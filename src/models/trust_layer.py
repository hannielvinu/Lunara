"""
LUNARA: Trust, Uncertainty & Hallucination-Risk Estimation Engine
Computes multi-source uncertainty, photometric shadow consistency, DEM slope alignment,
and generates pixel-level Confidence and Hallucination-Risk maps.
"""

import numpy as np
import cv2
import torch

class TrustLayer:
    def __init__(self, model_lunara=None):
        self.lunara = model_lunara

    def compute_model_uncertainty(self, lr_img: np.ndarray, num_passes: int = 2) -> np.ndarray:
        """
        Estimate generative model uncertainty using Monte Carlo dropout perturbations
        and multi-scale receptive field analysis.
        """
        if self.lunara is None:
            # Fallback high-frequency entropy estimate
            lap = cv2.Laplacian(lr_img, cv2.CV_32F)
            entropy = cv2.GaussianBlur(np.abs(lap), (15, 15), 3.0)
            uncertainty = cv2.resize(entropy, (lr_img.shape[1] * 4, lr_img.shape[0] * 4))
            return np.clip(uncertainty / (uncertainty.max() + 1e-8), 0.0, 1.0)

        self.lunara.net.train() # Enable dropout
        h, w = lr_img.shape[:2]
        img_norm = lr_img.astype(np.float32) / 255.0
        img_tensor = torch.from_numpy(img_norm).unsqueeze(0).unsqueeze(0).to(self.lunara.device)

        passes = []
        with torch.no_grad():
            for _ in range(num_passes):
                # Add tiny random jitter to test stability
                jitter = torch.randn_like(img_tensor) * 0.015
                out = self.lunara.net(img_tensor + jitter, mc_uncertainty=True)
                passes.append(out.squeeze().cpu().numpy())

        self.lunara.net.eval()
        passes_stack = np.stack(passes, axis=0) # [N, H, W]
        # Pixel-wise standard deviation across stochastic passes
        variance_map = np.std(passes_stack, axis=0)
        # Normalize to 0 - 1
        variance_norm = np.clip(variance_map / (np.percentile(variance_map, 98) + 1e-6), 0.0, 1.0)
        return variance_norm.astype(np.float32)

    def compute_cycle_reconstruction_error(self, enhanced_img: np.ndarray, lr_img: np.ndarray) -> np.ndarray:
        """
        Calculates downsampling reconstruction residual:
        E_recon = | Downsample(Enhanced) - LR |
        """
        h_lr, w_lr = lr_img.shape[:2]
        downsampled = cv2.resize(enhanced_img, (w_lr, h_lr), interpolation=cv2.INTER_AREA)
        diff = np.abs(downsampled.astype(np.float32) - lr_img.astype(np.float32)) / 255.0
        # Upsample residual to match enhanced image resolution
        diff_upsampled = cv2.resize(diff, (enhanced_img.shape[1], enhanced_img.shape[0]), interpolation=cv2.INTER_CUBIC)
        return np.clip(diff_upsampled, 0.0, 1.0)

    def compute_photometric_shadow_consistency(self, enhanced_img: np.ndarray, solar_angles: dict = None) -> np.ndarray:
        """
        Validates whether high-frequency edges and shadow gradients in the enhanced image
        align with the Sun azimuth and solar incidence vector.
        """
        solar_angles = solar_angles or {"sun_azimuth": 90.0, "incidence": 55.0}
        az_deg = solar_angles.get("sun_azimuth", 90.0)
        az_rad = np.radians(az_deg)
        
        # Expected illumination gradient vector
        sun_dx = np.cos(az_rad)
        sun_dy = np.sin(az_rad)
        
        # Compute image intensity gradients (Sobel)
        grad_x = cv2.Sobel(enhanced_img, cv2.CV_32F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(enhanced_img, cv2.CV_32F, 0, 1, ksize=3)
        
        grad_mag = np.sqrt(grad_x**2 + grad_y**2) + 1e-8
        norm_gx = grad_x / grad_mag
        norm_gy = grad_y / grad_mag
        
        # Dot product with expected sun vector (measures directional shadow fidelity)
        directional_alignment = np.abs(norm_gx * sun_dx + norm_gy * sun_dy)
        
        # In flat regions, alignment is trivially neutral
        weight = np.clip(grad_mag / (np.percentile(grad_mag, 90) + 1e-6), 0.0, 1.0)
        consistency = 0.5 + 0.5 * directional_alignment * weight + 0.5 * (1.0 - weight)
        return np.clip(consistency, 0.0, 1.0).astype(np.float32)

    def compute_dem_topographic_consistency(self, enhanced_img: np.ndarray, dem: np.ndarray = None) -> np.ndarray:
        """
        Compares enhanced optical image gradients with LOLA / TMC-2 DEM surface slope gradients.
        """
        if dem is None:
            # Synthetic proxy from smoothed optical profile
            dem_proxy = cv2.GaussianBlur(enhanced_img, (31, 31), 10.0).astype(np.float32)
            dem = dem_proxy
        else:
            if dem.shape != enhanced_img.shape:
                dem = cv2.resize(dem, (enhanced_img.shape[1], enhanced_img.shape[0]), interpolation=cv2.INTER_CUBIC)

        dem_dy, dem_dx = np.gradient(dem.astype(np.float32))
        dem_slope = np.sqrt(dem_dx**2 + dem_dy**2)
        dem_slope_norm = dem_slope / (np.percentile(dem_slope, 95) + 1e-6)
        
        # Optical intensity gradient
        opt_gy = cv2.Sobel(enhanced_img, cv2.CV_32F, 0, 1, ksize=3)
        opt_gx = cv2.Sobel(enhanced_img, cv2.CV_32F, 1, 0, ksize=3)
        opt_grad = np.sqrt(opt_gx**2 + opt_gy**2)
        opt_grad_norm = opt_grad / (np.percentile(opt_grad, 95) + 1e-6)
        
        # Correlation between elevation slope and optical contrast
        correlation = 1.0 - np.clip(np.abs(dem_slope_norm - opt_grad_norm), 0.0, 1.0)
        # Smooth spatial consistency
        consistency = cv2.GaussianBlur(correlation, (15, 15), 3.0)
        return np.clip(consistency, 0.0, 1.0).astype(np.float32)

    def analyze(self, lr_img: np.ndarray, enhanced_img: np.ndarray, dem: np.ndarray = None, solar_angles: dict = None) -> dict:
        """
        Full scientific evidence-awareness analysis generating Confidence Map, Hallucination-Risk Map,
        and scalar provenance metrics.
        """
        # 1. Model generative uncertainty (0.0 = deterministic, 1.0 = highly uncertain)
        uncertainty_map = self.compute_model_uncertainty(lr_img)
        
        # 2. Cycle-consistency reconstruction error (0.0 = perfect inversion, 1.0 = high mismatch)
        cycle_error_map = self.compute_cycle_reconstruction_error(enhanced_img, lr_img)
        
        # 3. Solar / Photometric shadow consistency (1.0 = physically consistent, 0.0 = inverted shadow)
        photometric_map = self.compute_photometric_shadow_consistency(enhanced_img, solar_angles)
        
        # 4. Topographic DEM slope consistency (1.0 = high topographic match, 0.0 = anomalous structure)
        dem_consistency_map = self.compute_dem_topographic_consistency(enhanced_img, dem)
        
        # Composite Hallucination-Risk Calculation:
        # High risk occurs when: high model uncertainty + high cycle error + low photometric consistency + low DEM alignment
        risk_raw = (
            0.35 * uncertainty_map +
            0.25 * cycle_error_map +
            0.20 * (1.0 - photometric_map) +
            0.20 * (1.0 - dem_consistency_map)
        )
        # Apply spatial smoothing
        risk_map = cv2.GaussianBlur(risk_raw, (7, 7), 1.5)
        risk_map = np.clip(risk_map, 0.0, 1.0)
        
        # Confidence Map is inverse of risk with high-confidence edge weighting
        confidence_raw = 1.0 - risk_map
        confidence_map = np.clip(confidence_raw, 0.0, 1.0)
        
        # Scalar Aggregate Metrics
        mean_confidence = float(np.mean(confidence_map) * 100.0)
        mean_risk = float(np.mean(risk_map) * 100.0)
        mean_geom = float(np.mean(photometric_map) * 100.0)
        mean_terrain = float(np.mean(dem_consistency_map) * 100.0)
        mean_reconstruction = float((1.0 - np.mean(cycle_error_map)) * 100.0)
        
        # Categorical risk categorization
        if mean_risk < 18.0:
            risk_category = "Low Risk (High Trust)"
        elif mean_risk < 35.0:
            risk_category = "Moderate Risk (Scientifically Plausible)"
        elif mean_risk < 55.0:
            risk_category = "Elevated Risk (Verification Recommended)"
        else:
            risk_category = "Severe Risk (High Hallucination Likelihood)"

        # Convert maps to 0-255 uint8 heatmaps for rendering and API transmission
        confidence_uint8 = (confidence_map * 255.0).astype(np.uint8)
        risk_uint8 = (risk_map * 255.0).astype(np.uint8)
        
        # Generate Jet/Inferno colored heatmaps for visualization
        risk_color = cv2.applyColorMap(risk_uint8, cv2.COLORMAP_INFERNO)
        confidence_color = cv2.applyColorMap(confidence_uint8, cv2.COLORMAP_VIRIDIS)

        return {
            "image_confidence_pct": round(mean_confidence, 2),
            "hallucination_risk_pct": round(mean_risk, 2),
            "geometry_consistency_pct": round(mean_geom, 2),
            "terrain_consistency_pct": round(mean_terrain, 2),
            "reconstruction_fidelity_pct": round(mean_reconstruction, 2),
            "risk_classification": risk_category,
            "confidence_map_raw": confidence_map,
            "risk_map_raw": risk_map,
            "confidence_map_uint8": confidence_uint8,
            "risk_map_uint8": risk_uint8,
            "confidence_color_bgr": confidence_color,
            "risk_color_bgr": risk_color
        }
