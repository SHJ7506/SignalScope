"""
SignalScope — Backend API Server
Implements POST /api/analyze exactly matching the frontend's contract
(src/types/analysis.ts) so the real React UI can talk to the real model.

Wires together:
  - Step 2/3 (Core Detection)  -> predicator.py (REAL trained model)
  - Step 4 (Explanation)       -> explainability.py (REAL Grad-CAM on the trained model)
  - Step 5 (Robustness Lab)    -> robustness.py (REAL, runs actual model on 4 variants)
  - Step 6 (Generalization)    -> reads generalization_report.json if present
                                   (produced by evaluate_generalization.py once the
                                   unseen-generator dataset is downloaded)

Run with:
    pip install fastapi uvicorn python-multipart
    uvicorn server:app --reload --port 8000
"""

import json
import os
from io import BytesIO

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

from predicator import DetectorAPI
from robustness import make_variants
from explainability import GradCAMExplainer, overlay_to_data_url

MODEL_PATH = "ai_detection_model.pt"
IMG_SIZE = 64  # Must match the checkpoint's training resolution (see README)
GENERALIZATION_REPORT_PATH = "generalization_report.json"

app = FastAPI(title="SignalScope API")

# Allow the Vite dev server (localhost:5173 by default) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your actual frontend origin before deploying
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = DetectorAPI(model_weight_path=MODEL_PATH, img_size=IMG_SIZE)
explainer = GradCAMExplainer(model_weight_path=MODEL_PATH, img_size=IMG_SIZE)


def load_generalization_result():
    """
    Returns the GeneralizationResult dict if evaluate_generalization.py has
    already been run (i.e. the unseen-generator dataset has been downloaded
    and evaluated). Returns None otherwise — the frontend hides this card
    when generalization is missing, so this is always safe.
    """
    if os.path.exists(GENERALIZATION_REPORT_PATH):
        with open(GENERALIZATION_REPORT_PATH, "r") as f:
            return json.load(f)
    return None


@app.post("/api/analyze")
async def analyze(image: UploadFile = File(...)):
    if image.content_type not in ("image/jpeg", "image/png"):
        raise HTTPException(status_code=400, detail="Only JPEG and PNG images are supported.")

    try:
        raw_bytes = await image.read()
        pil_image = Image.open(BytesIO(raw_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the uploaded image.")

    # --- Step 2/3: Core Detection (REAL model) ---
    core_result = detector.predict(pil_image)
    verdict = "LIKELY_AI_GENERATED" if core_result["label"] == "AI-generated" else "LIKELY_REAL"
    confidence = core_result["confidence"]

    # --- Step 5: Robustness Lab (REAL model on all 4 variants) ---
    variants = make_variants(pil_image)
    robustness = {
        name: detector.predict(variant_img)["ai_probability"]
        for name, variant_img in variants.items()
    }

    # --- Step 6: Generalization (loaded from disk if available) ---
    generalization = load_generalization_result()

    # --- Step 4: Explanation / Evidence (REAL Grad-CAM, not simulated) ---
    exp_result = explainer.explain(pil_image)
    evidence = {
        "imageUrl": overlay_to_data_url(exp_result["overlay_image"]),
        "explanation": exp_result["explanation"],
    }

    response = {
        "verdict": verdict,
        "confidence": confidence,
        "robustness": robustness,
        "evidence": evidence,
    }
    if generalization is not None:
        response["generalization"] = generalization

    return response


@app.get("/api/health")
async def health():
    return {"status": "ok", "model_loaded": True}
