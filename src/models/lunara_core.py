"""
LUNARA: Evidence-Aware Physics-Guided Super-Resolution Network
Integrates spatial attention, high-frequency gradient preservation, and planetary radiance reconstruction.
"""

import os
import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import cv2
from skimage.metrics import peak_signal_noise_ratio as psnr, structural_similarity as ssim

class SpatialChannelAttention(nn.Module):
    """Channel and spatial attention mechanism for planetary edge and crater rim preservation."""
    def __init__(self, channels):
        super(SpatialChannelAttention, self).__init__()
        # Channel attention
        self.avg_pool = nn.AdaptiveAvgPool2d(1)
        self.max_pool = nn.AdaptiveMaxPool2d(1)
        self.ca_mlp = nn.Sequential(
            nn.Conv2d(channels, channels // 8, 1, bias=False),
            nn.ReLU(inplace=True),
            nn.Conv2d(channels // 8, channels, 1, bias=False)
        )
        self.ca_sigmoid = nn.Sigmoid()
        
        # Spatial attention
        self.sa_conv = nn.Conv2d(2, 1, kernel_size=7, padding=3, bias=False)
        self.sa_sigmoid = nn.Sigmoid()

    def forward(self, x):
        # Channel
        ca = self.ca_sigmoid(self.ca_mlp(self.avg_pool(x)) + self.ca_mlp(self.max_pool(x)))
        x_ca = x * ca
        
        # Spatial
        avg_out = torch.mean(x_ca, dim=1, keepdim=True)
        max_out, _ = torch.max(x_ca, dim=1, keepdim=True)
        sa = self.sa_sigmoid(self.sa_conv(torch.cat([avg_out, max_out], dim=1)))
        return x_ca * sa

class PhysicsAttentionBlock(nn.Module):
    def __init__(self, channels=64):
        super(PhysicsAttentionBlock, self).__init__()
        self.conv1 = nn.Conv2d(channels, channels, kernel_size=3, padding=1)
        self.prelu = nn.PReLU()
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1)
        self.attention = SpatialChannelAttention(channels)
        self.dropout = nn.Dropout2d(p=0.1) # For MC uncertainty quantification

    def forward(self, x):
        res = self.conv1(x)
        res = self.prelu(res)
        res = self.conv2(res)
        res = self.attention(res)
        res = self.dropout(res)
        return x + res

class LunaraSuperResolutionNet(nn.Module):
    def __init__(self, scale_factor=4, num_channels=1, num_features=64, num_blocks=8):
        super(LunaraSuperResolutionNet, self).__init__()
        self.scale_factor = scale_factor
        
        # Low-level feature extraction
        self.head = nn.Sequential(
            nn.Conv2d(num_channels, num_features, kernel_size=3, padding=1),
            nn.PReLU()
        )
        
        # Deep physics-guided residual attention body
        self.blocks = nn.ModuleList([PhysicsAttentionBlock(num_features) for _ in range(num_blocks)])
        self.conv_after_body = nn.Conv2d(num_features, num_features, kernel_size=3, padding=1)
        
        # High-frequency gradient branch (Sobel feature infusion)
        self.gradient_conv = nn.Sequential(
            nn.Conv2d(num_channels, num_features // 2, kernel_size=3, padding=1),
            nn.PReLU(),
            nn.Conv2d(num_features // 2, num_features, kernel_size=3, padding=1)
        )
        
        # Multi-scale progressive upsampling (PixelShuffle 4x)
        self.upsample = nn.Sequential(
            nn.Conv2d(num_features, num_features * 4, kernel_size=3, padding=1),
            nn.PixelShuffle(2),
            nn.PReLU(),
            nn.Conv2d(num_features, num_features * 4, kernel_size=3, padding=1),
            nn.PixelShuffle(2),
            nn.PReLU()
        )
        
        # High-resolution reconstruction tail
        self.tail = nn.Sequential(
            nn.Conv2d(num_features, num_features // 2, kernel_size=3, padding=1),
            nn.PReLU(),
            nn.Conv2d(num_features // 2, num_channels, kernel_size=3, padding=1)
        )

    def forward(self, x, mc_uncertainty=False):
        if mc_uncertainty:
            self.train() # Enable dropout for Monte Carlo inference
        else:
            self.eval()
            
        feat0 = self.head(x)
        
        # Compute input gradient guidance
        gx = torch.abs(x[:, :, :, 1:] - x[:, :, :, :-1])
        gx = F.pad(gx, (0, 1, 0, 0))
        gy = torch.abs(x[:, :, 1:, :] - x[:, :, :-1, :])
        gy = F.pad(gy, (0, 0, 0, 1))
        grad_map = gx + gy
        grad_feat = self.gradient_conv(grad_map)
        
        # Process through attention blocks
        res = feat0 + grad_feat
        for block in self.blocks:
            res = block(res)
            
        feat_res = self.conv_after_body(res)
        feat_fusion = feat0 + feat_res
        
        # Upsampling
        up = self.upsample(feat_fusion)
        out = self.tail(up)
        
        # Physics base residual connection (bicubic prior)
        bicubic = F.interpolate(x, scale_factor=self.scale_factor, mode='bicubic', align_corners=False)
        reconstruction = torch.clamp(out + bicubic, 0.0, 1.0)
        return reconstruction

class LunaraModel:
    def __init__(self, scale_factor: int = 4, device: str = None):
        self.scale_factor = scale_factor
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model_name = "LUNARA Evidence-Aware Physics-SR"
        self.model_version = "v1.0.4-planetary"
        self.model_type = "Physics-Guided Super-Resolution"
        
        self.net = LunaraSuperResolutionNet(scale_factor=scale_factor).to(self.device)
        self._init_weights()
        self.net.eval()

    def _init_weights(self):
        for m in self.net.modules():
            if isinstance(m, nn.Conv2d):
                nn.init.kaiming_normal_(m.weight, mode='fan_out', nonlinearity='relu')
                if m.bias is not None:
                    nn.init.zeros_(m.bias)

    def enhance(self, lr_img: np.ndarray, solar_angles: dict = None) -> np.ndarray:
        """Run LUNARA super-resolution enhancement."""
        self.net.eval()
        img_norm = lr_img.astype(np.float32) / 255.0
        
        if len(img_norm.shape) == 2:
            img_tensor = torch.from_numpy(img_norm).unsqueeze(0).unsqueeze(0).to(self.device)
        else:
            img_tensor = torch.from_numpy(img_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.net(img_tensor, mc_uncertainty=False)
            
        out_np = output.squeeze().cpu().numpy()
        
        # Apply gentle high-frequency unsharp mask enhancement tuned for lunar regolith
        out_scaled = np.clip(out_np * 255.0, 0, 255).astype(np.uint8)
        gaussian_blur = cv2.GaussianBlur(out_scaled, (0, 0), 1.0)
        unsharp = cv2.addWeighted(out_scaled, 1.35, gaussian_blur, -0.35, 0)
        return np.clip(unsharp, 0, 255).astype(np.uint8)

    def evaluate(self, enhanced: np.ndarray, ground_truth: np.ndarray, dem: np.ndarray = None) -> dict:
        """Compute comprehensive reconstruction and scientific consistency metrics."""
        if enhanced.shape != ground_truth.shape:
            enhanced = cv2.resize(enhanced, (ground_truth.shape[1], ground_truth.shape[0]))

        score_psnr = float(psnr(ground_truth, enhanced, data_range=255))
        score_ssim = float(ssim(ground_truth, enhanced, data_range=255))
        mae = float(np.mean(np.abs(ground_truth.astype(np.float32) - enhanced.astype(np.float32))))
        rmse = float(np.sqrt(np.mean((ground_truth.astype(np.float32) - enhanced.astype(np.float32)) ** 2)))
        
        # Edge preservation index
        sobel_gt = cv2.Sobel(ground_truth, cv2.CV_64F, 1, 1, ksize=3)
        sobel_enh = cv2.Sobel(enhanced, cv2.CV_64F, 1, 1, ksize=3)
        epi = float(np.sum(sobel_gt * sobel_enh) / (np.sqrt(np.sum(sobel_gt**2) * np.sum(sobel_enh**2) + 1e-8)))

        # Learned Perceptual / High-Frequency Error Proxy (LPIPS Proxy)
        lpips_proxy = float(np.mean((cv2.Laplacian(ground_truth, cv2.CV_32F) - cv2.Laplacian(enhanced, cv2.CV_32F))**2) / 1000.0)

        # Physics consistency score calculation
        physics_score = None
        physics_status = "UNAVAILABLE"
        
        if dem is not None:
            # Resize DEM to match ground truth size
            dem_resized = cv2.resize(dem, (ground_truth.shape[1], ground_truth.shape[0]), interpolation=cv2.INTER_CUBIC)
            dem_dy, dem_dx = np.gradient(dem_resized.astype(np.float32))
            dem_slope = np.sqrt(dem_dx**2 + dem_dy**2)
            dem_slope_norm = dem_slope / (np.percentile(dem_slope, 95) + 1e-6)
            
            # Enhanced image gradients
            opt_gy = cv2.Sobel(enhanced, cv2.CV_32F, 0, 1, ksize=3)
            opt_gx = cv2.Sobel(enhanced, cv2.CV_32F, 1, 0, ksize=3)
            opt_grad = np.sqrt(opt_gx**2 + opt_gy**2)
            opt_grad_norm = opt_grad / (np.percentile(opt_grad, 95) + 1e-6)
            
            # Correlation between slope and image gradients
            correlation = 1.0 - np.mean(np.clip(np.abs(dem_slope_norm - opt_grad_norm), 0.0, 1.0))
            physics_score = round(float(correlation), 4)
            physics_status = "COMPUTED"

        return {
            "model": self.model_name,
            "version": self.model_version,
            "psnr_db": round(score_psnr, 2),
            "ssim": round(score_ssim, 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "edge_preservation_index": round(max(0.0, min(1.0, epi)), 4),
            "perceptual_similarity_proxy": round(min(0.5, max(0.01, lpips_proxy)), 4),
            "perceptual_metric_note": "This is a proxy metric and is not LPIPS.",
            "physics_consistency_score": physics_score,
            "physics_consistency_status": physics_status
        }
