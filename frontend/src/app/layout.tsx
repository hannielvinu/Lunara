import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "LUNARA | Evidence-Aware AI for Planetary Image Enhancement",
  description:
    "Scientific mission-control system enhancing low-resolution lunar satellite imagery using AI Super-Resolution with Confidence, Uncertainty, and Hallucination-Risk Estimation.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground min-h-screen flex flex-col telemetry-grid">
        <Header />
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
          {children}
        </main>
        <footer className="border-t border-white/5 bg-surface-400 py-4 px-4 text-center text-xs font-mono text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
            <span>
              LUNARA Planetary Mission Control &copy; 2026. Data: ISRO ISSDC / Chandrayaan-2 & NASA PDS.
            </span>
            <span className="text-cyan-400/80">
              PHYSICS-CONSTRAINED EVIDENCE PIPELINE ACTIVE
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
