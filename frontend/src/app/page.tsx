"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Upload,
  Layers,
  SplitSquareVertical,
  ShieldCheck,
  BarChart3,
  FileCheck2,
  Hexagon,
} from "lucide-react";

export default function HomePage() {
  const [systemOnline, setSystemOnline] = useState(false);

  useEffect(() => {
    fetch("/api/system/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "OPERATIONAL") setSystemOnline(true);
      })
      .catch(() => {});
  }, []);

  const workflowSteps = [
    {
      step: "01",
      title: "Upload",
      desc: "Ingest a low-resolution planetary observation or select a reference dataset.",
      icon: Upload,
    },
    {
      step: "02",
      title: "Enhance",
      desc: "Apply physics-guided super-resolution with multiple candidate models.",
      icon: Layers,
    },
    {
      step: "03",
      title: "Compare",
      desc: "Evaluate candidates side-by-side: Bicubic, AI Baseline, and LUNARA.",
      icon: SplitSquareVertical,
    },
    {
      step: "04",
      title: "Evaluate Trust",
      desc: "Measure confidence, hallucination risk, shadow consistency, and DEM alignment.",
      icon: ShieldCheck,
    },
    {
      step: "05",
      title: "Measure",
      desc: "Quantify reconstruction fidelity with PSNR, SSIM, edge preservation, and more.",
      icon: BarChart3,
    },
    {
      step: "06",
      title: "Report",
      desc: "Export the result with full scientific provenance and uncertainty documentation.",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero */}
      <section className="relative py-12 md:py-20 flex flex-col items-center text-center">
        {/* Subtle background radial */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-blue/[0.04] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-300 border border-white/[0.06] text-xs text-slate-400 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full ${systemOnline ? "bg-trust-high" : "bg-slate-600"}`} />
            <span>LUNARA v1.0.4 {systemOnline ? "Pipeline Online" : ""}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Trustworthy Super-Resolution for Planetary Imaging
          </h1>

          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-xl mx-auto">
            Enhance low-resolution spacecraft imagery, evaluate reconstruction uncertainty, and identify the most scientifically supported result.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/enhance"
              className="flex items-center gap-2.5 px-6 py-3 rounded-lg bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold text-sm transition-all shadow-lg shadow-accent-blue/20"
            >
              <span>Start Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/enhance?scene=scene_tycho_crater"
              className="flex items-center gap-2 px-5 py-3 rounded-lg bg-surface-200 hover:bg-surface-100 border border-white/[0.06] text-slate-300 text-sm font-medium transition-all"
            >
              <span>Explore Sample</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Evidence-Aware Workflow
          </h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            LUNARA does not blindly enhance pixels. Every reconstruction is scientifically evaluated before recommendation.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {workflowSteps.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-4 rounded-xl bg-surface-300/80 border border-white/[0.04] space-y-3 hover:border-accent-blue/20 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-600 tracking-wider">
                    STEP {item.step}
                  </span>
                  <Icon className="w-4 h-4 text-slate-600 group-hover:text-accent-blue transition-colors" />
                </div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-surface-300/60 border border-white/[0.04] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-trust-high/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-trust-high" />
          </div>
          <h3 className="text-sm font-bold text-white">Confidence Estimation</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Multi-scale Monte Carlo uncertainty quantification generates pixel-level confidence maps. Know exactly where the model is certain and where it is guessing.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-surface-300/60 border border-white/[0.04] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-trust-moderate/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-trust-moderate" />
          </div>
          <h3 className="text-sm font-bold text-white">Hallucination Risk</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Composite risk scoring from cycle-consistency error, photometric shadow alignment, and DEM topographic slope correlation identifies potentially fabricated textures.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-surface-300/60 border border-white/[0.04] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-accent-blue/10 flex items-center justify-center">
            <Hexagon className="w-5 h-5 text-accent-blue" />
          </div>
          <h3 className="text-sm font-bold text-white">Physics Consistency</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Enhanced imagery is cross-verified against solar illumination geometry and digital elevation models to ensure structural fidelity with real planetary terrain.
          </p>
        </div>
      </section>

      {/* Data Sources */}
      <section className="rounded-xl p-6 bg-surface-300/40 border border-white/[0.04]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">Validated on Real Planetary Data</h3>
            <p className="text-xs text-slate-500">
              ISRO Chandrayaan-2 TMC-2/OHRC observations and NASA LRO LOLA digital elevation models.
            </p>
          </div>
          <Link
            href="/datasets"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-200 border border-white/[0.06] text-sm text-slate-300 hover:text-white transition-colors whitespace-nowrap"
          >
            <span>View Datasets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
