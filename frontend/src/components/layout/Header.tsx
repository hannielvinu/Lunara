"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Hexagon } from "lucide-react";

export default function Header() {
  const [utcTime, setUtcTime] = useState<string>("");

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
    <header className="border-b border-white/[0.06] bg-surface-400/95 backdrop-blur-md sticky top-0 z-50 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/25 flex items-center justify-center text-accent-blue group-hover:border-accent-blue/50 transition-colors">
            <Hexagon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-[0.2em] text-base text-white group-hover:text-accent-blue transition-colors">
                LUNARA
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-200 border border-white/[0.06] text-slate-400 font-mono">
                v1.0.4
              </span>
            </div>
            <p className="text-[10px] text-slate-500 tracking-wide">
              Planetary Image Analysis
            </p>
          </div>
        </Link>

        {/* Minimal status */}
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-300 border border-white/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-trust-high animate-pulse" />
            <span className="text-slate-400">Pipeline Active</span>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-300 border border-white/[0.04] text-slate-400">
            <span>{utcTime || "Loading..."}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
