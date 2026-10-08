"""MammoSense API - thin FastAPI wrapper around the existing mammo_core pipeline.
Images are decoded and processed in memory only; nothing is written to disk."""
import base64
import io
import json
import logging
import os
import threading
from contextlib import asynccontextmanager
from pathlib import Path

import cv2
import joblib
import numpy as np
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, ImageOps

load_dotenv()
import mammo_core as mc  # noqa: E402  (after load_dotenv so BACKBONE_WEIGHTS is honoured)

log = logging.getLogger("mammosense")
logging.basicConfig(level=logging.INFO)

BASE = Path(__file__).parent
MODEL_DIR = Path(os.getenv("MODEL_DIR", "model"))
if not MODEL_DIR.is_absolute():
    MODEL_DIR = BASE / MODEL_DIR
MAX_BYTES = int(float(os.getenv("MAX_UPLOAD_MB", "10")) * 1024 * 1024)
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"
ORIGINS = [o.strip() for o in os.getenv("FRONTEND_ORIGIN", "http://localhost:3000").split(",") if o.strip()]
UNCERTAIN_LOW, UNCERTAIN_HIGH = 0.35, 0.65  # same band as the original app.py
Image.MAX_IMAGE_PIXELS = 80_000_000  # guard against decompression bombs

STATE = {"pipe": None, "head": None, "metrics": None}
INFER_LOCK = threading.Lock()  # mammo_core keeps global Keras models; serialise inference


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Loaded once, at server start
    try:
        STATE["pipe"] = joblib.load(MODEL_DIR / "pipeline.joblib")
        STATE["head"] = mc.make_head(STATE["pipe"])
        log.info("Pipeline loaded.")
    except Exception:
        log.exception("Could not load pipeline.joblib - /predict will return 503")
    try:
        STATE["metrics"] = json.loads((MODEL_DIR / "metrics.json").read_text())
    except Exception:
        log.warning("metrics.json unavailable - /metrics will return 503")
    yield


app = FastAPI(title="MammoSense API", version="1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=["GET", "POST"],
                   allow_headers=["Authorization", "Content-Type"])


# ---------- auth hook (optional) ----------
def verify_user(authorization: str | None = Header(default=None)):
    """When REQUIRE_AUTH=true, verify the Firebase ID token sent as 'Authorization: Bearer <token>'."""
    if not REQUIRE_AUTH:
        return None
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Sign in required.")
    try:
        import firebase_admin
        from firebase_admin import auth as fb_auth
        if not firebase_admin._apps:
            firebase_admin.initialize_app()  # uses GOOGLE_APPLICATION_CREDENTIALS / workload identity
        return fb_auth.verify_id_token(authorization.split(" ", 1)[1])
    except Exception:
        raise HTTPException(401, "Invalid or expired sign-in token.")


# ---------- helpers ----------
def decode_image(data: bytes):
    """bytes -> (gray uint8 2-D, looks_colour: bool). Mirrors app.py's handling of Gradio's numpy RGB input."""
    try:
        img = Image.open(io.BytesIO(data))
        if img.format not in ("JPEG", "PNG"):
            raise HTTPException(415, "Only JPG and PNG images are supported.")
        img = ImageOps.exif_transpose(img)
        if img.mode in ("I;16", "I", "F"):  # 16-bit greyscale PNGs -> 8-bit
            a = np.asarray(img, dtype=np.float32)
            a = (a - a.min()) / (a.max() - a.min() + 1e-8) * 255
            return a.astype(np.uint8), False
        arr = np.asarray(img.convert("RGB"))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(400, "The file could not be read as an image.")
    gray = cv2.cvtColor(arr.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    colour = (arr.max(-1).astype(int) - arr.min(-1)).mean() > 12
    return gray, bool(colour)


def to_data_uri(img: np.ndarray) -> str:
    """uint8 gray/RGB array -> PNG data URI"""
    buf = io.BytesIO()
    Image.fromarray(img).save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


# ---------- routes ----------
@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": STATE["pipe"] is not None, "metrics_loaded": STATE["metrics"] is not None}


@app.get("/metrics")
def get_metrics():
    if STATE["metrics"] is None:
        raise HTTPException(503, "Metrics unavailable.")
    return STATE["metrics"]


@app.post("/predict")
def predict(file: UploadFile = File(...), _user=Depends(verify_user)):
    if STATE["pipe"] is None:
        raise HTTPException(503, "The model is not available on the server.")
    data = file.file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, f"Image is larger than {MAX_BYTES // (1024 * 1024)} MB.")
    if not data:
        raise HTTPException(400, "Empty file.")

    gray, colour = decode_image(data)
    del data  # nothing is persisted
    if min(gray.shape) < 128:
        raise HTTPException(422, "Image is too small (minimum 128 px per side).")

    warnings = []
    if colour:
        warnings.append("This looks like a colour photo, not a greyscale mammogram. The result will not be meaningful.")
    try:
        with INFER_LOCK:
            pre, htf = mc.preprocess(gray)
            p = float(STATE["pipe"].predict_proba(mc.extract_features([htf]))[0, 1])  # Cancer = class 1
            cam, _score = mc.gradcam(htf, STATE["head"])
    except Exception:
        log.exception("Inference failed")
        raise HTTPException(500, "The analysis could not be completed.")

    no_cam = bool(cam.max() == 0)
    pre_rgb = cv2.cvtColor(pre, cv2.COLOR_GRAY2RGB)
    if no_cam:
        overlay = pre_rgb
        warnings.append("No reliable heatmap: this image is far from the training data, so treat the prediction with extra caution.")
    else:
        heat = cv2.applyColorMap(np.uint8(255 * cv2.resize(cam, (512, 512))), cv2.COLORMAP_JET)[..., ::-1]
        overlay = cv2.addWeighted(pre_rgb, 0.6, heat, 0.4, 0)

    return {
        "predicted_class": "Cancer" if p >= 0.5 else "Non-Cancer",
        "cancer_probability": p,
        "non_cancer_probability": 1 - p,
        "uncertain": bool(UNCERTAIN_LOW < p < UNCERTAIN_HIGH),
        "uncertainty_range": [UNCERTAIN_LOW, UNCERTAIN_HIGH],
        "heatmap_available": not no_cam,
        "warnings": warnings,
        "images": {
            "gradcam_overlay": to_data_uri(overlay),
            "preprocessed": to_data_uri(htf),
            "clahe": to_data_uri(pre),
        },
    }
