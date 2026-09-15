"""
Step 2/6: Evaluation & Generalization Script
Computes the metrics required by the SignalScope core task:
- ROC-AUC (overall)
- Macro-F1
- Confusion Matrix
- Accuracy & False-Positive Rate at a chosen threshold

Also supports "unseen-generator" style evaluation: point --test_dir at any
held-out folder (e.g. images from a generator not used in training) to get
a separate generalization score.

Usage:
    python eval.py --test_dir dataset/test --model_path ai_detection_model.pt
"""

import argparse
import json
import torch
from torch.utils.data import DataLoader
from torchvision import transforms, datasets
from sklearn.metrics import roc_auc_score, f1_score, confusion_matrix, accuracy_score
from model import AIDetectionModel


def get_transform(img_size=256):
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


def evaluate(model_path, test_dir, batch_size=32, threshold=0.5, report_path=None,
             img_size=256, num_workers=2):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    dataset = datasets.ImageFolder(root=test_dir, transform=get_transform(img_size))
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)
    print(f"Class mapping: {dataset.class_to_idx}  (0=FAKE/AI, 1=REAL — check order for your data)")
    print(f"Test samples: {len(dataset)}")

    model = AIDetectionModel(pretrained=False).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    all_labels, all_probs = [], []
    with torch.no_grad():
        for images, labels in loader:
            images = images.to(device)
            logits = model(images)
            probs = torch.sigmoid(logits).squeeze(1).cpu().numpy()
            all_probs.extend(probs.tolist())
            all_labels.extend(labels.numpy().tolist())

    preds = [1 if p >= threshold else 0 for p in all_probs]

    auc = roc_auc_score(all_labels, all_probs)
    macro_f1 = f1_score(all_labels, preds, average='macro')
    cm = confusion_matrix(all_labels, preds)
    acc = accuracy_score(all_labels, preds)

    # False Positive Rate = FP / (FP + TN); label 0 assumed FAKE, 1 assumed REAL
    tn, fp, fn, tp = cm.ravel()
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

    results = {
        "test_dir": test_dir,
        "num_samples": len(dataset),
        "roc_auc": round(float(auc), 4),
        "macro_f1": round(float(macro_f1), 4),
        "accuracy": round(float(acc), 4),
        "false_positive_rate": round(float(fpr), 4),
        "threshold": threshold,
        "confusion_matrix": cm.tolist(),
        "class_to_idx": dataset.class_to_idx,
    }

    print("\n=== Evaluation Results ===")
    for k, v in results.items():
        print(f"{k}: {v}")

    if report_path:
        with open(report_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"\nSaved report to {report_path}")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate the SignalScope core detection model")
    parser.add_argument("--test_dir", type=str, required=True, help="Path to test data (REAL/FAKE subfolders)")
    parser.add_argument("--model_path", type=str, required=True, help="Path to trained model weights (.pt)")
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--threshold", type=float, default=0.5)
    parser.add_argument("--report_path", type=str, default="eval_report.json")
    parser.add_argument("--img_size", type=int, default=256)
    parser.add_argument("--num_workers", type=int, default=2)
    args = parser.parse_args()

    evaluate(args.model_path, args.test_dir, args.batch_size, args.threshold, args.report_path,
             img_size=args.img_size, num_workers=args.num_workers)
