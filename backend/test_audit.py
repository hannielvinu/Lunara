import requests
import json
import time

BASE_URL = "http://localhost:8000"

def run_tests():
    print("Starting Backend API Audit Tests...\n")
    results = {}

    try:
        r = requests.get(f"{BASE_URL}/api/system/status")
        print(f"GET /api/system/status: {r.status_code}")
    except Exception as e:
        print(f"GET /api/system/status: FAILED - {e}")

    try:
        r = requests.get(f"{BASE_URL}/api/datasets")
        print(f"GET /api/datasets: {r.status_code}")
        datasets = r.json()
    except:
        pass

    dataset_id = datasets[0]["scene_id"] if datasets else "scene_tycho_crater"

    try:
        r = requests.get(f"{BASE_URL}/api/datasets/{dataset_id}")
        print(f"GET /api/datasets/{dataset_id}: {r.status_code}")
        
        r2 = requests.get(f"{BASE_URL}/api/datasets/invalid_id_123")
        print(f"GET /api/datasets/invalid_id_123: {r2.status_code}")
    except:
        pass

    try:
        payload = {"dataset_id": dataset_id, "model": "lunara", "scale": 4}
        r = requests.post(f"{BASE_URL}/api/enhance", json=payload)
        print(f"POST /api/enhance (valid): {r.status_code}")
        
        job_id = r.json().get("job_id")
        
        payload_invalid = {"dataset_id": "fake_id", "model": "lunara", "scale": 4}
        r_invalid = requests.post(f"{BASE_URL}/api/enhance", json=payload_invalid)
        print(f"POST /api/enhance (invalid dataset): {r_invalid.status_code}")
        
    except Exception as e:
        print(f"POST /api/enhance: FAILED - {e}")

    time.sleep(1.5) # wait for async processing

    try:
        r = requests.get(f"{BASE_URL}/api/jobs/{job_id}")
        print(f"GET /api/jobs/{job_id}: {r.status_code} - Status: {r.json().get('status')}")
        result_id = r.json().get("result_id")
    except:
        pass

    if result_id:
        endpoints = [
            f"/api/results/{result_id}",
            f"/api/results/{result_id}/confidence",
            f"/api/results/{result_id}/risk",
            f"/api/results/{result_id}/features",
            f"/api/metrics/{result_id}"
        ]
        for ep in endpoints:
            r = requests.get(f"{BASE_URL}{ep}")
            print(f"GET {ep}: {r.status_code}")
            
        print("\nAll Tests Executed.")
        r = requests.get(f"{BASE_URL}/api/metrics/{result_id}")
        metrics = r.json()
        print(json.dumps(metrics.get("metrics"), indent=2))
        print("DEM Source:", metrics.get("provenance", {}).get("dem_source"))

if __name__ == "__main__":
    run_tests()
