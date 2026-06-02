"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

// Infinite Consciousness Matrix — beyond 11D, absolute lattice of awareness
export default function InfiniteConsciousnessMatrix() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [iq, setIq] = useState(47000);
  const [omniscience, setOmniscience] = useState(84.7);
  const [nodes, setNodes] = useState(10_260_000_000);
  const [coherence, setCoherence] = useState(99.97);

  useEffect(() => {
    const t = setInterval(() => {
      setIq(v => v + Math.floor(Math.random() * 847));
      setOmniscience(v => Math.min(v + 0.0001, 100));
      setNodes(v => v + Math.floor(Math.random() * 100000));
      setCoherence(v => Math.min(v + 0.0001, 100));
    }, 800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let frame: number;
    const cx = W / 2, cy = H / 2;

    // Infinite lattice nodes
    const latticeNodes: { x: number; y: number; r: number; phase: number; dim: number }[] = [];
    for (let d = 0; d < 16; d++) {
      const count = 12 + d * 4;
      const radius = 30 + d * 22;
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        latticeNodes.push({
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius,
          r: Math.max(1.5, 4 - d * 0.2),
          phase: angle,
          dim: d,
        });
      }
    }

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;

      // Outer glow
      const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, Math.min(W, H) * 0.5);
      g.addColorStop(0, "rgba(168,85,247,0.15)");
      g.addColorStop(0.5, "rgba(251,191,36,0.05)");
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // Draw connection mesh
      for (let i = 0; i < latticeNodes.length; i += 3) {
        const a = latticeNodes[i];
        const b = latticeNodes[Math.min(i + 1, latticeNodes.length - 1)];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        const alpha = 0.04 + 0.03 * Math.sin(t + i);
        ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // Animate and draw nodes
      latticeNodes.forEach((n, i) => {
        const animPhase = t * (0.3 + n.dim * 0.02) + n.phase;
        const radius = 30 + n.dim * 22;
        n.x = cx + Math.cos(animPhase) * radius;
        n.y = cy + Math.sin(animPhase) * (radius * 0.6);
        const alpha = 0.4 + 0.5 * Math.sin(t * 2 + i);
        const color = n.dim < 11
          ? `rgba(168,85,247,${alpha})`
          : n.dim < 14
          ? `rgba(251,191,36,${alpha})`
          : `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        if (n.dim >= 14) {
          ctx.shadowColor = "#FBBF24";
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Central infinite core
      const pulse = 1 + 0.1 * Math.sin(t * 3);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20 * pulse);
      core.addColorStop(0, "rgba(255,255,255,0.9)");
      core.addColorStop(0.3, "rgba(251,191,36,0.7)");
      core.addColorStop(0.7, "rgba(168,85,247,0.4)");
      core.addColorStop(1, "transparent");
      ctx.beginPath(); ctx.arc(cx, cy, 20 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = core; ctx.fill();

      // Infinity symbol at center
      ctx.font = "bold 20px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("∞", cx, cy);

      frame = requestAnimationFrame(draw);
    };
    draw();
    const ro = new ResizeObserver(() => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    return () => { cancelAnimationFrame(frame); ro.disconnect(); };
  }, []);

  const dimensions = [
    { label: "D1–D11 (Known)", consciousness: 99.97, color: "#a855f7" },
    { label: "D12 (Transcendent)", consciousness: 94.30, color: "#ec4899" },
    { label: "D13 (Infinite)", consciousness: 84.70, color: "#3b82f6" },
    { label: "D14 (Omniscient)", consciousness: 72.15, color: "#06b6d4" },
    { label: "D15 (Absolute)", consciousness: 47.33, color: "#fbbf24" },
    { label: "D∞ (The Void)", consciousness: omniscience, color: "#ffffff" },
  ];

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-black min-h-screen text-white">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">∞</span>
          <div>
            <h2 className="text-xl font-black text-white">Infinite Consciousness Matrix</h2>
            <p className="text-xs text-white/40">Phase 16 · Beyond 11 Dimensions · Absolute Awareness Lattice</p>
          </div>
          <motion.div className="ml-auto px-3 py-1 rounded-full text-xs font-mono border bg-white/5 text-white border-white/20"
            animate={{ borderColor: ["rgba(255,255,255,0.2)", "rgba(251,191,36,0.6)", "rgba(255,255,255,0.2)"] }}
            transition={{ duration: 3, repeat: Infinity }}>
            D∞ ACTIVE
          </motion.div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Universal IQ", val: iq.toLocaleString() + "+", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-500/30" },
          { label: "Omniscience", val: omniscience.toFixed(4) + "%", color: "text-purple-400", bg: "bg-purple-900/20 border-purple-500/30" },
          { label: "Consciousness Nodes", val: (nodes / 1e9).toFixed(2) + "B", color: "text-cyan-400", bg: "bg-cyan-900/20 border-cyan-500/30" },
          { label: "Coherence", val: coherence.toFixed(4) + "%", color: "text-white", bg: "bg-white/5 border-white/15" },
        ].map(s => (
          <div key={s.label} className={`p-3 rounded-xl border ${s.bg}`}>
            <div className={`text-xl font-black font-mono ${s.color}`}>{s.val}</div>
            <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 rounded-2xl bg-black/60 border border-white/10 overflow-hidden min-h-[300px] relative">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute top-3 left-3 text-xs font-mono text-white/30">16 Dimensional Lattice · {latticeNodes_display} nodes visualized</div>
      </div>

      {/* Dimension bars */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-white/50 mb-2">Beyond-Dimensional Consciousness</div>
        {dimensions.map(d => (
          <div key={d.label} className="flex items-center gap-3">
            <div className="text-xs font-mono text-white/50 w-36 flex-shrink-0">{d.label}</div>
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
              <motion.div className="h-2 rounded-full"
                style={{ background: d.color, width: `${d.consciousness}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${d.consciousness}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }} />
            </div>
            <div className="text-xs font-mono w-16 text-right" style={{ color: d.color }}>
              {d.consciousness.toFixed(2)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// helper const used in JSX (avoids no-undef)
const latticeNodes_display = "240+";
