"""
Step 6: Generalization Test (Unseen-Generator Evaluation)

Run this ONCE you have downloaded a held-out set containing images from an
AI generator that was NOT used during training (e.g. Midjourney/DALL-E
samples, if your model was trained only on Stable-Diffusion-based CIFAKE).

Expected folder layout (same convention as the rest of the project):
    unseen_dataset/
        REAL/    <- real photos not used in training
        FAKE/    <- AI-generated images from the unseen generator

This produces `generalization_report.json`, matching the frontend's
GeneralizationResult type:
    { "generatorName": str, "auc": float, "description": str }

server.py automatically picks this file up and includes it in API responses
once it exists — no code changes needed there.

Usage:
    python evaluate_generalization.py \
        --unseen_dir path/to/unseen_dataset \
        --generator_name "Midjourney v6" \
        --model_path ai_detection_model.pt \
        --img_size 64
"""

import argparse
import json

from sklearn.metrics import roc_auc_score
from torch.utils.data import DataLoader
from torchvision import datasets

from eval import get_transform
from predicator import DetectorAPI


def evaluate_generalization(unseen_dir, model_path, generator_name, img_size=256,
                             report_path="generalization_report.json"):
    dataset = datasets.ImageFolder(root=unseen_dir, transform=get_transform(img_size))
    loader = DataLoader(dataset, batch_size=1, shuffle=False)
    print(f"Class mapping: {dataset.class_to_idx}")
    print(f"Unseen-generator samples: {len(dataset)}")

    detector = DetectorAPI(model_weight_path=model_path, img_size=img_size)

    # class_to_idx is alphabetical: FAKE=0, REAL=1 (same convention as training)
    all_labels, all_ai_probs = [], []
    for images, labels in loader:
        # images already transformed/normalized by get_transform via ImageFolder,
        # so we bypass detector.transform and call the model directly through
        # the same underlying network for consistency:
        import torch
        with torch.no_grad():
            logits = detector.model(images.to(detector.device))
            real_prob = torch.sigmoid(logits).item()
        ai_prob = 1.0 - real_prob
        all_ai_probs.append(ai_prob)
        all_labels.append(1 - labels.item())  # convert REAL=1/FAKE=0 -> AI=1/REAL=0 for AUC-on-AI-prob

    auc = roc_auc_score(all_labels, all_ai_probs)

    result = {
        "generatorName": generator_name,
        "auc": round(float(auc), 4),
        "description": (
            f"Evaluated on {len(dataset)} held-out images from '{generator_name}', "
            f"a generator never seen during training. This measures true "
            f"generalization rather than memorization of one generator's style."
        ),
    }

    print("\n=== Generalization Result ===")
    print(json.dumps(result, indent=2))

    with open(report_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nSaved to {report_path} — server.py will pick this up automatically.")

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Step 6 unseen-generator evaluation")
    parser.add_argument("--unseen_dir", type=str, required=True,
                         help="Folder with REAL/ and FAKE/ subfolders, images from an unseen generator")
    parser.add_argument("--model_path", type=str, default="ai_detection_model.pt")
    parser.add_argument("--generator_name", type=str, required=True,
                         help='e.g. "Midjourney v6" or "DALL-E 3"')
    parser.add_argument("--img_size", type=int, default=256)
    parser.add_argument("--report_path", type=str, default="generalization_report.json")
    args = parser.parse_args()

    evaluate_generalization(args.unseen_dir, args.model_path, args.generator_name,
                             args.img_size, args.report_path)
