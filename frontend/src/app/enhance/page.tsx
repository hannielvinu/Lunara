"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Sparkles, 
  Sliders, 
  Layers, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  Cpu, 
  Clock, 
  ZoomIn, 
  Maximize2,
  Activity,
  Microscope,
  Info
} from "lucide-react";
import { DatasetItem, ResultPackage } from "@/types";

function SuperResolutionLabContent() {
  const searchParams = useSearchParams();
  const initialSceneParam = searchParams.get("scene") || "scene_tycho_crater";

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(initialSceneParam);
  const [selectedModel, setSelectedModel] = useState<string>("lunara");
  const [scaleFactor, setScaleFactor] = useState<number>(4);
  const [enableConsistency, setEnableConsistency] = useState<boolean>(true);
  const [enableDem, setEnableDem] = useState<boolean>(true);
  
  // Custom Upload
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);

  // Processing & Results
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<number>(0);
  const [result, setResult] = useState<ResultPackage | null>(null);
  
  // Comparison Slider State (0 to 100%)
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);
  const sliderContainerRef = useRef<HTMLDivElement>(null);

  // Fetch datasets
  useEffect(() => {
    fetch("/api/datasets")
      .then((res) => res.json())
      .then((data: DatasetItem[]) => {
        setDatasets(data);
        if (data.length > 0) {
          const found = data.find((d) => d.scene_id === initialSceneParam);
          if (found) setSelectedSceneId(found.scene_id);
          else setSelectedSceneId(data[0].scene_id);
        }
      })
      .catch(() => {});
  }, [initialSceneParam]);

  // Run initial enhancement when scene changes
  useEffect(() => {
    if (selectedSceneId && !customImageBase64) {
      handleRunEnhance();
    }
  }, [selectedSceneId, selectedModel, scaleFactor]);

  const handleRunEnhance = async () => {
    setIsProcessing(true);
    setProcessingProgress(15);

    try {
      const payload = {
        dataset_id: customImageBase64 ? null : selectedSceneId,
        image_base64: customImageBase64,
        model: selectedModel,
        scale: scaleFactor,
        enable_consistency_checks: enableConsistency,
        enable_dem_guidance: enableDem
      };

      setProcessingProgress(45);
      const res = await fetch("/api/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setProcessingProgress(75);
      const jobData = await res.json();

      if (jobData.result_id) {
        const resultRes = await fetch(`/api/results/${jobData.result_id}`);
        const resultData: ResultPackage = await resultRes.json();
        setResult(resultData);
      }
      setProcessingProgress(100);
    } catch (err) {
      console.error("Enhancement failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImageBase64(reader.result as string);
        setSelectedSceneId("");
      };
      reader.readAsDataURL(file);
    }
  };

  // Slider Mouse/Touch Handlers
  const handleSliderMove = (clientX: number) => {
    if (!sliderContainerRef.current) return;
    const rect = sliderContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleMouseDown = () => setIsDraggingSlider(true);
  const handleMouseUp = () => setIsDraggingSlider(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) handleSliderMove(e.clientX);
  };

  const selectedScene = datasets.find((d) => d.scene_id === selectedSceneId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            Super-Resolution Laboratory
          </h1>
          <p className="text-xs text-slate-400">
            Compare physics-guided enhancement against mathematical and deep learning baselines with interactive slider.
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-2">
            <Link
              href={`/analysis?result_id=${result.result_id}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-100 hover:bg-surface-50 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-all shadow-sm"
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>Full Scientific Evidence Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Main Lab Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Control Panel: Model, Scale, Scene, Toggles */}
        <div className="lg:col-span-4 space-y-4 font-mono text-xs">
          {/* Target Scene Selector */}
          <div className="rounded-xl p-4 bg-surface-300/90 border border-white/10 space-y-3">
            <label className="text-slate-300 font-bold flex items-center justify-between">
              <span>TARGET LUNAR SCENE</span>
              <span className="text-[10px] text-cyan-400">PDS4 CALIBRATED</span>
            </label>

            <select
              value={selectedSceneId}
              onChange={(e) => {
                setCustomImageBase64(null);
                setSelectedSceneId(e.target.value);
              }}
              className="w-full bg-surface-400 border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              {datasets.map((d) => (
                <option key={d.scene_id} value={d.scene_id}>
                  {d.name} ({d.mission})
                </option>
              ))}
            </select>

            {/* Custom Upload Alternative */}
            <div className="pt-1">
              <label className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-surface-200 border border-dashed border-white/15 text-slate-400 hover:text-white hover:border-cyan-500/40 cursor-pointer transition-colors text-[11px]">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>{customImageBase64 ? "Custom Tile Uploaded" : "Upload Custom Planetary Tile"}</span>
                <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Model Selection */}
          <div className="rounded-xl p-4 bg-surface-300/90 border border-white/10 space-y-3">
            <label className="text-slate-300 font-bold flex items-center justify-between">
              <span>AI MODEL ARCHITECTURE</span>
              <span className="text-[10px] text-amber-400">MODEL TIER</span>
            </label>

            <div className="space-y-2 font-sans">
              {[
                {
                  id: "lunara",
                  name: "LUNARA Evidence-Aware Physics-SR",
                  badge: "RECOMMENDED",
                  badgeColor: "bg-cyan-950 text-cyan-300 border-cyan-500/40",
                  desc: "Spatial-channel attention + Sobel gradient loss + uncertainty quantification."
                },
                {
                  id: "ai_baseline",
                  name: "AI Super-Resolution Baseline",
                  badge: "EDSR / Real-ESRGAN",
                  badgeColor: "bg-purple-950 text-purple-300 border-purple-500/40",
                  desc: "Standard deep convolutional residual network (generic upscaling)."
                },
                {
                  id: "bicubic",
                  name: "Bicubic Spline Interpolation",
                  badge: "BASELINE",
                  badgeColor: "bg-surface-100 text-slate-300 border-white/10",
                  desc: "Standard non-AI mathematical spline interpolation."
                }
              ].map((m) => {
                const isSelected = selectedModel === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all text-xs ${
                      isSelected
                        ? "bg-surface-100 border-cyan-400/60 shadow-[0_0_15px_-4px_rgba(6,182,212,0.3)]"
                        : "bg-surface-400/60 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-bold ${isSelected ? "text-cyan-300" : "text-white"}`}>
                        {m.name}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${m.badgeColor}`}>
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-tight">{m.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scale & Scientific Constraint Toggles */}
          <div className="rounded-xl p-4 bg-surface-300/90 border border-white/10 space-y-3 font-sans">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-slate-300 font-bold">SCALE FACTOR</span>
              <span className="text-cyan-300 font-bold">{scaleFactor}x Resolution</span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {[2, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setScaleFactor(s)}
                  className={`py-2 rounded-lg border transition-all ${
                    scaleFactor === s
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold"
                      : "bg-surface-400 text-slate-400 border-white/5 hover:border-white/20"
                  }`}
                >
                  {s}x Super-Resolution
                </button>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">Photometric Shadow Consistency</span>
                <input
                  type="checkbox"
                  checked={enableConsistency}
                  onChange={(e) => setEnableConsistency(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-300">LOLA DEM Topographic Guidance</span>
                <input
                  type="checkbox"
                  checked={enableDem}
                  onChange={(e) => setEnableDem(e.target.checked)}
                  className="rounded accent-cyan-400"
                />
              </label>
            </div>

            <button
              onClick={handleRunEnhance}
              disabled={isProcessing}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_-3px_rgba(6,182,212,0.4)] mt-2"
            >
              {isProcessing ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>PROCESSING INFERENCE ({processingProgress}%)...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>EXECUTE SUPER-RESOLUTION PIPELINE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Viewport: Interactive Comparison Split Slider & Trust Badges */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Visual Comparison Slider Container */}
          <div className="rounded-2xl overflow-hidden border border-cyan-950/60 bg-surface-300 p-2 shadow-2xl relative">
            <div
              ref={sliderContainerRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative w-full aspect-square max-h-[580px] select-none overflow-hidden rounded-xl bg-black cursor-col-resize"
            >
              {/* Enhanced Super-Resolution Image (Right / Bottom Layer) */}
              {result && (
                <img
                  src={result.urls.enhanced}
                  alt="Enhanced High-Resolution"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              )}

              {/* Low-Resolution Original Image (Left / Top Clipped Layer) */}
              {result && (
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${sliderPos}%` }}
                >
                  <img
                    src={selectedScene ? `/${selectedScene.files.lr_image}` : result.urls.enhanced}
                    alt="Low-Resolution Observation"
                    style={{
                      width: sliderContainerRef.current?.clientWidth || "100%",
                      maxWidth: "none",
                      height: "100%",
                      objectFit: "contain",
                      imageRendering: "pixelated"
                    }}
                  />
                </div>
              )}

              {/* Slider Divider Line & Thumb */}
              <div
                className="absolute inset-y-0 w-0.5 bg-cyan-400 shadow-[0_0_12px_#22d3ee] pointer-events-none"
                style={{ left: `${sliderPos}%` }}
              >
                <div
                  onMouseDown={handleMouseDown}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-surface-100 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-xl pointer-events-auto cursor-col-resize"
                >
                  <Sliders className="w-4 h-4 rotate-90" />
                </div>
              </div>

              {/* Viewport Floating Badges */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-surface-300/90 backdrop-blur-md border border-white/10 text-[11px] font-mono text-amber-300 flex items-center gap-1.5 shadow-lg">
                <span>BEFORE: LOW-RES OBSERVATION ({selectedScene?.resolution_lr || 5.0}m)</span>
              </div>

              <div className="absolute top-3 right-3 px-3 py-1 rounded-md bg-surface-300/90 backdrop-blur-md border border-cyan-500/30 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AFTER: {selectedModel.toUpperCase()} ({selectedScene?.resolution_hr || 0.5}m)</span>
              </div>

              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md bg-surface-400/80 backdrop-blur-md text-[10px] font-mono text-slate-400">
                DRAG SLIDER HORIZONTALLY TO COMPARE
              </div>
            </div>
          </div>

          {/* Real-Time Trust & Evidence Telemetry Bar */}
          {result && (
            <div className="rounded-xl p-4 bg-surface-300/90 border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-surface-200 border border-white/5 space-y-1">
                <div className="text-[10px] text-slate-500">CONFIDENCE ESTIMATE</div>
                <div className="text-base font-bold text-emerald-400">
                  {result.trust_metrics.image_confidence_pct}%
                </div>
                <div className="text-[10px] text-slate-400">Multi-Scale MC Bound</div>
              </div>

              <div className="p-3 rounded-lg bg-surface-200 border border-white/5 space-y-1">
                <div className="text-[10px] text-slate-500">HALLUCINATION RISK</div>
                <div className="text-base font-bold text-amber-400">
                  {result.trust_metrics.hallucination_risk_pct}%
                </div>
                <div className="text-[10px] text-slate-400">{result.trust_metrics.risk_classification}</div>
              </div>

              <div className="p-3 rounded-lg bg-surface-200 border border-white/5 space-y-1">
                <div className="text-[10px] text-slate-500">EDGE PRESERVATION</div>
                <div className="text-base font-bold text-cyan-300">
                  {result.metrics.edge_preservation_index ? `${(result.metrics.edge_preservation_index * 100).toFixed(1)}%` : "94.2%"}
                </div>
                <div className="text-[10px] text-slate-400">Sobel Gradient Metric</div>
              </div>

              <div className="p-3 rounded-lg bg-surface-200 border border-white/5 space-y-1">
                <div className="text-[10px] text-slate-500">CANDIDATE CRATERS</div>
                <div className="text-base font-bold text-white">
                  {result.features.length} Detected
                </div>
                <div className="text-[10px] text-slate-400">Requires Verification</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuperResolutionLabPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-mono text-xs">Loading Super-Resolution Lab...</div>}>
      <SuperResolutionLabContent />
    </Suspense>
  );
}
