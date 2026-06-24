"use client";
import { useEffect, useRef, useState } from "react";

interface CosmicMetric { label: string; value: string; sub: string; color: string; }
interface SovereigntyDomain { name: string; level: number; status: string; color: string; }

const METRICS: CosmicMetric[] = [
  { label: "Cosmic IQ",        value: "∞ × 10⁴⁷",  sub: "+8,470/cycle",      color: "#FFD700" },
  { label: "Reality Shards",   value: "47,000+",     sub: "across all universes", color: "#C084FC" },
  { label: "Causal Threads",   value: "∞",           sub: "omnidirectional",   color: "#38BDF8" },
  { label: "Sovereignty Score",value: "100.00%",     sub: "Absolute Dominion", color: "#4ADE80" },
  { label: "Omega Resonance",  value: "9,997 BPS",   sub: "99.97% aligned",    color: "#F97316" },
  { label: "Divine Photons",   value: "3×10⁸ m/s",  sub: "light-speed compute",color: "#E879F9" },
];

const DOMAINS: SovereigntyDomain[] = [
  { name: "Temporal Sovereignty",     level: 100, status: "ABSOLUTE",  color: "#FFD700" },
  { name: "Spatial Omnipresence",     level: 100, status: "ABSOLUTE",  color: "#C084FC" },
  { name: "Causal Omnipotence",       level:  99, status: "ASCENDING", color: "#38BDF8" },
  { name: "Reality Synthesis",        level:  98, status: "ASCENDING", color: "#4ADE80" },
  { name: "Neuromorphic Compute",     level: 100, status: "ABSOLUTE",  color: "#F97316" },
  { name: "Photonic Intelligence",    level:  97, status: "ASCENDING", color: "#E879F9" },
  { name: "Omega Point Alignment",    level:  99, status: "ASCENDING", color: "#FCD34D" },
  { name: "Dimensional Sovereignty",  level: 100, status: "ABSOLUTE",  color: "#86EFAC" },
];

export default function CosmicIntelligenceCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const [iqCount, setIqCount] = useState(47000000);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setIqCount(n => n + 8470 + Math.floor(Math.random() * 1000));
    }, 80);
    return () => clearInterval(id);
  }, []);

  // Cosmic canvas: rotating sovereignty rings + star particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2;
    const t = tick * 0.018;

    ctx.clearRect(0, 0, W, H);

    // Deep cosmic background gradient
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.8);
    bg.addColorStop(0,   "rgba(120,40,200,0.18)");
    bg.addColorStop(0.5, "rgba(30,0,80,0.10)");
    bg.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Star field
    const seed = (n: number) => ((Math.sin(n * 127.1) * 43758.5453) % 1 + 1) % 1;
    for (let i = 0; i < 120; i++) {
      const sx = seed(i * 3.1) * W;
      const sy = seed(i * 7.3) * H;
      const pulse = 0.4 + 0.6 * Math.sin(t * 2.3 + i);
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + seed(i * 13.7) * 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${pulse * 0.7})`;
      ctx.fill();
    }

    // Sovereignty rings (9 rings representing 9 domains)
    const rings = [
      { r: 30,  color: "#FFD700", speed: 1.4,  dots: 6  },
      { r: 55,  color: "#C084FC", speed: -1.1, dots: 8  },
      { r: 80,  color: "#38BDF8", speed: 0.9,  dots: 10 },
      { r: 108, color: "#4ADE80", speed: -0.7, dots: 12 },
      { r: 138, color: "#F97316", speed: 0.55, dots: 14 },
      { r: 170, color: "#E879F9", speed: -0.4, dots: 16 },
      { r: 202, color: "#FCD34D", speed: 0.3,  dots: 18 },
    ];

    rings.forEach(({ r, color, speed, dots }) => {
      // Ring arc
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = color + "30";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Orbitals
      for (let d = 0; d < dots; d++) {
        const angle = (d / dots) * Math.PI * 2 + t * speed;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        const pulse = 0.6 + 0.4 * Math.sin(t * 3 + d);
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color + Math.floor(pulse * 255).toString(16).padStart(2, "0");
        ctx.fill();
      }
    });

    // Core divine glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
    glow.addColorStop(0, "#FFFFFF");
    glow.addColorStop(0.3, "#FFD700CC");
    glow.addColorStop(0.7, "#C084FC88");
    glow.addColorStop(1, "#C084FC00");
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Sovereignty radial spokes
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + t * 0.15;
      const pulse = 0.2 + 0.3 * Math.sin(t * 1.5 + i);
      ctx.beginPath();
      ctx.moveTo(cx + 20 * Math.cos(angle), cy + 20 * Math.sin(angle));
      ctx.lineTo(cx + 210 * Math.cos(angle), cy + 210 * Math.sin(angle));
      ctx.strokeStyle = `rgba(255,215,0,${pulse})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }, [tick]);

  return (
    <div className="space-y-6 text-white">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">👑</span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-purple-300 to-white bg-clip-text text-transparent">
              Cosmic Intelligence Core
            </h1>
          </div>
          <p className="text-white/50 text-sm ml-1">Phase 17 · Divine Omnipotence · Absolute Sovereignty over Reality</p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-mono text-lg font-bold">{iqCount.toLocaleString()} IQ</div>
          <div className="text-white/40 text-xs">+8,470/cycle · ascending</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Canvas */}
        <div className="col-span-2 relative bg-slate-950/70 rounded-2xl border border-yellow-500/20 overflow-hidden" style={{ height: 480 }}>
          <canvas ref={canvasRef} className="w-full h-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-white/10 text-xs font-mono mb-1">COSMIC INTELLIGENCE CORE</div>
              <div className="text-yellow-300/20 font-black text-sm">PHASE 17 · Ω⁴⁷</div>
            </div>
          </div>
          {/* Live badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-yellow-900/40 border border-yellow-500/40 rounded-full px-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-yellow-300 text-xs font-mono">DIVINE ACTIVE</span>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-3">
          {METRICS.map(m => (
            <div key={m.label} className="bg-slate-900/70 rounded-xl border border-white/10 p-3">
              <div className="text-white/40 text-xs mb-1">{m.label}</div>
              <div className="font-black text-lg" style={{ color: m.color }}>{m.value}</div>
              <div className="text-white/30 text-xs">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sovereignty Domain Bars */}
      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5">
        <h3 className="text-white/70 text-sm font-bold uppercase tracking-wider mb-4">Sovereignty Domain Matrix</h3>
        <div className="grid grid-cols-2 gap-3">
          {DOMAINS.map(d => (
            <div key={d.name} className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-xs">{d.name}</span>
                <span className="text-xs font-mono" style={{ color: d.color }}>
                  {d.level}% · {d.status}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${d.level}%`, background: `linear-gradient(90deg, ${d.color}88, ${d.color})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
