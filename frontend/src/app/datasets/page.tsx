"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Database,
  FileCode2,
  ExternalLink,
  Search,
  ScanSearch,
  ChevronDown,
} from "lucide-react";
import { DatasetItem } from "@/types";

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pds4XmlContent, setPds4XmlContent] = useState<string>("");
  const [isXmlModalOpen, setIsXmlModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/datasets")
      .then((res) => res.json())
      .then((data: DatasetItem[]) => setDatasets(data));
  }, []);

  const handleOpenXml = async (sceneId: string) => {
    try {
      const res = await fetch(`/api/datasets/${sceneId}`);
      const data = await res.json();
      setPds4XmlContent(data.pds4_xml_content || "<!-- PDS4 XML label not available for this scene -->");
      setIsXmlModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDatasets = datasets.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.mission.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.instrument.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.04]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Database className="w-5 h-5 text-accent-blue" />
            Datasets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reference planetary observations from ISRO Chandrayaan-2 and NASA LRO archives.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mission, instrument, region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-300 border border-white/[0.06] rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-accent-blue/50"
          />
        </div>
      </div>

      {/* Dataset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDatasets.map((ds) => (
          <div
            key={ds.scene_id}
            className="rounded-xl p-5 bg-surface-300/60 border border-white/[0.04] space-y-4 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] text-accent-blue font-mono font-semibold tracking-wider">
                  {ds.mission} &middot; {ds.instrument}
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">{ds.name}</h3>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-200 border border-white/[0.04] text-slate-500">
                PDS4
              </span>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] font-mono p-3 rounded-lg bg-surface-400/40 border border-white/[0.03]">
              <span className="text-slate-600">Coordinates</span>
              <span className="text-slate-300">
                {ds.latitude > 0 ? `+${ds.latitude}` : ds.latitude}&deg;, {ds.longitude}&deg;
              </span>
              <span className="text-slate-600">Resolution</span>
              <span className="text-accent-blue">{ds.resolution_lr}m &rarr; {ds.resolution_hr}m</span>
              <span className="text-slate-600">Sun Incidence</span>
              <span className="text-slate-300">{ds.solar_geometry.incidence}&deg;</span>
              <span className="text-slate-600">Sun Azimuth</span>
              <span className="text-slate-300">{ds.solar_geometry.sun_azimuth}&deg;</span>
              <span className="text-slate-600">DEM Source</span>
              <span className="text-slate-300">{ds.provenance.dem_source}</span>
              <span className="text-slate-600">Acquired</span>
              <span className="text-slate-300">{ds.acquisition_time.split("T")[0]}</span>
            </div>

            {/* Provenance */}
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <div><span className="text-slate-600 font-mono">LID:</span> urn:isro:chandrayaan2:{ds.instrument.toLowerCase()}:{ds.scene_id}</div>
              <div><span className="text-slate-600 font-mono">License:</span> {ds.license}</div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.03]">
              <button
                onClick={() => handleOpenXml(ds.scene_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-200 hover:bg-surface-100 border border-white/[0.04] text-accent-blue text-xs transition-colors"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>PDS4 XML</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={ds.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-500 hover:text-white text-xs transition-colors"
                >
                  <span>Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <Link
                  href={`/enhance?scene=${ds.scene_id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent-blue hover:bg-accent-blue/90 text-white font-semibold text-xs transition-colors"
                >
                  <ScanSearch className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PDS4 XML Modal */}
      {isXmlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-xl bg-surface-300 border border-white/[0.06] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-white/[0.04] flex items-center justify-between bg-surface-400 text-xs">
              <span className="font-semibold text-white flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-accent-blue" />
                PDS4 Observational XML Label
              </span>
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className="px-2.5 py-1 rounded bg-surface-200 text-slate-400 hover:text-white border border-white/[0.04]"
              >
                Close
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-surface-400 font-mono text-[11px] text-slate-300 whitespace-pre-wrap select-all">
              {pds4XmlContent}
            </div>
            <div className="p-3 bg-surface-400 border-t border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>NASA/ISRO PDS4 Information Model v1.14.0.0</span>
              <button
                onClick={() => navigator.clipboard.writeText(pds4XmlContent)}
                className="text-accent-blue hover:underline"
              >
                Copy XML
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
