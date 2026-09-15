import torch
from torchvision import transforms
from PIL import Image
from model import AIDetectionModel

class DetectorAPI:
    """Clean API wrapper for Person 2's AI Detection Model."""
    
    def __init__(self, model_weight_path: str, device: str = None, img_size: int = 256):
        if device is None:
            self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        else:
            self.device = torch.device(device)

        # Initialize model and load weights
        self.model = AIDetectionModel(pretrained=False)
        self.model.load_state_dict(torch.load(model_weight_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()

        # Image Preprocessing Transformation Pipeline
        # NOTE: img_size MUST match the resolution the model was trained with (see train.py --img_size)
        self.transform = transforms.Compose([
            transforms.Resize((img_size, img_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def predict(self, image_input) -> dict:
        """
        Main prediction method expected by the team.

        Args:
            image_input: Accepts a PIL Image object or PyTorch Tensor [C, H, W].

        Returns:
            dict with:
                label: "AI-generated" or "Real"
                ai_probability: float 0-1 (1.0 = certainly AI-generated)
                real_probability: float 0-1 (1.0 = certainly real)
                confidence: float 0-1, confidence in the predicted label

        IMPORTANT LABEL NOTE:
        torchvision's ImageFolder assigns class indices ALPHABETICALLY.
        For a folder layout of FAKE/REAL, that means FAKE=0, REAL=1.
        The model's raw sigmoid output is therefore P(label=1) = P(REAL) —
        NOT P(AI-generated). This function converts it correctly so callers
        never have to remember that detail.
        """
        # Convert PIL Image if needed
        if isinstance(image_input, Image.Image):
            tensor = self.transform(image_input).unsqueeze(0).to(self.device)
        elif isinstance(image_input, torch.Tensor):
            if image_input.dim() == 3:
                tensor = image_input.unsqueeze(0).to(self.device)
            else:
                tensor = image_input.to(self.device)
        else:
            raise TypeError("Input must be a PIL Image or torch.Tensor")

        with torch.no_grad():
            logits = self.model(tensor)
            real_probability = torch.sigmoid(logits).item()  # P(label=1) = P(REAL)

        ai_probability = 1.0 - real_probability
        label = "AI-generated" if ai_probability >= 0.5 else "Real"
        confidence = max(ai_probability, real_probability)

        return {
            "label": label,
            "ai_probability": round(float(ai_probability), 4),
            "real_probability": round(float(real_probability), 4),
            "confidence": round(float(confidence), 4),
        }


# Example usage for verification:
if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_path", type=str, default="ai_detection_model.pt")
    parser.add_argument("--img_size", type=int, default=64,
                         help="Must match the resolution used in training (demo checkpoint = 64)")
    parser.add_argument("--image", type=str, default=None, help="Path to an image to test (optional)")
    args = parser.parse_args()

    detector = DetectorAPI(model_weight_path=args.model_path, img_size=args.img_size)

    if args.image:
        img = Image.open(args.image).convert("RGB")
    else:
        img = Image.new('RGB', (512, 512), color='red')

    result = detector.predict(img)
    print(result)