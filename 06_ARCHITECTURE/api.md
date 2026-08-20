# LUNARA: REST API Specification

FastAPI Application Base URL: `http://127.0.0.1:8000`

---

## Endpoints

### 1. System Telemetry
`GET /api/system/status`
- **Response**:
```json
{
  "status": "OPERATIONAL",
  "system": "LUNARA Evidence-Aware Planetary Super-Resolution Engine",
  "version": "1.0.4-planetary",
  "device": "cpu",
  "models_loaded": {
    "bicubic": "Bicubic Interpolation",
    "ai_baseline": "Deep Residual SR Baseline (Real-ESRGAN/EDSR Architecture)",
    "lunara_core": "LUNARA Evidence-Aware Physics-SR"
  },
  "total_catalog_scenes": 4,
  "active_jobs": 0,
  "completed_jobs": 12
}
```

---

### 2. Dataset Catalog
`GET /api/datasets`
- **Response**: Array of `DatasetItem` objects with coordinates, solar geometry, and PDS4 references.

`GET /api/datasets/{scene_id}`
- **Response**: Detailed scene metadata including full PDS4 XML label string.

`POST /api/datasets/upload`
- **Payload**: Multipart form with `file`, `name`, `latitude`, `longitude`, `resolution_lr`, `sun_azimuth`, `incidence_angle`.

---

### 3. Super-Resolution Enhancement
`POST /api/enhance`
- **Payload**:
```json
{
  "dataset_id": "scene_tycho_crater",
  "model": "lunara",
  "scale": 4,
  "enable_consistency_checks": true,
  "enable_dem_guidance": true
}
```
- **Response**: `JobStatusResponse` with `job_id`, `status`, `result_id`.

`GET /api/jobs/{job_id}`
- **Response**: Current status, progress percentage, error message if any.

---

### 4. Results & Scientific Evidence
`GET /api/results/{result_id}`
- **Response**: Complete package containing enhanced image URLs, Confidence Map, Hallucination-Risk Map, detected features list, metrics, and scientific provenance.

`GET /api/results/{result_id}/confidence`
- **Response**: Confidence percentage and heatmap URLs.

`GET /api/results/{result_id}/risk`
- **Response**: Hallucination-risk percentage, risk category classification, and risk map URLs.

`GET /api/results/{result_id}/features`
- **Response**: Array of candidate crater morphologies with physical diameters (km/m), sub-pixel coordinates, and scientific disclaimers.

`GET /api/compare/{scene_id}`
- **Response**: 4-way comparative data (Low-Res vs Bicubic vs AI Baseline vs LUNARA vs Ground Truth).
