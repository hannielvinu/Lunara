"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Gauge, 
  Globe2, 
  Sparkles, 
  Microscope, 
  SplitSquareVertical, 
  Database, 
  BookOpenCheck 
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Mission Control", href: "/", icon: Gauge },
    { name: "Planetary Explorer", href: "/explorer", icon: Globe2 },
    { name: "Super-Resolution Lab", href: "/enhance", icon: Sparkles },
    { name: "Scientific Analysis", href: "/analysis", icon: Microscope },
    { name: "Compare", href: "/compare", icon: SplitSquareVertical },
    { name: "Datasets", href: "/datasets", icon: Database },
    { name: "Research", href: "/research", icon: BookOpenCheck },
  ];

  return (
    <nav className="border-b border-white/5 bg-surface-400/80 backdrop-blur-sm px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.2)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
