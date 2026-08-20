# LUNARA Scientific Dataset Policy

This directory (`01_DATA/`) serves as the central hub for planetary datasets required by the LUNARA application. 
Because raw satellite imagery and topographic arrays are extremely large, we maintain a strict Git exclusion policy for these files to preserve repository hygiene.

## 📁 Directory Structure

```text
01_DATA/
├── README.md         # This policy document (Tracked)
├── manifests/        # Dataset manifests and schema definitions (Tracked)
├── metadata/         # Lightweight JSON/XML metadata for datasets (Tracked)
├── samples/          # Compressed, low-res preview samples for UI (Tracked)
├── raw/              # Raw high-resolution .TIFF / .NPY files (IGNORED)
└── processed/        # Preprocessed chunks or generated DEM proxies (IGNORED)
```

## 📜 Git Tracking Policy

**What IS in Git:**
- Source information and checksums.
- Manifests and JSON metadata (e.g., PDS4 labels).
- Small sample fixtures to allow the UI to function without the full dataset.

**What is NOT in Git:**
- Anything inside `01_DATA/raw/` or `01_DATA/processed/`.
- Large model weights, array dumps, or generated inference maps.

## 🛰️ How to Obtain Datasets

The LUNARA pipeline is configured to operate on **Chandrayaan-2 TMC-2/OHRC** optical data and accompanying **LOLA GDR / Stereo DTM** elevation data.

To fully replicate the processing pipeline locally:
1. Download the TMC-2 observations from the [ISRO PRADAN Portal](https://pradan.issdc.gov.in/ch2/).
2. Extract the imagery and place the `.npy` or `.tiff` files into `01_DATA/raw/`.
3. The LUNARA backend will automatically detect valid files in the `raw/` directory or fall back to an optical proxy if elevation data is missing.

*Note: If no datasets are present in `raw/`, the application will seamlessly fall back to using the tracked data in the `samples/` directory for demonstration purposes.*
