# LUNARA: Planetary Satellite Image Enhancement

**LUNARA** is an advanced AI-powered pipeline designed for the evidence-aware enhancement and analysis of planetary satellite imagery, primarily targeting Chandrayaan-2 TMC-2/OHRC data.

Unlike generic super-resolution models, LUNARA prioritizes scientific integrity by providing:
- **Physics-Guided Super-Resolution**: Enhancing spatial resolution while retaining structural validity.
- **Trust & Hallucination-Risk Estimation**: Pixel-level confidence maps to identify AI-generated artifacts.
- **Topographic Consistency**: Cross-verifying photometric shadows and gradients against DEMs (Digital Elevation Models).
- **Scientific Provenance**: Explicit tracking of data lineage, physical metrics, and model application.

---

## 📁 Repository Structure

- `backend/` - FastAPI Python server hosting the PyTorch AI pipeline.
- `frontend/` - Next.js interactive web application for mission control and analysis.
- `src/` - Core ML models, trust layers, and pipeline logic.
- `01_DATA/` - Tracked metadata, manifests, and samples (raw data is explicitly ignored).
- `00_PROJECT_BRIEF/` - Core hackathon documentation and objectives.

## 🚀 Quick Start Guide

### 1. Data Setup
Large scientific datasets (like raw `.tiff` or `.npy` arrays) are **not** tracked in Git.
To run the full pipeline locally:
- See `01_DATA/README.md` for download instructions.
- Place raw data in `01_DATA/raw/`.
- If no data is placed there, LUNARA will fall back to using small sample fixtures provided in `01_DATA/samples/`.

### 2. Backend Setup
The backend handles all AI inference and trust evaluations.
```bash
cd backend
python -m venv .venv
# Activate virtual environment (Windows)
.venv\Scripts\activate
# Install requirements
pip install -r requirements.txt
# Run the FastAPI server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
The frontend provides the interactive planetary exploration UI.
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000` to access the Mission Control dashboard.

---

## 🛡️ Git & Data Policy

To ensure repository hygiene and fast cloning:
- **Never commit:** `node_modules/`, `.next/`, `backend/static_output/`, `__pycache__/`, or virtual environments.
- **Never commit:** Raw planetary datasets, generated PNG maps, or large PyTorch checkpoints (`*.pt`, `*.pth`).
- **Always commit:** Source code, configuration, lightweight metadata, and small UI sample assets.

*Generated dependencies and outputs are no longer tracked by Git. The scientific datasets were not deleted; only their Git-tracking policy was changed where appropriate.*
