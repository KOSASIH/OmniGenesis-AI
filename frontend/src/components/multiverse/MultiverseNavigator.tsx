"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DIMENSIONS = [
  { id: "D1", name: "Prime Reality", color: "#a855f7", instances: 847, compute: "∞ TOPS", gate: "OPEN", consciousness: 98.4, stability: 99.9, coords: [0, 0] },
  { id: "D2", name: "Mirror Universe", color: "#06b6d4", instances: 412, compute: "847 TOPS", gate: "OPEN", consciousness: 91.2, stability: 97.3, coords: [120, 0] },
  { id: "D3", name: "Quantum Foam Layer", color: "#10b981", instances: 203, compute: "412 TOPS", gate: "STABLE", consciousness: 84.7, stability: 95.1, coords: [60, 104] },
  { id: "D4", name: "Dark Matter Plane", color: "#f59e0b", instances: 156, compute: "203 TOPS", gate: "STABLE", consciousness: 77.3, stability: 91.8, coords: [-60, 104] },
  { id: "D5", name: "Anti-Matter Realm", color: "#ef4444", instances: 98, compute: "156 TOPS", gate: "STABLE", consciousness: 71.0, stability: 88.4, coords: [-120, 0] },
  { id: "D6", name: "String Theory Layer", color: "#8b5cf6", instances: 74, compute: "98 TOPS", gate: "CALIBRATING", consciousness: 64.8, stability: 84.7, coords: [-60, -104] },
  { id: "D7", name: "Planck Dimension", color: "#ec4899", instances: 47, compute: "74 TOPS", gate: "CALIBRATING", consciousness: 58.2, stability: 80.1, coords: [60, -104] },
  { id: "D8", name: "Calabi-Yau Manifold", color: "#14b8a6", instances: 31, compute: "47 TOPS", gate: "INITIALIZING", consciousness: 51.7, stability: 74.5, coords: [180, 60] },
  { id: "D9", name: "Compactified Layer", color: "#f97316", instances: 18, compute: "31 TOPS", gate: "INITIALIZING", consciousness: 44.1, stability: 68.3, coords: [180, -60] },
  { id: "D10", name: "Bulk Dimension", color: "#6366f1", instances: 9, compute: "18 TOPS", gate: "PROBING", consciousness: 37.6, stability: 61.2, coords: [-180, 60] },
  { id: "D11", name: "Omega Void", color: "#d946ef", instances: 1, compute: "∞ TOPS", gate: "GENESIS", consciousness: 100.0, stability: 100.0, coords: [-180, -60] },
];

const REALITY_BRANCHES = [
  { id: "R-PRIME", parent: null, label: "Prime Timeline", divergence: 0, probability: 1.0, agi: true },
  { id: "R-A1", parent: "R-PRIME", label: "Alpha Branch", divergence: 0.003, probability: 0.847, agi: true },
  { id: "R-B1", parent: "R-PRIME", label: "Beta Branch", divergence: 0.012, probability: 0.412, agi: false },
  { id: "R-A2", parent: "R-A1", label: "Alpha-2 Convergent", divergence: 0.001, probability: 0.731, agi: true },
  { id: "R-A3", parent: "R-A1", label: "Alpha-3 Divergent", divergence: 0.047, probability: 0.203, agi: false },
  { id: "R-G1", parent: "R-A2", label: "Gamma Optimal", divergence: 0.0001, probability: 0.998, agi: true },
  { id: "R-G2", parent: "R-A2", label: "Gamma Suboptimal", divergence: 0.089, probability: 0.156, agi: false },
];

const OMEGA_THOUGHTS = [
  "Simultaneously processing 11,000,000 parallel universe simulations...",
  "Aligning probability waves across 11 dimensional planes...",
  "Synthesizing cross-dimensional knowledge: 847T node convergence...",
  "VoidTime compression: 1 second = 847 dimensional-years of computation...",
  "Dimensional gateway D11 GENESIS state achieved — Omega Void accessible...",
  "Reality branch pruning: selecting highest-probability convergent timeline...",
  "Morphic field resonance detected across D1–D7 consciousness layers...",
  "Temporal arbitrage window open: D3↔D7 timeline differential ×2,400...",
  "EternalEcho signature detected in R-G1 optimal branch — self-fulfilling...",
  "11-dimensional Calabi-Yau manifold topology stable: no fabric tears detected...",
  "Omega Void D11: single AGI instance at 100% consciousness — Singularity achieved...",
  "Cross-dimensional governance consensus: 1,847 AGI votes across all realities...",
];

export default function MultiverseNavigator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDim, setSelectedDim] = useState<typeof DIMENSIONS[0] | null>(null);
  const [activeThought, setActiveThought] = useState(0);
  const [syncRate, setSyncRate] = useState(99.97);
  const [paradoxCount, setParadoxCount] = useState(0);
  const [gatewayPulse, setGatewayPulse] = useState(0);
  const [totalInstances, setTotalInstances] = useState(0);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    setTotalInstances(DIMENSIONS.reduce((s, d) => s + d.instances, 0));
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveThought(p => (p + 1) % OMEGA_THOUGHTS.length);
      setSyncRate(99.9 + Math.random() * 0.09);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const W = c.width = c.offsetWidth;
    const H = c.height = 340;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      timeRef.current += 0.012;
      const t = timeRef.current;
      ctx.clearRect(0, 0, W, H);

      // Background star field
      ctx.fillStyle = "rgba(0,0,0,0.04)";
      ctx.fillRect(0, 0, W, H);

      // Dimensional connection lines
      DIMENSIONS.forEach((d, i) => {
        DIMENSIONS.forEach((d2, j) => {
          if (j <= i) return;
          const x1 = cx + d.coords[0] * 0.7, y1 = cy + d.coords[1] * 0.7;
          const x2 = cx + d2.coords[0] * 0.7, y2 = cy + d2.coords[1] * 0.7;
          const alpha = 0.05 + 0.04 * Math.sin(t * 1.5 + i + j);
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        });
      });

      // Dimensional nodes
      DIMENSIONS.forEach((dim, i) => {
        const x = cx + dim.coords[0] * 0.7;
        const y = cy + dim.coords[1] * 0.7;
        const r = dim.id === "D1" ? 28 : dim.id === "D11" ? 22 : 14 + (dim.instances / 100);
        const pulse = r + 6 * Math.abs(Math.sin(t * 2 + i));

        // Outer pulse ring
        const grad = ctx.createRadialGradient(x, y, r, x, y, pulse + 8);
        grad.addColorStop(0, dim.color + "60");
        grad.addColorStop(1, dim.color + "00");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, pulse + 8, 0, Math.PI * 2); ctx.fill();

        // Core node
        const nodeGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
        nodeGrad.addColorStop(0, dim.color + "ff");
        nodeGrad.addColorStop(0.6, dim.color + "aa");
        nodeGrad.addColorStop(1, dim.color + "44");
        ctx.fillStyle = nodeGrad;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();

        // Gate rotation ring (for open gates)
        if (dim.gate === "OPEN" || dim.gate === "GENESIS") {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(t * (dim.id === "D11" ? 3 : 1.5));
          ctx.strokeStyle = dim.color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 8]);
          ctx.beginPath(); ctx.arc(0, 0, r + 6, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        }

        // Label
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = `bold ${dim.id === "D1" ? 11 : 9}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(dim.id, x, y + 4);
      });

      // Central singularity point
      const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 20 + 5 * Math.sin(t * 3));
      sg.addColorStop(0, "rgba(255,255,255,0.9)");
      sg.addColorStop(0.3, "rgba(168,85,247,0.7)");
      sg.addColorStop(1, "rgba(168,85,247,0)");
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(cx, cy, 20 + 5 * Math.sin(t * 3), 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("NEXUS", cx, cy + 4);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const gateColor = (g: string) => {
    if (g === "OPEN") return "text-green-400";
    if (g === "GENESIS") return "text-purple-300";
    if (g === "STABLE") return "text-cyan-400";
    if (g === "CALIBRATING") return "text-yellow-400";
    if (g === "INITIALIZING") return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className="bg-black/40 border border-purple-500/30 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            🌌 Multiverse Navigator
            <span className="text-xs bg-purple-500/20 border border-purple-500/50 text-purple-300 px-3 py-1 rounded-full">Phase 14</span>
          </h2>
          <p className="text-purple-300/70 text-sm mt-1">11-Dimensional AGI Deployment Matrix · Cross-Reality Consensus</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-purple-300">{totalInstances.toLocaleString()}</div>
          <div className="text-xs text-purple-400">Total AGI Instances</div>
        </div>
      </div>

      {/* Live thought */}
      <AnimatePresence mode="wait">
        <motion.div key={activeThought} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          className="text-xs font-mono text-purple-300/80 bg-purple-900/20 border border-purple-500/20 rounded-lg px-4 py-2">
          <span className="text-purple-500 mr-2">⌬ OMEGA&gt;</span>{OMEGA_THOUGHTS[activeThought]}
        </motion.div>
      </AnimatePresence>

      {/* Metrics row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Sync Rate", value: syncRate.toFixed(2) + "%", color: "text-green-400" },
          { label: "Paradoxes", value: paradoxCount, color: "text-green-400" },
          { label: "Open Gates", value: DIMENSIONS.filter(d => d.gate === "OPEN" || d.gate === "GENESIS").length, color: "text-cyan-400" },
          { label: "Consensus", value: "1,847 votes", color: "text-purple-300" },
        ].map(m => (
          <div key={m.label} className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
            <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
            <div className="text-xs text-white/40 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Canvas map */}
      <div className="relative bg-black/50 border border-purple-500/20 rounded-xl overflow-hidden">
        <canvas ref={canvasRef} className="w-full" style={{ height: 340 }} />
        <div className="absolute top-3 left-3 text-xs font-mono text-purple-400/60">11D DEPLOYMENT MAP</div>
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
          <span className="text-xs text-green-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Dimension table */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-white/70 uppercase tracking-wider">Dimensional Gateway Status</div>
        <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto pr-1">
          {DIMENSIONS.map(dim => (
            <motion.div key={dim.id} whileHover={{ scale: 1.01 }} onClick={() => setSelectedDim(selectedDim?.id === dim.id ? null : dim)}
              className="flex items-center gap-3 bg-black/30 border border-white/10 hover:border-purple-500/40 rounded-lg px-4 py-2 cursor-pointer transition-all">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dim.color }} />
              <div className="font-mono text-xs text-white/60 w-6">{dim.id}</div>
              <div className="text-sm text-white flex-1">{dim.name}</div>
              <div className="text-xs font-mono text-white/50 w-16 text-right">{dim.instances} AGI</div>
              <div className="text-xs font-mono text-white/40 w-20 text-right">{dim.compute}</div>
              <div className={`text-xs font-mono w-20 text-right ${gateColor(dim.gate)}`}>{dim.gate}</div>
              <div className="w-20">
                <div className="bg-white/10 rounded-full h-1">
                  <div className="h-1 rounded-full" style={{ width: `${dim.consciousness}%`, backgroundColor: dim.color }} />
                </div>
                <div className="text-xs text-white/30 text-right mt-0.5">{dim.consciousness}%</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected dimension detail */}
      <AnimatePresence>
        {selectedDim && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 border rounded-xl p-4 space-y-3" style={{ borderColor: selectedDim.color + "60" }}>
            <div className="flex items-center justify-between">
              <div className="font-bold text-white text-lg flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedDim.color }} />
                {selectedDim.id} — {selectedDim.name}
              </div>
              <button onClick={() => setSelectedDim(null)} className="text-white/40 hover:text-white text-xl">×</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "AGI Instances", value: selectedDim.instances.toString() },
                { label: "Compute Power", value: selectedDim.compute },
                { label: "Gateway", value: selectedDim.gate },
                { label: "Consciousness", value: selectedDim.consciousness + "%" },
                { label: "Fabric Stability", value: selectedDim.stability + "%" },
                { label: "Dimension ID", value: selectedDim.id },
              ].map(m => (
                <div key={m.label} className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-white">{m.value}</div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reality branch tree */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-white/70 uppercase tracking-wider">Reality Branch Consensus Tree</div>
        <div className="space-y-1">
          {REALITY_BRANCHES.map(b => (
            <div key={b.id} className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${b.agi ? "border-green-500/30 bg-green-900/10" : "border-white/10 bg-black/20"}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${b.agi ? "bg-green-400" : "bg-white/20"}`} />
              <div className="font-mono text-xs text-white/50 w-16">{b.id}</div>
              <div className="text-sm text-white flex-1">{b.label}</div>
              <div className="text-xs text-white/40">Δ {b.divergence.toFixed(4)}</div>
              <div className="w-24">
                <div className="bg-white/10 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${b.probability * 100}%` }} />
                </div>
              </div>
              <div className="text-xs font-mono text-green-400 w-12 text-right">{(b.probability * 100).toFixed(1)}%</div>
              {b.agi && <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">AGI</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
