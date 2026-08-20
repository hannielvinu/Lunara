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
                "lr_original": metadata.get("files", {}).get("lr_image", "")
            },
            "trust_metrics": pipeline_output["trust_metrics"],
            "metrics": pipeline_output["metrics"],
            "features": pipeline_output["features"],
            "provenance": pipeline_output["provenance"]
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
