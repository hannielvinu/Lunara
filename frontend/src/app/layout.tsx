import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "LUNARA | Trustworthy Super-Resolution for Planetary Imaging",
  description:
    "Enhance low-resolution spacecraft imagery, evaluate reconstruction uncertainty, and identify the most scientifically supported result.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <Header />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
          {children}
        </main>
        <footer className="border-t border-white/[0.04] bg-surface-400 py-4 px-4 text-center text-xs text-slate-600">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <span>
              LUNARA &copy; 2026 &mdash; Data: ISRO ISSDC / Chandrayaan-2, NASA PDS
            </span>
            <span className="text-slate-500 font-mono text-[10px]">
              Evidence-Aware Planetary Image Analysis
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
