# LUNARA: Limitations & Boundary Conditions

## 1. Data & Optical Constraints
- **Sub-Pixel Misregistration**: Real-world cross-instrument observations (e.g. TMC-2 vs OHRC) exhibit viewing parallax and slight phase angle discrepancies. The current prototype relies on calibrated physics-degradation pairs for exact reference ground-truthing.
- **Extreme Shadow Regimes**: In Permanently Shadowed Regions (PSR) near the lunar poles ($>88^\circ$ incidence), signal-to-noise ratio drops significantly. LUNARA flags these regions with elevated hallucination risk.

---

## 2. Model & Algorithmic Limitations
- **Generative AI Hallucination**: While LUNARA penalizes false features through Sobel edge loss, photometric shadow checks, and DEM elevation gradients, minor stochastic perturbations may still produce micro-texture artifacts.
- **Candidate Feature Verification**: All detected crater candidates and linear grabens must be treated as prototype reconnaissance and verified against formal USGS / IAU nomenclature catalogs before scientific assertion.
