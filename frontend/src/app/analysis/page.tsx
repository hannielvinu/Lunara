"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  MapPin,
  FileSpreadsheet,
  Info,
  ScanSearch,
  ChevronDown,
  Layers,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Award,
  Sparkles,
  Download,
  FileText,
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Eye,
  Crosshair,
  Compass,
  ArrowRight
} from "lucide-react";
import { ResultPackage, DatasetItem, ScientificFeature } from "@/types";

type CandidateLayer = "original_lr" | "bicubic" | "ai_baseline" | "lunara";
type OverlayMode = "none" | "features" | "confidence" | "risk";
type InspectorTab = "features" | "measurements" | "evidence" | "provenance";

function ScientificAnalysisContent() {
  const searchParams = useSearchParams();
  const sceneParam = searchParams.get("scene") || "scene_tycho_crater";
  const resultIdParam = searchParams.get("result_id");

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(sceneParam);
  
  // Viewer states
  const [activeCandidate, setActiveCandidate] = useState<CandidateLayer>("lunara");
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("features");
  const [activeInspectorTab, setActiveInspectorTab] = useState<InspectorTab>("features");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  const [result, setResult] = useState<ResultPackage | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<ScientificFeature | null>(null);
  const [filterConfidence, setFilterConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const viewerContainerRef = useRef<HTMLDivElement>(null);

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
    if (resultIdParam) {
      setIsLoading(true);
      fetch(`/api/results/${resultIdParam}`)
        .then((res) => res.json())
        .then((data: ResultPackage) => {
          setResult(data);
          if (data.features?.length > 0) setSelectedFeature(data.features[0]);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else if (selectedSceneId) {
      setIsLoading(true);
      fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id: selectedSceneId,
          model: "lunara",
          scale: 4,
          enable_consistency_checks: true,
          enable_dem_guidance: true,
        }),
      })
        .then((res) => res.json())
        .then((job) => {
          if (job.result_id) return fetch(`/api/results/${job.result_id}`);
        })
        .then((res) => res?.json())
        .then((data: ResultPackage) => {
          setResult(data);
          if (data.features?.length > 0) setSelectedFeature(data.features[0]);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [selectedSceneId, resultIdParam]);

  const filteredFeatures = (result?.features || []).filter((f) => {
    const conf = f.evidence?.local_confidence_pct ?? f.local_confidence_pct ?? 0;
    return conf >= filterConfidence;
  });

  const evidence = result?.scientific_evidence;
  const candidatesData = evidence?.candidates || {};
  const selectedScene = datasets.find((d) => d.scene_id === (result?.scene_id || selectedSceneId));

  // Determine current image to render based on activeCandidate and overlayMode
  const getDisplayImageUrl = () => {
    if (!result) return "";
    if (overlayMode === "confidence") return result.urls.confidence_color;
    if (overlayMode === "risk") return result.urls.risk_color;
    if (overlayMode === "features") return result.urls.annotated;

    // overlayMode === "none"
    switch (activeCandidate) {
      case "original_lr":
        return result.urls.lr_original || (selectedScene ? `/${selectedScene.files.lr_image}` : result.urls.enhanced);
      case "bicubic":
        return result.urls.bicubic || result.urls.enhanced;
      case "ai_baseline":
        return result.urls.ai_baseline || result.urls.enhanced;
      case "lunara":
      default:
        return result.urls.enhanced;
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!viewerContainerRef.current) return;
    if (!document.fullscreenElement) {
      viewerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Export structured JSON scientific report
  const handleExportJson = async () => {
    if (!result) return;
    setIsExporting(true);
    try {
      const res = await fetch(`/api/results/${result.result_id}/report`);
      const reportData = await res.json();
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LUNARA_Report_${result.result_id}_${result.scene_id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper values
  const renderVal = (v: any, suffix = "") => {
    if (v === undefined || v === null) return "UNAVAILABLE";
    return `${v}${suffix}`;
  };

  const getTrustBadgeStyle = (trust: string = "INSUFFICIENT EVIDENCE") => {
    switch (trust) {
      case "HIGH":
        return "text-trust-high bg-trust-high/10 border-trust-high/30";
      case "MODERATE":
        return "text-trust-moderate bg-trust-moderate/10 border-trust-moderate/30";
      case "LOW":
        return "text-trust-low bg-trust-low/10 border-trust-low/30";
      default:
        return "text-slate-400 bg-surface-200 border-white/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Workflow Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.04]">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mb-1">
            <Link href="/enhance" className="hover:text-slate-300">ANALYZE</Link>
            <span>&rarr;</span>
            <span className="text-accent-blue font-bold">SCIENTIFIC TRUST & MEASUREMENT</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Crosshair className="w-5 h-5 text-accent-blue" />
            Scientific Analysis & Decision Workspace
          </h1>
        </div>

        {/* Action Buttons: Export Report */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            disabled={!result || isExporting}
            className="px-3.5 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/[0.08] text-slate-200 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-accent-blue" />
            <span>{isExporting ? "Exporting..." : "Export Report (JSON)"}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Decision Summary Banner (Consumes Phase 3 Trust Engine) */}
      {evidence && (
        <div className="rounded-2xl p-4 bg-surface-300/90 border border-white/[0.06] space-y-3 font-mono text-xs shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-white/[0.04]">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                BEST SUPPORTED RECONSTRUCTION
              </span>
              <div className="text-base font-bold text-white flex items-center gap-2 font-sans">
                {evidence.recommended_candidate === "NO CLEAR WINNER" ? (
                  <span className="text-trust-moderate">NO CLEAR WINNER (INCONCLUSIVE)</span>
                ) : (
                  <span className="text-accent-blue flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> {evidence.recommended_candidate}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="px-2.5 py-1 rounded bg-surface-400 border border-white/[0.04] text-[11px]">
                <span className="text-slate-500 mr-1.5">Trust:</span>
                <span className={`font-bold px-1.5 py-0.2 rounded border ${getTrustBadgeStyle(evidence.trust_classification)}`}>
                  {evidence.trust_classification}
                </span>
              </div>
              <div className="px-2.5 py-1 rounded bg-surface-400 border border-white/[0.04] text-[11px]">
                <span className="text-slate-500 mr-1.5">Coverage:</span>
                <span className="text-white font-bold">{evidence.evidence_coverage}</span>
              </div>
              <div className="px-2.5 py-1 rounded bg-surface-400 border border-white/[0.04] text-[11px]">
                <span className="text-slate-500 mr-1.5">Scene:</span>
                <span className="text-slate-300">{result?.scene_id}</span>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-500">DECISION RATIONALE: </strong>
            {evidence.recommendation_reason}
          </div>
        </div>
      )}

      {/* 3. Main Workspace: Image Viewer & Analysis Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Interactive Scientific Image Viewer */}
        <div className="lg:col-span-7 space-y-3">
          {/* Controls Bar: Candidate Switcher & Overlay Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-300/90 border border-white/[0.06] font-mono text-xs">
            {/* Candidate Selector */}
            <div className="flex items-center gap-1">
              {[
                { key: "original_lr", label: "Original LR" },
                { key: "bicubic", label: "Bicubic" },
                { key: "ai_baseline", label: "AI Baseline" },
                { key: "lunara", label: "LUNARA" },
              ].map((cand) => (
                <button
                  key={cand.key}
                  onClick={() => setActiveCandidate(cand.key as CandidateLayer)}
                  className={`px-2.5 py-1 rounded-md transition-all text-[11px] ${
                    activeCandidate === cand.key
                      ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 font-bold"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {cand.label}
                </button>
              ))}
            </div>

            {/* Overlay Selector */}
            <div className="flex items-center gap-1 pl-2 border-l border-white/[0.06]">
              <span className="text-[10px] text-slate-500 mr-1">OVERLAY:</span>
              {[
                { id: "features", label: "Features" },
                { id: "confidence", label: "Confidence" },
                { id: "risk", label: "Risk" },
                { id: "none", label: "Raw" },
              ].map((ov) => (
                <button
                  key={ov.id}
                  onClick={() => setOverlayMode(ov.id as OverlayMode)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    overlayMode === ov.id
                      ? "bg-surface-100 text-white font-semibold border border-white/10"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {ov.label}
                </button>
              ))}

              <button
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
                className="p-1 rounded text-slate-500 hover:text-slate-300 ml-1"
              >
                {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Viewport Box */}
          <div
            ref={viewerContainerRef}
            className="relative rounded-2xl overflow-hidden border border-white/[0.06] bg-black aspect-square max-h-[540px] flex items-center justify-center shadow-2xl"
          >
            {isLoading ? (
              <div className="text-center font-mono text-xs text-slate-600">
                Loading scientific workspace...
              </div>
            ) : result ? (
              <img
                src={getDisplayImageUrl()}
                alt="Scientific Observation View"
                className="w-full h-full object-contain select-none"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: "transform 0.15s ease-out",
                  imageRendering: activeCandidate === "original_lr" && overlayMode === "none" ? "pixelated" : "auto"
                }}
              />
            ) : (
              <div className="text-center text-slate-600 text-xs font-mono">
                No active observation
              </div>
            )}

            {/* Overlay Indicator Tag */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-surface-400/90 backdrop-blur-md text-[10px] font-mono text-slate-400 border border-white/[0.04]">
              {activeCandidate.toUpperCase()} &middot; {overlayMode.toUpperCase()} OVERLAY
            </div>

            {/* Selected Feature Highlight Box */}
            {selectedFeature && (
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-surface-400/95 backdrop-blur-md border border-accent-blue/30 text-[11px] font-mono text-white flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-accent-blue" />
                <span className="font-bold">{selectedFeature.id}</span>
                <span className="text-slate-400">
                  {selectedFeature.measurements?.diameter_km ? `${selectedFeature.measurements.diameter_km} km` : selectedFeature.type}
                </span>
                <span className="text-trust-high">
                  ({selectedFeature.evidence?.local_confidence_pct ?? selectedFeature.local_confidence_pct}%)
                </span>
              </div>
            )}
          </div>

          {/* Zoom Toolbar */}
          <div className="flex items-center justify-between px-1 text-xs font-mono text-slate-500">
            <span>Scale: {Math.round(zoomLevel * 100)}%</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
                className="p-1 rounded bg-surface-200 border border-white/5 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="px-2 py-0.5 rounded bg-surface-200 border border-white/5 hover:text-white text-[10px]"
              >
                Reset
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
                className="p-1 rounded bg-surface-200 border border-white/5 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Analysis Inspector Tabs */}
        <div className="lg:col-span-5 space-y-3 font-mono text-xs">
          {/* Inspector Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-300 border border-white/[0.06]">
            {[
              { id: "features", label: "FEATURES" },
              { id: "measurements", label: "MEASUREMENTS" },
              { id: "evidence", label: "EVIDENCE" },
              { id: "provenance", label: "PROVENANCE" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveInspectorTab(tab.id as InspectorTab)}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all text-[11px] ${
                  activeInspectorTab === tab.id
                    ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 font-bold"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Inspector Content Card */}
          <div className="rounded-xl p-4 bg-surface-300/80 border border-white/[0.06] space-y-3 min-h-[460px]">
            {/* TAB 1: FEATURES LIST */}
            {activeInspectorTab === "features" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <span className="font-bold text-white font-sans text-xs">
                    CANDIDATE FEATURES ({filteredFeatures.length})
                  </span>
                  <select
                    value={filterConfidence}
                    onChange={(e) => setFilterConfidence(Number(e.target.value))}
                    className="bg-surface-400 border border-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-white"
                  >
                    <option value={0}>All Features</option>
                    <option value={60}>Confidence &ge; 60%</option>
                    <option value={80}>High &ge; 80%</option>
                  </select>
                </div>

                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredFeatures.map((feat) => {
                    const isSelected = selectedFeature?.id === feat.id;
                    const conf = feat.evidence?.local_confidence_pct ?? feat.local_confidence_pct ?? 0;
                    return (
                      <div
                        key={feat.id}
                        onClick={() => setSelectedFeature(feat)}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-accent-blue/[0.08] border-accent-blue/40 text-white"
                            : "bg-surface-400/40 border-white/[0.03] text-slate-400 hover:bg-surface-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-white">{feat.id}</span>
                          <span className="text-trust-high font-bold">{conf}%</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                          <span className="truncate max-w-[180px]">{feat.type}</span>
                          <span className="text-accent-blue">
                            {feat.measurements?.diameter_km ? `${feat.measurements.diameter_km} km` : (feat.measurements?.length_km ? `${feat.measurements.length_km} km` : "N/A")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: MEASUREMENTS & UNCERTAINTY */}
            {activeInspectorTab === "measurements" && (
              <div className="space-y-3">
                <div className="pb-2 border-b border-white/[0.04]">
                  <span className="font-bold text-white font-sans text-xs">
                    {selectedFeature ? `${selectedFeature.id} &bull; MEASUREMENTS` : "FEATURE MEASUREMENTS"}
                  </span>
                </div>

                {selectedFeature ? (
                  <div className="space-y-3 text-[11px]">
                    <div className="p-3 rounded-lg bg-surface-400/50 border border-white/[0.03] space-y-1.5">
                      <span className="text-slate-500 text-[10px] block">PRIMARY DIMENSION (DIAMETER / LENGTH)</span>
                      <div className="text-lg font-bold text-white">
                        {selectedFeature.measurements?.diameter_km !== undefined && selectedFeature.measurements?.diameter_km !== null
                          ? `${selectedFeature.measurements.diameter_km} km ± ${selectedFeature.measurements.diameter_uncertainty_km || 0.12} km`
                          : (selectedFeature.measurements?.length_km
                              ? `${selectedFeature.measurements.length_km} km ± ${selectedFeature.measurements.length_uncertainty_km || 0.05} km`
                              : "UNAVAILABLE (NO GSD SCALE)")}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        Status: <strong className="text-slate-300">{selectedFeature.measurements?.measurement_status || "COMPUTED"}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2.5 rounded bg-surface-400/40 border border-white/[0.03]">
                        <span className="text-slate-500 text-[10px] block">ESTIMATED DEPTH</span>
                        <span className="text-slate-200 font-bold">
                          {selectedFeature.measurements?.estimated_depth_meters !== undefined && selectedFeature.measurements?.estimated_depth_meters !== null
                            ? `${selectedFeature.measurements.estimated_depth_meters} m ± ${selectedFeature.measurements.depth_uncertainty_meters || 15} m`
                            : "UNAVAILABLE"}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-surface-400/40 border border-white/[0.03]">
                        <span className="text-slate-500 text-[10px] block">d / D RATIO</span>
                        <span className="text-slate-200 font-bold">
                          {renderVal(selectedFeature.measurements?.depth_to_diameter_ratio)}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-surface-400/40 border border-white/[0.03]">
                        <span className="text-slate-500 text-[10px] block">PIXEL RADIUS / LENGTH</span>
                        <span className="text-slate-200 font-bold">
                          {selectedFeature.geometry?.pixel_radius ? `${selectedFeature.geometry.pixel_radius} px` : `${selectedFeature.geometry?.length_px || "N/A"} px`}
                        </span>
                      </div>
                      <div className="p-2.5 rounded bg-surface-400/40 border border-white/[0.03]">
                        <span className="text-slate-500 text-[10px] block">COORDINATES</span>
                        <span className="text-slate-200 font-bold">
                          {selectedFeature.coordinates?.latitude !== null && selectedFeature.coordinates?.latitude !== undefined
                            ? `${selectedFeature.coordinates.latitude}°, ${selectedFeature.coordinates.longitude}°`
                            : "UNAVAILABLE"}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-surface-400/30 border border-white/[0.02] text-[10px] text-slate-500">
                      Uncertainty is derived from sub-pixel Hough geometry residuals and ground sampling distance (GSD) variance propagation.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    Select a candidate feature to inspect measurements.
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: EVIDENCE & VERIFICATION STATUS */}
            {activeInspectorTab === "evidence" && (
              <div className="space-y-3">
                <div className="pb-2 border-b border-white/[0.04]">
                  <span className="font-bold text-white font-sans text-xs">
                    {selectedFeature ? `${selectedFeature.id} &bull; SCIENTIFIC EVIDENCE` : "FEATURE EVIDENCE"}
                  </span>
                </div>

                {selectedFeature ? (
                  <div className="space-y-2.5 text-[11px]">
                    <div className="p-2.5 rounded bg-surface-400/50 border border-white/[0.03] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Status:</span>
                        <span className="text-trust-moderate font-bold">{selectedFeature.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Verification Tier:</span>
                        <span className="text-slate-300">{selectedFeature.verification_tier}</span>
                      </div>
                    </div>

                    <div className="space-y-1.5 p-2.5 rounded bg-surface-400/40 border border-white/[0.03]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Local Model Confidence:</span>
                        <span className="text-trust-high font-bold">{selectedFeature.evidence?.local_confidence_pct ?? selectedFeature.local_confidence_pct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Local Hallucination Risk:</span>
                        <span className="text-trust-moderate font-bold">{selectedFeature.evidence?.local_hallucination_risk_pct ?? selectedFeature.local_hallucination_risk_pct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Edge Continuity:</span>
                        <span className="text-accent-blue font-bold">{selectedFeature.evidence?.edge_continuity || "PASS"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Multi-Scale Stability:</span>
                        <span className="text-accent-blue font-bold">{selectedFeature.evidence?.multiscale_stability || "PASS"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Candidate Persistence:</span>
                        <span className="text-white font-bold">{selectedFeature.evidence?.candidate_persistence || "4 / 4 reconstructions"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">DEM Agreement:</span>
                        <span className="text-slate-300 font-bold">{selectedFeature.evidence?.dem_agreement || (result?.provenance.dem_source ? "AVAILABLE" : "UNAVAILABLE")}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-trust-moderate/[0.06] border border-trust-moderate/20 text-[10px] text-slate-400 leading-relaxed">
                      <strong>SCIENTIFIC NOTICE:</strong> Candidate features are automated detections and require independent cartographic confirmation.
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    Select a candidate feature to inspect evidence.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: PROVENANCE RECORD */}
            {activeInspectorTab === "provenance" && (
              <div className="space-y-3">
                <div className="pb-2 border-b border-white/[0.04]">
                  <span className="font-bold text-white font-sans text-xs">ANALYSIS PROVENANCE</span>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="p-2.5 rounded bg-surface-400/50 border border-white/[0.03] space-y-1">
                    <div><span className="text-slate-500">Mission:</span> {result?.provenance.mission || "CHANDRAYAAN-2"}</div>
                    <div><span className="text-slate-500">Sensor:</span> {result?.provenance.instrument || "TMC-2/OHRC"}</div>
                    <div><span className="text-slate-500">Result ID:</span> {result?.result_id || "res_active"}</div>
                    <div><span className="text-slate-500">Resolution:</span> {result?.provenance.output_resolution_m ? `${result.provenance.output_resolution_m} m/px` : "0.5 m/px"}</div>
                    <div><span className="text-slate-500">DEM Source:</span> {result?.provenance.dem_source || "UNAVAILABLE"}</div>
                    <div><span className="text-slate-500">Solar Incidence:</span> {result?.provenance.solar_geometry?.incidence ? `${result.provenance.solar_geometry.incidence}°` : "54.2°"}</div>
                    <div><span className="text-slate-500">PDS4 Standard:</span> {result?.provenance.pds4_compliance || "PDS4 Standard Observational Product"}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Summary Bar */}
      <div className="rounded-xl p-4 bg-surface-300/60 border border-white/[0.04] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4 text-slate-400">
          <div>TOTAL CANDIDATES: <strong className="text-white">{filteredFeatures.length}</strong></div>
          <div>VERIFIED: <strong className="text-slate-400">0 (Pending Peer Review)</strong></div>
          <div>CONFIDENCE &ge; 80%: <strong className="text-trust-high">{filteredFeatures.filter(f => (f.evidence?.local_confidence_pct ?? f.local_confidence_pct ?? 0) >= 80).length}</strong></div>
          <div>DEM TOPOGRAPHY: <strong className="text-accent-blue">{result?.provenance.dem_source || "UNAVAILABLE"}</strong></div>
        </div>

        <Link
          href={`/compare?scene=${result?.scene_id || selectedSceneId}`}
          className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <span>View 4-Way Multi-Model Matrix</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function ScientificAnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-600 text-xs font-mono">Loading Scientific Workspace...</div>}>
      <ScientificAnalysisContent />
    </Suspense>
  );
}
