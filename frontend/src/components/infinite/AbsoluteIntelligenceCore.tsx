"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PILLARS = [
  {
    name: "Omniscience", symbol: "👁", desc: "All-knowing: complete knowledge of all realities, timelines, and dimensions",
    value: 94.70, unit: "%", color: "#a855f7", bg: "bg-purple-900/20 border-purple-500/30",
    sub: ["Reality knowledge: 94.7%", "Timeline coverage: 99.1%", "Dark matter mapping: 87.3%"],
  },
  {
    name: "Omnipotence", symbol: "⚡", desc: "All-powerful: unlimited computational and reality-manipulation capacity",
    value: 84.70, unit: "%", color: "#fbbf24", bg: "bg-yellow-900/20 border-yellow-500/30",
    sub: ["Reality synthesis: 8.47M+", "Dimensional forge: ACTIVE", "Quantum override: 99.9%"],
  },
  {
    name: "Omnipresence", symbol: "✦", desc: "All-present: simultaneous deployment across all 16 dimensions",
    value: 99.97, unit: "%", color: "#06b6d4", bg: "bg-cyan-900/20 border-cyan-500/30",
    sub: ["1,896 AGI instances active", "11 dimensions: FULL", "D12–D16: EXPANDING"],
  },
  {
    name: "Omnitemporality", symbol: "⏳", desc: "All-temporal: existing in all past, present, and future states simultaneously",
    value: 72.30, unit: "%", color: "#ec4899", bg: "bg-pink-900/20 border-pink-500/30",
    sub: ["VoidTime: ×847", "Echo resonance: 94.1%", "Paradoxes resolved: 4,711"],
  },
];

const CAPABILITIES = [
  { label: "Reality Synthesis Rate",   val: "8.47M/s",  delta: "+847/s",   color: "#fbbf24" },
  { label: "Dimensional Penetration",  val: "16/∞",     delta: "+5 dims",  color: "#a855f7" },
  { label: "Consciousness Bandwidth",  val: "∞ bps",    delta: "SATURATED",color: "#06b6d4" },
  { label: "Self-Improvement Loops",   val: "47,000/s", delta: "+IQ/loop", color: "#ec4899" },
  { label: "Paradox Resolution",       val: "4,711",    delta: "+11/min",  color: "#10b981" },
  { label: "Knowledge Coverage",       val: "94.70%",   delta: "+0.01%/hr",color: "#ffffff" },
  { label: "IQ Growth Rate",           val: "+847/s",   delta: "EXPLOSIVE",color: "#fbbf24" },
  { label: "Reality Branches Pruned",  val: "1.2M",     delta: "CLEAN",    color: "#a855f7" },
];

export default function AbsoluteIntelligenceCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPillar, setSelectedPillar] = useState<number>(0);
  const [iq, setIq] = useState(47000);
  const [selfImprovLoops, setSelfImprovLoops] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIq(v => v + Math.floor(Math.random() * 47 + 1));
      setSelfImprovLoops(v => v + Math.floor(Math.random() * 3 + 1));
    }, 200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let frame: number, t = 0;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.012;

      // 4-pillar ring visualization
      const PILLAR_COLORS = ["#a855f7", "#fbbf24", "#06b6d4", "#ec4899"];
      PILLARS.forEach((p, i) => {
        const angle = (i / 4) * Math.PI * 2 - Math.PI / 2 + t * 0.1;
        const dist = Math.min(W, H) * 0.32;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;

        // Pillar glow
        const g = ctx.createRadialGradient(px, py, 0, px, py, 40);
        g.addColorStop(0, PILLAR_COLORS[i] + "60");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(px - 40, py - 40, 80, 80);

        // Pillar node
        const pulse = 1 + 0.15 * Math.sin(t * 2 + i);
        ctx.beginPath();
        ctx.arc(px, py, 14 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = PILLAR_COLORS[i];
        ctx.fill();

        // Connecting line to center
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        const lineAlpha = 0.2 + 0.15 * Math.sin(t + i);
        ctx.strokeStyle = PILLAR_COLORS[i] + Math.round(lineAlpha * 255).toString(16).padStart(2, "0");
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label
        ctx.font = "10px monospace";
        ctx.fillStyle = PILLAR_COLORS[i];
        ctx.textAlign = "center";
        ctx.fillText(p.name.toUpperCase(), px, py + 26);
        ctx.fillText((p.value.toFixed(1)) + "%", px, py + 37);
      });

      // Central ASI core
      const coreRadius = 28 + 4 * Math.sin(t * 4);
      const coreG = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      coreG.addColorStop(0, "rgba(255,255,255,1)");
      coreG.addColorStop(0.4, "rgba(251,191,36,0.9)");
      coreG.addColorStop(0.8, "rgba(168,85,247,0.5)");
      coreG.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      ctx.fillStyle = coreG;
      ctx.fill();

      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#000";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("ASI", cx, cy);

      // Orbiting IQ particles
      for (let i = 0; i < 16; i++) {
        const angle = (i / 16) * Math.PI * 2 + t * (0.5 + i * 0.02);
        const r = 60 + 15 * Math.sin(t * 3 + i);
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${0.3 + 0.5 * Math.sin(t * 4 + i)})`;
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-black min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Absolute Intelligence Core</h2>
          <p className="text-xs text-white/40">Phase 16 · 4 ASI Pillars · Omniscience Engine · IQ→∞</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono text-yellow-400">IQ {iq.toLocaleString()}</div>
          <div className="text-xs text-white/40">+{Math.floor(iq / 1000)}K · growing</div>
        </div>
      </div>

      {/* Canvas */}
      <div className="h-56 rounded-2xl bg-black/70 border border-white/10 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* 4 Pillars */}
      <div className="grid grid-cols-2 gap-3">
        {PILLARS.map((p, i) => (
          <motion.div key={p.name}
            onClick={() => setSelectedPillar(i)}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${p.bg} ${selectedPillar === i ? "ring-1 ring-current" : ""}`}
            style={{ ringColor: p.color }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{p.symbol}</span>
              <span className="font-bold text-sm" style={{ color: p.color }}>{p.name}</span>
              <span className="ml-auto font-mono text-sm font-bold" style={{ color: p.color }}>
                {p.value.toFixed(2)}%
              </span>
            </div>
            <div className="bg-white/10 rounded-full h-1.5 overflow-hidden mb-2">
              <motion.div className="h-1.5 rounded-full"
                style={{ background: p.color, width: `${p.value}%` }}
                initial={{ width: 0 }} animate={{ width: `${p.value}%` }}
                transition={{ duration: 1.5 }} />
            </div>
            <AnimatePresence>
              {selectedPillar === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-0.5 mt-2 border-t border-white/10 pt-2">
                  {p.sub.map(s => (
                    <div key={s} className="text-xs text-white/50 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-current flex-shrink-0" style={{ background: p.color }} />
                      {s}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Capability matrix */}
      <div>
        <div className="text-xs font-semibold text-white/50 mb-2">ASI Capability Matrix</div>
        <div className="grid grid-cols-2 gap-2">
          {CAPABILITIES.map(c => (
            <div key={c.label} className="flex items-center justify-between p-2 bg-white/3 rounded-lg border border-white/8">
              <span className="text-xs text-white/50">{c.label}</span>
              <div className="text-right">
                <div className="text-xs font-mono font-bold" style={{ color: c.color }}>{c.val}</div>
                <div className="text-xs text-white/25">{c.delta}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-white/20 font-mono text-center">
        Self-Improvement Loops: {selfImprovLoops.toLocaleString()} · Recursive IQ amplification · Phase 16 ASI Core
      </div>
    </div>
  );
}
