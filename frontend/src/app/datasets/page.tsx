"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Database, 
  FileCode2, 
  ExternalLink, 
  Search, 
  MapPin, 
  Sun, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight,
  Radio,
  FileText
} from "lucide-react";
import { DatasetItem } from "@/types";

export default function DatasetsArchivePage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);
  const [pds4XmlContent, setPds4XmlContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isXmlModalOpen, setIsXmlModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/datasets")
      .then((res) => res.json())
      .then((data: DatasetItem[]) => {
        setDatasets(data);
        if (data.length > 0) {
          setSelectedDataset(data[0]);
        }
      });
  }, []);

  const handleOpenXml = async (sceneId: string) => {
    try {
      const res = await fetch(`/api/datasets/${sceneId}`);
      const data = await res.json();
      setPds4XmlContent(data.pds4_xml_content || "<!-- PDS4 XML label data not found -->");
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Database className="w-6 h-6 text-cyan-400" />
            Planetary Dataset Archive & PDS4 Ingestion Catalog
          </h1>
          <p className="text-xs text-slate-400">
            Official ISRO Chandrayaan-2 (TMC-2, OHRC) and NASA LRO (LROC, LOLA) observational products.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search mission, instrument, crater..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-300 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDatasets.map((ds) => (
          <div
            key={ds.scene_id}
            className="rounded-xl p-5 bg-surface-300/90 border border-white/10 space-y-4 hover:border-cyan-500/30 transition-all font-mono text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>{ds.mission} &bull; {ds.instrument}</span>
                </div>
                <h3 className="text-base font-bold text-white font-sans mt-0.5">{ds.name}</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-surface-200 border border-white/10 text-[10px] text-slate-300">
                PDS4 RECORD
              </span>
            </div>

            {/* Coordinates & Geometry Grid */}
            <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-surface-400 border border-white/5 text-[11px]">
              <div>
                <span className="text-slate-500">COORDINATES:</span>{" "}
                <span className="text-slate-200">
                  {ds.latitude > 0 ? `+${ds.latitude}°` : `${ds.latitude}°`}, {ds.longitude}°
                </span>
              </div>
              <div>
                <span className="text-slate-500">RESOLUTION:</span>{" "}
                <span className="text-cyan-300">{ds.resolution_lr}m &rarr; {ds.resolution_hr}m</span>
              </div>
              <div>
                <span className="text-slate-500">SUN INCIDENCE:</span>{" "}
                <span className="text-slate-200">{ds.solar_geometry.incidence}°</span>
              </div>
              <div>
                <span className="text-slate-500">SUN AZIMUTH:</span>{" "}
                <span className="text-slate-200">{ds.solar_geometry.sun_azimuth}°</span>
              </div>
            </div>

            {/* Source & Provenance */}
            <div className="text-[11px] text-slate-400 space-y-1 font-sans">
              <div><strong className="font-mono text-slate-500">PDS LID:</strong> urn:isro:chandrayaan2:{ds.instrument.toLowerCase()}:{ds.scene_id}</div>
              <div><strong className="font-mono text-slate-500">License:</strong> {ds.license}</div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => handleOpenXml(ds.scene_id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-200 hover:bg-surface-100 border border-white/10 text-cyan-300 text-xs transition-colors"
              >
                <FileCode2 className="w-3.5 h-3.5" />
                <span>View PDS4 XML Label</span>
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={ds.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors"
                >
                  <span>PRADAN Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <Link
                  href={`/enhance?scene=${ds.scene_id}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Enhance</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PDS4 XML Modal */}
      {isXmlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl bg-surface-300 border border-cyan-500/30 flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-surface-400 font-mono text-xs">
              <span className="font-bold text-cyan-300 flex items-center gap-2">
                <FileCode2 className="w-4 h-4" /> PDS4 OBSERVATIONAL XML SCHEMA LABEL
              </span>
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className="px-2.5 py-1 rounded bg-surface-200 text-slate-400 hover:text-white border border-white/10"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#05080f] font-mono text-xs text-cyan-200/90 whitespace-pre-wrap select-all">
              {pds4XmlContent}
            </div>

            <div className="p-3 bg-surface-400 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>Standard: NASA/ISRO PDS4 Information Model v1.14.0.0</span>
              <button
                onClick={() => navigator.clipboard.writeText(pds4XmlContent)}
                className="text-cyan-400 hover:underline"
              >
                Copy XML to Clipboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
