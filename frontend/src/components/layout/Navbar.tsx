"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ScanSearch,
  LayoutGrid,
  SplitSquareVertical,
  ShieldCheck,
  Database,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Analyze", href: "/enhance", icon: ScanSearch },
    { name: "Results", href: "/results", icon: LayoutGrid },
    { name: "Compare", href: "/compare", icon: SplitSquareVertical },
    { name: "Scientific Trust", href: "/analysis", icon: ShieldCheck },
    { name: "Datasets", href: "/datasets", icon: Database },
  ];

  return (
    <nav className="border-b border-white/[0.04] bg-surface-400/60 backdrop-blur-sm px-4">
      <div className="max-w-7xl mx-auto flex items-center gap-0.5 overflow-x-auto py-1 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? "bg-accent-blue/10 text-accent-blue border border-accent-blue/20 font-semibold"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accent-blue" : "text-slate-500"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
