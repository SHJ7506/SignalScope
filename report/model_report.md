# SignalScope — Model Report

| Field | Details |
|---|---|
| **Task** | Binary classification: Real photo vs AI-generated image |
| **Dataset & Split** | CIFAKE (real photos + Stable-Diffusion-generated images). Demo checkpoint trained on a 5,000/1,000/2,000 (train/val/test) subset of the full ~120k dataset. |
| **Model / Approach** | ResNet18 (spatial branch) fused with a custom FFT frequency-domain branch (captures generation artifacts in the frequency spectrum), combined via a fully-connected fusion head. See `model/model.py`. |
| **Training** | AdamW optimizer, BCEWithLogitsLoss, 3 epochs, batch size 32, image size 64×64 (demo-scale — see limitations). Best checkpoint selected by validation loss. |
| **Metric & Result (demo checkpoint)** | ROC-AUC: 0.934 · Macro-F1: 0.854 · Accuracy: 85.5% · False Positive Rate: 0.173 (see `model/eval_report.json`) |
| **Baseline** | To be filled in once the official kickoff baseline number is published. |
| **Generalization (Step 6)** | Evaluation harness (`model/evaluate_generalization.py`) is built and tested; awaiting the unseen-generator dataset download to produce the real unseen-AUC number. |
| **Limitations** | This demo checkpoint was trained from scratch (no ImageNet pretraining, due to no internet access in the build sandbox) on a small subset at low resolution, for proof-of-concept purposes only. It shows some verdict instability under heavy image degradation (see Robustness Lab). Before final submission, retrain with: full dataset, pretrained ImageNet weights, 256×256 resolution, more epochs — this will substantially improve both accuracy and robustness. |
