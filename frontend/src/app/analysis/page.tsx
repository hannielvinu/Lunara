"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Microscope, 
  ShieldCheck, 
  AlertTriangle, 
  Layers, 
  MapPin, 
  Download, 
  Eye, 
  CheckCircle2, 
  HelpCircle,
  FileSpreadsheet,
  Info
} from "lucide-react";
import { ResultPackage, DatasetItem, ScientificFeature } from "@/types";

function ScientificAnalysisContent() {
  const searchParams = useSearchParams();
  const sceneParam = searchParams.get("scene") || "scene_tycho_crater";

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(sceneParam);
  const [activeLayer, setActiveLayer] = useState<"annotated" | "confidence" | "risk" | "enhanced">("annotated");
  const [result, setResult] = useState<ResultPackage | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<ScientificFeature | null>(null);
  const [filterConfidence, setFilterConfidence] = useState<number>(0);

  useEffect(() => {
    fetch("/api/datasets")
      .then((res) => res.json())
      .then((data: DatasetItem[]) => {
        setDatasets(data);
        if (data.length > 0) {
          const found = data.find((d) => d.scene_id === sceneParam);
          if (found) setSelectedSceneId(found.scene_id);
          else setSelectedSceneId(data[0].scene_id);
        }
      });
  }, [sceneParam]);

  useEffect(() => {
    if (selectedSceneId) {
      // Run enhancement pipeline to get fresh result package
      fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: selectedSceneId,
          model: "lunara",
          scale: 4,
          enable_consistency_checks: true,
          enable_dem_guidance: true
        })
      })
        .then((res) => res.json())
        .then((job) => {
          if (job.result_id) {
            return fetch(`/api/results/${job.result_id}`);
          }
        })
        .then((res) => res?.json())
        .then((data: ResultPackage) => {
          setResult(data);
          if (data.features && data.features.length > 0) {
            setSelectedFeature(data.features[0]);
          }
        })
        .catch(() => {});
    }
  }, [selectedSceneId]);

  const selectedScene = datasets.find((d) => d.scene_id === selectedSceneId);
  const filteredFeatures = (result?.features || []).filter(
    (f) => f.local_confidence_pct >= filterConfidence
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Microscope className="w-6 h-6 text-cyan-400" />
            Scientific Evidence & Hallucination Analysis
          </h1>
          <p className="text-xs text-slate-400">
            Multi-modal verification: Generative Uncertainty, Photometric Consistency, Topographic Gradients, and Candidate Craters.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <select
            value={selectedSceneId}
            onChange={(e) => setSelectedSceneId(e.target.value)}
            className="bg-surface-300 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            {datasets.map((d) => (
              <option key={d.scene_id} value={d.scene_id}>
                {d.name} ({d.mission})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mandatory Scientific Honesty Banner */}
      <div className="rounded-xl p-4 bg-amber-950/30 border border-amber-500/30 flex items-start gap-3 text-xs">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-amber-300 uppercase tracking-wider font-mono">
            SCIENTIFIC HONESTY & VERIFICATION DISCLAIMER
          </span>
          <p className="text-slate-300 leading-relaxed">
            All detected features, confidence scores, and hallucination risk indices are prototype estimates produced by the LUNARA AI pipeline. Features labeled as <strong className="text-amber-200">"Candidate crater"</strong> or <strong className="text-amber-200">"AI-detected feature"</strong> represent morphological candidates that require formal cartographic cross-referencing and planetary peer review before scientific confirmation.
          </p>
        </div>
      </div>

      {/* Viewport Layer Switcher & Main Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Layer Viewport */}
        <div className="lg:col-span-7 space-y-3">
          {/* Layer Tabs */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-surface-300 border border-white/10 font-mono text-xs overflow-x-auto">
            {[
              { id: "annotated", label: "Candidate Features", color: "text-cyan-300" },
              { id: "confidence", label: "Confidence Map", color: "text-emerald-300" },
              { id: "risk", label: "Hallucination Risk", color: "text-amber-300" },
              { id: "enhanced", label: "Pure Enhanced", color: "text-slate-300" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveLayer(tab.id as any)}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                  activeLayer === tab.id
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Canvas Display */}
          <div className="relative rounded-2xl overflow-hidden border border-cyan-950/60 bg-black aspect-square max-h-[560px] shadow-2xl">
            {result ? (
              <img
                src={
                  activeLayer === "annotated"
                    ? result.urls.annotated
                    : activeLayer === "confidence"
                    ? result.urls.confidence_color
                    : activeLayer === "risk"
                    ? result.urls.risk_color
                    : result.urls.enhanced
                }
                alt="Scientific Layer View"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex items-center justify-center w-full h-full text-slate-500 font-mono text-xs">
                Loading scientific observation layers...
              </div>
            )}

            {/* Layer Legend Overlay */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-surface-400/90 backdrop-blur-md border border-white/10 text-[11px] font-mono flex items-center gap-3">
              {activeLayer === "confidence" && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded bg-gradient-to-r from-purple-900 via-teal-600 to-yellow-300" />
                  <span className="text-slate-300">0% &rarr; 100% Trust</span>
                </div>
              )}
              {activeLayer === "risk" && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded bg-gradient-to-r from-black via-red-600 to-yellow-200" />
                  <span className="text-slate-300">Low &rarr; Severe Hallucination Risk</span>
                </div>
              )}
              {activeLayer === "annotated" && (
                <div className="flex items-center gap-2 text-cyan-300">
                  <span className="w-2.5 h-2.5 rounded-full border border-cyan-400" />
                  <span>Crater Rims &bull; Cyan: High Trust &bull; Orange: Verification Req</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quantitative Evidence & Selected Feature Details */}
        <div className="lg:col-span-5 space-y-4 font-mono text-xs">
          {/* Trust Metrics Breakdown */}
          {result && (
            <div className="rounded-xl p-4 bg-surface-300/90 border border-white/10 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> EVIDENCE SUMMARY
                </span>
                <span className="px-2 py-0.5 rounded bg-surface-200 text-slate-300 text-[10px]">
                  {result.provenance.model_applied}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mean Confidence:</span>
                  <span className="text-emerald-400 font-bold">
                    {result.trust_metrics.image_confidence_pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-400 overflow-hidden">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${result.trust_metrics.image_confidence_pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Hallucination Risk:</span>
                  <span className="text-amber-400 font-bold">
                    {result.trust_metrics.hallucination_risk_pct}% ({result.trust_metrics.risk_classification.split(" ")[0]})
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-400 overflow-hidden">
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${result.trust_metrics.hallucination_risk_pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Solar Shadow Consistency:</span>
                  <span className="text-cyan-300 font-bold">
                    {result.trust_metrics.geometry_consistency_pct}%
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">DEM Topographic Slope Match:</span>
                  <span className="text-cyan-300 font-bold">
                    {result.trust_metrics.terrain_consistency_pct}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Selected Feature Telemetry Inspector */}
          {selectedFeature ? (
            <div className="rounded-xl p-4 bg-surface-300/90 border border-cyan-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> {selectedFeature.id}
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-500/30">
                  {selectedFeature.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded bg-surface-400 border border-white/5">
                <div>
                  <div className="text-slate-500 text-[10px]">DIAMETER</div>
                  <div className="text-white font-bold">{selectedFeature.diameter_km} km ({selectedFeature.diameter_meters}m)</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">EST. DEPTH</div>
                  <div className="text-white font-bold">{selectedFeature.estimated_depth_meters} m</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">LATITUDE</div>
                  <div className="text-slate-200">{selectedFeature.latitude > 0 ? `+${selectedFeature.latitude}°` : `${selectedFeature.latitude}°`}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">LONGITUDE</div>
                  <div className="text-slate-200">{selectedFeature.longitude}°</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">CONFIDENCE</div>
                  <div className="text-emerald-400 font-bold">{selectedFeature.local_confidence_pct}%</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">HALLUCINATION RISK</div>
                  <div className="text-amber-400 font-bold">{selectedFeature.local_hallucination_risk_pct}%</div>
                </div>
              </div>

              <div className="p-2 rounded bg-surface-200 border border-white/5 text-[10px] text-slate-400 leading-tight">
                <span className="text-amber-300 font-bold">STATUS:</span> {selectedFeature.status} &bull; {selectedFeature.verification_requirement}
              </div>
            </div>
          ) : (
            <div className="rounded-xl p-4 bg-surface-300 border border-white/5 text-slate-500 text-center">
              Select a crater from the table below to inspect parameters.
            </div>
          )}
        </div>
      </div>

      {/* Candidate Crater Morphologies Table */}
      <div className="rounded-xl p-5 bg-surface-300/90 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              AI-DETECTED CANDIDATE CRATER MORPHOLOGIES ({filteredFeatures.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Sub-pixel coordinates, physical diameter estimates, and local hallucination bounds.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Filter Trust &gt;</span>
            <select
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(Number(e.target.value))}
              className="bg-surface-400 border border-white/10 rounded p-1 text-white text-xs"
            >
              <option value={0}>All Features (0%+)</option>
              <option value={60}>Moderate (60%+)</option>
              <option value={80}>High Confidence (80%+)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/5">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-surface-400 text-slate-400 uppercase text-[10px] border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Feature ID</th>
                <th className="py-2.5 px-3">Classification</th>
                <th className="py-2.5 px-3">Latitude</th>
                <th className="py-2.5 px-3">Longitude</th>
                <th className="py-2.5 px-3">Diameter</th>
                <th className="py-2.5 px-3">Est. Depth</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Hallucination Risk</th>
                <th className="py-2.5 px-3">Verification Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredFeatures.map((feat) => {
                const isSelected = selectedFeature?.id === feat.id;
                return (
                  <tr
                    key={feat.id}
                    onClick={() => setSelectedFeature(feat)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-cyan-950/40 text-cyan-200"
                        : "hover:bg-surface-200 text-slate-300"
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-white">{feat.id}</td>
                    <td className="py-2 px-3">{feat.label}</td>
                    <td className="py-2 px-3">{feat.latitude > 0 ? `+${feat.latitude}°` : `${feat.latitude}°`}</td>
                    <td className="py-2 px-3">{feat.longitude}°</td>
                    <td className="py-2 px-3 text-cyan-300 font-semibold">{feat.diameter_km} km</td>
                    <td className="py-2 px-3">{feat.estimated_depth_meters} m</td>
                    <td className="py-2 px-3 text-emerald-400 font-semibold">{feat.local_confidence_pct}%</td>
                    <td className="py-2 px-3 text-amber-400">{feat.local_hallucination_risk_pct}%</td>
                    <td className="py-2 px-3 text-[10px] text-slate-400">{feat.verification_tier}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ScientificAnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-mono text-xs">Loading scientific analysis...</div>}>
      <ScientificAnalysisContent />
    </Suspense>
  );
}
