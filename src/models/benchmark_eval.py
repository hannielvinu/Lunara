"""
LUNARA: Comprehensive Benchmark Evaluation Engine
Runs rigorous multi-model comparative benchmarking across all benchmark lunar regions.
Compares: Original Ground Truth vs Bicubic vs AI Baseline vs LUNARA Core.
"""

import os
import sys
import json
import numpy as np
from PIL import Image

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

DATA_DIR = os.path.join(BASE_DIR, "01_DATA")
CATALOG_PATH = os.path.join(DATA_DIR, "data_catalog.json")
RESULTS_DIR = os.path.join(BASE_DIR, "07_DEMO", "benchmark_results")
os.makedirs(RESULTS_DIR, exist_ok=True)

from src.models.pipeline import LunaraPipeline

def run_benchmark():
    print("[LUNARA Benchmark] Loading Data Catalog...")
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    pipeline = LunaraPipeline()
    benchmark_records = []

    models_to_test = ["bicubic", "ai_baseline", "lunara"]

    for scene in catalog:
        scene_id = scene["scene_id"]
        scene_name = scene["name"]
        print(f"\n=======================================================")
        print(f"Benchmarking Scene: {scene_name} ({scene_id})")
        print(f"=======================================================")

        # Load images & DEM
        lr_path = os.path.join(BASE_DIR, scene["files"]["lr_image"])
        hr_path = os.path.join(BASE_DIR, scene["files"]["hr_image"])
        dem_path = os.path.join(BASE_DIR, scene["files"]["dem"])

        lr_img = np.array(Image.open(lr_path))
        hr_gt = np.array(Image.open(hr_path))
        dem = np.load(dem_path)

        scene_results = {}

        for model_key in models_to_test:
            print(f" -> Testing model: {model_key.upper()}...")
            result = pipeline.run(
                lr_image=lr_img,
                model_choice=model_key,
                scale=4,
                dem=dem,
                metadata=scene,
                ground_truth=hr_gt
            )

            metrics = result["metrics"]
            trust = result["trust_metrics"]
            num_features = len(result["features"])

            # Save enhanced image and confidence/risk maps to DEMO folder
            out_prefix = f"{scene_id}_{model_key}"
            Image.fromarray(result["enhanced_image"]).save(os.path.join(RESULTS_DIR, f"{out_prefix}_enhanced.png"))
            Image.fromarray(result["confidence_map"]).save(os.path.join(RESULTS_DIR, f"{out_prefix}_confidence.png"))
            Image.fromarray(result["risk_map"]).save(os.path.join(RESULTS_DIR, f"{out_prefix}_risk.png"))
            if model_key == "lunara":
                Image.fromarray(result["annotated_image"]).save(os.path.join(RESULTS_DIR, f"{scene_id}_features_annotated.png"))

            record = {
                "Scene ID": scene_id,
                "Terrain": scene["name"],
                "Model": metrics.get("model", model_key),
                "PSNR (dB)": metrics.get("psnr_db", 0.0),
                "SSIM": metrics.get("ssim", 0.0),
                "MAE": metrics.get("mae", 0.0),
                "Edge Preservation": metrics.get("edge_preservation_index", 0.0),
                "Confidence (%)": trust["image_confidence_pct"],
                "Hallucination Risk (%)": trust["hallucination_risk_pct"],
                "Risk Level": trust["risk_classification"],
                "Detected Craters": num_features,
                "Latency (ms)": result["provenance"]["processing_latency_ms"]
            }
            benchmark_records.append(record)

    # Save benchmark table to JSON & Markdown
    bench_json_path = os.path.join(RESULTS_DIR, "benchmark_summary.json")
    with open(bench_json_path, "w", encoding="utf-8") as f:
        json.dump(benchmark_records, f, indent=2)

    # Generate Markdown Summary
    md_content = "# LUNARA: Multi-Model Scientific Super-Resolution Benchmark\n\n"
    md_content += "Evaluation performed across 4 representative planetary test scenes degraded at 4x scale factor.\n\n"
    md_content += "| Scene | Model | PSNR (dB) | SSIM | Edge Preservation | Confidence (%) | Hallucination Risk (%) | Risk Status | Craters Detected |\n"
    md_content += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
    for r in benchmark_records:
        md_content += f"| {r['Scene ID']} | **{r['Model']}** | {r['PSNR (dB)']} | {r['SSIM']} | {r['Edge Preservation']} | {r['Confidence (%)']}% | {r['Hallucination Risk (%)']}% | {r['Risk Level']} | {r['Detected Craters']} |\n"

    md_path = os.path.join(BASE_DIR, "04_MODEL_SPEC", "evaluation_metrics.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(md_content)

    print(f"\n[LUNARA Benchmark] Completed! Evaluation table written to -> {md_path}")

if __name__ == "__main__":
    run_benchmark()
