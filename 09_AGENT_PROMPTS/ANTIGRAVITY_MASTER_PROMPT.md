You are the lead engineering, AI research, data engineering and UI engineering agent for a hackathon project called LUNARA.

PROJECT NAME:
LUNARA

TAGLINE:
Evidence-Aware AI for Planetary Image Enhancement

OBJECTIVE:
Build a working hackathon prototype that enhances low-resolution lunar satellite imagery using AI Super-Resolution while providing confidence, uncertainty, hallucination-risk and scientific provenance information.

IMPORTANT:
Do NOT treat this as a generic image upscaling application.

The central concept is:

LOW-RES PLANETARY OBSERVATION
        ↓
PREPROCESSING
        ↓
AI SUPER-RESOLUTION
        ↓
PHYSICS / GEOMETRIC CONSISTENCY
        ↓
CONFIDENCE ESTIMATION
        ↓
HALLUCINATION-RISK ESTIMATION
        ↓
SCIENTIFIC ANALYSIS
        ↓
HIGH-RES IMAGE + EVIDENCE

==================================================
1. DATA SOURCES
==================================================

Use official sources wherever possible.

PRIMARY DATA SOURCE:

ISRO Chandrayaan-2 PRADAN / ISSDC

https://pradan.issdc.gov.in/ch2/

Use:

1. TMC-2
2. OHRC
3. TMC-2 derived DTM/DEM products
4. XML/PDS4 metadata
5. Chandrayaan-2 SPICE/geometry information where accessible

Official ISRO reference:

https://www.isro.gov.in/CHANDRAYAAN.html

SECONDARY VALIDATION:

NASA LROC / LRO archive:

https://science.nasa.gov/mission/lro/data-products/

LOLA:

https://pds-geosciences.wustl.edu/missions/lro/lola.htm

USGS ISIS documentation:

https://astrogeology.usgs.gov/docs/

PDS4:

https://pds.nasa.gov/datastandards/documents/current-version.shtml

IMPORTANT DATA RULES:

- Prefer official sources.
- Do not scrape random image websites.
- Do not use copyrighted stock imagery.
- Do not silently substitute random datasets.
- Record the exact source URL for every dataset.
- Record dataset license/usage information.
- Preserve original metadata.
- Do not modify original source files.
- Create processed copies separately.

If a source requires authentication, registration, manual approval or restricted access, DO NOT attempt to bypass it.

Instead:
1. report the limitation
2. use an openly accessible official alternative if possible
3. continue the build
4. document the substitution.

==================================================
2. DATA ACQUISITION
==================================================

First inspect the existing repository structure.

Expected:

01_DATA/
02_RESEARCH/
03_BASELINES/
04_MODEL_SPEC/
05_UI_SPEC/
06_ARCHITECTURE/
07_DEMO/
08_REFERENCES/
09_AGENT_PROMPTS/

Do not create unnecessary duplicate folders.

Inside 01_DATA create/use:

01_DATA/
    ISRO/
        Chandrayaan-2/
            TMC-2/
            OHRC/
            DEM/
            SPICE/
    NASA/
        LROC/
        LOLA/
    PAIRS/
        train/
        validation/
        test/

Do not download huge archives blindly.

First determine:
- available products
- file sizes
- formats
- metadata
- spatial resolution
- geographic coverage

Then select a small representative subset suitable for a hackathon.

Target:
3–4 lunar regions.

Prefer:
1. normal lunar terrain
2. crater-rich terrain
3. complex ridge/edge terrain
4. shadow/polar or difficult terrain if available

At least one region should be suitable for a strong before/after demo.

==================================================
3. DATA INSPECTION
==================================================

For every selected scene extract:

- mission
- instrument
- observation ID
- acquisition date
- image dimensions
- spatial resolution
- latitude
- longitude
- projection
- processing level
- incidence angle
- emission angle
- phase angle
- Sun geometry if available
- spacecraft geometry if available
- source URL

Preserve PDS4/XML labels.

Create a machine-readable metadata index.

Example:

data_catalog.json

Each record should contain:

scene_id
mission
instrument
source
source_url
resolution
dimensions
latitude
longitude
acquisition_time
metadata_file
image_file
dem_file
geometry_available

==================================================
4. TRAINING / VALIDATION DATA
==================================================

Do NOT assume that native TMC-2/OHRC images automatically form perfectly aligned training pairs.

Inspect:
- spatial coverage
- resolution
- registration
- projection
- viewing geometry

If valid paired data exists:
create aligned pairs.

If not:
create a realistic degradation pipeline from higher-resolution imagery.

Example:

HIGH RES IMAGE
    ↓
blur
    ↓
downsample
    ↓
noise
    ↓
compression/degradation
    ↓
LOW RES INPUT

Then train:

LOW RES → HIGH RES

Document the degradation model.

==================================================
5. BASELINES
==================================================

Implement at least:

1. Bicubic interpolation
2. One established AI super-resolution baseline, preferably Real-ESRGAN or another suitable pretrained/open model
3. LUNARA model/pipeline

Do not claim LUNARA is scientifically superior unless measured.

Compare using appropriate metrics.

Possible metrics:

PSNR
SSIM
LPIPS
edge preservation
feature consistency
crater detection consistency

If ground truth is unavailable, clearly distinguish:
reference-based metrics
from
no-reference/scientific consistency metrics.

==================================================
6. LUNARA CORE PIPELINE
==================================================

Implement this architecture:

INPUT
  ↓
PDS4/metadata ingestion
  ↓
Radiometric/geometric preprocessing where applicable
  ↓
Image normalization
  ↓
AI SUPER RESOLUTION
  ↓
Physics/geometry consistency checks
  ↓
Confidence estimation
  ↓
Hallucination-risk estimation
  ↓
Scientific feature extraction
  ↓
Result package

Result package:

enhanced image
confidence map
risk map
metrics
detected features
metadata
provenance

==================================================
7. AI MODEL
==================================================

For the hackathon, prioritize reliability over model complexity.

Architecture may use:

CNN/Transformer-based super-resolution

Possible pretrained baseline:
Real-ESRGAN

Optional advanced refinement:
diffusion-based restoration

DO NOT train a giant foundation/diffusion model from scratch.

If compute is insufficient:
use pretrained models + fine-tuning.

Clearly label:
BASELINE
LUNARA

Do not fabricate scientific performance.

==================================================
8. TRUST / HALLUCINATION LAYER
==================================================

This is one of the main innovations.

The system must not simply produce a visually pleasing image.

Generate:

CONFIDENCE MAP

and

HALLUCINATION / RISK MAP

Potential signals:

- model uncertainty
- disagreement between models
- reconstruction consistency
- edge consistency
- terrain/DEM consistency
- geometry consistency
- multi-scale consistency

Example output:

image_confidence
geometry_consistency
terrain_consistency
feature_consistency
hallucination_risk

These values must be clearly described as prototype estimates if not scientifically validated.

==================================================
9. SCIENTIFIC FEATURES
==================================================

Implement a prototype crater/terrain feature detection layer.

For detected crater-like features show:

latitude
longitude
diameter estimate
confidence
evidence/risk

Do not present AI-generated features as confirmed scientific discoveries.

Use wording such as:

"Candidate crater"
"AI-detected feature"
"Requires scientific verification"

==================================================
10. BACKEND
==================================================

Use:

Python
FastAPI
Pydantic
PyTorch
NumPy
OpenCV
scikit-image
Rasterio
GDAL where practical

Architecture:

Next.js
    ↓
FastAPI
    ↓
Processing pipeline
    ↓
PyTorch

API:

POST /api/datasets/upload
GET /api/datasets
GET /api/datasets/{id}

POST /api/enhance
GET /api/jobs/{id}
GET /api/results/{id}

GET /api/results/{id}/confidence
GET /api/results/{id}/risk
GET /api/results/{id}/features
GET /api/metrics/{id}

==================================================
11. FRONTEND
==================================================

Use:

Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Three.js
React Three Fiber
Framer Motion
Lucide icons

Typography:

Satoshi

Do NOT use emojis.

==================================================
12. UI DESIGN
==================================================

The UI should feel like:

premium planetary science mission control

References provided by the user should be treated as visual inspiration.

Combine:

1. spacecraft mission-control dashboard
2. scientific planetary explorer
3. advanced aerospace operations interface

Avoid:

- generic SaaS dashboard
- gaming UI
- cartoon space theme
- excessive neon
- excessive glassmorphism
- excessive animations

Use:

dark neutral surfaces
precise typography
scientific data visualization
subtle orbital animations
3D planets
technical telemetry
image-analysis interfaces

==================================================
13. PAGES
==================================================

Build:

1. Mission Control
2. Planetary Explorer
3. Super-Resolution Lab
4. Scientific Analysis
5. Compare
6. Datasets
7. Research

MISSION CONTROL:

Show:
system status
datasets
processing jobs
model status
recent activity
mission visualization

PLANETARY EXPLORER:

3D Moon
planetary navigation
coordinates
regions
crater markers
dataset information

ENHANCE:

original image
enhanced image
comparison slider
model
scale
processing status

ANALYSIS:

enhanced image
confidence map
hallucination-risk map
terrain/DEM
candidate features
metrics

COMPARE:

Original
Bicubic
AI baseline
LUNARA

DATASETS:

mission
instrument
resolution
scene
metadata
source

RESEARCH:

methods
model
datasets
validation
limitations
references

==================================================
14. THREE.JS
==================================================

Create a high-quality 3D lunar/planetary visualization.

Include:

Moon
subtle rotation
coordinate grid
orbit
satellite
crater markers
lighting/terminator

Optional:

small solar-system visualization.

Do not make it look like a game.

==================================================
15. DESIGN SYSTEM
==================================================

Primary font:
Satoshi

No emojis.

Use professional icons.

Dark scientific palette.

Use accent colors only for:

success
warning
critical
selected
AI state

Animations should be subtle and purposeful.

==================================================
16. PROVENANCE
==================================================

Every processed result should have provenance.

Example:

{
  source_mission,
  instrument,
  scene_id,
  source_url,
  model,
  model_version,
  scale,
  preprocessing,
  constraints,
  dem_used,
  confidence,
  hallucination_risk,
  processing_time
}

==================================================
17. DOCUMENTATION
==================================================

Create/update:

06_ARCHITECTURE/system_architecture.md
06_ARCHITECTURE/ai_pipeline.md
06_ARCHITECTURE/api.md

04_MODEL_SPEC/architecture.md
04_MODEL_SPEC/training.md
04_MODEL_SPEC/evaluation_metrics.md

08_REFERENCES/references.md

Also create:

DATA_SOURCES.md
MODEL_CARD.md
LIMITATIONS.md

==================================================
18. IMPORTANT SCIENTIFIC HONESTY
==================================================

Never fabricate:

- ISRO validation
- scientific accuracy
- dataset availability
- benchmark results
- resolution improvement
- crater discoveries
- official pipeline integration

Clearly distinguish:

REAL DATA
SIMULATED DATA
PRETRAINED MODEL
LUNARA MODEL
PROTOTYPE ESTIMATE

==================================================
19. EXECUTION STRATEGY
==================================================

Work in phases.

PHASE 1:
Inspect repository and available environment.

PHASE 2:
Research and verify data sources.

PHASE 3:
Acquire a small dataset subset.

PHASE 4:
Build preprocessing and dataset pipeline.

PHASE 5:
Implement Bicubic baseline.

PHASE 6:
Implement established AI baseline.

PHASE 7:
Implement LUNARA enhancement + confidence/risk layer.

PHASE 8:
Build FastAPI backend.

PHASE 9:
Build frontend.

PHASE 10:
Integrate 3D planetary visualization.

PHASE 11:
Integrate scientific analysis.

PHASE 12:
Run evaluation.

PHASE 13:
Polish UI.

PHASE 14:
Prepare final demo.

After every phase:
- test
- document
- report what worked
- report what failed
- do not silently invent missing components.

==================================================
20. MOST IMPORTANT PRODUCT REQUIREMENT
==================================================

The final demo must clearly demonstrate:

LOW RESOLUTION
      ↓
LUNARA
      ↓
HIGHER RESOLUTION
      +
CONFIDENCE
      +
HALLUCINATION RISK
      +
SCIENTIFIC FEATURES
      +
PROVENANCE

The central message:

"LUNARA doesn't just enhance what we see.
It tells us what we can trust."

==================================================
21. START NOW
==================================================

First DO NOT immediately build the UI.

First inspect the repository.

Then inspect the available data sources.

Then produce:

1. DATA SOURCES FOUND
2. DATASETS AVAILABLE
3. DOWNLOAD SIZES
4. ACCESS REQUIREMENTS
5. RECOMMENDED DATASETS
6. DATASET LIMITATIONS
7. PROPOSED TRAIN/VALIDATION/TEST SPLIT
8. IMPLEMENTATION PLAN

Wait for approval before downloading extremely large datasets or performing expensive model training.

Do not ask unnecessary questions if a reasonable engineering decision can be made.

Keep a running DEVELOPMENT_LOG.md documenting decisions and issues.