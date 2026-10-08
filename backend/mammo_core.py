"""Shared by training and the app, so inference preprocessing == training preprocessing.
Mirrors the notebook (crop -> 512 resize -> CLAHE -> HTF -> VGG19+DenseNet121 features),
minus the random augmentation."""
import os
import cv2
import numpy as np
from PIL import Image

WEIGHTS = None if os.getenv("BACKBONE_WEIGHTS", "imagenet").lower() == "none" else "imagenet"
CLASSES = ["Non-Cancer", "Cancer"]  # index 1 = Cancer = positive class (explicit; the notebook's LabelEncoder had Cancer=0)


# ---------------- preprocessing ----------------
def auto_crop_black(img, threshold=10):
    mask = img > threshold
    if not np.any(mask):
        return img
    ys, xs = np.where(mask)
    return img[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def _jpeg(img, q=95):
    # training images were saved with cv2.imwrite(.jpg) at each stage; repeat that round-trip
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, q])
    return cv2.imdecode(buf, cv2.IMREAD_GRAYSCALE)


def homomorphic_filter(image, d0=30, rh=2.0, rl=0.5, c=1.0):  # notebook cell 8
    image = np.float32(image) / 255.0
    rows, cols = image.shape
    u = np.arange(rows) - rows // 2
    v = np.arange(cols) - cols // 2
    U, V = np.meshgrid(u, v, indexing="ij")
    D = np.sqrt(U ** 2 + V ** 2)
    H = (rh - rl) * (1 - np.exp(-c * (D ** 2 / d0 ** 2))) + rl
    f = np.fft.fftshift(np.fft.fft2(np.log1p(image)))
    out = np.exp(np.real(np.fft.ifft2(np.fft.ifftshift(f * H)))) - 1
    out = (out - out.min()) / (out.max() - out.min() + 1e-8)
    return (out * 255).astype(np.uint8)


def preprocess(gray):
    """gray: 2-D uint8 -> (clahe_img, htf_img), both 512x512 uint8. htf_img is the model input."""
    x = cv2.resize(auto_crop_black(gray), (512, 512))
    x = _jpeg(cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(x))
    return x, _jpeg(homomorphic_filter(x))


# ---------------- backbones / features ----------------
_m = {}


def _load():
    if _m:
        return
    import tensorflow as tf
    from tensorflow.keras.applications import VGG19, DenseNet121
    vgg = VGG19(weights=WEIGHTS, include_top=False)  # output = block5_pool; mean over H,W == pooling='avg'
    _m["vgg"] = vgg
    _m["dn"] = DenseNet121(weights=WEIGHTS, include_top=False, pooling="avg")
    _m["vgg_conv"] = tf.keras.Model(vgg.input, vgg.get_layer("block5_conv4").output)
    _m["pool"] = vgg.get_layer("block5_pool")  # applied to the conv tensor so gradients can flow back to it


def _batch(grays):
    from tensorflow.keras.applications.vgg19 import preprocess_input as pv
    from tensorflow.keras.applications.densenet import preprocess_input as pd
    # keras load_img default resize is 'nearest' -> keep identical
    arr = np.stack([np.asarray(Image.fromarray(g).convert("RGB").resize((224, 224), Image.NEAREST), dtype="float32")
                    for g in grays])
    return pv(arr.copy()), pd(arr.copy())


def extract_features(grays, batch=8):
    """list of 2-D uint8 (HTF images) -> (N, 1536) = [VGG19 512 | DenseNet121 1024]"""
    _load()
    out = []
    for i in range(0, len(grays), batch):
        xv, xd = _batch(grays[i:i + batch])
        v = _m["vgg"](xv, training=False).numpy().mean(axis=(1, 2))
        d = _m["dn"](xd, training=False).numpy()
        out.append(np.concatenate([v, d], axis=1))
    return np.concatenate(out)


# ---------------- Grad-CAM through the real classifier ----------------
def make_head(pipe):
    """Scaler -> PCA -> SelectKBest -> Scaler are all affine, so collapse them to z = x@W + b.
    The RBF-SVM decision function is differentiable, so Grad-CAM can flow back to VGG19."""
    import tensorflow as tf
    prefit, svc = pipe[:-1], pipe[-1]
    d = 1536
    b = prefit.transform(np.zeros((1, d)))[0]
    W = prefit.transform(np.eye(d)) - b
    return dict(W=tf.constant(W, tf.float32), b=tf.constant(b, tf.float32),
                sv=tf.constant(svc.support_vectors_, tf.float32), coef=tf.constant(svc.dual_coef_[0], tf.float32),
                icpt=float(svc.intercept_[0]), gamma=float(svc._gamma))


def gradcam(htf_img, head):
    """Returns (cam in [0,1] at 14x14, svm_score). Heatmap explains the *predicted* class."""
    import tensorflow as tf
    _load()
    xv, xd = _batch([htf_img])
    d_feat = _m["dn"](xd, training=False)
    with tf.GradientTape() as tape:
        conv = _m["vgg_conv"](xv, training=False)
        pool = _m["pool"](conv)
        feat = tf.concat([tf.reduce_mean(pool, axis=(1, 2)), d_feat], axis=1)
        z = feat @ head["W"] + head["b"]
        k = tf.exp(-head["gamma"] * tf.reduce_sum((z[:, None, :] - head["sv"][None]) ** 2, axis=-1))
        score = tf.reduce_sum(k * head["coef"], axis=-1)[0] + head["icpt"]
        target = score if float(score) >= 0 else -score
    grads = tape.gradient(target, conv)[0]
    cam = tf.nn.relu(tf.reduce_sum(conv[0] * tf.reduce_mean(grads, axis=(0, 1)), axis=-1)).numpy()
    return cam / (cam.max() + 1e-8), float(score)
