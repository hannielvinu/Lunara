# LUNARA: Data Sources & Provenance Registry

## 1. Primary Science Repository

### ISRO ISSDC / PRADAN (Chandrayaan-2)
- **Portal URL:** `https://pradan.issdc.gov.in/ch2/`
- **Instruments Used:**
  - **TMC-2 (Terrain Mapping Camera-2):** Panchromatic stereo camera (5.0m spatial resolution, 20km swath, spectral band $0.5 - 0.85\,\mu\text{m}$).
  - **OHRC (Orbiter High Resolution Camera):** $0.25 - 0.32\,\text{m/pixel}$ spatial resolution, 3km swath.
  - **TMC-2 DTM/DEM:** 10m–25m grid elevation products.
- **Data Standard:** PDS4 XML Observational Schema (`Product_Observational`).
- **Access Rule:** Open scientific catalog indexing with semi-restricted raw payload session authentication.

---

## 2. Validation & Elevation Repositories

### NASA Lunar Reconnaissance Orbiter (LRO) PDS Node
- **Portal URL:** `https://pds.lroc.asu.edu/` & `https://wms.lroc.asu.edu/lroc/search`
- **Payloads:** LROC NAC (Narrow Angle Camera, $0.5 - 2.0\,\text{m/px}$) and LROC WAC ($100\,\text{m/px}$).
- **Access Rule:** Open public HTTPS access without authentication.

### NASA Planetary Geodesy Data Archive (PGDA) / LOLA
- **Portal URL:** `https://pgda.gsfc.nasa.gov/products/78`
- **Payload:** LOLA Digital Elevation Models (GDRs and South Pole 5m–20m GeoTIFFs).
- **Access Rule:** Open public HTTPS access.

---

## 3. Benchmark Planetary Scenes Curated

| Scene ID | Geological Feature | Latitude | Longitude | Input Res | Target Res | Solar Incidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `scene_tycho_crater` | Tycho Crater Central Peak & Rim | $-43.31^\circ$ | $-11.36^\circ$ | 5.0 m | 0.32 m | $54.2^\circ$ |
| `scene_rupes_recta` | Rupes Recta (Straight Wall) Fault Scarp | $-22.10^\circ$ | $-7.80^\circ$ | 5.0 m | 0.50 m | $78.5^\circ$ |
| `scene_south_pole_shackleton` | South Pole Shackleton Rim (PSR) | $-89.90^\circ$ | $0.00^\circ$ | 8.0 m | 1.00 m | $88.5^\circ$ |
| `scene_mare_imbrium` | Mare Imbrium Regolith Plain | $+26.10^\circ$ | $+3.60^\circ$ | 5.0 m | 0.50 m | $45.0^\circ$ |
