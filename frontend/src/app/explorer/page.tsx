"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Globe2, 
  Compass, 
  Sun, 
  MapPin, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Info,
  Radio
} from "lucide-react";
import Moon3DGlobe from "@/components/planetary/Moon3DGlobe";
import { DatasetItem } from "@/types";

export default function PlanetaryExplorerPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>("scene_tycho_crater");

  useEffect(() => {
    fetch("/api/datasets")
      .then((res) => res.json())
      .then((data) => setDatasets(data))
      .catch(() => {});
  }, []);

  const selectedScene = datasets.find((d) => d.scene_id === selectedSceneId) || datasets[0];

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Globe2 className="w-6 h-6 text-cyan-400" />
            Planetary 3D Lunar Explorer
          </h1>
          <p className="text-xs text-slate-400">
            Interactive Chandrayaan-2 & LRO orbital navigation across target geological landmarks.
          </p>
        </div>

        {selectedScene && (
          <Link
            href={`/enhance?scene=${selectedScene.scene_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Process {selectedScene.name.split(" ")[0]} in Super-Res Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Explorer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main 3D Lunar Canvas Viewport */}
        <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-cyan-950/60 bg-surface-300 min-h-[560px] flex flex-col relative shadow-2xl">
          <Moon3DGlobe
            selectedSceneId={selectedSceneId}
            onSelectScene={(id) => setSelectedSceneId(id)}
            interactive={true}
          />
        </div>

        {/* Right Telemetry & Observation Inspector Panel */}
        <div className="lg:col-span-4 space-y-4">
          {selectedScene ? (
            <div className="rounded-xl p-5 bg-surface-300/90 border border-white/10 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> REGIONAL TELEMETRY
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-500/30">
                  {selectedScene.mission}
                </span>
              </div>

              <div>
                <div className="text-[10px] text-slate-500 uppercase">Target Landmark</div>
                <h3 className="text-base font-bold text-white font-sans mt-0.5">
                  {selectedScene.name}
                </h3>
              </div>

              {/* Coordinates & Geometry Grid */}
              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-lg bg-surface-400 border border-white/5">
                <div>
                  <div className="text-[10px] text-slate-500">LATITUDE</div>
                  <div className="text-white font-semibold">
                    {selectedScene.latitude > 0 ? `+${selectedScene.latitude}°` : `${selectedScene.latitude}°`}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">LONGITUDE</div>
                  <div className="text-white font-semibold">{selectedScene.longitude}°</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">INPUT RES (LR)</div>
                  <div className="text-amber-400 font-semibold">{selectedScene.resolution_lr} m/px</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">SUPER-RES (HR)</div>
                  <div className="text-cyan-300 font-semibold">{selectedScene.resolution_hr} m/px (4x)</div>
                </div>
              </div>

              {/* Solar Geometry & Illumination */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>SOLAR ILLUMINATION ANGLES</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-surface-200 border border-white/5">
                    <div className="text-[9px] text-slate-500">INCIDENCE</div>
                    <div className="text-slate-200 font-bold">{selectedScene.solar_geometry.incidence}°</div>
                  </div>
                  <div className="p-2 rounded bg-surface-200 border border-white/5">
                    <div className="text-[9px] text-slate-500">EMISSION</div>
                    <div className="text-slate-200 font-bold">{selectedScene.solar_geometry.emission}°</div>
                  </div>
                  <div className="p-2 rounded bg-surface-200 border border-white/5">
                    <div className="text-[9px] text-slate-500">SUN AZIMUTH</div>
                    <div className="text-slate-200 font-bold">{selectedScene.solar_geometry.sun_azimuth}°</div>
                  </div>
                </div>
              </div>

              {/* PDS4 & SPICE Provenance Badge */}
              <div className="p-3 rounded-lg bg-surface-200 border border-white/5 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold">
                  <Radio className="w-3.5 h-3.5" />
                  <span>PDS4 COMPLIANT RECORD</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-tight">
                  Calibrated radiance observation indexed with detached XML label and SPICE planetary ephemeris.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={`/enhance?scene=${selectedScene.scene_id}`}
                  className="w-full text-center py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all font-sans"
                >
                  Open in Super-Resolution Lab
                </Link>
                <Link
                  href={`/analysis?scene=${selectedScene.scene_id}`}
                  className="w-full text-center py-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-white/10 text-slate-300 text-xs transition-all font-sans"
                >
                  Inspect Scientific Evidence Maps
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-6 bg-surface-300 border border-white/5 text-center text-slate-500 text-xs font-mono">
              Select a benchmark region on the 3D globe to view observation telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
