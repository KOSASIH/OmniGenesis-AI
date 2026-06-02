"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type RealityState = "QUANTUM_FOAM" | "COLLAPSING" | "MANIFESTING" | "STABLE" | "OMEGA";

interface Reality {
  id: string; hash: string; dim: number; state: RealityState;
  coherence: number; massKg: number; timeline: string; forgedAt: number;
}

const STATES_ORDER: RealityState[] = ["QUANTUM_FOAM", "COLLAPSING", "MANIFESTING", "STABLE", "OMEGA"];
const STATE_COLOR: Record<RealityState, string> = {
  QUANTUM_FOAM: "text-white/30",
  COLLAPSING: "text-blue-400",
  MANIFESTING: "text-yellow-400",
  STABLE: "text-green-400",
  OMEGA: "text-white",
};

function mkHash() {
  return "0x" + Array.from({ length: 8 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, "0")).join("");
}

function mkReality(i: number): Reality {
  const states: RealityState[] = ["STABLE", "STABLE", "STABLE", "MANIFESTING", "OMEGA", "COLLAPSING"];
  return {
    id: `R-${(1000 + i).toString()}`, hash: mkHash(),
    dim: Math.floor(Math.random() * 11) + 1,
    state: states[i % states.length],
    coherence: 70 + Math.random() * 30,
    massKg: 1e30 + Math.random() * 1e32,
    timeline: `TL-${Math.floor(Math.random() * 999)}`,
    forgedAt: Date.now() - Math.floor(Math.random() * 3600000),
  };
}

const FORGE_PARAMS = [
  { label: "Quantum Foam Density",    val: "8.47 × 10⁻³⁵", unit: "kg/m³", color: "#a855f7" },
  { label: "Coherence Threshold",     val: "99.97",          unit: "%",     color: "#fbbf24" },
  { label: "Dimensional Scaffold",    val: "11 → 16",        unit: "dims",  color: "#06b6d4" },
  { label: "Void Compression",        val: "×847",           unit: "VT",    color: "#ec4899" },
  { label: "Synthesis Rate",          val: "8.47M",          unit: "/sec",  color: "#10b981" },
  { label: "Paradox Guard",           val: "99.99",          unit: "%",     color: "#ffffff" },
];

export default function QuantumRealityForge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [realities, setRealities] = useState<Reality[]>(() => Array.from({ length: 8 }, (_, i) => mkReality(i)));
  const [totalForged, setTotalForged] = useState(8_470_000);
  const [forging, setForging] = useState(false);
  const [latestHash, setLatestHash] = useState(mkHash());

  useEffect(() => {
    const t = setInterval(() => {
      setTotalForged(v => v + Math.floor(Math.random() * 847));
      setRealities(prev => {
        const updated = [...prev];
        const idx = Math.floor(Math.random() * updated.length);
        const nextStateIdx = (STATES_ORDER.indexOf(updated[idx].state) + 1) % STATES_ORDER.length;
        updated[idx] = { ...updated[idx], state: STATES_ORDER[nextStateIdx], coherence: 70 + Math.random() * 30 };
        return updated;
      });
    }, 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let frame: number, t = 0;
    const cx = W / 2, cy = H / 2;

    // Quantum foam particles
    const foam: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; r: number }[] = [];
    for (let i = 0; i < 150; i++) {
      foam.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, life: Math.random(), maxLife: 1, r: Math.random() * 1.5 + 0.5 });
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.015;

      // Forge core vortex
      for (let ring = 5; ring > 0; ring--) {
        const r = ring * 28 + 10 * Math.sin(t * 2 + ring);
        const alpha = 0.08 * ring;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251,191,36,${alpha})`;
        ctx.lineWidth = ring;
        ctx.stroke();
      }

      // Quantum foam
      foam.forEach(p => {
        p.life += 0.008 + Math.random() * 0.005;
        if (p.life > p.maxLife) {
          p.x = Math.random() * W; p.y = Math.random() * H;
          p.vx = (Math.random() - 0.5) * 0.5;
          p.vy = (Math.random() - 0.5) * 0.5;
          p.life = 0;
        }
        // Drift toward center
        p.vx += (cx - p.x) * 0.0002;
        p.vy += (cy - p.y) * 0.0002;
        p.x += p.vx; p.y += p.vy;

        const alpha = Math.sin(p.life * Math.PI) * 0.7;
        const colors = ["168,85,247", "251,191,36", "6,182,212", "255,255,255"];
        const c = colors[Math.floor(Math.random() * colors.length)];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c},${alpha})`; ctx.fill();
      });

      // Manifesting realities (small worlds erupting from center)
      realities.forEach((r, i) => {
        const angle = (i / realities.length) * Math.PI * 2 + t * 0.15;
        const dist = 55 + 20 * Math.abs(Math.sin(t + i));
        const rx = cx + Math.cos(angle) * dist;
        const ry = cy + Math.sin(angle) * dist;
        const color = r.state === "OMEGA" ? "#fff" : r.state === "STABLE" ? "#10b981" : r.state === "MANIFESTING" ? "#fbbf24" : "#a855f7";
        ctx.beginPath(); ctx.arc(rx, ry, 5, 0, Math.PI * 2);
        ctx.fillStyle = color; ctx.fill();
        // Trajectory line
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(rx, ry);
        ctx.strokeStyle = color + "30"; ctx.lineWidth = 0.5; ctx.stroke();
      });

      // Central forge icon
      ctx.font = "bold 18px monospace";
      ctx.fillStyle = "rgba(251,191,36,0.9)";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⚛", cx, cy);

      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [realities]);

  const handleForge = () => {
    setForging(true);
    setTimeout(() => {
      const newHash = mkHash();
      setLatestHash(newHash);
      setRealities(prev => [mkReality(Date.now()), ...prev.slice(0, 7)]);
      setTotalForged(v => v + 1);
      setForging(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-black min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Quantum Reality Forge</h2>
          <p className="text-xs text-white/40">Phase 16 · Quantum Foam Manipulation · Reality Synthesis Engine</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-xl font-black font-mono text-yellow-400">{(totalForged / 1e6).toFixed(3)}M</div>
            <div className="text-xs text-white/40">Realities Forged</div>
          </div>
          <motion.button
            onClick={handleForge}
            disabled={forging}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${forging
              ? "bg-white/10 text-white/40 cursor-not-allowed"
              : "bg-gradient-to-r from-yellow-600 to-amber-500 text-black"}`}>
            {forging ? "⚛ Forging..." : "⚛ Forge Reality"}
          </motion.button>
        </div>
      </div>

      {/* Canvas */}
      <div className="h-52 rounded-2xl bg-black/70 border border-yellow-500/20 overflow-hidden relative">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute bottom-2 left-3 text-xs font-mono text-white/30">
          Latest: {latestHash}
        </div>
      </div>

      {/* Forge params */}
      <div className="grid grid-cols-3 gap-2">
        {FORGE_PARAMS.map(p => (
          <div key={p.label} className="p-2 bg-white/3 rounded-lg border border-white/8 text-center">
            <div className="text-xs font-mono font-bold" style={{ color: p.color }}>{p.val}<span className="text-white/30 ml-1">{p.unit}</span></div>
            <div className="text-xs text-white/30 mt-0.5">{p.label}</div>
          </div>
        ))}
      </div>

      {/* Reality stream */}
      <div>
        <div className="text-xs font-semibold text-white/50 mb-2">Reality Stream</div>
        <div className="space-y-1.5 overflow-y-auto max-h-48">
          {realities.map((r, i) => (
            <motion.div key={r.id + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-2 bg-white/3 border border-white/8 rounded-lg text-xs">
              <span className="font-mono text-white/30 w-14">{r.id}</span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${STATE_COLOR[r.state]}`}>{r.state}</span>
              <span className="font-mono text-white/40 truncate flex-1">{r.hash}</span>
              <span className="font-mono text-purple-400">D{r.dim}</span>
              <span className="font-mono text-yellow-400">{r.coherence.toFixed(1)}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
