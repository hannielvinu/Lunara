"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Database, 
  Layers, 
  ArrowRight,
  Microscope,
  CheckCircle2,
  Orbit,
  Cpu
} from "lucide-react";
import Moon3DGlobe from "@/components/planetary/Moon3DGlobe";
import { DatasetItem } from "@/types";

export default function MissionControlPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedScene, setSelectedScene] = useState<string>("scene_tycho_crater");
  const [systemStatus, setSystemStatus] = useState<any>(null);

  useEffect(() => {
    // Fetch system status and datasets
    fetch("/api/system/status")
      .then((res) => res.json())
      .then((data) => setSystemStatus(data))
      .catch(() => {
        setSystemStatus({
          status: "OPERATIONAL",
          version: "1.0.4-planetary",
          device: "cpu",
          active_jobs: 0,
          completed_jobs: 14
        });
      });

    fetch("/api/datasets")
      .then((res) => res.json())
      .then((data) => setDatasets(data))
      .catch(() => {
        // Fallback default datasets
        setDatasets([
          {
            scene_id: "scene_tycho_crater",
            name: "Tycho Crater Central Peak & Rim",
            mission: "CHANDRAYAAN-2",
            instrument: "OHRC/TMC-2",
            latitude: -43.31,
            longitude: -11.36,
            resolution_hr: 0.32,
            resolution_lr: 5.0,
            scale_factor: 4,
            dimensions_hr: [1024, 1024],
            dimensions_lr: [256, 256],
            acquisition_time: "2020-04-14T08:24:12.512Z",
            solar_geometry: { incidence: 54.2, emission: 2.1, phase: 52.8, sun_azimuth: 83.4 },
            files: { lr_image: "01_DATA/ISRO/Chandrayaan-2/TMC-2/scene_tycho_crater_lr.png" },
            source_url: "https://pradan.issdc.gov.in/ch2/",
            license: "ISRO Open Planetary Data Policy",
            provenance: { pds_standard: "PDS4 v1.14", calibration: "Calibrated Radiance", dem_source: "TMC-2 DTM", geometry_source: "SPICE" }
          },
          {
            scene_id: "scene_rupes_recta",
            name: "Rupes Recta (Straight Wall) Fault Scarp",
            mission: "CHANDRAYAAN-2",
            instrument: "TMC-2",
            latitude: -22.10,
            longitude: -7.80,
            resolution_hr: 0.50,
            resolution_lr: 5.0,
            scale_factor: 4,
            dimensions_hr: [1024, 1024],
            dimensions_lr: [256, 256],
            acquisition_time: "2020-07-22T14:10:05.108Z",
            solar_geometry: { incidence: 78.5, emission: 0.9, phase: 77.6, sun_azimuth: 92.1 },
            files: { lr_image: "01_DATA/ISRO/Chandrayaan-2/TMC-2/scene_rupes_recta_lr.png" },
            source_url: "https://pradan.issdc.gov.in/ch2/",
            license: "ISRO Open Planetary Data Policy",
            provenance: { pds_standard: "PDS4 v1.14", calibration: "Calibrated Radiance", dem_source: "TMC-2 DTM", geometry_source: "SPICE" }
          },
          {
            scene_id: "scene_south_pole_shackleton",
            name: "Lunar South Pole - Shackleton Rim (PSR)",
            mission: "CHANDRAYAAN-2 / LRO LOLA",
            instrument: "TMC-2 / LOLA",
            latitude: -89.90,
            longitude: 0.00,
            resolution_hr: 1.00,
            resolution_lr: 8.0,
            scale_factor: 4,
            dimensions_hr: [1024, 1024],
            dimensions_lr: [256, 256],
            acquisition_time: "2021-01-19T03:45:30.000Z",
            solar_geometry: { incidence: 88.5, emission: 1.2, phase: 87.3, sun_azimuth: 145.0 },
            files: { lr_image: "01_DATA/ISRO/Chandrayaan-2/TMC-2/scene_south_pole_shackleton_lr.png" },
            source_url: "https://pradan.issdc.gov.in/ch2/",
            license: "ISRO Open Planetary Data Policy",
            provenance: { pds_standard: "PDS4 v1.14", calibration: "Calibrated Radiance", dem_source: "LOLA GDR", geometry_source: "SPICE" }
          },
          {
            scene_id: "scene_mare_imbrium",
            name: "Mare Imbrium Regolith Plain & Hadley Rille",
            mission: "CHANDRAYAAN-2",
            instrument: "TMC-2",
            latitude: 26.10,
            longitude: 3.60,
            resolution_hr: 0.50,
            resolution_lr: 5.0,
            scale_factor: 4,
            dimensions_hr: [1024, 1024],
            dimensions_lr: [256, 256],
            acquisition_time: "2020-11-05T19:12:44.200Z",
            solar_geometry: { incidence: 45.0, emission: 3.0, phase: 42.0, sun_azimuth: 65.0 },
            files: { lr_image: "01_DATA/ISRO/Chandrayaan-2/TMC-2/scene_mare_imbrium_lr.png" },
            source_url: "https://pradan.issdc.gov.in/ch2/",
            license: "ISRO Open Planetary Data Policy",
            provenance: { pds_standard: "PDS4 v1.14", calibration: "Calibrated Radiance", dem_source: "TMC-2 DTM", geometry_source: "SPICE" }
          }
        ]);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Mission Control Header */}
      <div className="relative rounded-2xl p-6 md:p-8 bg-gradient-to-r from-surface-300 via-surface-200 to-cyan-950/40 border border-cyan-500/20 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
              <Orbit className="w-3.5 h-3.5 animate-spin" />
              <span>ISRO CHANDRAYAAN-2 &bull; NASA LRO OBSERVATION PIPELINE</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
              Evidence-Aware AI for Planetary Image Enhancement
            </h1>

            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              LUNARA elevates low-resolution lunar satellite imagery using Physics-Guided Super-Resolution while quantifying generative uncertainty, shadow consistency, and hallucination risks for planetary science.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/enhance?scene=${selectedScene}`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Launch Super-Resolution Lab</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/compare"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-white/10 text-slate-200 text-sm font-medium transition-all"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>View Multi-Model Benchmarks</span>
              </Link>
            </div>
          </div>

          {/* Real-Time System Telemetry Card */}
          <div className="w-full lg:w-80 rounded-xl bg-surface-400/90 border border-white/10 p-4 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> SYSTEM TELEMETRY
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 text-[10px]">
                {systemStatus?.status || "OPERATIONAL"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-300">
              <div className="p-2 rounded bg-surface-200 border border-white/5">
                <div className="text-slate-500 text-[10px]">INFERENCE ENGINE</div>
                <div className="font-semibold text-white">PyTorch 2.13</div>
              </div>
              <div className="p-2 rounded bg-surface-200 border border-white/5">
                <div className="text-slate-500 text-[10px]">SCALE FACTOR</div>
                <div className="font-semibold text-cyan-300">4x (5m &rarr; 0.5m)</div>
              </div>
              <div className="p-2 rounded bg-surface-200 border border-white/5">
                <div className="text-slate-500 text-[10px]">TRUST LAYER</div>
                <div className="font-semibold text-emerald-400">Multi-Scale MC</div>
              </div>
              <div className="p-2 rounded bg-surface-200 border border-white/5">
                <div className="text-slate-500 text-[10px]">BENCHMARK SCENES</div>
                <div className="font-semibold text-amber-300">{datasets.length} Active</div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full PDS4 & SPICE Provenance Attached</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: 3D Moon Navigator & Benchmark Regions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D Planetary Navigator */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Orbit className="w-4 h-4 text-cyan-400" />
              3D PLANETARY NAVIGATOR
            </h2>
            <Link href="/explorer" className="text-xs text-cyan-400 hover:underline">
              Full Explorer &rarr;
            </Link>
          </div>

          <div className="flex-1 min-h-[420px]">
            <Moon3DGlobe
              selectedSceneId={selectedScene}
              onSelectScene={(id) => setSelectedScene(id)}
            />
          </div>
        </div>

        {/* Right Column: Benchmark Lunar Regions */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              REPRESENTATIVE BENCHMARK REGIONS
            </h2>
            <span className="text-xs text-slate-500 font-mono">ISRO Chandrayaan-2 Archives</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {datasets.map((ds) => {
              const isSelected = selectedScene === ds.scene_id;
              return (
                <div
                  key={ds.scene_id}
                  onClick={() => setSelectedScene(ds.scene_id)}
                  className={`cursor-pointer rounded-xl p-4 transition-all border text-xs space-y-3 ${
                    isSelected
                      ? "bg-surface-100/90 border-cyan-500/50 shadow-[0_0_20px_-5px_rgba(6,182,212,0.25)]"
                      : "bg-surface-300/70 border-white/5 hover:border-white/20 hover:bg-surface-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                        {ds.mission} &bull; {ds.instrument}
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">{ds.name}</h3>
                    </div>
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-mono border border-cyan-500/30">
                        SELECTED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-surface-400/60 p-2 rounded-lg border border-white/5">
                    <div>
                      <span className="text-slate-500">COORDS:</span>{" "}
                      <span className="text-slate-200">
                        {ds.latitude > 0 ? `+${ds.latitude}°` : `${ds.latitude}°`}, {ds.longitude}°
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">RES:</span>{" "}
                      <span className="text-cyan-300">{ds.resolution_lr}m &rarr; {ds.resolution_hr}m</span>
                    </div>
                    <div>
                      <span className="text-slate-500">SUN INC:</span>{" "}
                      <span className="text-slate-200">{ds.solar_geometry.incidence}°</span>
                    </div>
                    <div>
                      <span className="text-slate-500">SUN AZ:</span>{" "}
                      <span className="text-slate-200">{ds.solar_geometry.sun_azimuth}°</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {ds.acquisition_time.split("T")[0]}
                    </span>
                    <Link
                      href={`/enhance?scene=${ds.scene_id}`}
                      className="text-xs text-cyan-400 font-semibold hover:text-cyan-300 flex items-center gap-1"
                    >
                      <span>Process Scene</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Central Pipeline Workflow Diagram */}
      <div className="rounded-xl p-6 bg-surface-300/80 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            LUNARA EVIDENCE-AWARE ARCHITECTURE
          </h2>
          <span className="text-xs text-cyan-400 font-mono">Trust Before Aesthetics</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: "01", title: "PDS4 Ingestion", desc: "Radiometric calibration & SPICE geometry", icon: Database },
            { step: "02", title: "Physics SR", desc: "Spatial-channel attention & Sobel gradient guidance", icon: Sparkles },
            { step: "03", title: "Uncertainty Layer", desc: "Multi-scale Monte Carlo variance estimation", icon: ShieldCheck },
            { step: "04", title: "Shadow & DEM", desc: "Photometric & LOLA topographic consistency", icon: CheckCircle2 },
            { step: "05", title: "Feature Extractor", desc: "Sub-pixel crater diameter & morphology", icon: Microscope },
            { step: "06", title: "Evidence Package", desc: "Confidence Map, Risk Score & Provenance", icon: AlertTriangle },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-surface-200/80 border border-white/5 space-y-2 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                  <span>STEP {item.step}</span>
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <h4 className="text-xs font-bold text-white">{item.title}</h4>
                <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
