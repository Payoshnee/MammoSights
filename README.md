# MammoSense

AI-assisted mammogram analysis with visual explanations. **Research demonstration only - not a medical device and not a diagnosis.**

```
mammo-sense/
├── frontend/   Next.js (App Router) + TypeScript + Tailwind
└── backend/    FastAPI around your existing mammo_core.py (unchanged)
```

Pipeline (unchanged): crop → 512×512 → CLAHE → homomorphic filter → VGG19 (512) + DenseNet121 (1024) → 1536 → StandardScaler → PCA(100) → top 30 → StandardScaler → RBF-SVM. **Cancer = class 1.**

## Prerequisites
- Node.js 18.18+ (20 recommended) and npm
- Python 3.10-3.12
- A Firebase project (Authentication enabled)
- A Google Cloud project with billing enabled (for Maps Platform)

## Model files (manual step)
Copy your trained model into `backend/model/`:
```
backend/model/pipeline.joblib   <- you add this (from train_export.py)
backend/model/metrics.json      <- already included
```
`pipeline.joblib` must have been saved with `scikit-learn==1.6.1` (`mammo_core.make_head` reads the private `svc._gamma`). If the file is missing the API still starts; `/predict` returns 503.

## Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # Windows: copy .env.example .env
uvicorn main:app --reload
```
First start downloads ImageNet weights for VGG19/DenseNet121 (internet needed once). The first prediction is slower while TensorFlow warms up.

Endpoints: `GET /health`, `GET /metrics` (your metrics.json), `POST /predict` (multipart field `file`). Images are processed in memory and never written to disk. Env vars: `FRONTEND_ORIGIN` (comma-separated CORS origins), `MODEL_DIR`, `MAX_UPLOAD_MB`, `REQUIRE_AUTH`.

`/predict` returns: `predicted_class`, `cancer_probability`, `non_cancer_probability`, `uncertain` (true when 0.35 < p < 0.65, as in your app.py), `uncertainty_range`, `heatmap_available`, `warnings[]`, and `images.{gradcam_overlay, preprocessed, clahe}` as PNG data URIs.

## Frontend
```bash
cd frontend
npm install
cp .env.example .env.local         # Windows: copy .env.example .env.local
npm run dev                        # http://localhost:3000
```

## Firebase
1. Firebase console → Add project → **Authentication → Sign-in method**: enable *Email/Password* and *Google*.
2. Project settings → *Your apps* → add a Web app; copy the config into `frontend/.env.local` (`NEXT_PUBLIC_FIREBASE_*`).
3. Authentication → Settings → Authorized domains: `localhost` is included; add your production domain later.

Only Authentication is used. Nothing is written to Firestore or Storage.

To test the ML flow before Firebase is ready, set `NEXT_PUBLIC_DEV_SKIP_AUTH=true` in `.env.local` (honoured only in development, never in production builds).

## Google Maps
In Google Cloud Console enable: **Maps JavaScript API**, **Places API (New)** (the legacy Places API is closed to new projects), and **Geocoding API**. Create an API key, restrict it to HTTP referrers (`http://localhost:3000/*` plus your domain) and to those three APIs, and put it in `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`. Optionally set `NEXT_PUBLIC_GOOGLE_MAP_ID`; otherwise Google's `DEMO_MAP_ID` is used.

## Privacy and security notes
- Upload → analyse → return → discard. No image history, no prediction history, no cloud image storage.
- The result lives only in React memory; refreshing the result page discards it.
- Route protection in the frontend is a UI guard. Real enforcement is server-side: set `REQUIRE_AUTH=true`, `pip install firebase-admin`, provide Google credentials, and `/predict` will verify the Firebase ID token the frontend already sends as `Authorization: Bearer`.
- Browser location is requested only when the user presses "Use my current location", used for one search, and not stored.

## Deployment outline (later)
- Frontend → Vercel (root `frontend`, set all `NEXT_PUBLIC_*` vars; add the Vercel domain to Firebase authorized domains and Maps key referrers)
- Backend → Google Cloud Run (container with TensorFlow-CPU; bake `pipeline.joblib` and cached ImageNet weights into the image; set `FRONTEND_ORIGIN`, `REQUIRE_AUTH=true`; allow ≥2 GB RAM)
- Auth → Firebase Auth; Maps → Google Maps Platform

## Test checklist
1. `GET http://localhost:8000/health` shows `model_loaded: true`.
2. Landing page loads; nav anchors work; mobile menu opens.
3. Sign up with email, log out, sign in with Google; both land on `/dashboard`.
4. `/analyse`: wrong file type is rejected; valid image shows preview, name, dimensions; nothing is sent until you press Analyse.
5. Stages appear, then `/result`; percentages match the API response.
6. Try an image near 50% (or a colour photo) to see the uncertain/warning states.
7. ML Expert View: three images, pipeline diagram, model info, real metrics (stop the backend to confirm "Metrics unavailable.").
8. `/find-care`: manual search and browser location (permission prompt appears only on click); cards, View on Map, Directions.
9. Check the Network tab: no request leaves the browser until Analyse is pressed.
