"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  SplitSquareVertical,
  ChevronDown,
  Hexagon,
} from "lucide-react";
import { DatasetItem } from "@/types";

function CompareContent() {
  const searchParams = useSearchParams();
  const sceneParam = searchParams.get("scene") || "scene_tycho_crater";

  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string>(sceneParam);
  const [compareData, setCompareData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
      fetch(`/api/compare/${selectedSceneId}`)
        .then((res) => res.json())
        .then((data) => {
          setCompareData(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [selectedSceneId]);

  const selectedScene = datasets.find((d) => d.scene_id === selectedSceneId);

  const modelCards = [
    {
      key: "original_lr",
      label: "Original Observation",
      tag: "Input",
      tagColor: "text-slate-400 bg-surface-200 border-white/[0.06]",
      borderColor: "border-white/[0.06]",
    },
    {
      key: "bicubic",
      label: "Bicubic Interpolation",
      tag: "Mathematical",
      tagColor: "text-slate-400 bg-surface-200 border-white/[0.06]",
      borderColor: "border-white/[0.06]",
    },
    {
      key: "ai_baseline",
      label: "AI Baseline (EDSR)",
      tag: "Deep Learning",
      tagColor: "text-accent-violet bg-accent-violet/10 border-accent-violet/20",
      borderColor: "border-accent-violet/20",
    },
    {
      key: "lunara",
      label: "LUNARA Physics-SR",
      tag: "Evidence-Aware",
      tagColor: "text-accent-blue bg-accent-blue/10 border-accent-blue/20",
      borderColor: "border-accent-blue/30",
    },
  ];

  function renderMetricValue(val: any): string {
    if (val === undefined || val === null || val === "") return "UNAVAILABLE";
    if (typeof val === "number") return val.toFixed(4);
    return String(val);
  }

  function renderPctValue(val: any): string {
    if (val === undefined || val === null) return "UNAVAILABLE";
    return `${val}%`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.04]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <SplitSquareVertical className="w-5 h-5 text-accent-blue" />
            Multi-Model Comparison
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Side-by-side benchmark of all enhancement candidates for the same observation.
          </p>
        </div>
        <div className="relative">
          <select
            value={selectedSceneId}
            onChange={(e) => setSelectedSceneId(e.target.value)}
            className="bg-surface-300 border border-white/[0.06] rounded-lg p-2 pr-8 text-xs text-white focus:outline-none focus:border-accent-blue/50 appearance-none"
          >
            {datasets.map((d) => (
              <option key={d.scene_id} value={d.scene_id}>{d.name}</option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-600 text-xs">
          Running all three models for comparison...
        </div>
      ) : (
        <>
          {/* 4-Way Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {modelCards.map((card) => {
              const model = compareData?.models?.[card.key];
              return (
                <div
                  key={card.key}
                  className={`rounded-xl overflow-hidden border ${card.borderColor} bg-surface-300/60 flex flex-col space-y-2 p-2.5`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-white font-semibold">{card.label}</span>
                    <span className={`px-1.5 py-0.5 rounded border ${card.tagColor}`}>{card.tag}</span>
                  </div>
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-black border border-white/[0.03]">
                    {model?.image_b64 ? (
                      <img
                        src={model.image_b64}
                        alt={card.label}
                        className="w-full h-full object-contain"
                        style={card.key === "original_lr" ? { imageRendering: "pixelated" } : {}}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-600 text-xs">
                        No data
                      </div>
                    )}
                  </div>
                  {/* Compact metrics under each card */}
                  {model?.metrics && card.key !== "original_lr" && (
                    <div className="text-[10px] font-mono text-slate-500 space-y-0.5 px-0.5">
                      {model.metrics.psnr_db !== undefined && (
                        <div>PSNR: <span className="text-slate-300">{model.metrics.psnr_db} dB</span></div>
                      )}
                      {model.metrics.ssim !== undefined && (
                        <div>SSIM: <span className="text-slate-300">{model.metrics.ssim}</span></div>
                      )}
                      {model.trust_metrics?.image_confidence_pct !== undefined && (
                        <div>Confidence: <span className="text-trust-high">{model.trust_metrics.image_confidence_pct}%</span></div>
                      )}
                      {model.trust_metrics?.hallucination_risk_pct !== undefined && (
                        <div>Risk: <span className="text-trust-moderate">{model.trust_metrics.hallucination_risk_pct}%</span></div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quantitative Benchmark Table */}
          <div className="rounded-xl p-5 bg-surface-300/60 border border-white/[0.04] space-y-4">
            <h3 className="text-sm font-bold text-white">Quantitative Benchmark</h3>
            <div className="overflow-x-auto rounded-lg border border-white/[0.03]">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-400 text-slate-500 text-[10px] font-mono border-b border-white/[0.04]">
                  <tr>
                    <th className="py-2 px-3">Model</th>
                    <th className="py-2 px-3">PSNR (dB)</th>
                    <th className="py-2 px-3">SSIM</th>
                    <th className="py-2 px-3">Edge Pres. (EPI)</th>
                    <th className="py-2 px-3">Confidence</th>
                    <th className="py-2 px-3">Hallucination Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03] font-mono">
                  {/* Bicubic */}
                  <tr className="text-slate-400 hover:bg-surface-200/50">
                    <td className="py-2 px-3 text-slate-300 font-medium font-sans">Bicubic Interpolation</td>
                    <td className="py-2 px-3">{renderMetricValue(compareData?.models?.bicubic?.metrics?.psnr_db)}</td>
                    <td className="py-2 px-3">{renderMetricValue(compareData?.models?.bicubic?.metrics?.ssim)}</td>
                    <td className="py-2 px-3">
                      {compareData?.models?.bicubic?.metrics?.edge_preservation_index !== undefined
                        ? `${(compareData.models.bicubic.metrics.edge_preservation_index * 100).toFixed(1)}%`
                        : "UNAVAILABLE"}
                    </td>
                    <td className="py-2 px-3">{renderPctValue(compareData?.models?.bicubic?.trust_metrics?.image_confidence_pct)}</td>
                    <td className="py-2 px-3">{renderPctValue(compareData?.models?.bicubic?.trust_metrics?.hallucination_risk_pct)}</td>
                  </tr>

                  {/* AI Baseline */}
                  <tr className="text-slate-400 hover:bg-surface-200/50">
                    <td className="py-2 px-3 text-accent-violet font-medium font-sans">AI Baseline (EDSR)</td>
                    <td className="py-2 px-3">{renderMetricValue(compareData?.models?.ai_baseline?.metrics?.psnr_db)}</td>
                    <td className="py-2 px-3">{renderMetricValue(compareData?.models?.ai_baseline?.metrics?.ssim)}</td>
                    <td className="py-2 px-3">
                      {compareData?.models?.ai_baseline?.metrics?.edge_preservation_index !== undefined
                        ? `${(compareData.models.ai_baseline.metrics.edge_preservation_index * 100).toFixed(1)}%`
                        : "UNAVAILABLE"}
                    </td>
                    <td className="py-2 px-3">{renderPctValue(compareData?.models?.ai_baseline?.trust_metrics?.image_confidence_pct)}</td>
                    <td className="py-2 px-3">{renderPctValue(compareData?.models?.ai_baseline?.trust_metrics?.hallucination_risk_pct)}</td>
                  </tr>

                  {/* LUNARA */}
                  <tr className="text-white bg-accent-blue/[0.04] border-l-2 border-l-accent-blue font-semibold hover:bg-accent-blue/[0.07]">
                    <td className="py-2 px-3 text-accent-blue font-medium font-sans flex items-center gap-1.5">
                      <Hexagon className="w-3 h-3" />
                      LUNARA Physics-SR
                    </td>
                    <td className="py-2 px-3 text-trust-high">{renderMetricValue(compareData?.models?.lunara?.metrics?.psnr_db)}</td>
                    <td className="py-2 px-3 text-trust-high">{renderMetricValue(compareData?.models?.lunara?.metrics?.ssim)}</td>
                    <td className="py-2 px-3 text-accent-blue">
                      {compareData?.models?.lunara?.metrics?.edge_preservation_index !== undefined
                        ? `${(compareData.models.lunara.metrics.edge_preservation_index * 100).toFixed(1)}%`
                        : "UNAVAILABLE"}
                    </td>
                    <td className="py-2 px-3 text-trust-high">{renderPctValue(compareData?.models?.lunara?.trust_metrics?.image_confidence_pct)}</td>
                    <td className="py-2 px-3 text-trust-high">{renderPctValue(compareData?.models?.lunara?.trust_metrics?.hallucination_risk_pct)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-600 text-xs">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
