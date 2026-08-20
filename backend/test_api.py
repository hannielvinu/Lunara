"""
LUNARA: Automated Backend API Verification Script
Tests FastAPI endpoints directly via TestClient.
"""

import os
import sys
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api():
    print("Testing GET /api/system/status...")
    res = client.get("/api/system/status")
    assert res.status_code == 200, f"Status failed: {res.text}"
    status_data = res.json()
    print(f"System status: {status_data['status']} | Version: {status_data['version']}")

    print("\nTesting GET /api/datasets...")
    res = client.get("/api/datasets")
    assert res.status_code == 200, f"Datasets failed: {res.text}"
    datasets = res.json()
    print(f"Found {len(datasets)} datasets in catalog.")
    assert len(datasets) >= 4, "Expected at least 4 benchmark datasets"

    scene_id = datasets[0]["scene_id"]
    print(f"\nTesting GET /api/datasets/{scene_id}...")
    res = client.get(f"/api/datasets/{scene_id}")
    assert res.status_code == 200
    ds_detail = res.json()
    print(f"Scene name: {ds_detail['name']} | Mission: {ds_detail['mission']}")

    print(f"\nTesting POST /api/enhance (LUNARA model on {scene_id})...")
    req_body = {
        "dataset_id": scene_id,
        "model": "lunara",
        "scale": 4,
        "enable_consistency_checks": True,
        "enable_dem_guidance": True
    }
    res = client.post("/api/enhance", json=req_body)
    assert res.status_code == 200, f"Enhance failed: {res.text}"
    job_info = res.json()
    print(f"Job ID: {job_info['job_id']} | Status: {job_info['status']} | Result ID: {job_info['result_id']}")

    result_id = job_info["result_id"]
    assert result_id is not None, "Expected result_id"

    print(f"\nTesting GET /api/results/{result_id}...")
    res = client.get(f"/api/results/{result_id}")
    assert res.status_code == 200
    result_data = res.json()
    print(f"Result Confidence: {result_data['trust_metrics']['image_confidence_pct']}%")
    print(f"Hallucination Risk: {result_data['trust_metrics']['hallucination_risk_pct']}% ({result_data['trust_metrics']['risk_classification']})")
    print(f"Scientific Candidate Features Detected: {len(result_data['features'])}")

    print(f"\nTesting GET /api/results/{result_id}/confidence...")
    res = client.get(f"/api/results/{result_id}/confidence")
    assert res.status_code == 200

    print(f"\nTesting GET /api/results/{result_id}/risk...")
    res = client.get(f"/api/results/{result_id}/risk")
    assert res.status_code == 200

    print(f"\nTesting GET /api/results/{result_id}/features...")
    res = client.get(f"/api/results/{result_id}/features")
    assert res.status_code == 200
    feat_data = res.json()
    print(f"Features API returned {feat_data['total_features']} features with disclaimer: {feat_data['scientific_disclaimer'][:60]}...")

    print(f"\nTesting GET /api/compare/{scene_id}...")
    res = client.get(f"/api/compare/{scene_id}")
    assert res.status_code == 200
    compare_data = res.json()
    print(f"Compare API returned models: {list(compare_data['models'].keys())}")

    print("\n[SUCCESS] ALL FASTAPI BACKEND API ENDPOINTS VERIFIED AND FULLY OPERATIONAL!")

if __name__ == "__main__":
    test_api()
