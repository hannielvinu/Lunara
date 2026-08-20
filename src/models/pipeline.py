"""
LUNARA: Unified End-to-End Planetary Enhancement Pipeline
Orchestrates:
Input -> PDS4 Metadata -> Ingestion & Preprocessing -> AI Super-Resolution ->
Trust & Uncertainty -> Hallucination Risk -> Scientific Features -> Provenance Package
"""

import os
import sys
import time
import json
import numpy as np
import cv2
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.models.bicubic_baseline import BicubicBaseline
from src.models.sr_baseline import AIBaselineModel
from src.models.lunara_core import LunaraModel
from src.models.trust_layer import TrustLayer
from src.models.feature_detector import ScientificFeatureDetector

class LunaraPipeline:
    def __init__(self):
        print("[LUNARA Pipeline] Initializing AI models and trust engines...")
        self.bicubic = BicubicBaseline(scale_factor=4)
        self.ai_baseline = AIBaselineModel(scale_factor=4)
        self.lunara = LunaraModel(scale_factor=4)
        self.trust_layer = TrustLayer(model_lunara=self.lunara)
        self.feature_detector = ScientificFeatureDetector()
        print("[LUNARA Pipeline] All inference sub-systems online.")

    def run(
        self,
        lr_image: np.ndarray,
        model_choice: str = "lunara",
        scale: int = 4,
        dem: np.ndarray = None,
        metadata: dict = None,
        ground_truth: np.ndarray = None
    ) -> dict:
        """
        Execute full end-to-end super-resolution and scientific trust evaluation.
        """
        start_time = time.time()
        metadata = metadata or {}
        solar_angles = metadata.get("solar_geometry", {"incidence": 55.0, "sun_azimuth": 90.0})
        
        # 1. Model Super-Resolution Enhancement
        if model_choice.lower() == "bicubic":
            enhanced_img = self.bicubic.enhance(lr_image)
            selected_model_name = self.bicubic.model_name
            selected_model_type = "Mathematical Baseline"
        elif model_choice.lower() in ["ai_baseline", "baseline", "sr_baseline"]:
            enhanced_img = self.ai_baseline.enhance(lr_image)
            selected_model_name = self.ai_baseline.model_name
            selected_model_type = "AI Baseline (EDSR/Real-ESRGAN)"
        else: # "lunara" default
            enhanced_img = self.lunara.enhance(lr_image, solar_angles)
            selected_model_name = self.lunara.model_name
            selected_model_type = "Physics-Guided Super-Resolution"

        # 2. Trust, Uncertainty & Hallucination Risk Analysis
        trust_analysis = self.trust_layer.analyze(
            lr_img=lr_image,
            enhanced_img=enhanced_img,
            dem=dem,
            solar_angles=solar_angles
        )

        # 3. Scientific Candidate Feature Extraction
        center_lat = metadata.get("latitude", 0.0)
        center_lon = metadata.get("longitude", 0.0)
        res_m = metadata.get("resolution_hr", 0.5)

        detected_features = self.feature_detector.detect_features(
            enhanced_img=enhanced_img,
            confidence_map=trust_analysis["confidence_map_raw"],
            risk_map=trust_analysis["risk_map_raw"],
            center_lat=center_lat,
            center_lon=center_lon,
            res_meters=res_m
        )
        
        annotated_img = self.feature_detector.annotate_image(enhanced_img, detected_features)

        # 4. Metrics Evaluation (if ground truth available)
        metrics = {}
        if ground_truth is not None:
            if model_choice.lower() == "bicubic":
                metrics = self.bicubic.evaluate(enhanced_img, ground_truth)
            elif model_choice.lower() in ["ai_baseline", "baseline", "sr_baseline"]:
                metrics = self.ai_baseline.evaluate(enhanced_img, ground_truth)
            else:
                metrics = self.lunara.evaluate(enhanced_img, ground_truth)
        else:
            # No-reference proxy metrics
            lap = cv2.Laplacian(enhanced_img, cv2.CV_64F)
            metrics = {
                "model": selected_model_name,
                "laplacian_variance_sharpness": round(float(lap.var()), 2),
                "no_reference_edge_score": round(float(np.mean(np.abs(lap))), 2)
            }

        elapsed_ms = round((time.time() - start_time) * 1000.0, 1)

        # 5. Scientific Provenance Record
        provenance = {
            "mission": metadata.get("mission", "CHANDRAYAAN-2"),
            "instrument": metadata.get("instrument", "TMC-2/OHRC"),
            "scene_id": metadata.get("scene_id", "custom_observation"),
            "source_url": metadata.get("source_url", "https://pradan.issdc.gov.in/ch2/"),
            "model_applied": selected_model_name,
            "model_type": selected_model_type,
            "model_version": getattr(self.lunara, "model_version", "v1.0.4"),
            "scale_factor": f"{scale}x",
            "input_resolution_m": metadata.get("resolution_lr", 5.0),
            "output_resolution_m": metadata.get("resolution_hr", 0.5),
            "input_dimensions": list(lr_image.shape[:2]),
            "output_dimensions": list(enhanced_img.shape[:2]),
            "dem_used": dem is not None,
            "solar_geometry": solar_angles,
            "processing_latency_ms": elapsed_ms,
            "scientific_disclaimer": self.feature_detector.disclaimer,
            "pds4_compliance": "PDS4 Standard Observational Product"
        }

        return {
            "enhanced_image": enhanced_img,
            "annotated_image": annotated_img,
            "confidence_map": trust_analysis["confidence_map_uint8"],
            "risk_map": trust_analysis["risk_map_uint8"],
            "confidence_color": trust_analysis["confidence_color_bgr"],
            "risk_color": trust_analysis["risk_color_bgr"],
            "trust_metrics": {
                "image_confidence_pct": trust_analysis["image_confidence_pct"],
                "hallucination_risk_pct": trust_analysis["hallucination_risk_pct"],
                "geometry_consistency_pct": trust_analysis["geometry_consistency_pct"],
                "terrain_consistency_pct": trust_analysis["terrain_consistency_pct"],
                "reconstruction_fidelity_pct": trust_analysis["reconstruction_fidelity_pct"],
                "risk_classification": trust_analysis["risk_classification"]
            },
            "metrics": metrics,
            "features": detected_features,
            "provenance": provenance
        }
