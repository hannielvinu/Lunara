"use client";

import React from "react";
import Link from "next/link";
import { 
  BookOpenCheck, 
  ShieldCheck, 
  Layers, 
  Cpu, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  FileText,
  Activity,
  Sparkles
} from "lucide-react";

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpenCheck className="w-6 h-6 text-cyan-400" />
            Research, Methodology & Model Card
          </h1>
          <p className="text-xs text-slate-400">
            Formal technical specifications, physics-guided loss formulations, uncertainty bounds, and scientific provenance.
          </p>
        </div>

        <Link
          href="/compare"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-200 border border-white/10 text-cyan-300 font-mono text-xs hover:bg-surface-100 transition-colors"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>View Benchmark Results</span>
        </Link>
      </div>

      {/* Model Card Section */}
      <div className="rounded-xl p-6 bg-surface-300/90 border border-white/10 space-y-4 font-mono text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <span className="text-cyan-400 font-bold tracking-wider uppercase text-sm flex items-center gap-2">
            <Cpu className="w-4 h-4" /> LUNARA MODEL CARD (v1.0.4-planetary)
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] border border-cyan-500/30">
            PYTORCH 2.13 INFERENCE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs text-slate-300">
          <div className="space-y-2 p-4 rounded-lg bg-surface-400 border border-white/5 font-mono">
            <div className="text-cyan-300 font-bold text-sm">MODEL ARCHITECTURE</div>
            <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
              <li>Spatial & Channel Attention Super-Resolution (SCASR)</li>
              <li>High-frequency Sobel gradient guidance branch</li>
              <li>PixelShuffle 4x progressive sub-pixel upsampling</li>
              <li>Monte Carlo stochastic dropout for generative uncertainty</li>
              <li>Physics-constrained bicubic base residual skip</li>
            </ul>
          </div>

          <div className="space-y-2 p-4 rounded-lg bg-surface-400 border border-white/5 font-mono">
            <div className="text-emerald-400 font-bold text-sm">INTENDED USE & SCOPE</div>
            <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
              <li>Primary: Super-resolution of lunar orbital imaging (5m &rarr; 0.5m)</li>
              <li>Planetary geological feature reconnaissance (crater rims, fault scarps)</li>
              <li>Trust-bounded evidence maps for planetary landing site screening</li>
              <li>Limitation: Prototype model requiring formal cartographic verification</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Mathematical Formulations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Degradation Pipeline */}
        <div className="rounded-xl p-5 bg-surface-300/90 border border-white/10 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm pb-2 border-b border-white/10">
            <Activity className="w-4 h-4" /> 1. PLANETARY SENSOR DEGRADATION MODEL
          </div>
          <p className="font-sans text-slate-300 leading-relaxed text-xs">
            To prevent uncalibrated registration bias between differing orbital tracks, low-resolution observations are modeled via calibrated planetary optical degradation:
          </p>
          <div className="p-3 rounded-lg bg-[#05080f] text-cyan-300 text-[11px] border border-cyan-500/20">
            I_LR = Quantize( Downsample_4x( PSF_optics &otimes; I_HR ) + N_poisson + N_gaussian )
          </div>
          <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-200">PSF_optics:</strong> Airy disk diffraction & camera point-spread function (&sigma;=1.2)</li>
            <li><strong className="text-slate-200">N_poisson:</strong> Photon arrival shot noise</li>
            <li><strong className="text-slate-200">N_gaussian:</strong> CMOS readout electronic thermal noise (&sigma;=0.03)</li>
          </ul>
        </div>

        {/* Hallucination Risk Metric */}
        <div className="rounded-xl p-5 bg-surface-300/90 border border-white/10 space-y-3 font-mono text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm pb-2 border-b border-white/10">
            <ShieldCheck className="w-4 h-4" /> 2. HALLUCINATION RISK QUANTIFICATION
          </div>
          <p className="font-sans text-slate-300 leading-relaxed text-xs">
            Hallucination risk is computed pixel-wise by fusing generative variance, cycle reconstruction error, solar shadow consistency, and DEM slope correlation:
          </p>
          <div className="p-3 rounded-lg bg-[#05080f] text-amber-300 text-[11px] border border-amber-500/20">
            R(x,y) = 0.35&bull;&sigma;_mc + 0.25&bull;E_recon + 0.20&bull;(1 - E_grad) + 0.20&bull;(1 - C_topo)
          </div>
          <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
            <li><strong className="text-slate-200">&sigma;_mc:</strong> Monte Carlo generative uncertainty across stochastic passes</li>
            <li><strong className="text-slate-200">E_recon:</strong> Cycle downsampling reconstruction residual</li>
            <li><strong className="text-slate-200">E_grad:</strong> Photometric gradient alignment with solar azimuth vector</li>
            <li><strong className="text-slate-200">C_topo:</strong> Correlation with LOLA / TMC-2 DEM surface slopes</li>
          </ul>
        </div>
      </div>

      {/* Scientific Honesty Statement */}
      <div className="rounded-xl p-5 bg-surface-300/90 border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm font-mono pb-2 border-b border-white/10">
          <AlertTriangle className="w-4 h-4" /> SCIENTIFIC HONESTY & ETHICAL COMMITMENT
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The LUNARA project strictly adheres to planetary science integrity standards. We explicitly do not claim unverified crater discoveries or official ISRO mission endorsement. All AI-enhanced products, confidence heatmaps, and candidate morphologies are clearly marked with provenance metadata and require independent scientific peer review.
        </p>
      </div>

      {/* References & Data Citations */}
      <div className="rounded-xl p-5 bg-surface-300/90 border border-white/10 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-white font-bold text-sm pb-2 border-b border-white/10">
          <FileText className="w-4 h-4 text-cyan-400" /> OFFICIAL REFERENCES & CITATIONS
        </div>
        <div className="space-y-2 text-[11px] text-slate-400 font-sans">
          <div className="p-2.5 rounded bg-surface-400 border border-white/5">
            <strong className="text-white">ISRO Chandrayaan-2 PRADAN ISSDC Archive:</strong>{" "}
            Indian Space Science Data Centre, Planetary Data System 4 Archive for Terrain Mapping Camera-2 (TMC-2) and Orbiter High Resolution Camera (OHRC).{" "}
            <a href="https://pradan.issdc.gov.in/ch2/" target="_blank" className="text-cyan-400 underline">
              https://pradan.issdc.gov.in/ch2/
            </a>
          </div>
          <div className="p-2.5 rounded bg-surface-400 border border-white/5">
            <strong className="text-white">NASA Lunar Reconnaissance Orbiter (LRO) PDS Node:</strong>{" "}
            LROC Science Operations Center & Planetary Geodesy Data Archive for LOLA Digital Elevation Models.{" "}
            <a href="https://pds.lroc.asu.edu/" target="_blank" className="text-cyan-400 underline">
              https://pds.lroc.asu.edu/
            </a>
          </div>
          <div className="p-2.5 rounded bg-surface-400 border border-white/5">
            <strong className="text-white">NASA/PDS4 Standards Information Model:</strong>{" "}
            Planetary Data System Standards, Jet Propulsion Laboratory / Caltech.{" "}
            <a href="https://pds.nasa.gov/datastandards/documents/current-version.shtml" target="_blank" className="text-cyan-400 underline">
              https://pds.nasa.gov/
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
