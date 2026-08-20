"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  Sliders,
  Layers,
  ShieldCheck,
  ArrowRight,
  Activity,
  ScanSearch,
  ImagePlus,
  Info,
  ChevronDown,
  X,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RefreshCw,
  Columns2,
  CheckCircle2,
  AlertCircle,
  FileText
} from "lucide-react";
import { DatasetItem, ResultPackage } from "@/types";

type CandidateKey = "original_lr" | "bicubic" | "ai_baseline" | "lunara";
type ViewMode = "single" | "slider" | "split";

function AnalyzeContent() {
  const searchParams = useSearchParams();
  const initialScene = searchParams.get("scene") || "";

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(initialScene);
  const [selectedModel, setSelectedModel] = useState<string>("lunara");
  const [scaleFactor, setScaleFactor] = useState<number>(4);

  // Upload state
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [customFileName, setCustomFileName] = useState<string>("");
  const [customFileSize, setCustomFileSize] = useState<string>("");
  const [customImageDims, setCustomImageDims] = useState<[number, number] | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Processing & Multi-Stage State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<number>(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultPackage | null>(null);
  const [hasRunOnce, setHasRunOnce] = useState(false);

  // Candidate Lab View State
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateKey>("lunara");
  const [viewMode, setViewMode] = useState<ViewMode>("slider");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);

  // Ingestion of datasets
  useEffect(() => {
    fetch("/api/datasets")
      .then((res) => res.json())
      .then((data: DatasetItem[]) => {
        setDatasets(data);
        if (initialScene) {
          const found = data.find((d) => d.scene_id === initialScene);
          if (found) setSelectedSceneId(found.scene_id);
        }
      })
      .catch(() => {});
  }, [initialScene]);

  const handleRunAnalysis = useCallback(async () => {
    if (!selectedSceneId && !customImageBase64) return;
    setIsProcessing(true);
    setProcessingError(null);
    setProcessingStage(1); // Ingestion & Preprocessing
    setResult(null);

    try {
      const payload = {
        dataset_id: customImageBase64 ? null : selectedSceneId,
        image_base64: customImageBase64,
        model: selectedModel,
        scale: scaleFactor,
        enable_consistency_checks: true,
        enable_dem_guidance: true,
      };

      // Progress animation stages
      const stageTimer1 = setTimeout(() => setProcessingStage(2), 250); // Candidate generation
      const stageTimer2 = setTimeout(() => setProcessingStage(3), 550); // Scientific validation

      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const jobData = await res.json();
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      if (jobData.status === "failed") {
        throw new Error(jobData.error || "Enhancement job failed on backend");
      }

      if (jobData.result_id) {
        setProcessingStage(4); // Complete
        const resultRes = await fetch(`/api/results/${jobData.result_id}`);
        if (!resultRes.ok) {
          throw new Error("Failed to fetch generated result package");
        }
        const resultData: ResultPackage = await resultRes.json();
        setResult(resultData);
        setSelectedCandidate("lunara");
        setHasRunOnce(true);
      }
    } catch (err: any) {
      console.error("Enhancement failed:", err);
      setProcessingError(err.message || "LUNARA could not process this observation.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedSceneId, customImageBase64, selectedModel, scaleFactor]);

  // Auto-run if scene was provided via URL
  useEffect(() => {
    if (initialScene && selectedSceneId && !hasRunOnce && !isProcessing) {
      handleRunAnalysis();
    }
  }, [initialScene, selectedSceneId, hasRunOnce, isProcessing, handleRunAnalysis]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCustomImageBase64(b64);
      setCustomFileName(file.name);
      setCustomFileSize(`${(file.size / 1024).toFixed(1)} KB`);
      
      const img = new Image();
      img.onload = () => {
        setCustomImageDims([img.width, img.height]);
      };
      img.src = b64;

      setSelectedSceneId("");
      setResult(null);
      setHasRunOnce(false);
      setProcessingError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleClearUpload = () => {
    setCustomImageBase64(null);
    setCustomFileName("");
    setCustomFileSize("");
    setCustomImageDims(null);
    setResult(null);
    setHasRunOnce(false);
    setProcessingError(null);
  };

  // Slider handlers
  const handleSliderMove = (clientX: number) => {
    if (!sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(percent);
  };

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

  const selectedScene = datasets.find((d) => d.scene_id === selectedSceneId);
  const hasInput = !!selectedSceneId || !!customImageBase64;

  // Resolve image candidate URLs safely
  const originalImageUrl = result?.urls?.lr_original || (selectedScene ? `/${selectedScene.files.lr_image}` : customImageBase64 || "");
  const bicubicImageUrl = result?.urls?.bicubic || "";
  const aiBaselineImageUrl = result?.urls?.ai_baseline || "";
  const lunaraImageUrl = result?.urls?.enhanced || result?.urls?.lunara || "";

  const candidateUrlMap: Record<CandidateKey, string> = {
    original_lr: originalImageUrl,
    bicubic: bicubicImageUrl,
    ai_baseline: aiBaselineImageUrl,
    lunara: lunaraImageUrl,
  };

  const currentCandidateUrl = candidateUrlMap[selectedCandidate] || lunaraImageUrl;

  const candidateMeta = {
    original_lr: {
      name: "Original Low-Res Observation",
      badge: "Input",
      badgeColor: "text-slate-400 bg-surface-200 border-white/[0.06]",
      desc: "Original unprocessed spacecraft sensor acquisition.",
      resolution: selectedScene ? `${selectedScene.resolution_lr}m / px` : (result?.provenance?.input_resolution_m ? `${result.provenance.input_resolution_m}m / px` : "UNAVAILABLE"),
      dimensions: result?.provenance?.input_dimensions ? `${result.provenance.input_dimensions[0]} × ${result.provenance.input_dimensions[1]}` : (customImageDims ? `${customImageDims[0]} × ${customImageDims[1]}` : "UNAVAILABLE"),
      model: "Spacecraft Optical Imager",
    },
    bicubic: {
      name: "Bicubic Spline Interpolation",
      badge: "Mathematical",
      badgeColor: "text-slate-400 bg-surface-200 border-white/[0.06]",
      desc: "Standard 2D polynomial spline resampling baseline.",
      resolution: selectedScene ? `${selectedScene.resolution_hr}m / px` : (result?.provenance?.output_resolution_m ? `${result.provenance.output_resolution_m}m / px` : "UNAVAILABLE"),
      dimensions: result?.provenance?.output_dimensions ? `${result.provenance.output_dimensions[0]} × ${result.provenance.output_dimensions[1]}` : "UNAVAILABLE",
      model: "BicubicSplineKernel (4x)",
    },
    ai_baseline: {
      name: "AI Super-Resolution Baseline",
      badge: "Deep Learning",
      badgeColor: "text-accent-violet bg-accent-violet/10 border-accent-violet/20",
      desc: "Generic deep residual convolutional network upscaler.",
      resolution: selectedScene ? `${selectedScene.resolution_hr}m / px` : (result?.provenance?.output_resolution_m ? `${result.provenance.output_resolution_m}m / px` : "UNAVAILABLE"),
      dimensions: result?.provenance?.output_dimensions ? `${result.provenance.output_dimensions[0]} × ${result.provenance.output_dimensions[1]}` : "UNAVAILABLE",
      model: "AIBaselineResidualNet",
    },
    lunara: {
      name: "LUNARA Physics-Guided SR",
      badge: "Evidence-Aware",
      badgeColor: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
      desc: "Physics-constrained super-resolution with uncertainty quantification.",
      resolution: selectedScene ? `${selectedScene.resolution_hr}m / px` : (result?.provenance?.output_resolution_m ? `${result.provenance.output_resolution_m}m / px` : "UNAVAILABLE"),
      dimensions: result?.provenance?.output_dimensions ? `${result.provenance.output_dimensions[0]} × ${result.provenance.output_dimensions[1]}` : "UNAVAILABLE",
      model: result?.provenance?.model_applied || "LunaraSuperResolutionNet",
    },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-2 border-b border-white/[0.04]">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ScanSearch className="w-5 h-5 text-accent-blue" />
          Enhancement Lab
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Ingest planetary imagery, generate multiple reconstruction candidates, and inspect them side-by-side.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Ingestion & Control */}
        <div className="lg:col-span-4 space-y-4">
          {/* Upload Zone */}
          <div className="rounded-xl p-4 bg-surface-300/80 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 tracking-wide">
                OBSERVATION INGESTION
              </label>
              {customImageBase64 && (
                <button
                  onClick={handleClearUpload}
                  className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center gap-3 py-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer ${
                isDragOver
                  ? "border-accent-blue/50 bg-accent-blue/[0.04]"
                  : customImageBase64
                  ? "border-trust-high/30 bg-trust-high/[0.03]"
                  : "border-white/10 hover:border-white/20 bg-surface-400/40"
              }`}
            >
              <label className="flex flex-col items-center gap-2 cursor-pointer w-full px-4 text-center">
                {customImageBase64 ? (
                  <>
                    <ImagePlus className="w-6 h-6 text-trust-high" />
                    <span className="text-xs text-trust-high font-medium truncate max-w-full">{customFileName}</span>
                    <span className="text-[10px] text-slate-500">{customFileSize} &middot; Click to change</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-500" />
                    <span className="text-xs text-slate-400">Drag & drop or browse file</span>
                    <span className="text-[10px] text-slate-600">PNG, TIFF, JPEG</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={handleInputChange} className="hidden" />
              </label>
            </div>

            {/* Reference Dataset Selector */}
            <div className="relative">
              <span className="text-[10px] text-slate-600 font-mono mb-1 block">OR CHOOSE BENCHMARK SCENE</span>
              <select
                value={selectedSceneId}
                onChange={(e) => {
                  setCustomImageBase64(null);
                  setCustomFileName("");
                  setCustomFileSize("");
                  setCustomImageDims(null);
                  setSelectedSceneId(e.target.value);
                  setResult(null);
                  setHasRunOnce(false);
                  setProcessingError(null);
                }}
                className="w-full bg-surface-400 border border-white/[0.06] rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-accent-blue/50 appearance-none pr-8"
              >
                <option value="">-- Choose project reference dataset --</option>
                {datasets.map((d) => (
                  <option key={d.scene_id} value={d.scene_id}>
                    {d.name} ({d.mission})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-[calc(50%+4px)] pointer-events-none" />
            </div>
          </div>

          {/* Pre-Flight Ingestion Summary */}
          {hasInput && (
            <div className="rounded-xl p-4 bg-surface-300/60 border border-white/[0.04] space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                <span className="text-slate-400 font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-accent-blue" /> PRE-FLIGHT INGESTION
                </span>
                <span className="px-1.5 py-0.5 rounded bg-surface-200 text-slate-400 text-[10px]">
                  {customImageBase64 ? "USER UPLOAD" : "PDS4 CALIBRATED"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                <span className="text-slate-500">Source</span>
                <span className="text-slate-300 truncate">{selectedScene ? selectedScene.mission : "Custom Observation"}</span>
                <span className="text-slate-500">Sensor</span>
                <span className="text-slate-300">{selectedScene ? selectedScene.instrument : "Optical"}</span>
                <span className="text-slate-500">Input Res</span>
                <span className="text-slate-300">{selectedScene ? `${selectedScene.resolution_lr}m / px` : "5.0m / px (Est)"}</span>
                <span className="text-slate-500">DEM Status</span>
                <span className="text-trust-high">{selectedScene?.files?.dem ? "LOLA DEM Attached" : "Optical Proxy"}</span>
                {customImageDims && (
                  <>
                    <span className="text-slate-500">Dimensions</span>
                    <span className="text-slate-300">{customImageDims[0]} × {customImageDims[1]}</span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Enhancement Execution Sequence */}
          {isProcessing ? (
            <div className="rounded-xl p-4 bg-surface-300/90 border border-accent-blue/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-accent-blue font-semibold">
                <span className="flex items-center gap-2">
                  <Activity className="w-4 h-4 animate-spin" /> EXECUTING PIPELINE
                </span>
              </div>

              <div className="space-y-2 pt-1">
                {[
                  { stage: 1, label: "Ingestion & Radiometric Preprocessing" },
                  { stage: 2, label: "Multi-Candidate Super-Resolution Generation" },
                  { stage: 3, label: "Physics Consistency & Uncertainty Quantification" },
                  { stage: 4, label: "Provenance & Feature Package Assembly" },
                ].map((st) => (
                  <div key={st.stage} className="flex items-center gap-2 text-[11px]">
                    {processingStage > st.stage ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-trust-high shrink-0" />
                    ) : processingStage === st.stage ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-accent-blue border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full bg-surface-400 border border-white/10 shrink-0" />
                    )}
                    <span className={processingStage === st.stage ? "text-white font-medium" : processingStage > st.stage ? "text-slate-400" : "text-slate-600"}>
                      {st.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={handleRunAnalysis}
              disabled={!hasInput}
              className="w-full py-3 rounded-lg bg-accent-blue hover:bg-accent-blue/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent-blue/15"
            >
              <ScanSearch className="w-4 h-4" />
              <span>RUN LUNARA ANALYSIS</span>
            </button>
          )}

          {/* Error Alert */}
          {processingError && (
            <div className="rounded-xl p-4 bg-trust-low/[0.08] border border-trust-low/30 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-trust-low font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>ANALYSIS FAILED</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                {processingError}
              </p>
              <button
                onClick={handleRunAnalysis}
                className="mt-1 px-3 py-1.5 rounded bg-surface-200 border border-white/10 text-slate-200 hover:text-white text-xs font-mono flex items-center gap-1.5"
              >
                <RefreshCw className="w-3 h-3" /> Try Again
              </button>
            </div>
          )}
        </div>

        {/* Right Panel: Candidate Lab & Interactive Viewer */}
        <div className="lg:col-span-8 space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Candidate Selector Tabs */}
              <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-300/90 border border-white/[0.06] overflow-x-auto text-xs font-mono">
                <div className="flex items-center gap-1">
                  {[
                    { key: "original_lr", label: "1. ORIGINAL LR" },
                    { key: "bicubic", label: "2. BICUBIC" },
                    { key: "ai_baseline", label: "3. AI BASELINE" },
                    { key: "lunara", label: "4. LUNARA RESULT" },
                  ].map((cand) => (
                    <button
                      key={cand.key}
                      onClick={() => setSelectedCandidate(cand.key as CandidateKey)}
                      className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                        selectedCandidate === cand.key
                          ? "bg-accent-blue/15 text-accent-blue border border-accent-blue/30 font-bold shadow-sm"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {cand.label}
                    </button>
                  ))}
                </div>

                {/* View Mode Controls */}
                <div className="flex items-center gap-1 pl-2 border-l border-white/[0.06]">
                  <button
                    onClick={() => setViewMode("slider")}
                    title="Interactive Slider Mode"
                    className={`p-1.5 rounded ${viewMode === "slider" ? "bg-surface-100 text-accent-blue" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("split")}
                    title="Side-by-Side Mode"
                    className={`p-1.5 rounded ${viewMode === "split" ? "bg-surface-100 text-accent-blue" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("single")}
                    title="Single Candidate View"
                    className={`p-1.5 rounded ${viewMode === "single" ? "bg-surface-100 text-accent-blue" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    title="Toggle Fullscreen"
                    className="p-1.5 rounded text-slate-500 hover:text-slate-300"
                  >
                    {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Main Image Viewport */}
              <div
                ref={viewerContainerRef}
                className="rounded-2xl overflow-hidden border border-white/[0.06] bg-surface-300 p-2 shadow-2xl relative"
              >
                {/* 1. Comparison Slider View */}
                {viewMode === "slider" && (
                  <div
                    ref={sliderRef}
                    onMouseMove={(e) => { if (isDragging) handleSliderMove(e.clientX); }}
                    onMouseUp={() => setIsDragging(false)}
                    onMouseLeave={() => setIsDragging(false)}
                    className="relative w-full aspect-square max-h-[560px] select-none overflow-hidden rounded-xl bg-black cursor-col-resize"
                  >
                    {/* Selected Candidate Layer (Right / Bottom) */}
                    <img
                      src={currentCandidateUrl}
                      alt={candidateMeta[selectedCandidate].name}
                      className="absolute inset-0 w-full h-full object-contain"
                      style={{ transform: `scale(${zoomLevel})`, transition: "transform 0.15s ease-out" }}
                    />

                    {/* Original Low-Res Layer (Left / Top Clipped) */}
                    <div
                      className="absolute inset-y-0 left-0 overflow-hidden"
                      style={{ width: `${sliderPos}%` }}
                    >
                      <img
                        src={originalImageUrl}
                        alt="Original Low-Res Observation"
                        style={{
                          width: sliderRef.current?.clientWidth || "100%",
                          maxWidth: "none",
                          height: "100%",
                          objectFit: "contain",
                          imageRendering: "pixelated",
                          transform: `scale(${zoomLevel})`,
                          transition: "transform 0.15s ease-out"
                        }}
                      />
                    </div>

                    {/* Slider Line & Drag Handle */}
                    <div
                      className="absolute inset-y-0 w-px bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                      style={{ left: `${sliderPos}%` }}
                    >
                      <div
                        onMouseDown={() => setIsDragging(true)}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-surface-200 border border-white/20 flex items-center justify-center text-white/70 shadow-xl pointer-events-auto cursor-col-resize"
                      >
                        <Sliders className="w-3.5 h-3.5 rotate-90" />
                      </div>
                    </div>

                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-surface-400/90 backdrop-blur-md text-[10px] font-mono text-slate-400 border border-white/[0.04]">
                      ORIGINAL LR ({candidateMeta.original_lr.resolution})
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-surface-400/90 backdrop-blur-md text-[10px] font-mono text-accent-blue border border-accent-blue/20">
                      {candidateMeta[selectedCandidate].badge.toUpperCase()}: {candidateMeta[selectedCandidate].name}
                    </div>
                  </div>
                )}

                {/* 2. Side-by-Side Dual View */}
                {viewMode === "split" && (
                  <div className="grid grid-cols-2 gap-2 w-full aspect-square max-h-[560px] select-none rounded-xl overflow-hidden bg-black p-2">
                    {/* Left: Original LR */}
                    <div className="relative rounded-lg overflow-hidden border border-white/5 bg-surface-400 flex flex-col">
                      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-surface-400/90 text-[10px] font-mono text-slate-400 border border-white/5">
                        ORIGINAL LR
                      </div>
                      <img
                        src={originalImageUrl}
                        alt="Original LR"
                        className="w-full h-full object-contain"
                        style={{ imageRendering: "pixelated", transform: `scale(${zoomLevel})` }}
                      />
                    </div>

                    {/* Right: Selected Candidate */}
                    <div className="relative rounded-lg overflow-hidden border border-accent-blue/20 bg-surface-400 flex flex-col">
                      <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded bg-surface-400/90 text-[10px] font-mono text-accent-blue border border-accent-blue/20">
                        {candidateMeta[selectedCandidate].name}
                      </div>
                      <img
                        src={currentCandidateUrl}
                        alt={candidateMeta[selectedCandidate].name}
                        className="w-full h-full object-contain"
                        style={{ transform: `scale(${zoomLevel})` }}
                      />
                    </div>
                  </div>
                )}

                {/* 3. Single Fullscreen-Ready View */}
                {viewMode === "single" && (
                  <div className="relative w-full aspect-square max-h-[560px] select-none overflow-hidden rounded-xl bg-black flex items-center justify-center">
                    <img
                      src={currentCandidateUrl}
                      alt={candidateMeta[selectedCandidate].name}
                      className="w-full h-full object-contain"
                      style={{
                        transform: `scale(${zoomLevel})`,
                        imageRendering: selectedCandidate === "original_lr" ? "pixelated" : "auto"
                      }}
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-surface-400/90 backdrop-blur-md text-[10px] font-mono text-accent-blue border border-accent-blue/20">
                      {candidateMeta[selectedCandidate].name}
                    </div>
                  </div>
                )}

                {/* Zoom Bar */}
                <div className="flex items-center justify-between pt-2 px-1 text-xs font-mono text-slate-500">
                  <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
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
                      title="Reset Zoom"
                    >
                      100%
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

              {/* Selected Candidate Metadata & Provenance Strip */}
              <div className="rounded-xl p-4 bg-surface-300/80 border border-white/[0.04] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-sans">{candidateMeta[selectedCandidate].name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${candidateMeta[selectedCandidate].badgeColor}`}>
                      {candidateMeta[selectedCandidate].badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">RESULT ID: {result.result_id}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] block">ARCHITECTURE</span>
                    <span className="text-slate-300">{candidateMeta[selectedCandidate].model}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">RESOLUTION</span>
                    <span className="text-accent-blue">{candidateMeta[selectedCandidate].resolution}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">DEM SOURCE</span>
                    <span className="text-slate-300">{result.provenance.dem_source || "UNAVAILABLE"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block">LATENCY</span>
                    <span className="text-slate-300">{result.provenance.processing_latency_ms ? `${result.provenance.processing_latency_ms} ms` : "UNAVAILABLE"}</span>
                  </div>
                </div>

                {/* Available Baseline Metrics (real values from backend) */}
                {result.metrics && Object.keys(result.metrics).length > 0 && (
                  <div className="pt-2 border-t border-white/[0.04] grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 text-[10px] block">PSNR</span>
                      <span className="text-trust-high font-bold">{result.metrics.psnr_db !== undefined ? `${result.metrics.psnr_db} dB` : "UNAVAILABLE"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">SSIM</span>
                      <span className="text-trust-high font-bold">{result.metrics.ssim !== undefined ? result.metrics.ssim : "UNAVAILABLE"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">EDGE PRESERVATION</span>
                      <span className="text-accent-blue font-bold">{result.metrics.edge_preservation_index !== undefined ? `${(result.metrics.edge_preservation_index * 100).toFixed(1)}%` : "UNAVAILABLE"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">PHYSICS STATUS</span>
                      <span className="text-slate-300 font-bold">{result.metrics.physics_consistency_status || "COMPUTED"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom CTA to Scientific Trust Workflow */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href={`/compare?scene=${selectedSceneId}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/[0.06] text-xs font-mono text-slate-300 hover:text-white transition-colors"
                >
                  <Layers className="w-3.5 h-3.5 text-accent-violet" />
                  <span>VIEW FULL 4-WAY BENCHMARK MATRIX</span>
                </Link>

                <Link
                  href={`/analysis?result_id=${result.result_id}`}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold text-xs font-mono transition-all shadow-md shadow-accent-blue/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>CONTINUE TO SCIENTIFIC TRUST &rarr;</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-surface-300/30 py-24 px-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-200 border border-white/[0.06] flex items-center justify-center">
                <ScanSearch className="w-7 h-7 text-slate-600" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-semibold text-slate-400">
                  {hasInput ? "Observation Ingested & Ready" : "No Observation Selected"}
                </h3>
                <p className="text-xs text-slate-600 max-w-sm">
                  {hasInput
                    ? 'Click "RUN LUNARA ANALYSIS" to execute super-resolution and generate all enhancement candidates.'
                    : "Upload a planetary image or choose a reference benchmark scene to begin."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-600 text-xs">Loading Enhancement Lab...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}
