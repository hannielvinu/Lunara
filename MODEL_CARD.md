# LUNARA: Model Card

## Model Overview
- **Model Name:** LUNARA Evidence-Aware Physics-SR
- **Version:** `v1.0.4-planetary`
- **Model Type:** Physics-Guided Deep Super-Resolution with Monte Carlo Uncertainty Quantification
- **Primary Task:** $4\times$ spatial resolution enhancement of planetary optical imagery ($5.0\,\text{m/px} \rightarrow 0.5\,\text{m/px}$).

---

## Intended Use
- **Primary Domain:** Lunar satellite observation enhancement (Chandrayaan-2 TMC-2 / NASA LROC).
- **Secondary Domain:** Automated preliminary candidate crater morphology detection with confidence bounds.
- **Out-of-Scope:** Not certified for real-time autonomous spacecraft descent guidance or definitive cartographic publications without human verification.

---

## Key Performance Indicators (Benchmarks)

| Metric | Bicubic | AI Baseline (EDSR) | LUNARA Core |
| :--- | :--- | :--- | :--- |
| **PSNR (dB)** | 31.20 | 33.80 | **36.40** |
| **SSIM** | 0.8240 | 0.8710 | **0.9280** |
| **Edge Preservation Index (EPI)** | 74.2% | 86.5% | **94.2%** |
| **Mean Confidence Score** | 55.0% | 62.5% | **86.2%** |
| **Hallucination Risk Score** | 45.0% | 37.5% | **13.8%** |

---

## Ethical & Scientific Considerations
- The model outputs pixel-level **Confidence Maps** and **Hallucination-Risk Heatmaps** alongside enhanced rasters to ensure human planetary scientists can distinguish reliable features from generative artifacts.
