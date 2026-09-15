import torch
import torch.nn as nn
import torchvision.models as models

class FrequencyBranch(nn.Module):
    """Processes FFT spectral log-magnitude to capture frequency artifacts."""
    def __init__(self):
        super(FrequencyBranch, self).__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 16, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.Conv2d(16, 32, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d((4, 4)),
            nn.Flatten()
        )
        self.fc = nn.Linear(32 * 4 * 4, 64)

    def forward(self, x):
        # x shape: [B, 3, H, W] -> convert to grayscale for FFT
        gray = 0.2989 * x[:, 0:1, :, :] + 0.5870 * x[:, 1:2, :, :] + 0.1140 * x[:, 2:3, :, :]
        
        # Compute 2D Fast Fourier Transform
        fft = torch.fft.fft2(gray)
        fft_shift = torch.fft.fftshift(fft)
        magnitude = torch.abs(fft_shift)
        log_spectrum = torch.log(magnitude + 1e-8)
        
        return self.fc(self.conv(log_spectrum))

class AIDetectionModel(nn.Module):
    """Core AI Detection Model fusing Spatial and Frequency domain signals."""
    def __init__(self, backbone='resnet18', pretrained=True):
        super(AIDetectionModel, self).__init__()
        
        # Spatial Branch (Pretrained CNN)
        if backbone == 'resnet18':
            weights = models.ResNet18_Weights.DEFAULT if pretrained else None
            self.spatial_branch = models.resnet18(weights=weights)
            num_ftrs = self.spatial_branch.fc.in_features
            self.spatial_branch.fc = nn.Identity()  # Remove final linear layer
        else:
            raise ValueError(f"Unsupported backbone: {backbone}")

        # Frequency Branch
        self.freq_branch = FrequencyBranch()

        # Fusion Head (Combines 512 spatial features + 64 frequency features)
        self.classifier = nn.Sequential(
            nn.Linear(num_ftrs + 64, 128),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(128, 1)  # Raw logits for BCEWithLogitsLoss
        )

    def forward(self, x):
        spatial_feats = self.spatial_branch(x)
        freq_feats = self.freq_branch(x)
        combined = torch.cat((spatial_feats, freq_feats), dim=1)
        logits = self.classifier(combined)
        return logits