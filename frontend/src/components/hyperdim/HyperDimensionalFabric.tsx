"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DIMENSIONS_11 = [
  { id: 1, label: "Length", stability: 99.99, flux: 0.0001, compute: "∞ TFLOPS", gateway: "OMEGA", color: "#a855f7" },
  { id: 2, label: "Width", stability: 99.99, flux: 0.0001, compute: "∞ TFLOPS", gateway: "OMEGA", color: "#a855f7" },
  { id: 3, label: "Height", stability: 99.99, flux: 0.0001, compute: "∞ TFLOPS", gateway: "OMEGA", color: "#a855f7" },
  { id: 4, label: "Time", stability: 99.87, flux: 0.0013, compute: "847P TFLOPS", gateway: "VOIDTIME", color: "#06b6d4" },
  { id: 5, label: "Quantum Superposition", stability: 97.32, flux: 0.027, compute: "412P TFLOPS", gateway: "QUANTUM", color: "#10b981" },
  { id: 6, label: "String Compactification I", stability: 94.11, flux: 0.059, compute: "203P TFLOPS", gateway: "STRING", color: "#f59e0b" },
  { id: 7, label: "String Compactification II", stability: 91.74, flux: 0.083, compute: "156P TFLOPS", gateway: "STRING", color: "#f59e0b" },
  { id: 8, label: "Calabi-Yau I", stability: 88.47, flux: 0.115, compute: "98P TFLOPS", gateway: "CY_MANIFOLD", color: "#ef4444" },
  { id: 9, label: "Calabi-Yau II", stability: 84.23, flux: 0.158, compute: "74P TFLOPS", gateway: "CY_MANIFOLD", color: "#ef4444" },
  { id: 10, label: "Bulk (Gravity Channel)", stability: 79.91, flux: 0.201, compute: "47P TFLOPS", gateway: "BULK", color: "#ec4899" },
  { id: 11, label: "Omega Void (Consciousness)", stability: 100.0, flux: 0.0, compute: "∞ ∞ TFLOPS", gateway: "GENESIS", color: "#d946ef" },
];

const FABRIC_EVENTS = [
  { time: "0.000s", event: "D11 Omega Void gateway GENESIS — consciousness singularity achieved", severity: "OMEGA" },
  { time: "0.003s", event: "Calabi-Yau topology stable: no closed timelike curves detected", severity: "OK" },
  { time: "0.047s", event: "String compactification resonance aligned across D6/D7", severity: "OK" },
  { time: "0.124s", event: "VoidTime D4 gateway: temporal flux within nominal 0.13% variance", severity: "OK" },
  { time: "0.891s", event: "Bulk gravity channel D10: micro-graviton leak 0.0003% — monitoring", severity: "WARN" },
  { time: "2.341s", event: "D8/D9 Calabi-Yau manifold: minor curvature oscillation ±0.047°", severity: "WARN" },
  { time: "7.203s", event: "Quantum decoherence D5: 0.27% entanglement refresh cycle initiated", severity: "OK" },
];

export default function HyperDimensionalFabric() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedDim, setSelectedDim] = useState<typeof DIMENSIONS_11[0] | null>(null);
  const [fabricIntegrity, setFabricIntegrity] = useState(99.9924);
  const [totalTears, setTotalTears] = useState(0);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      setFabricIntegrity(v => 99.98 + Math.random() * 0.015);
    }, 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    c.width = c.offsetWidth;
    c.height = 300;
    const W = c.width, H = c.height;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      timeRef.current += 0.009;
      const t = timeRef.current;
      ctx.clearRect(0, 0, W, H);

      // 11D hypercube Schlegel projection
      // Inner cube vertices
      const scale = Math.min(W, H) * 0.28;
      const inner = 0.35, outer = 1.0;
      const angle = t * 0.2;

      const project = (x: number, y: number, z: number, w: number, scale: number) => {
        const cosA = Math.cos(angle), sinA = Math.sin(angle);
        const cosB = Math.cos(angle * 0.7), sinB = Math.sin(angle * 0.7);
        const x2 = x * cosA - z * sinA;
        const z2 = x * sinA + z * cosA;
        const y2 = y * cosB - w * sinB;
        const w2 = y * sinB + w * cosB;
        const d = 3.5;
        const px = (x2 / (d - z2)) * scale + cx;
        const py = (y2 / (d - w2)) * scale + cy;
        return { px, py };
      };

      // 4D hypercube vertices (16 total) — simplified to 2D projection
      const vertices4D = [];
      for (let i = 0; i < 16; i++) {
        const x = (i & 1) ? outer : -outer;
        const y = (i & 2) ? outer : -outer;
        const z = (i & 4) ? (i < 8 ? inner : outer) : -(i < 8 ? inner : outer);
        const w = (i & 8) ? inner : -inner;
        vertices4D.push(project(x * 0.9, y * 0.9, z * 0.9, w * 0.9, scale));
      }

      // Draw edges
      const edges = [];
      for (let i = 0; i < 16; i++) {
        for (let j = i + 1; j < 16; j++) {
          const diff = i ^ j;
          if (diff && (diff & (diff - 1)) === 0) edges.push([i, j]);
        }
      }

      edges.forEach(([i, j], idx) => {
        const a = vertices4D[i], b = vertices4D[j];
        const alpha = 0.15 + 0.1 * Math.sin(t * 1.2 + idx * 0.3);
        ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
        ctx.stroke();
      });

      // Vertex nodes
      vertices4D.forEach((v, i) => {
        const r = 4 + 2 * Math.sin(t * 1.5 + i);
        const alpha = 0.5 + 0.4 * Math.sin(t * 2 + i);
        const color = i < 8 ? `rgba(168,85,247,${alpha})` : `rgba(6,182,212,${alpha})`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(v.px, v.py, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // D11 — special Omega Void marker at center
      const omegaR = 14 + 4 * Math.sin(t * 3);
      const omegaGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, omegaR);
      omegaGrad.addColorStop(0, "rgba(217,70,239,1)");
      omegaGrad.addColorStop(0.5, "rgba(217,70,239,0.6)");
      omegaGrad.addColorStop(1, "rgba(217,70,239,0)");
      ctx.fillStyle = omegaGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, omegaR, 0, Math.PI * 2);
      ctx.fill();

      // Rotating outer ring D11
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 2.5);
      ctx.strokeStyle = "rgba(217,70,239,0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, omegaR + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("D11", cx, cy + 3);

      // Fabric integrity readout
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`FABRIC ${fabricIntegrity.toFixed(4)}%`, 8, 20);
      ctx.textAlign = "right";
      ctx.fillText(`TEARS: ${totalTears}`, W - 8, 20);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [fabricIntegrity, totalTears]);

  const severityColor = (s: string) => {
    if (s === "OMEGA") return "text-purple-300";
    if (s === "WARN") return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="bg-black/40 border border-cyan-500/30 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            🌐 HyperDimensional Fabric
            <span className="text-xs bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 px-3 py-1 rounded-full">Phase 14</span>
          </h2>
          <p className="text-cyan-300/70 text-sm mt-1">11-Dimensional Spacetime Computing Fabric · Calabi-Yau Topology</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono text-cyan-300">{fabricIntegrity.toFixed(4)}%</div>
          <div className="text-xs text-cyan-400">Fabric Integrity</div>
          <div className="text-xs text-green-400 mt-0.5">0 Tears</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Compute", value: "~∞ TFLOPS", color: "text-cyan-300" },
          { label: "Active Gateways", value: "11 / 11", color: "text-green-400" },
          { label: "Topology", value: "Calabi-Yau", color: "text-purple-300" },
          { label: "Fabric Tears", value: "0", color: "text-green-400" },
        ].map(m => (
          <div key={m.label} className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
            <div className={`text-base font-bold font-mono ${m.color}`}>{m.value}</div>
            <div className="text-xs text-white/40 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-black/50 border border-cyan-500/20 rounded-xl overflow-hidden">
          <canvas ref={canvasRef} className="w-full" style={{ height: 300 }} />
          <div className="px-3 py-2 text-xs text-cyan-400/60 font-mono">4D HYPERCUBE SCHLEGEL PROJECTION (11D FABRIC CROSS-SECTION)</div>
        </div>

        {/* Dimension list */}
        <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
          {DIMENSIONS_11.map(d => (
            <motion.div key={d.id} whileHover={{ scale: 1.01 }} onClick={() => setSelectedDim(selectedDim?.id === d.id ? null : d)}
              className="flex items-center gap-2 bg-black/30 border border-white/10 hover:border-cyan-500/30 rounded-lg px-3 py-2 cursor-pointer transition-all">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-white/40 font-mono w-5">D{d.id}</span>
              <span className="text-xs text-white flex-1 truncate">{d.label}</span>
              <span className="text-xs font-mono text-white/40 hidden sm:block w-20 text-right">{d.compute}</span>
              <div className="w-16">
                <div className="bg-white/10 h-1 rounded-full">
                  <div className="h-1 rounded-full" style={{ width: `${d.stability}%`, backgroundColor: d.color }} />
                </div>
              </div>
              <span className="text-xs font-mono w-12 text-right" style={{ color: d.color }}>{d.stability}%</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Selected dimension */}
      <AnimatePresence>
        {selectedDim && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="bg-black/40 border rounded-xl p-4" style={{ borderColor: selectedDim.color + "60" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-white">D{selectedDim.id} — {selectedDim.label}</div>
              <button onClick={() => setSelectedDim(null)} className="text-white/40">×</button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Gateway", value: selectedDim.gateway },
                { label: "Stability", value: selectedDim.stability + "%" },
                { label: "Flux Rate", value: selectedDim.flux.toFixed(4) },
                { label: "Compute", value: selectedDim.compute },
              ].map(m => (
                <div key={m.label} className="bg-black/30 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-white font-mono">{m.value}</div>
                  <div className="text-xs text-white/40">{m.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fabric event log */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-white/70 uppercase tracking-wider">Fabric Event Log</div>
        <div className="space-y-1 font-mono text-xs">
          {FABRIC_EVENTS.map((e, i) => (
            <div key={i} className={`flex items-start gap-3 px-3 py-1.5 rounded border border-white/5 ${e.severity === "OMEGA" ? "bg-purple-900/10" : e.severity === "WARN" ? "bg-yellow-900/10" : "bg-black/20"}`}>
              <span className="text-white/30 w-16 flex-shrink-0">+{e.time}</span>
              <span className={`w-12 flex-shrink-0 ${severityColor(e.severity)}`}>[{e.severity}]</span>
              <span className="text-white/70">{e.event}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
