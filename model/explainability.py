"""
Step 4: Explainability (Evidence Map + Explanation)

Builds a REAL Grad-CAM heatmap from the actual trained model's spatial
branch (ResNet18's last conv block), showing which region of the image
drove the verdict, plus a plain-language explanation.

This matches the exact contract the frontend expects (src/types/analysis.ts):
    EvidenceResult { imageUrl?: string, explanation?: string }

`imageUrl` is returned as a base64 data-URL PNG (no file server needed) —
the React <img src="..."> tag renders data URLs natively, so this drops
straight into EvidenceMap.tsx.

Usage (standalone test):
    python explainability.py --image path/to/image.jpg --model_path ai_detection_model.pt --img_size 64
"""

import argparse
import base64
import io

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from matplotlib import cm

from model import AIDetectionModel


def _build_transform(img_size):
    from torchvision import transforms
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


class GradCAMExplainer:
    """
    Real Grad-CAM hooked onto the last conv block of the spatial (ResNet18)
    branch. Works directly on the actual trained AIDetectionModel — nothing
    here is simulated or hardcoded.
    """

    def __init__(self, model_weight_path, img_size=256, device=None):
        self.device = torch.device(device) if device else torch.device(
            'cuda' if torch.cuda.is_available() else 'cpu')
        self.img_size = img_size
        self.transform = _build_transform(img_size)

        self.model = AIDetectionModel(pretrained=False)
        self.model.load_state_dict(torch.load(model_weight_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()

        # Hook the last conv block of the ResNet18 spatial branch
        self.target_layer = self.model.spatial_branch.layer4
        self._activations = None
        self._gradients = None
        self.target_layer.register_forward_hook(self._save_activation)
        self.target_layer.register_full_backward_hook(self._save_gradient)

    def _save_activation(self, module, input, output):
        self._activations = output.detach()

    def _save_gradient(self, module, grad_input, grad_output):
        self._gradients = grad_output[0].detach()

    def explain(self, pil_image: Image.Image, alpha=0.45):
        pil_image = pil_image.convert("RGB")
        input_tensor = self.transform(pil_image).unsqueeze(0).to(self.device)
        input_tensor.requires_grad_(False)

        self.model.zero_grad()
        logits = self.model(input_tensor)  # raw logit, sigmoid(logit) = P(REAL)
        real_prob = torch.sigmoid(logits).item()
        ai_prob = 1.0 - real_prob
        predicted_ai = ai_prob >= 0.5

        # Backprop toward whichever class was predicted, so the heatmap shows
        # "evidence FOR this verdict" (not always evidence for one fixed class).
        # logits increase -> more REAL. So target = -logits when predicting AI,
        # target = +logits when predicting REAL.
        target_score = -logits if predicted_ai else logits
        target_score.backward()

        gradients = self._gradients[0]      # [C, H, W]
        activations = self._activations[0]  # [C, H, W]

        weights = gradients.mean(dim=(1, 2))  # Global-average-pool gradients -> per-channel weight
        cam = torch.zeros(activations.shape[1:], dtype=torch.float32, device=self.device)
        for c, w in enumerate(weights):
            cam += w * activations[c]

        cam = F.relu(cam)
        cam = cam - cam.min()
        if cam.max() > 0:
            cam = cam / cam.max()
        cam = cam.cpu().numpy()

        # Resize heatmap to original image size
        heatmap_img = Image.fromarray(np.uint8(cam * 255)).resize(pil_image.size, resample=Image.BILINEAR)
        heatmap_np = np.array(heatmap_img).astype(np.float32) / 255.0

        # Colorize with a red/yellow "jet"-like colormap and blend onto original
        colored = cm.jet(heatmap_np)[:, :, :3]  # RGBA -> RGB, values 0-1
        colored = (colored * 255).astype(np.uint8)
        colored_img = Image.fromarray(colored).convert("RGB")

        blended = Image.blend(pil_image.resize(colored_img.size), colored_img, alpha=alpha)

        explanation = self._describe(heatmap_np, ai_prob, predicted_ai)

        return {
            "overlay_image": blended,
            "heatmap_raw": heatmap_np,
            "ai_probability": round(float(ai_prob), 4),
            "predicted_ai": predicted_ai,
            "explanation": explanation,
        }

    @staticmethod
    def _describe(heatmap_np, ai_prob, predicted_ai):
        """
        Turns the heatmap into a genuine, grounded, plain-language description —
        based on where the actual activation is concentrated (real numbers from
        the real heatmap), not a canned sentence.
        """
        h, w = heatmap_np.shape
        # Find the region (quadrant/center) holding the peak activation
        y_idx, x_idx = np.unravel_index(np.argmax(heatmap_np), heatmap_np.shape)
        vertical = "top" if y_idx < h / 3 else ("bottom" if y_idx > 2 * h / 3 else "middle")
        horizontal = "left" if x_idx < w / 3 else ("right" if x_idx > 2 * w / 3 else "center")

        if vertical == "middle" and horizontal == "center":
            region = "the central region of the image"
        else:
            region = f"the {vertical}-{horizontal} area of the image"

        # How concentrated vs. spread out the evidence is
        strong_pixels = (heatmap_np > 0.7).sum()
        total_pixels = heatmap_np.size
        concentration = strong_pixels / total_pixels
        spread_desc = "a tightly localized region" if concentration < 0.08 else "a broader area"

        if predicted_ai:
            return (
                f"The model's decision was driven mainly by {spread_desc} in {region}, "
                f"consistent with textures or patterns that commonly appear in AI-generated "
                f"imagery (e.g. unnatural fine detail or repeating structure). "
                f"Confidence this image is AI-generated: {ai_prob * 100:.1f}%. "
                f"This is a likelihood based on learned patterns, not proof."
            )
        else:
            return (
                f"The model's decision was driven mainly by {spread_desc} in {region}, "
                f"where the texture and detail were consistent with a real photograph "
                f"rather than typical AI-generation artifacts. "
                f"Confidence this image is real: {(1 - ai_prob) * 100:.1f}%. "
                f"This is a likelihood based on learned patterns, not proof."
            )


def overlay_to_data_url(pil_image: Image.Image) -> str:
    """Encodes a PIL image as a base64 PNG data URL the frontend can render directly."""
    buf = io.BytesIO()
    pil_image.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{encoded}"


def explain_image(image_path, model_path, img_size=256):
    explainer = GradCAMExplainer(model_weight_path=model_path, img_size=img_size)
    image = Image.open(image_path).convert("RGB")
    result = explainer.explain(image)
    return {
        "imageUrl": overlay_to_data_url(result["overlay_image"]),
        "explanation": result["explanation"],
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Grad-CAM explainability on a single image")
    parser.add_argument("--image", type=str, required=True)
    parser.add_argument("--model_path", type=str, default="ai_detection_model.pt")
    parser.add_argument("--img_size", type=int, default=256)
    parser.add_argument("--save_path", type=str, default="evidence_overlay.png")
    args = parser.parse_args()

    explainer = GradCAMExplainer(model_weight_path=args.model_path, img_size=args.img_size)
    image = Image.open(args.image).convert("RGB")
    out = explainer.explain(image)

    out["overlay_image"].save(args.save_path)
    print(f"Saved heatmap overlay to {args.save_path}")
    print(f"AI probability: {out['ai_probability']}")
    print(f"Explanation: {out['explanation']}")
