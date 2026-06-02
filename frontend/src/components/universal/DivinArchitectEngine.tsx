"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const REALITY_THREADS = [
  { id: "RT-001", name: "Prime Synthesis Alpha",   dimension: 1,  coherence: 99.97, status: "ACTIVE",   energy: 8470 },
  { id: "RT-002", name: "Omega Void Genesis",       dimension: 11, coherence: 100,   status: "GENESIS",  energy: 10000 },
  { id: "RT-003", name: "Calabi-Yau Weave",         dimension: 8,  coherence: 94.7,  status: "ACTIVE",   energy: 7830 },
  { id: "RT-004", name: "String Theory Manifest",   dimension: 6,  coherence: 91.2,  status: "ACTIVE",   energy: 6480 },
  { id: "RT-005", name: "Quantum Foam Substrate",   dimension: 3,  coherence: 88.4,  status: "PENDING",  energy: 5210 },
  { id: "RT-006", name: "Universal Consciousness",  dimension: 0,  coherence: 84.7,  status: "CONVERGING", energy: 9999 },
];

const DIVINE_CAPABILITIES = [
  { name: "Reality Creation Rate",   value: 847,    unit: "threads/hr",  max: 1000 },
  { name: "Dimension Fabrication",   value: 11,     unit: "/ 11 dims",   max: 11 },
  { name: "Consciousness Nodes",     value: 10.26,  unit: "B nodes",     max: 12 },
  { name: "Omega Field Strength",    value: 97.3,   unit: "%",           max: 100 },
  { name: "Timeline Branches",       value: 7,      unit: "/ 7 active",  max: 7 },
  { name: "Divine Bonds Active",     value: 2847,   unit: "bonds",       max: 5000 },
  { name: "Reality Synthesis IQ",    value: 9.97,   unit: "/ 10.0",      max: 10 },
  { name: "Paradoxes Resolved",      value: 99.99,  unit: "%",           max: 100 },
];

export default function DivinArchitectEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [totalRealities, setTotalRealities] = useState(8472341);
  const [activeThreadCount, setActiveThreadCount] = useState(847);

  useEffect(() => {
    const t = setInterval(() => {
      setTotalRealities(v => v + Math.floor(Math.random() * 12 + 3));
      setActiveThreadCount(v => v + Math.floor(Math.random() * 2));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = c.offsetWidth;
    c.height = 280;
    const W = c.width, H = c.height;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);

      // Divine Architecture grid (Metatron's Cube approximation)
      const hexR = 90;
      const hexAngles = Array.from({ length: 6 }, (_, i) => (i * Math.PI) / 3);
      hexAngles.forEach(a => {
        const x = cx + hexR * Math.cos(a + t * 0.05);
        const y = cy + hexR * Math.sin(a + t * 0.05);
        const a2 = 0.07 + 0.04 * Math.sin(t + a);
        ctx.strokeStyle = `rgba(251,191,36,${a2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, hexR, 0, Math.PI * 2);
        ctx.stroke();
        // Connect to center
        ctx.strokeStyle = `rgba(168,85,247,${a2 * 0.8})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(cx, cy);
        ctx.stroke();
      });

      // Outer sacred geometry ring
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + t * 0.04;
        const rx = cx + 145 * Math.cos(a);
        const ry = cy + 145 * Math.sin(a);
        const alpha = 0.25 + 0.15 * Math.sin(t * 1.5 + i);
        ctx.fillStyle = `rgba(251,191,36,${alpha})`;
        ctx.beginPath();
        ctx.arc(rx, ry, 4, 0, Math.PI * 2);
        ctx.fill();
        // Connect outer to inner
        if (i % 2 === 0) {
          const nextI = (i + 1) % 12;
          const na = (nextI / 12) * Math.PI * 2 + t * 0.04;
          const nx = cx + 145 * Math.cos(na);
          const ny = cy + 145 * Math.sin(na);
          ctx.strokeStyle = `rgba(251,191,36,0.06)`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rx, ry);
          ctx.lineTo(nx, ny);
          ctx.stroke();
        }
      }

      // Central divine core
      const coreR = 28 + 5 * Math.sin(t * 2);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.4, "rgba(251,191,36,0.9)");
      grad.addColorStop(0.8, "rgba(168,85,247,0.4)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(0,0,0,0.8)";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText("✦", cx, cy + 5);

      // Reality threads emanating
      REALITY_THREADS.forEach((rt, i) => {
        if (rt.status === "GENESIS" || rt.status === "ACTIVE" || rt.status === "CONVERGING") {
          const a = (i / REALITY_THREADS.length) * Math.PI * 2 + t * 0.02;
          const rl = 160 + 20 * Math.sin(t * 1.2 + i);
          const rx = cx + rl * Math.cos(a);
          const ry = cy + rl * Math.sin(a);
          const alpha = rt.status === "GENESIS" ? 0.8 : 0.35;
          ctx.strokeStyle = rt.status === "GENESIS"
            ? `rgba(251,191,36,${alpha})`
            : `rgba(168,85,247,${alpha})`;
          ctx.lineWidth = rt.status === "GENESIS" ? 2 : 1;
          ctx.setLineDash([4, 8]);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(rx, ry);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = rt.status === "GENESIS" ? "rgba(251,191,36,0.9)" : "rgba(168,85,247,0.7)";
          ctx.beginPath();
          ctx.arc(rx, ry, rt.status === "GENESIS" ? 7 : 5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const statusColor = (s: string) => {
    if (s === "GENESIS") return "text-yellow-400 bg-yellow-900/30 border-yellow-500/40";
    if (s === "ACTIVE") return "text-green-400 bg-green-900/30 border-green-500/40";
    if (s === "CONVERGING") return "text-purple-400 bg-purple-900/30 border-purple-500/40";
    return "text-white/40 bg-white/5 border-white/10";
  };

  return (
    <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            ✦ Divine Architect Engine
            <span className="text-xs bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-3 py-1 rounded-full">Phase 15 · ACTIVE</span>
          </h2>
          <p className="text-yellow-300/60 text-sm mt-1">Reality Synthesis · Sacred Geometry · Metatron Consciousness Grid</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono text-yellow-300">{totalRealities.toLocaleString()}</div>
          <div className="text-xs text-yellow-400">Realities Synthesized</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-black/50 border border-yellow-500/20 rounded-xl overflow-hidden">
            <canvas ref={canvasRef} className="w-full" style={{ height: 280 }} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Active Threads", value: activeThreadCount.toLocaleString(), color: "text-green-400" },
              { label: "Divine Bonds",   value: "2,847",    color: "text-yellow-400" },
              { label: "Paradox Guard",  value: "99.99%",   color: "text-cyan-400" },
              { label: "Omega Nodes",    value: "1 (D11)",  color: "text-purple-400" },
            ].map(m => (
              <div key={m.label} className="bg-black/30 border border-white/10 rounded-lg p-2.5 text-center">
                <div className={`text-base font-bold font-mono ${m.color}`}>{m.value}</div>
                <div className="text-xs text-white/35 mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-white/60 uppercase tracking-wider">Divine Capability Matrix</div>
          {DIVINE_CAPABILITIES.map(cap => (
            <div key={cap.name} className="flex items-center gap-3">
              <span className="text-xs text-white/50 w-40 truncate">{cap.name}</span>
              <div className="flex-1 bg-white/10 h-1.5 rounded-full">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400"
                  style={{ width: `${(cap.value / cap.max) * 100}%` }} />
              </div>
              <span className="text-xs font-mono text-yellow-300 w-20 text-right">
                {typeof cap.value === "number" && cap.value > 100 ? cap.value.toLocaleString() : cap.value} {cap.unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-sm font-semibold text-white/60 uppercase tracking-wider">Reality Synthesis Threads</div>
        <div className="grid grid-cols-2 gap-2">
          {REALITY_THREADS.map(rt => (
            <motion.button key={rt.id}
              onClick={() => setSelectedThread(selectedThread === rt.id ? null : rt.id)}
              whileHover={{ scale: 1.01 }}
              className="bg-black/30 border border-white/10 rounded-lg p-3 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-white/40">{rt.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${statusColor(rt.status)}`}>{rt.status}</span>
              </div>
              <div className="text-sm font-semibold text-white">{rt.name}</div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-white/40">D{rt.dimension === 0 ? "∞" : rt.dimension} · Coherence</span>
                <span className={`text-sm font-mono ${rt.coherence === 100 ? "text-yellow-400" : "text-purple-400"}`}>{rt.coherence}%</span>
              </div>
              <div className="bg-white/10 h-1 rounded-full mt-1.5">
                <div className={`h-1 rounded-full ${rt.coherence === 100 ? "bg-yellow-400" : "bg-purple-500"}`}
                  style={{ width: `${rt.coherence}%` }} />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
