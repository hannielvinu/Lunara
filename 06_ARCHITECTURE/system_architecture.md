# LUNARA: System Architecture Specification

## 1. High-Level Architectural Overview

LUNARA is designed as a mission-control planetary intelligence system bridging space agency science repositories (ISRO Chandrayaan-2 ISSDC / NASA PDS) with physics-guided super-resolution AI and real-time uncertainty quantification.

```
+-----------------------------------------------------------------------------------+
|                           LUNARA MISSION CONTROL UI                                |
|   Next.js 15 App Router | TypeScript | Tailwind CSS | Three.js 3D Lunar Navigator  |
+-----------------------------------------------------------------------------------+
                                        |
                            JSON / REST API / Streaming
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                            FASTAPI BACKEND ENGINE                                 |
|          Dataset Catalog | Async Job Worker | Provenance & PDS4 Ingestion         |
+-----------------------------------------------------------------------------------+
                                        |
               +------------------------+------------------------+
               |                                                 |
               v                                                 v
+-----------------------------+               +-------------------------------------+
|    SUPER-RESOLUTION MODELS  |               |       TRUST & UNCERTAINTY LAYER     |
| - Mathematical Bicubic      |               | - Multi-Scale MC Uncertainty        |
| - AI Baseline (EDSR/RCAN)   |               | - Solar Shadow Gradient Check       |
| - LUNARA Physics-Guided SR  |               | - LOLA DEM Topographic Alignment    |
+-----------------------------+               +-------------------------------------+
               |                                                 |
               +------------------------+------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                     SCIENTIFIC CANDIDATE FEATURE EXTRACTOR                        |
|        Impact Crater Rims | Physical Diameters | Verification Tiers & Disclaimers |
+-----------------------------------------------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                        SCIENTIFIC PROVENANCE PACKAGE                              |
|   Enhanced Image + Confidence Map + Hallucination Risk Map + SPICE Metadata Index |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Specifications

### 2.1 Planetary Data Ingestion Subsystem (`01_DATA/` & `src/data/`)
- Ingests native PDS4 `Product_Observational` XML labels and geometry headers.
- Calibrates 16-bit raw sensor Digital Numbers (DN) to radiance factor ($I/F$).
- Applies realistic optical Point Spread Function (PSF) and CMOS sensor noise models for controlled evaluation.

### 2.2 Inference Pipeline (`src/models/`)
- **PyTorch 2.13 Execution Engine**: Runs spatial-channel attention and high-frequency edge loss models.
- **Monte Carlo Stochastic Inference**: Triggers dropout perturbations across stochastic passes to map generative variance.
- **Gradient & Topographic Consistency**: Compares predicted intensity gradients with solar illumination vectors and LOLA/TMC-2 DEM surface slopes.

### 2.3 Scientific Feature Extractor
- Sub-pixel circle and ellipse fitting for impact crater morphologies.
- Physical diameter estimation in meters and kilometers scaled to orbital camera ground sampling distance (GSD).
- Explicit scientific caution classification:
  - *Tier 1: High Scientific Plausibility*
  - *Tier 2: Requires Photometric Cross-Check*
  - *Tier 3: Possible Illumination Artifact*

### 2.4 Frontend Mission Control Dashboard (`frontend/`)
- Built on Next.js 15 with App Router and server/client component boundaries.
- **Three.js 3D Lunar Globe**: Interactive WebGL lunar sphere featuring realistic lighting, terminator shadow boundary, polar orbit trails, Chandrayaan-2 satellite model, and clickable landmark markers.
- **Interactive Comparison Split Slider**: Real-time slider revealing high-frequency reconstructed edges over low-resolution observations.
