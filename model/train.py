"""
Step 2/3: Core AI Detection Model — Training Script
Trains the ResNet18 + FFT-Frequency fusion model (see model.py) on the
Real-vs-AI-generated dataset (CIFAKE-style folder layout: <split>/REAL, <split>/FAKE).

Usage:
    python train.py --train_dir dataset/train --val_dir dataset/val \
                     --epochs 5 --batch_size 32 --save_path best_model.pt
"""

import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import transforms, datasets
from model import AIDetectionModel


def get_transform(img_size=256):
    return transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])


def run_epoch(model, loader, criterion, optimizer, device, train=True):
    model.train() if train else model.eval()
    total_loss, correct, total = 0.0, 0, 0

    context = torch.enable_grad() if train else torch.no_grad()
    with context:
        for images, labels in loader:
            images = images.to(device)
            labels = labels.float().unsqueeze(1).to(device)

            if train:
                optimizer.zero_grad()

            outputs = model(images)
            loss = criterion(outputs, labels)

            if train:
                loss.backward()
                optimizer.step()

            total_loss += loss.item() * images.size(0)
            preds = (torch.sigmoid(outputs) >= 0.5).float()
            correct += (preds == labels).sum().item()
            total += images.size(0)

    avg_loss = total_loss / max(total, 1)
    accuracy = correct / max(total, 1)
    return avg_loss, accuracy


def train_model(train_dir, val_dir, epochs=5, batch_size=32, lr=1e-4,
                 save_path='ai_detection_model.pt', pretrained=True,
                 img_size=256, num_workers=2):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")

    transform = get_transform(img_size)

    # ImageFolder assigns labels alphabetically: FAKE=0, REAL=1
    train_dataset = datasets.ImageFolder(root=train_dir, transform=transform)
    val_dataset = datasets.ImageFolder(root=val_dir, transform=transform)
    print(f"Class mapping: {train_dataset.class_to_idx}")
    print(f"Train samples: {len(train_dataset)} | Val samples: {len(val_dataset)}")

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=num_workers)

    model = AIDetectionModel(pretrained=pretrained).to(device)
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.AdamW(model.parameters(), lr=lr)

    best_val_loss = float('inf')

    for epoch in range(epochs):
        train_loss, train_acc = run_epoch(model, train_loader, criterion, optimizer, device, train=True)
        val_loss, val_acc = run_epoch(model, val_loader, criterion, optimizer, device, train=False)

        print(f"Epoch {epoch + 1}/{epochs} | "
              f"Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | "
              f"Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}")

        # Save only the best-performing checkpoint (based on validation loss)
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), save_path)
            print(f"  -> New best model saved to {save_path} (val_loss={val_loss:.4f})")

    print("Training complete.")
    return save_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train the SignalScope core detection model")
    parser.add_argument("--train_dir", type=str, required=True, help="Path to training data (REAL/FAKE subfolders)")
    parser.add_argument("--val_dir", type=str, required=True, help="Path to validation data (REAL/FAKE subfolders)")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-4)
    parser.add_argument("--save_path", type=str, default="ai_detection_model.pt")
    parser.add_argument("--no_pretrained", action="store_true",
                         help="Train ResNet18 backbone from scratch (use if no internet access to download ImageNet weights)")
    parser.add_argument("--img_size", type=int, default=256, help="Input image resolution (default 256)")
    parser.add_argument("--num_workers", type=int, default=2)
    args = parser.parse_args()

    train_model(args.train_dir, args.val_dir, args.epochs, args.batch_size, args.lr,
                args.save_path, pretrained=not args.no_pretrained,
                img_size=args.img_size, num_workers=args.num_workers)
