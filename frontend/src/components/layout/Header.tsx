"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, Radio, Satellite, ShieldCheck, Sparkles } from "lucide-react";

export default function Header() {
  const [utcTime, setUtcTime] = useState<string>("");
  const [subSolarLat, setSubSolarLat] = useState<string>("+01.42° N");
  const [subSolarLon, setSubSolarLon] = useState<string>("034.18° E");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-cyan-950/40 bg-surface-300/90 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Mission Identifier */}
        <div className="flex items-center gap-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-sm">
              <Satellite className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-widest text-lg text-white group-hover:text-cyan-400 transition-colors">
                  LUNARA
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
                  v1.0.4 PROTOTYPE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 tracking-tight">
                Evidence-Aware AI for Planetary Image Enhancement
              </p>
            </div>
          </Link>
        </div>

        {/* Real-Time Telemetry Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-200 border border-white/5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">ISRO CH-2 / LRO:</span>
            <span className="text-emerald-400 font-semibold">ONLINE</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-200 border border-white/5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">SUB-SOLAR:</span>
            <span className="text-cyan-300">{subSolarLat}, {subSolarLon}</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-200 border border-white/5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">TRUST ENGINE:</span>
            <span className="text-amber-300 font-semibold">ACTIVE</span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/30 border border-cyan-500/20 text-cyan-300">
            <span>{utcTime || "2026-08-20 06:45:00 UTC"}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
