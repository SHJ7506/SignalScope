# SignalScope — Real vs AI-Generated Image Detection

Full-stack implementation: real trained detection model + real robustness testing
+ real React frontend + real FastAPI backend connecting them.

## Demo Video

[Watch the demo](https://drive.google.com/file/d/1faB7NE6DZDjcxp1Yt9qEv14AnxG65E8L/view?usp=sharing)

## What's Done

## Step 6: Generalization Test — Real Result

Evaluated on **10,660 held-out images from Midjourney** — a generator never
seen during training (the model was trained only on Stable-Diffusion-based
CIFAKE data). This measures genuine generalization, not memorization of one
generator's style.

**Unseen-generator ROC-AUC: 0.9663**

See `model/generalization_report.json`. `server.py` automatically picks this
up and includes it in API responses.

| Step | Status | Notes |
|---|---|---|
| 1. Image Input | ✅ Done | Real React upload UI (`/src`) |
| 2. Preprocessing | ✅ Done | `model/train.py`, `model/eval.py` |
| 3. Core Detection | ✅ Done | Real trained model: `model/ai_detection_model.pt` (demo-scale, see caveat below) |
| 4. Explanation / Evidence | ✅ Done | Real Grad-CAM on the trained model (`model/explainability.py`), wired into the live API and the React Evidence Map |
| 5. Robustness Lab | ✅ Done | `model/robustness.py`, wired into the live API |
| 6. Generalization Test | ✅ Done | Real evaluation on 10,660 unseen Midjourney images — ROC-AUC 0.9663. See `model/generalization_report.json` |
| 7. Forensic Report | ✅ Done | The React UI itself renders this (VerdictCard + RobustnessChart + GeneralizationCard) |
| 8. Responsible Output | ✅ Done | Frontend always says "Likely AI-generated" / "Likely Real", never absolute claims |

## ⚠️ Important Caveat: Demo-Scale Model

`ai_detection_model.pt` was trained inside a sandboxed environment with only
1 CPU core, no GPU, and no internet access to download ImageNet pretrained
weights. It was trained from scratch on a 5,000-image subset at 64×64
resolution for 3 epochs — just enough to prove the entire pipeline
(model → robustness → API → frontend) genuinely works end-to-end with real
data, not mocked data.

**Real results on 2,000 held-out test images:** ROC-AUC 0.934, Macro-F1 0.854,
Accuracy 85.5% (see `model/eval_report.json`).

**Before final submission, retrain properly** — full dataset, pretrained
ImageNet weights, 256×256 resolution, more epochs — see "Retraining" below.

## Dataset

- **Core training data:** [CIFAKE](https://www.kaggle.com/datasets/birdy654/cifake-real-and-ai-generated-synthetic-images) — real photos vs. Stable-Diffusion-generated synthetic images, MIT/open-licensed, as provided for the challenge.
- **Split used:** [state your actual train/val/test split here, e.g. "80% train / 10% val / 10% test, stratified by class"]
- **Additional public data:** [name any extra dataset added, or write "None — core task trained on the provided CIFAKE data only"]
- **Unseen-generator evaluation data (Step 6):** 10,660 held-out real + Midjourney-generated images

## Reported Metrics (Self-Evaluated, Dev Test Split)

> These are our own metrics on a held-out split of the CIFAKE training data — **not** the organizers' official held-out set, which will be scored separately via `predicator.py`'s `predict()` interface.

| Metric | Value |
|---|---|
| ROC-AUC (overall) | 0.934 |
| ROC-AUC (unseen-generator split, Midjourney) | 0.9663 |
| Macro-F1 | 0.854 |
| Accuracy | 85.5% |
| Threshold used | 0.5 |
| False Positive Rate (real photo flagged as AI-generated) | 11.8% (118 / 1000 real images) |

**Confusion Matrix** (2,000 held-out test images):

|  | Predicted: Real | Predicted: AI-generated |
|---|---|---|
| **Actual: Real** | 882 (TN) | 118 (FP) |
| **Actual: AI-generated** | 173 (FN) | 827 (TP) |

## Project Structure

```
Task/
├── README.md
├── requirements.txt
├── model/                     ← All Python: model, training, eval, API server
│   ├── model.py                 Model architecture (ResNet18 + FFT branch)
│   ├── train.py                 Training script (train/val split, checkpointing)
│   ├── eval.py                  Core metrics: ROC-AUC, Macro-F1, Confusion Matrix
│   ├── predicator.py             DetectorAPI — the required predict() interface
│   ├── robustness.py            Step 5: real robustness testing
│   ├── evaluate_generalization.py  Step 6: unseen-generator evaluation
│   ├── server.py                 FastAPI backend — /api/analyze (real, not mocked)
│   ├── streamlit_app.py         Alternative simple standalone UI
│   └── ai_detection_model.pt    Trained demo checkpoint
├── src/                        ← Real React/TypeScript frontend
│   └── (Vite + React app — see src/README.md for its own details)
└── report/
    └── model_report.md
```

## How to Run Everything

### 1. Backend (Python)

```bash
cd model
pip install -r ../requirements.txt
uvicorn server:app --reload --port 8000
```

Verify it's running: `curl http://localhost:8000/api/health`

### 2. Frontend (React)

```bash
cd src
npm install
npm run dev
```

The frontend's `.env.local` is already set to `VITE_USE_MOCK=false` and
`VITE_API_BASE_URL=http://localhost:8000`, so it will call the real backend
above — not mock data.

Open the printed local URL, upload an image, and you'll see a real verdict,
real confidence, and real robustness results pulled from the actual model.

### 3. (Optional) Simple Standalone UI

If you just want a quick one-file demo without running the React app:
```bash
cd model
streamlit run streamlit_app.py
```

## Retraining Properly for Submission

On a machine/Colab with GPU + internet access:

```bash
cd model
python train.py \
    --train_dir dataset/train \
    --val_dir dataset/val \
    --epochs 15 --batch_size 32 --img_size 256 \
    --save_path ai_detection_model.pt
    # (omit --no_pretrained to use ImageNet pretrained weights)

python eval.py \
    --test_dir dataset/test \
    --model_path ai_detection_model.pt \
    --img_size 256 --report_path eval_report.json
```

You'll need `dataset/train`, `dataset/val`, `dataset/test` folders each with
`REAL/` and `FAKE/` subfolders (unzip the CIFAKE archive and split out a
validation set — it ships with only train/test).

**IMPORTANT:** Update `IMG_SIZE` in `server.py` and `streamlit_app.py` to
match whatever `--img_size` you actually trained with (256 for the real
submission, not 64).

## Running Step 6 Again On A New Unseen-Generator Dataset

```bash
cd model
python evaluate_generalization.py \
    --unseen_dir path/to/unseen_dataset \
    --generator_name "Midjourney v6" \
    --model_path ai_detection_model.pt \
    --img_size 256
```

This writes `generalization_report.json`. `server.py` automatically detects
this file and starts including real generalization results in API
responses — no code changes needed.

## What Changed From Earlier Drafts (For The Team's Awareness)

- An earlier detection prototype **simulated** predictions using
  `Math.random()` based on the ground-truth label. Fully replaced with real
  model inference.
- An earlier robustness prototype used Google Gemini object-recognition (or
  hardcoded fallback numbers) instead of the real detector. Replaced with
  `robustness.py` calling the real trained model on every image variant.
- Fixed a label-mapping bug in `predicator.py`: `ImageFolder` assigns
  `FAKE=0, REAL=1` alphabetically, so the raw model output is `P(REAL)`, not
  `P(AI-generated)` — now handled correctly inside `predict()`.
- Built the missing backend (`server.py`) connecting the real React frontend
  (which was already well-built, with a clean typed API contract) to the
  real model — this was the only piece missing between a good UI and a
  fully working product.
- Built Step 4 (`model/explainability.py`) from scratch: real Grad-CAM
  hooked onto the trained ResNet18's last conv layer, producing a genuine
  heatmap overlay + a plain-language explanation generated from the actual
  heatmap's peak region (not a canned sentence). Also fixed `EvidenceMap.tsx`
  to actually display this heatmap — previously it only re-showed the
  original image and ignored `evidence.imageUrl` entirely.

## Known Limitations

- Core model is demo-scale (trained from scratch, 64×64, 3 epochs, no GPU) —
  see "Important Caveat" above. Retraining steps included for a stronger run.
- Reported dev metrics are on our own held-out split, not the organizers'
  official test set.
