"""
LUNARA: Baseline 1 - Standard Bicubic Interpolation
Provides standard mathematical interpolation benchmark for lunar super-resolution.
"""

import numpy as np
import cv2
from skimage.metrics import peak_signal_noise_ratio as psnr, structural_similarity as ssim

class BicubicBaseline:
    def __init__(self, scale_factor: int = 4):
        self.scale_factor = scale_factor
        self.model_name = "Bicubic Interpolation"
        self.model_type = "Mathematical Baseline"

    def enhance(self, lr_img: np.ndarray) -> np.ndarray:
        """Upscale low-resolution image using bicubic spline interpolation."""
        h, w = lr_img.shape[:2]
        hr_h, hr_w = h * self.scale_factor, w * self.scale_factor
        enhanced = cv2.resize(lr_img, (hr_w, hr_h), interpolation=cv2.INTER_CUBIC)
        return np.clip(enhanced, 0, 255).astype(np.uint8)

    def evaluate(self, enhanced: np.ndarray, ground_truth: np.ndarray) -> dict:
        """Compute standard reconstruction metrics against high-resolution ground truth."""
        if enhanced.shape != ground_truth.shape:
            enhanced = cv2.resize(enhanced, (ground_truth.shape[1], ground_truth.shape[0]))

        score_psnr = float(psnr(ground_truth, enhanced, data_range=255))
        score_ssim = float(ssim(ground_truth, enhanced, data_range=255))
        mae = float(np.mean(np.abs(ground_truth.astype(np.float32) - enhanced.astype(np.float32))))
        rmse = float(np.sqrt(np.mean((ground_truth.astype(np.float32) - enhanced.astype(np.float32)) ** 2)))
        
        # Edge preservation index (EPI)
        sobel_gt = cv2.Sobel(ground_truth, cv2.CV_64F, 1, 1, ksize=3)
        sobel_enh = cv2.Sobel(enhanced, cv2.CV_64F, 1, 1, ksize=3)
        epi = float(np.sum(sobel_gt * sobel_enh) / (np.sqrt(np.sum(sobel_gt**2) * np.sum(sobel_enh**2) + 1e-8)))

        return {
            "model": self.model_name,
            "psnr_db": round(score_psnr, 2),
            "ssim": round(score_ssim, 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "edge_preservation_index": round(max(0.0, min(1.0, epi)), 4)
        }
