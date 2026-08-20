export interface SolarGeometry {
  incidence: number;
  emission: number;
  phase: number;
  sun_azimuth: number;
}

export interface DatasetItem {
  scene_id: string;
  name: string;
  mission: string;
  instrument: string;
  latitude: number;
  longitude: number;
  resolution_hr: number;
  resolution_lr: number;
  scale_factor: number;
  dimensions_hr: [number, number];
  dimensions_lr: [number, number];
  acquisition_time: string;
  solar_geometry: SolarGeometry;
  files: {
    hr_image?: string;
    lr_image?: string;
    dem?: string;
    pds4_xml?: string;
  };
  source_url: string;
  license: string;
  provenance: {
    pds_standard: string;
    calibration: string;
    dem_source: string;
    geometry_source: string;
  };
}

export interface TrustMetrics {
  image_confidence_pct: number;
  hallucination_risk_pct: number;
  geometry_consistency_pct: number;
  terrain_consistency_pct: number;
  reconstruction_fidelity_pct: number;
  risk_classification: string;
}

export interface ScientificFeature {
  id: string;
  type: string;
  label: string;
  status: string;
  verification_requirement: string;
  verification_tier: string;
  pixel_x: number;
  pixel_y: number;
  pixel_radius: number;
  latitude: number;
  longitude: number;
  diameter_meters: number;
  diameter_km: number;
  estimated_depth_meters: number;
  depth_to_diameter_ratio: number;
  local_confidence_pct: number;
  local_hallucination_risk_pct: number;
}

export interface ProvenanceRecord {
  mission: string;
  instrument: string;
  scene_id: string;
  source_url: string;
  model_applied: string;
  model_type: string;
  model_version: string;
  scale_factor: string;
  input_resolution_m: number;
  output_resolution_m: number;
  input_dimensions: [number, number];
  output_dimensions: [number, number];
  dem_used: boolean;
  solar_geometry: Record<string, number>;
  processing_latency_ms: number;
  scientific_disclaimer: string;
  pds4_compliance: string;
}

export interface ResultPackage {
  result_id: string;
  job_id: string;
  scene_id: string;
  model_applied: string;
  model_type: string;
  scale: number;
  urls: {
    enhanced: string;
    annotated: string;
    confidence_map: string;
    risk_map: string;
    confidence_color: string;
    risk_color: string;
    lr_original?: string;
  };
  trust_metrics: TrustMetrics;
  metrics: Record<string, any>;
  features: ScientificFeature[];
  provenance: ProvenanceRecord;
}
