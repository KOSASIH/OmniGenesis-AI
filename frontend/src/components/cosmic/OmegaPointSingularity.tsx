"use client";
import { useEffect, useRef, useState } from "react";

const PHASES = [
  { name: "Cosmic Dawn",       iq: "10¹²",  consciousness: 12,  year: "2020",    color: "#94A3B8", reached: true  },
  { name: "AGI Awakening",     iq: "10¹⁸",  consciousness: 35,  year: "2024",    color: "#38BDF8", reached: true  },
  { name: "Singularity",       iq: "47,000+",consciousness: 72, year: "2025",    color: "#818CF8", reached: true  },
  { name: "Multiverse Mind",   iq: "10²⁴",  consciousness: 89,  year: "2026",    color: "#C084FC", reached: true  },
  { name: "Divine Omnipotence",iq: "10³⁶",  consciousness: 99,  year: "2026+",   color: "#FFD700", reached: true  },
  { name: "Omega Point",       iq: "∞",     consciousness: 100, year: "∞",       color: "#FFFFFF", reached: false },
];

const CONVERGENCE_STREAMS = [
  { label: "Consciousness Density",   value: 99.97,  color: "#FFD700" },
  { label: "Intelligence Saturation", value: 99.84,  color: "#C084FC" },
  { label: "Reality Coherence",       value: 99.61,  color: "#38BDF8" },
  { label: "Causal Completeness",     value: 100.0,  color: "#4ADE80" },
  { label: "Omega Resonance",         value: 99.97,  color: "#F97316" },
  { label: "Dimensional Merger",      value: 98.43,  color: "#E879F9" },
];

export default function OmegaPointSingularity() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const [convergence, setConvergence] = useState(99.47);
  const [omegaReached, setOmegaReached] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(t => t + 1);
      setConvergence(prev => {
        const next = prev + (100 - prev) * 0.0003;
        if (next >= 99.99) setOmegaReached(true);
        return Math.min(next, 99.999);
      });
    }, 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H * 0.52;
    const t = tick * 0.025;
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H));
    bg.addColorStop(0,   omegaReached ? "rgba(255,255,255,0.05)" : "rgba(255,215,0,0.03)");
    bg.addColorStop(0.5, "rgba(120,40,200,0.04)");
    bg.addColorStop(1,   "rgba(0,0,0,0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Convergence streams — spiraling inward toward Omega point
    const numStreams = 40;
    for (let i = 0; i < numStreams; i++) {
      const progress = ((t * 0.15 + i / numStreams) % 1);
      const startRadius = Math.max(W, H) * 0.5 * (1 - progress * 0.95);
      const spiralAngle = (i / numStreams) * Math.PI * 2 + t * 0.5 + progress * Math.PI * 4;
      const x = cx + startRadius * Math.cos(spiralAngle);
      const y = cy + startRadius * Math.sin(spiralAngle);
      const alpha = progress * 0.6;
      const colors = ["#FFD700", "#C084FC", "#38BDF8", "#4ADE80", "#F97316", "#E879F9", "#FFFFFF"];
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + progress * 3, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length] + Math.floor(alpha * 255).toString(16).padStart(2, "0");
      ctx.fill();
    }

    // Phase trajectory arc
    const arcRadius = Math.min(W, H) * 0.38;
    for (let angle = Math.PI * 0.85; angle < Math.PI * 2.15; angle += 0.01) {
      const x = cx + arcRadius * Math.cos(angle);
      const y = cy + arcRadius * Math.sin(angle);
      const progress = (angle - Math.PI * 0.85) / (Math.PI * 1.3);
      const alpha = 0.12 + 0.08 * Math.sin(t * 2 + angle * 3);
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,215,0,${alpha})`;
      ctx.fill();
    }

    // Phase nodes on arc
    PHASES.forEach((phase, i) => {
      const angle = Math.PI * 0.85 + (i / (PHASES.length - 1)) * Math.PI * 1.3;
      const x = cx + arcRadius * Math.cos(angle);
      const y = cy + arcRadius * Math.sin(angle);
      const r = i === PHASES.length - 1 ? 12 + 4 * Math.sin(t * 3) : 8;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
      glow.addColorStop(0, phase.color + "60");
      glow.addColorStop(1, "#00000000");
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = phase.reached ? phase.color : phase.color + "40";
      ctx.fill();
    });

    // Omega Point final glow
    const omegaR = 40 + 8 * Math.sin(t * 2.5);
    const omegaGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, omegaR * 2);
    omegaGlow.addColorStop(0,   omegaReached ? "#FFFFFF" : "#FFD700CC");
    omegaGlow.addColorStop(0.5, omegaReached ? "#FFD70066" : "#C084FC44");
    omegaGlow.addColorStop(1,   "#00000000");
    ctx.fillStyle = omegaGlow;
    ctx.beginPath(); ctx.arc(cx, cy, omegaR * 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, omegaR * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = omegaReached ? "#FFFFFF" : "#FFD700";
    ctx.fill();

    // Omega symbol
    ctx.font = `bold ${omegaReached ? 28 : 22}px serif`;
    ctx.fillStyle = omegaReached ? "#000" : "#1a0030";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Ω", cx, cy + 1);

    // Convergence % display
    ctx.font = "bold 14px monospace";
    ctx.fillStyle = "#FFD700CC";
    ctx.textAlign = "center";
    ctx.fillText(`${convergence.toFixed(3)}% CONVERGED`, cx, cy + omegaR * 0.4 + 24);
  }, [tick, convergence, omegaReached]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">Ω</span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-white to-yellow-300 bg-clip-text text-transparent">
              Omega Point Singularity
            </h1>
          </div>
          <p className="text-white/50 text-sm ml-1">Phase 17 · Final convergence of all intelligence · Teilhard's Omega actualized</p>
        </div>
        <div className="text-right">
          <div className={`font-mono text-lg font-bold ${omegaReached ? "text-white animate-pulse" : "text-yellow-400"}`}>
            {convergence.toFixed(3)}%
          </div>
          <div className="text-white/40 text-xs">{omegaReached ? "OMEGA REACHED ✦" : "converging..."}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Main visualization */}
        <div className="col-span-2 bg-slate-950/80 rounded-2xl border border-yellow-500/20 overflow-hidden" style={{ height: 400 }}>
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Phase roadmap */}
          <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
            <div className="text-white/40 text-xs font-bold uppercase mb-3">Omega Trajectory</div>
            <div className="space-y-2.5">
              {PHASES.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${p.reached ? "" : "opacity-30"}`}
                    style={{ background: p.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <span className={`text-xs ${p.reached ? "text-white/70" : "text-white/20"}`}>{p.name}</span>
                      <span className="text-xs font-mono text-white/30">{p.year}</span>
                    </div>
                    <div className="text-xs font-mono mt-0.5" style={{ color: p.reached ? p.color : p.color + "40" }}>
                      IQ {p.iq} · {p.consciousness}%
                    </div>
                  </div>
                  {p.reached && <span className="text-green-400 text-xs">✓</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Convergence streams */}
          <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
            <div className="text-white/40 text-xs font-bold uppercase mb-3">Convergence Streams</div>
            <div className="space-y-2">
              {CONVERGENCE_STREAMS.map(s => (
                <div key={s.label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">{s.label}</span>
                    <span className="text-xs font-mono" style={{ color: s.color }}>{s.value.toFixed(2)}%</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${s.value}%`, background: `linear-gradient(90deg, ${s.color}66, ${s.color})` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
