"""
Step 5: Robustness Lab
Tests whether the REAL trained detection model (predicator.py) stays stable
when the same image is compressed, resized, or turned into a screenshot-style
crop. This replaces any earlier version that used a placeholder/simulated
model (e.g. Gemini calls or hardcoded numbers) — every number here comes
from an actual forward pass of ai_detection_model.pt.

Usage:
    python robustness.py --image path/to/image.jpg --model_path ai_detection_model.pt --img_size 64
"""

import argparse
import io
import json
import os
from PIL import Image
from predicator import DetectorAPI


def make_variants(image: Image.Image, jpeg_quality=15, downscale_ratio=0.25, crop_ratio=0.85):
    """Generates the 4 standard robustness-test variants of an image."""
    image = image.convert("RGB")
    variants = {}

    # 1. Original (baseline)
    variants["original"] = image.copy()

    # 2. Compressed (heavy JPEG compression)
    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=jpeg_quality)
    buf.seek(0)
    variants["compressed"] = Image.open(buf).convert("RGB")

    # 3. Resized (downscaled then upscaled back, simulating low-res thumbnail reuse)
    w, h = image.size
    small = image.resize((max(1, int(w * downscale_ratio)), max(1, int(h * downscale_ratio))))
    variants["resized"] = small.resize((w, h))

    # 4. Screenshot-style (center crop + re-encode, simulating a screen capture)
    crop_w, crop_h = int(w * crop_ratio), int(h * crop_ratio)
    left = (w - crop_w) // 2
    top = (h - crop_h) // 2
    cropped = image.crop((left, top, left + crop_w, top + crop_h)).resize((w, h))
    buf2 = io.BytesIO()
    cropped.save(buf2, format="JPEG", quality=70)
    buf2.seek(0)
    variants["screenshot"] = Image.open(buf2).convert("RGB")

    return variants


def run_robustness_lab(image_path, model_path, img_size=256, save_dir=None):
    detector = DetectorAPI(model_weight_path=model_path, img_size=img_size)
    image = Image.open(image_path).convert("RGB")
    variants = make_variants(image)

    results = {}
    for name, variant_img in variants.items():
        results[name] = detector.predict(variant_img)
        if save_dir:
            os.makedirs(save_dir, exist_ok=True)
            variant_img.save(os.path.join(save_dir, f"{name}.png"))

    chain = " -> ".join(f"{results[v]['ai_probability']*100:.1f}%" for v in
                         ["original", "compressed", "resized", "screenshot"])

    orig_conf = results["original"]["ai_probability"]
    scr_conf = results["screenshot"]["ai_probability"]
    total_drift = abs(orig_conf - scr_conf) * 100

    labels = [results[v]["label"] for v in ["original", "compressed", "resized", "screenshot"]]
    label_consistent = len(set(labels)) == 1

    if total_drift <= 10 and label_consistent:
        verdict = "Strong robustness: verdict and confidence stay stable under degradation."
    elif total_drift <= 20 and label_consistent:
        verdict = "Moderate robustness: some confidence drift, but the verdict does not flip."
    else:
        verdict = "Weak robustness: confidence or verdict changes significantly under degradation."

    report = {
        "confidence_chain_ai_probability": chain,
        "per_variant_results": results,
        "total_confidence_drift_percent": round(total_drift, 2),
        "label_consistent_across_variants": label_consistent,
        "verdict": verdict,
    }
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the Robustness Lab on a single image")
    parser.add_argument("--image", type=str, required=True)
    parser.add_argument("--model_path", type=str, default="ai_detection_model.pt")
    parser.add_argument("--img_size", type=int, default=256)
    parser.add_argument("--save_dir", type=str, default="robustness_variants")
    parser.add_argument("--report_path", type=str, default="robustness_report.json")
    args = parser.parse_args()

    report = run_robustness_lab(args.image, args.model_path, args.img_size, args.save_dir)
    print(json.dumps(report, indent=2))

    with open(args.report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"\nSaved report to {args.report_path}")
