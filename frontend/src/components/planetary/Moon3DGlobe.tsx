"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Compass, Eye, Maximize2, RotateCcw } from "lucide-react";

interface Marker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  mission: string;
  description: string;
}

const BENCHMARK_MARKERS: Marker[] = [
  {
    id: "scene_tycho_crater",
    name: "Tycho Crater Rim & Peak",
    lat: -43.31,
    lon: -11.36,
    mission: "Chandrayaan-2 OHRC / TMC-2",
    description: "Prominent 86km impact crater with central peak and bright ray system."
  },
  {
    id: "scene_rupes_recta",
    name: "Rupes Recta (Straight Wall)",
    lat: -22.10,
    lon: -7.80,
    mission: "Chandrayaan-2 TMC-2",
    description: "110km long linear fault scarp rising 240m above Mare Nubium."
  },
  {
    id: "scene_south_pole_shackleton",
    name: "South Pole - Shackleton Rim",
    lat: -89.90,
    lon: 0.00,
    mission: "Chandrayaan-2 / LRO LOLA",
    description: "Permanently Shadowed Region (PSR) near the lunar south pole."
  },
  {
    id: "scene_mare_imbrium",
    name: "Mare Imbrium Plain",
    lat: 26.10,
    lon: 3.60,
    mission: "Chandrayaan-2 TMC-2",
    description: "Basaltic mare plain with sub-km micro craters and Hadley Rille."
  }
];

interface Moon3DGlobeProps {
  selectedSceneId?: string;
  onSelectScene?: (sceneId: string) => void;
  interactive?: boolean;
}

export default function Moon3DGlobe({
  selectedSceneId,
  onSelectScene,
  interactive = true,
}: Moon3DGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeMarker, setActiveMarker] = useState<Marker | null>(null);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 2.6;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Procedural Lunar Surface Texture Generation
    const canvas = document.createElement("canvas");
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d")!;

    // Base lunar mare tone
    ctx.fillStyle = "#2a2c30";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Highlands & crater mottling noise
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 14 + 2;
      const brightness = Math.floor(Math.random() * 80 + 120);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${brightness}, ${brightness}, ${brightness + 10}, 0.18)`;
      ctx.fill();
    }

    // Mare dark basalts
    ctx.fillStyle = "rgba(18, 20, 24, 0.45)";
    ctx.beginPath();
    ctx.ellipse(800, 350, 260, 160, 0, 0, Math.PI * 2); // Oceanus Procellarum / Imbrium
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1150, 420, 150, 120, 0, 0, Math.PI * 2); // Serenitatis
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1350, 480, 120, 100, 0, 0, Math.PI * 2); // Tranquillitatis
    ctx.fill();

    const moonTexture = new THREE.CanvasTexture(canvas);
    moonTexture.wrapS = THREE.RepeatWrapping;
    moonTexture.wrapT = THREE.ClampToEdgeWrapping;

    // 3. Moon Sphere Mesh
    const moonGeo = new THREE.SphereGeometry(1.0, 64, 64);
    const moonMat = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 0.88,
      metalness: 0.05,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    scene.add(moonMesh);

    // 4. Coordinate Grid Lines (Latitude/Longitude overlays)
    const gridMat = new THREE.LineBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.12,
    });

    // Latitude circles
    for (let lat = -80; lat <= 80; lat += 20) {
      const latRad = THREE.MathUtils.degToRad(lat);
      const r = Math.cos(latRad) * 1.002;
      const y = Math.sin(latRad) * 1.002;
      const ringGeo = new THREE.BufferGeometry();
      const points = [];
      for (let theta = 0; theta <= Math.PI * 2; theta += 0.05) {
        points.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      ringGeo.setFromPoints(points);
      const latLine = new THREE.Line(ringGeo, gridMat);
      moonMesh.add(latLine);
    }

    // 5. Orbit Path & Orbiter Satellite
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      orbitPoints.push(
        new THREE.Vector3(
          Math.cos(theta) * 1.35,
          Math.sin(theta) * 0.45,
          Math.sin(theta) * 1.35
        )
      );
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.35,
    });
    const orbitLine = new THREE.Line(orbitGeo, orbitMat);
    scene.add(orbitLine);

    // Spacecraft Body
    const satGroup = new THREE.Group();
    const satBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.03, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.8, roughness: 0.2 })
    );
    const panelGeo = new THREE.BoxGeometry(0.12, 0.005, 0.04);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.5, roughness: 0.3 });
    const panelL = new THREE.Mesh(panelGeo, panelMat);
    panelL.position.x = -0.08;
    const panelR = new THREE.Mesh(panelGeo, panelMat);
    panelR.position.x = 0.08;
    satGroup.add(satBody, panelL, panelR);
    scene.add(satGroup);

    // 6. Interactive Regional Landing / Crater Markers
    const markerGroup = new THREE.Group();
    const markerMeshes: { mesh: THREE.Mesh; marker: Marker }[] = [];

    BENCHMARK_MARKERS.forEach((marker) => {
      const phi = (90 - marker.lat) * (Math.PI / 180);
      const theta = (marker.lon + 180) * (Math.PI / 180);
      const x = -(1.01 * Math.sin(phi) * Math.cos(theta));
      const z = 1.01 * Math.sin(phi) * Math.sin(theta);
      const y = 1.01 * Math.cos(phi);

      const mGeo = new THREE.SphereGeometry(0.024, 16, 16);
      const isSelected = selectedSceneId === marker.id;
      const mMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0x22d3ee : 0xf59e0b,
      });
      const markerMesh = new THREE.Mesh(mGeo, mMat);
      markerMesh.position.set(x, y, z);
      markerGroup.add(markerMesh);
      markerMeshes.push({ mesh: markerMesh, marker });
    });
    moonMesh.add(markerGroup);

    // 7. Lighting (Sun with day/night terminator)
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(3, 1.5, 2);
    scene.add(dirLight);

    const ambientLight = new THREE.AmbientLight(0x0e1726, 0.4);
    scene.add(ambientLight);

    // 8. Animation & Interaction Loop
    let animationFrameId: number;
    let orbitTime = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotate) {
        moonMesh.rotation.y += 0.0018;
      }

      // Orbiter path animation
      orbitTime += 0.012;
      satGroup.position.set(
        Math.cos(orbitTime) * 1.35,
        Math.sin(orbitTime) * 0.45,
        Math.sin(orbitTime) * 1.35
      );
      satGroup.rotation.y = -orbitTime;

      renderer.render(scene, camera);
    };
    animate();

    // Mouse Interaction
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !interactive) return;
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;
      moonMesh.rotation.y += deltaX * 0.005;
      moonMesh.rotation.x += deltaY * 0.005;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      domEl.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }
      renderer.dispose();
    };
  }, [selectedSceneId, autoRotate, interactive]);

  return (
    <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden bg-gradient-to-b from-[#05070c] via-[#090e18] to-[#04060a] border border-cyan-950/40">
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Overlay Mission Telemetry & Controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-surface-200/80 backdrop-blur-md border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>CH-2 POLAR ORBIT: 100 KM ALT</span>
        </div>
        <div className="px-2.5 py-1 rounded-md bg-surface-200/80 backdrop-blur-md border border-white/5 text-[10px] font-mono text-slate-400">
          LUNAR RADIUS: 1737.4 KM
        </div>
      </div>

      {/* Control Buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`p-1.5 rounded-md border text-xs transition-colors backdrop-blur-md ${
            autoRotate
              ? "bg-cyan-950/70 border-cyan-500/40 text-cyan-300"
              : "bg-surface-200/70 border-white/10 text-slate-400"
          }`}
          title="Toggle Auto Rotation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Region Selector Bar */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 overflow-x-auto p-2 rounded-lg bg-surface-300/85 backdrop-blur-md border border-white/10 scrollbar-none">
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 shrink-0 pl-1">
          <Eye className="w-3.5 h-3.5 text-amber-400" />
          <span>REGIONS:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {BENCHMARK_MARKERS.map((m) => {
            const isSelected = selectedSceneId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMarker(m);
                  if (onSelectScene) onSelectScene(m.id);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-semibold"
                    : "bg-surface-100 text-slate-300 border border-white/5 hover:border-cyan-500/30"
                }`}
              >
                {m.name.split(" ")[0]} ({m.lat > 0 ? `+${m.lat}°` : `${m.lat}°`})
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
