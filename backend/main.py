"""
LUNARA: High-Performance FastAPI Planetary Mission Control Backend
Provides REST APIs for dataset catalog, super-resolution jobs, trust & uncertainty maps,
hallucination-risk estimation, scientific feature extraction, and multi-model benchmarking.
"""

import os
import sys
import uuid
import time
import json
import base64
from typing import Optional, List, Dict, Any
from io import BytesIO

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field
import numpy as np
import cv2
from PIL import Image

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.models.pipeline import LunaraPipeline
from src.models.trust_engine import ScientificTrustEngine
from src.models.feature_analysis_engine import ScientificFeatureAnalysisEngine

# Initialize FastAPI App
app = FastAPI(
    title="LUNARA Mission Control API",
    description="Evidence-Aware AI for Planetary Image Enhancement & Scientific Provenance",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage & Pipeline instance
pipeline = LunaraPipeline()
trust_engine = ScientificTrustEngine()
feature_engine = ScientificFeatureAnalysisEngine()
JOBS_DB: Dict[str, Dict[str, Any]] = {}
RESULTS_DB: Dict[str, Dict[str, Any]] = {}

DATA_DIR = os.path.join(BASE_DIR, "01_DATA")
CATALOG_PATH = os.path.join(DATA_DIR, "data_catalog.json")
RESULTS_DIR = os.path.join(BASE_DIR, "07_DEMO", "benchmark_results")
STATIC_OUTPUT_DIR = os.path.join(BASE_DIR, "backend", "static_output")
os.makedirs(STATIC_OUTPUT_DIR, exist_ok=True)

# Mount static directories for image retrieval
app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")
app.mount("/static_output", StaticFiles(directory=STATIC_OUTPUT_DIR), name="static_output")
if os.path.exists(RESULTS_DIR):
    app.mount("/demo_results", StaticFiles(directory=RESULTS_DIR), name="demo_results")

# -------------------------------------------------------------
# Pydantic Request & Response Schemas
# -------------------------------------------------------------

class SolarGeometry(BaseModel):
    incidence: float = 54.2
    emission: float = 2.1
    phase: float = 52.8
    sun_azimuth: float = 83.4

class DatasetItem(BaseModel):
    scene_id: str
    name: str
    mission: str
    instrument: str
    latitude: float
    longitude: float
    resolution_hr: float
    resolution_lr: float
    scale_factor: int
    dimensions_hr: List[int]
    dimensions_lr: List[int]
    acquisition_time: str
    solar_geometry: SolarGeometry
    files: Dict[str, str]
    source_url: str
    license: str
    provenance: Dict[str, str]

class EnhanceRequest(BaseModel):
    dataset_id: Optional[str] = None
    image_base64: Optional[str] = None
    model: str = Field(default="lunara", description="'lunara', 'ai_baseline', or 'bicubic'")
    scale: int = Field(default=4, ge=2, le=8)
    enable_consistency_checks: bool = True
    enable_dem_guidance: bool = True
    custom_lat: Optional[float] = None
    custom_lon: Optional[float] = None

class TrustMetrics(BaseModel):
    image_confidence_pct: float
    hallucination_risk_pct: float
    geometry_consistency_pct: float
    terrain_consistency_pct: float
    reconstruction_fidelity_pct: float
    risk_classification: str

class ScientificFeature(BaseModel):
    id: str
    type: str
    label: str
    status: str
    verification_requirement: str
    verification_tier: str
    pixel_x: int
    pixel_y: int
    pixel_radius: int
    latitude: float
    longitude: float
    diameter_meters: float
    diameter_km: float
    estimated_depth_meters: float
    depth_to_diameter_ratio: float
    local_confidence_pct: float
    local_hallucination_risk_pct: float

class ProvenanceRecord(BaseModel):
    mission: str
    instrument: str
    scene_id: str
    source_url: str
    model_applied: str
    model_type: str
    model_version: str
    scale_factor: str
    input_resolution_m: float
    output_resolution_m: float
    input_dimensions: List[int]
    output_dimensions: List[int]
    dem_used: bool
    dem_source: str
    solar_geometry: Dict[str, float]
    processing_latency_ms: float
    scientific_disclaimer: str
    pds4_compliance: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress_pct: int
    model: str
    scale: int
    created_at: float
    completed_at: Optional[float] = None
    result_id: Optional[str] = None
    error: Optional[str] = None

# -------------------------------------------------------------
# Helper Functions
# -------------------------------------------------------------

def load_catalog() -> List[Dict[str, Any]]:
    if os.path.exists(CATALOG_PATH):
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def get_dataset_by_id(scene_id: str) -> Optional[Dict[str, Any]]:
    catalog = load_catalog()
    for item in catalog:
        if item["scene_id"] == scene_id:
            return item
    return None

def encode_img_base64(img_np: np.ndarray, format="PNG") -> str:
    """Encode numpy array to base64 string."""
    is_success, buffer = cv2.imencode(f".{format.lower()}", img_np)
    if is_success:
        return f"data:image/{format.lower()};base64," + base64.b64encode(buffer).decode("utf-8")
    return ""

def process_enhancement_task(job_id: str, request: EnhanceRequest):
    """Background processor for enhancement job."""
    try:
        JOBS_DB[job_id]["status"] = "processing"
        JOBS_DB[job_id]["progress_pct"] = 25

        # 1. Acquire Input Image and Metadata
        dem = None
        ground_truth = None
        metadata = {}

        if request.dataset_id:
            ds = get_dataset_by_id(request.dataset_id)
            if not ds:
                raise ValueError(f"Dataset {request.dataset_id} not found.")
            metadata = ds
            lr_path = os.path.join(BASE_DIR, ds["files"]["lr_image"])
            lr_img = np.array(Image.open(lr_path))
            
            # Ground truth and DEM if available
            if "hr_image" in ds["files"] and os.path.exists(os.path.join(BASE_DIR, ds["files"]["hr_image"])):
                ground_truth = np.array(Image.open(os.path.join(BASE_DIR, ds["files"]["hr_image"])))
            if "dem" in ds["files"] and os.path.exists(os.path.join(BASE_DIR, ds["files"]["dem"])) and request.enable_dem_guidance:
                dem = np.load(os.path.join(BASE_DIR, ds["files"]["dem"]))
        elif request.image_base64:
            # Decode custom base64 image
            raw_b64 = request.image_base64.split(",")[-1]
            img_bytes = base64.b64decode(raw_b64)
            pil_img = Image.open(BytesIO(img_bytes)).convert("L")
            lr_img = np.array(pil_img)
            metadata = {
                "mission": "CUSTOM / USER UPLOAD",
                "instrument": "Planetary Sensor",
                "scene_id": f"upload_{job_id[:8]}",
                "latitude": request.custom_lat or 0.0,
                "longitude": request.custom_lon or 0.0,
                "resolution_lr": 5.0,
                "resolution_hr": 5.0 / request.scale,
                "solar_geometry": {"incidence": 54.2, "sun_azimuth": 90.0}
            }
        else:
            raise ValueError("Neither dataset_id nor image_base64 provided.")

        JOBS_DB[job_id]["progress_pct"] = 50

        # 2. Run Pipeline
        pipeline_output = pipeline.run(
            lr_image=lr_img,
            model_choice=request.model,
            scale=request.scale,
            dem=dem,
            metadata=metadata,
            ground_truth=ground_truth
        )

        JOBS_DB[job_id]["progress_pct"] = 85

        # 3. Save Static Output Files
        res_id = f"res_{job_id}"
        lr_orig_url = metadata.get("files", {}).get("lr_image", "")
        if not lr_orig_url or request.image_base64:
            lr_orig_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_lr_input.png")
            Image.fromarray(lr_img).save(lr_orig_path)
            lr_orig_url = f"/static_output/{res_id}_lr_input.png"
        elif not lr_orig_url.startswith("/"):
            lr_orig_url = f"/{lr_orig_url}"

        enh_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_enhanced.png")
        ann_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_annotated.png")
        conf_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_confidence.png")
        risk_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_risk.png")
        conf_c_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_confidence_color.png")
        risk_c_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_risk_color.png")

        Image.fromarray(pipeline_output["enhanced_image"]).save(enh_path)
        Image.fromarray(pipeline_output["annotated_image"]).save(ann_path)
        Image.fromarray(pipeline_output["confidence_map"]).save(conf_path)
        Image.fromarray(pipeline_output["risk_map"]).save(risk_path)
        cv2.imwrite(conf_c_path, pipeline_output["confidence_color"])
        cv2.imwrite(risk_c_path, pipeline_output["risk_color"])

        # Also generate and save candidate baseline images for Candidate Lab
        bicubic_img = pipeline.bicubic.enhance(lr_img)
        ai_base_img = pipeline.ai_baseline.enhance(lr_img)
        bicubic_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_bicubic.png")
        ai_base_path = os.path.join(STATIC_OUTPUT_DIR, f"{res_id}_ai_baseline.png")
        Image.fromarray(bicubic_img).save(bicubic_path)
        Image.fromarray(ai_base_img).save(ai_base_path)

        # Multi-Candidate Scientific Trust Evaluation (Phase 3)
        solar_angles = metadata.get("solar_geometry", {"incidence": 54.2, "sun_azimuth": 90.0})
        # Extract mean uncertainty for LUNARA
        lunara_uncert_val = float(np.mean(pipeline_output["risk_map"]) / 255.0)

        candidates_dict = {
            "original_lr": {
                "name": "Original Low-Res Observation",
                "image": cv2.resize(lr_img, (pipeline_output["enhanced_image"].shape[1], pipeline_output["enhanced_image"].shape[0]), interpolation=cv2.INTER_NEAREST)
            },
            "bicubic": {
                "name": "Bicubic Interpolation",
                "image": bicubic_img
            },
            "ai_baseline": {
                "name": "AI Super-Resolution Baseline (EDSR)",
                "image": ai_base_img
            },
            "lunara": {
                "name": "LUNARA Physics-Guided SR",
                "image": pipeline_output["enhanced_image"]
            }
        }

        scientific_evidence = trust_engine.evaluate_all_candidates(
            candidates=candidates_dict,
            lr_img=lr_img,
            ground_truth=ground_truth,
            dem=dem,
            solar_angles=solar_angles,
            lunara_uncertainty=lunara_uncert_val
        )

        # Advanced Multi-Morphology Feature Analysis (Phase 4)
        feature_analysis = feature_engine.extract_all_features(
            enhanced_img=pipeline_output["enhanced_image"],
            lr_img=lr_img,
            confidence_map=pipeline_output["confidence_map"],
            risk_map=pipeline_output["risk_map"],
            center_lat=metadata.get("latitude", 0.0),
            center_lon=metadata.get("longitude", 0.0),
            res_meters=metadata.get("resolution_hr", 0.5 / request.scale if request.image_base64 else 0.5),
            dem=dem,
            candidate_images={
                "original_lr": lr_img,
                "bicubic": bicubic_img,
                "ai_baseline": ai_base_img,
                "lunara": pipeline_output["enhanced_image"]
            }
        )

        # Construct full result package
        result_package = {
            "result_id": res_id,
            "job_id": job_id,
            "scene_id": metadata.get("scene_id", "custom"),
            "model_applied": pipeline_output["provenance"]["model_applied"],
            "model_type": pipeline_output["provenance"]["model_type"],
            "scale": request.scale,
            "urls": {
                "enhanced": f"/static_output/{res_id}_enhanced.png",
                "annotated": f"/static_output/{res_id}_annotated.png",
                "confidence_map": f"/static_output/{res_id}_confidence.png",
                "risk_map": f"/static_output/{res_id}_risk.png",
                "confidence_color": f"/static_output/{res_id}_confidence_color.png",
                "risk_color": f"/static_output/{res_id}_risk_color.png",
                "lr_original": lr_orig_url,
                "bicubic": f"/static_output/{res_id}_bicubic.png",
                "ai_baseline": f"/static_output/{res_id}_ai_baseline.png",
                "lunara": f"/static_output/{res_id}_enhanced.png"
            },
            "trust_metrics": pipeline_output["trust_metrics"],
            "metrics": pipeline_output["metrics"],
            "features": feature_analysis["features"],
            "feature_analysis": feature_analysis,
            "provenance": pipeline_output["provenance"],
            "scientific_evidence": scientific_evidence
        }

        RESULTS_DB[res_id] = result_package
        JOBS_DB[job_id]["status"] = "completed"
        JOBS_DB[job_id]["progress_pct"] = 100
        JOBS_DB[job_id]["completed_at"] = time.time()
        JOBS_DB[job_id]["result_id"] = res_id

    except Exception as e:
        JOBS_DB[job_id]["status"] = "failed"
        JOBS_DB[job_id]["error"] = str(e)
        print(f"[LUNARA Job Error] {e}")

# -------------------------------------------------------------
# REST API Endpoints
# -------------------------------------------------------------

@app.get("/api/system/status")
def get_system_status():
    """Returns telemetry on pipeline health, loaded models, and active jobs."""
    return {
        "status": "OPERATIONAL",
        "system": "LUNARA Evidence-Aware Planetary Super-Resolution Engine",
        "version": "1.0.4-planetary",
        "device": pipeline.lunara.device,
        "models_loaded": {
            "bicubic": pipeline.bicubic.model_name,
            "ai_baseline": pipeline.ai_baseline.model_name,
            "lunara_core": pipeline.lunara.model_name
        },
        "total_catalog_scenes": len(load_catalog()),
        "active_jobs": sum(1 for j in JOBS_DB.values() if j["status"] in ["queued", "processing"]),
        "completed_jobs": sum(1 for j in JOBS_DB.values() if j["status"] == "completed"),
        "timestamp": time.time()
    }

@app.get("/api/datasets", response_model=List[DatasetItem])
def get_datasets():
    """List all available representative planetary scenes from Chandrayaan-2 & LRO."""
    return load_catalog()

@app.get("/api/datasets/{scene_id}")
def get_dataset_details(scene_id: str):
    """Retrieve detailed scene metadata, PDS4 XML, and geometry."""
    ds = get_dataset_by_id(scene_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    # Read PDS4 XML content if available
    xml_content = ""
    xml_rel_path = ds["files"].get("pds4_xml")
    if xml_rel_path:
        xml_full_path = os.path.join(BASE_DIR, xml_rel_path)
        if os.path.exists(xml_full_path):
            with open(xml_full_path, "r", encoding="utf-8") as f:
                xml_content = f.read()

    return {
        **ds,
        "pds4_xml_content": xml_content
    }

@app.post("/api/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    name: str = Form(...),
    latitude: float = Form(0.0),
    longitude: float = Form(0.0),
    resolution_lr: float = Form(5.0),
    sun_azimuth: float = Form(90.0),
    incidence_angle: float = Form(54.0)
):
    """Upload custom lunar observation tile and register into data catalog."""
    scene_id = f"custom_scene_{uuid.uuid4().hex[:8]}"
    contents = await file.read()
    pil_img = Image.open(BytesIO(contents)).convert("L")
    
    # Save into ISRO TMC-2 custom dir
    custom_dir = os.path.join(DATA_DIR, "ISRO", "Chandrayaan-2", "TMC-2")
    os.makedirs(custom_dir, exist_ok=True)
    filename = f"{scene_id}_lr.png"
    filepath = os.path.join(custom_dir, filename)
    pil_img.save(filepath)
    
    new_entry = {
        "scene_id": scene_id,
        "name": name,
        "mission": "CHANDRAYAAN-2 (Custom Ingestion)",
        "instrument": "TMC-2",
        "latitude": latitude,
        "longitude": longitude,
        "resolution_hr": resolution_lr / 4.0,
        "resolution_lr": resolution_lr,
        "scale_factor": 4,
        "dimensions_hr": [pil_img.height * 4, pil_img.width * 4],
        "dimensions_lr": [pil_img.height, pil_img.width],
        "acquisition_time": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "solar_geometry": {
            "incidence": incidence_angle,
            "emission": 0.0,
            "phase": incidence_angle,
            "sun_azimuth": sun_azimuth
        },
        "files": {
            "lr_image": os.path.relpath(filepath, BASE_DIR).replace("\\", "/")
        },
        "source_url": "Custom Planetary Observation Upload",
        "license": "Custom Upload License",
        "provenance": {
            "pds_standard": "PDS4 User Ingestion",
            "calibration": "Calibrated Radiance",
            "dem_source": "Synthetic Topographic Proxy",
            "geometry_source": "User Telemetry"
        }
    }
    
    catalog = load_catalog()
    catalog.append(new_entry)
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)
        
    return {"status": "SUCCESS", "dataset": new_entry}

@app.post("/api/enhance", response_model=JobStatusResponse)
def submit_enhancement(request: EnhanceRequest, background_tasks: BackgroundTasks):
    """Submit super-resolution and scientific evidence evaluation job."""
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    
    JOBS_DB[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress_pct": 5,
        "model": request.model,
        "scale": request.scale,
        "created_at": time.time(),
        "completed_at": None,
        "result_id": None,
        "error": None
    }
    
    # Run synchronously or in background
    # Since processing takes 0.2s - 0.8s, run immediately and update job
    process_enhancement_task(job_id, request)
    return JOBS_DB[job_id]

@app.get("/api/jobs/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    """Poll job status."""
    if job_id not in JOBS_DB:
        raise HTTPException(status_code=404, detail="Job not found")
    return JOBS_DB[job_id]

@app.get("/api/results")
def list_results():
    """Retrieve list of recent results."""
    return list(RESULTS_DB.values())

@app.get("/api/results/{result_id}")
def get_result(result_id: str):
    """Retrieve complete result package with images, trust maps, features, and provenance."""
    if result_id not in RESULTS_DB:
        raise HTTPException(status_code=404, detail="Result not found")
    return RESULTS_DB[result_id]

@app.get("/api/results/{result_id}/confidence")
def get_confidence_details(result_id: str):
    """Retrieve Confidence map and scalar metrics."""
    res = RESULTS_DB.get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    return {
        "result_id": result_id,
        "image_confidence_pct": res["trust_metrics"]["image_confidence_pct"],
        "confidence_map_url": res["urls"]["confidence_map"],
        "confidence_color_url": res["urls"]["confidence_color"],
        "reconstruction_fidelity_pct": res["trust_metrics"]["reconstruction_fidelity_pct"]
    }

@app.get("/api/results/{result_id}/risk")
def get_risk_details(result_id: str):
    """Retrieve Hallucination-Risk map and categorization."""
    res = RESULTS_DB.get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    return {
        "result_id": result_id,
        "hallucination_risk_pct": res["trust_metrics"]["hallucination_risk_pct"],
        "risk_classification": res["trust_metrics"]["risk_classification"],
        "risk_map_url": res["urls"]["risk_map"],
        "risk_color_url": res["urls"]["risk_color"],
        "geometry_consistency_pct": res["trust_metrics"]["geometry_consistency_pct"],
        "terrain_consistency_pct": res["trust_metrics"]["terrain_consistency_pct"]
    }

@app.get("/api/results/{result_id}/features")
def get_result_features(result_id: str):
    """Retrieve candidate scientific features with verification tiers and disclaimer."""
    res = RESULTS_DB.get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    return {
        "result_id": result_id,
        "total_features": len(res["features"]),
        "scientific_disclaimer": res["provenance"]["scientific_disclaimer"],
        "features": res["features"]
    }

@app.get("/api/results/{result_id}/features/{feature_id}")
def get_single_feature(result_id: str, feature_id: str):
    """Retrieve single detected feature record with measurements, evidence, and uncertainty."""
    res = RESULTS_DB.get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    
    found = None
    for f in res.get("features", []):
        if f.get("id") == feature_id:
            found = f
            break
            
    if not found:
        raise HTTPException(status_code=404, detail="Feature ID not found")
    return found

@app.get("/api/results/{result_id}/analysis")
def get_full_analysis(result_id: str):
    """Retrieve complete scientific analysis workspace bundle."""
    res = RESULTS_DB.get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    return {
        "result_id": result_id,
        "scene_id": res["scene_id"],
        "model_applied": res["model_applied"],
        "feature_analysis": res.get("feature_analysis", {"features": res["features"]}),
        "scientific_evidence": res.get("scientific_evidence", {}),
        "trust_metrics": res["trust_metrics"],
        "metrics": res["metrics"],
        "provenance": res["provenance"]
    }

@app.get("/api/results/{result_id}/report")
def get_scientific_report(result_id: str):
    """Generate structured scientific export report with evidence, measurements, limitations, and provenance."""
    res = RESULTS_DB.get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
        
    evidence = res.get("scientific_evidence", {})
    features = res.get("features", [])
    provenance = res.get("provenance", {})
    metrics = res.get("metrics", {})
    
    report = {
        "title": "LUNARA Scientific Planetary Analysis & Trust Report",
        "system": "LUNARA Evidence-Aware Planetary Super-Resolution Engine",
        "report_id": f"REP-{result_id.upper()}",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "input_observation": {
            "scene_id": res["scene_id"],
            "mission": provenance.get("mission", "CHANDRAYAAN-2"),
            "instrument": provenance.get("instrument", "TMC-2/OHRC"),
            "input_resolution_m": provenance.get("input_resolution_m", "UNAVAILABLE"),
            "input_dimensions": provenance.get("input_dimensions", "UNAVAILABLE"),
            "solar_geometry": provenance.get("solar_geometry", {})
        },
        "reconstruction_evaluation": {
            "recommended_candidate": evidence.get("recommended_candidate", "LUNARA Physics-SR"),
            "trust_classification": evidence.get("trust_classification", "HIGH"),
            "evidence_coverage": evidence.get("evidence_coverage", "4 / 5"),
            "recommendation_justification": evidence.get("recommendation_reason", "Supported by multi-modal structural and physical constraints"),
            "reconstruction_metrics": metrics
        },
        "candidate_surface_features": {
            "total_candidates": len(features),
            "feature_records": [
                {
                    "id": f.get("id"),
                    "type": f.get("type"),
                    "status": f.get("status"),
                    "measurement": f.get("measurements", {}).get("diameter_km") or f.get("measurements", {}).get("length_km") or "UNAVAILABLE",
                    "uncertainty": f.get("measurements", {}).get("diameter_uncertainty_km") or f.get("measurements", {}).get("length_uncertainty_km") or "UNAVAILABLE",
                    "coordinates": f.get("coordinates", {}),
                    "local_confidence": f.get("evidence", {}).get("local_confidence_pct", f.get("local_confidence_pct", 0.0))
                }
                for f in features[:25]
            ]
        },
        "scientific_limitations_and_disclaimers": {
            "perceptual_metric": "High-frequency proxy metric used instead of true deep network LPIPS.",
            "dem_source": provenance.get("dem_source", "UNAVAILABLE"),
            "cartographic_notice": "Automated candidate feature extraction is not a substitute for peer-reviewed cartographic confirmation."
        },
        "provenance_record": provenance
    }
    return report

@app.get("/api/results/{result_id}/report.html")
def get_html_report(result_id: str):
    """Generate printable HTML scientific report."""
    from fastapi.responses import HTMLResponse
    rep = get_scientific_report(result_id)
    features_rows = "".join([
        f"<tr><td><code>{f['id']}</code></td><td>{f['type']}</td><td><span class='badge'>{f['status']}</span></td><td>{f['measurement']}</td><td>{f['uncertainty']}</td><td>{f['local_confidence']}%</td></tr>"
        for f in rep["candidate_surface_features"]["feature_records"]
    ])
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>{rep['title']} - {rep['report_id']}</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #07090e; color: #f1f5f9; padding: 32px; line-height: 1.5; }}
  h1 {{ font-size: 22px; color: #6389ff; margin-bottom: 4px; }}
  h2 {{ font-size: 16px; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-top: 24px; color: #e2e8f0; }}
  .meta-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; font-size: 12px; margin-top: 8px; font-family: monospace; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; font-family: monospace; }}
  th, td {{ padding: 8px 10px; border-bottom: 1px solid #1e293b; text-align: left; }}
  th {{ background: #0e141f; color: #94a3b8; text-transform: uppercase; font-size: 10px; }}
  .badge {{ padding: 2px 6px; border-radius: 4px; font-size: 10px; background: rgba(99,137,255,0.15); color: #6389ff; border: 1px solid rgba(99,137,255,0.3); }}
  .notice {{ background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.3); padding: 12px; border-radius: 8px; font-size: 11px; margin-top: 24px; color: #cbd5e1; }}
  @media print {{ body {{ background: white; color: black; }} th {{ background: #eee; color: black; }} td, th {{ border-bottom: 1px solid #ddd; }} .badge {{ border: 1px solid #666; color: black; }} }}
</style>
</head>
<body>
<h1>{rep['title']}</h1>
<div style="font-family: monospace; font-size: 11px; color: #64748b;">Report ID: {rep['report_id']} &bull; Generated: {rep['generated_at']}</div>

<h2>1. Input Observation</h2>
<div class="meta-grid">
  <div>Scene ID: <strong>{rep['input_observation']['scene_id']}</strong></div>
  <div>Mission: <strong>{rep['input_observation']['mission']}</strong></div>
  <div>Sensor: <strong>{rep['input_observation']['instrument']}</strong></div>
  <div>Input GSD: <strong>{rep['input_observation']['input_resolution_m']} m/px</strong></div>
</div>

<h2>2. Reconstruction & Scientific Trust</h2>
<div class="meta-grid">
  <div>Recommended Candidate: <strong style="color: #34d399;">{rep['reconstruction_evaluation']['recommended_candidate']}</strong></div>
  <div>Trust Level: <strong>{rep['reconstruction_evaluation']['trust_classification']}</strong></div>
  <div>Evidence Coverage: <strong>{rep['reconstruction_evaluation']['evidence_coverage']}</strong></div>
  <div>Decision Justification: <strong>{rep['reconstruction_evaluation']['recommendation_justification']}</strong></div>
</div>

<h2>3. Candidate Planetary Surface Features ({rep['candidate_surface_features']['total_candidates']})</h2>
<table>
  <thead>
    <tr><th>Feature ID</th><th>Type</th><th>Status</th><th>Measurement</th><th>Uncertainty</th><th>Confidence</th></tr>
  </thead>
  <tbody>
    {features_rows}
  </tbody>
</table>

<h2>4. Scientific Limitations & Notice</h2>
<div class="notice">
  <strong>SCIENTIFIC NOTICE:</strong> {rep['scientific_limitations_and_disclaimers']['cartographic_notice']}<br>
  &bull; Perceptual Metric: {rep['scientific_limitations_and_disclaimers']['perceptual_metric']}<br>
  &bull; Topographic Elevation Source: {rep['scientific_limitations_and_disclaimers']['dem_source']}
</div>
</body>
</html>"""
    return HTMLResponse(content=html_content)

@app.get("/api/results/{result_id}/trust")
def get_trust_evidence(result_id: str):
    """Retrieve full Phase 3 multi-candidate scientific trust evidence and recommendation."""
    res = RESULTS_DB.get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    return {
        "result_id": result_id,
        "scene_id": res["scene_id"],
        "model_applied": res["model_applied"],
        "scientific_evidence": res.get("scientific_evidence", {}),
        "trust_metrics": res["trust_metrics"],
        "provenance": res["provenance"]
    }

@app.get("/api/metrics/{result_id}")
def get_metrics(result_id: str):
    """Retrieve quantitative scientific reconstruction metrics."""
    res = RESULTS_DB.get(result_id)
    if not res:
        raise HTTPException(status_code=404, detail="Result not found")
    return {
        "result_id": result_id,
        "metrics": res["metrics"],
        "trust_metrics": res["trust_metrics"],
        "provenance": res["provenance"]
    }

@app.get("/api/compare/{scene_id}")
def get_scene_comparison(scene_id: str):
    """
    Returns 4-way comparative view data (Original vs Bicubic vs AI Baseline vs LUNARA)
    for interactive side-by-side analysis.
    """
    ds = get_dataset_by_id(scene_id)
    if not ds:
        raise HTTPException(status_code=404, detail="Scene not found")

    lr_path = os.path.join(BASE_DIR, ds["files"]["lr_image"])
    hr_path = os.path.join(BASE_DIR, ds["files"]["hr_image"])
    dem_path = os.path.join(BASE_DIR, ds["files"]["dem"])

    lr_img = np.array(Image.open(lr_path))
    hr_gt = np.array(Image.open(hr_path))
    dem = np.load(dem_path) if os.path.exists(dem_path) else None

    # Run all 3 models
    res_bicubic = pipeline.run(lr_img, "bicubic", 4, dem, ds, hr_gt)
    res_baseline = pipeline.run(lr_img, "ai_baseline", 4, dem, ds, hr_gt)
    res_lunara = pipeline.run(lr_img, "lunara", 4, dem, ds, hr_gt)

    # Encode images as base64 for direct comparative rendering
    return {
        "scene_id": scene_id,
        "scene_name": ds["name"],
        "mission": ds["mission"],
        "coordinates": {"lat": ds["latitude"], "lon": ds["longitude"]},
        "models": {
            "original_lr": {
                "name": "Low-Res Planetary Observation (TMC-2)",
                "resolution": f"{ds['resolution_lr']}m/px",
                "image_b64": encode_img_base64(lr_img),
                "metrics": {"type": "Input Observation"}
            },
            "bicubic": {
                "name": "Bicubic Interpolation",
                "resolution": f"{ds['resolution_hr']}m/px",
                "image_b64": encode_img_base64(res_bicubic["enhanced_image"]),
                "confidence_b64": encode_img_base64(res_bicubic["confidence_map"]),
                "risk_b64": encode_img_base64(res_bicubic["risk_map"]),
                "metrics": res_bicubic["metrics"],
                "trust_metrics": res_bicubic["trust_metrics"]
            },
            "ai_baseline": {
                "name": "AI Super-Resolution Baseline (EDSR/Real-ESRGAN)",
                "resolution": f"{ds['resolution_hr']}m/px",
                "image_b64": encode_img_base64(res_baseline["enhanced_image"]),
                "confidence_b64": encode_img_base64(res_baseline["confidence_map"]),
                "risk_b64": encode_img_base64(res_baseline["risk_map"]),
                "metrics": res_baseline["metrics"],
                "trust_metrics": res_baseline["trust_metrics"]
            },
            "lunara": {
                "name": "LUNARA Evidence-Aware Physics-SR",
                "resolution": f"{ds['resolution_hr']}m/px",
                "image_b64": encode_img_base64(res_lunara["enhanced_image"]),
                "annotated_b64": encode_img_base64(res_lunara["annotated_image"]),
                "confidence_b64": encode_img_base64(res_lunara["confidence_map"]),
                "risk_b64": encode_img_base64(res_lunara["risk_map"]),
                "confidence_color_b64": encode_img_base64(res_lunara["confidence_color"]),
                "risk_color_b64": encode_img_base64(res_lunara["risk_color"]),
                "metrics": res_lunara["metrics"],
                "trust_metrics": res_lunara["trust_metrics"],
                "features": res_lunara["features"],
                "provenance": res_lunara["provenance"]
            },
            "ground_truth_hr": {
                "name": "Ground Truth High-Res (OHRC/NAC)",
                "resolution": f"{ds['resolution_hr']}m/px",
                "image_b64": encode_img_base64(hr_gt),
                "metrics": {"type": "Reference Standard"}
            }
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
