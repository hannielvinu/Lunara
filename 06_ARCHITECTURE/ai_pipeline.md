# LUNARA: AI Super-Resolution & Trust Pipeline

## 1. Pipeline Execution Flow

```
+------------------------------------+
|  LOW-RES PLANETARY OBSERVATION     | (e.g. TMC-2 at 5m/pixel)
+------------------------------------+
                  |
                  v
+------------------------------------+
|  PDS4 / SPICE METADATA INGESTION   | (Solar incidence, azimuth, emission, Lat/Lon)
+------------------------------------+
                  |
                  v
+------------------------------------+
|  AI SUPER-RESOLUTION ENHANCEMENT   | (Spatial-Channel Attention Network 4x)
+------------------------------------+
                  |
                  +------------------------------------------+
                  |                                          |
                  v                                          v
+------------------------------------+     +------------------------------------+
|  PHYSICS & GEOMETRY CONSISTENCY    |     |   MONTE CARLO UNCERTAINTY PASSES   |
|  - Photometric Shadow Alignment    |     |   - Stochastic Dropout Variance    |
|  - LOLA DEM Slope Correlation      |     |   - Multi-scale Perturbations      |
+------------------------------------+     +------------------------------------+
                  |                                          |
                  +--------------------+---------------------+
                                       |
                                       v
                     +------------------------------------+
                     |   PIXEL CONFIDENCE & RISK ENGINE   |
                     |   - Confidence Map (0 - 100%)      |
                     |   - Hallucination Risk Map (0-100%)|
                     +------------------------------------+
                                       |
                                       v
                     +------------------------------------+
                     |   SCIENTIFIC FEATURE EXTRACTION    |
                     |   - Candidate Crater Morphologies  |
                     |   - Diameter Estimation (km/m)     |
                     |   - Verification Tier Flags        |
                     +------------------------------------+
                                       |
                                       v
                     +------------------------------------+
                     |   FULL RESULT PACKAGE & PROVENANCE |
                     +------------------------------------+
```

---

## 2. Mathematical Formulations

### 2.1 Sensor Degradation Formulation
$$\mathbf{I}_{LR} = \text{Quantize}\left(\text{Downsample}_{4\times}\left(\mathbf{PSF}_{\text{optics}} \otimes \mathbf{I}_{HR}\right) + \mathcal{N}_{\text{poisson}} + \mathcal{N}_{\text{gaussian}}\right)$$

### 2.2 Composite Hallucination-Risk Index
$$R(x, y) = 0.35 \cdot \sigma_{mc}(x,y) + 0.25 \cdot E_{recon}(x,y) + 0.20 \cdot (1 - E_{grad}(x,y)) + 0.20 \cdot (1 - C_{topo}(x,y))$$

Where:
- $\sigma_{mc}(x, y)$: Standard deviation across stochastic inference passes.
- $E_{recon}(x, y)$: Downsampling cycle-consistency residual $| \mathcal{D}(\mathbf{I}_{SR}) - \mathbf{I}_{LR} |$.
- $E_{grad}(x, y)$: Directional cosine correlation between image intensity gradients and solar illumination azimuth $\vec{S}_{sun}$.
- $C_{topo}(x, y)$: Spatial correlation between optical gradients and LOLA/TMC-2 DEM topographic slopes.

### 2.3 Pixel-Level Confidence Map
$$C(x, y) = 1.0 - R(x, y)$$
Bounded between $[0\%, 100\%]$.
