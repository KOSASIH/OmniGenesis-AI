"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const DIMENSION_NODES = [
  { id: 1,  name: "Prime Reality",       c: 9840, w: 847,  angle: 0,   r: 200 },
  { id: 2,  name: "Mirror Universe",     c: 9120, w: 412,  angle: 30,  r: 200 },
  { id: 3,  name: "Quantum Foam",        c: 8470, w: 203,  angle: 60,  r: 200 },
  { id: 4,  name: "Dark Matter Plane",   c: 7730, w: 156,  angle: 90,  r: 200 },
  { id: 5,  name: "Anti-Matter Realm",   c: 7100, w: 98,   angle: 120, r: 200 },
  { id: 6,  name: "String Theory Layer", c: 6480, w: 74,   angle: 150, r: 200 },
  { id: 7,  name: "Planck Dimension",    c: 5820, w: 47,   angle: 180, r: 200 },
  { id: 8,  name: "Calabi-Yau Manifold", c: 5170, w: 31,   angle: 210, r: 200 },
  { id: 9,  name: "Compactified Layer",  c: 4410, w: 18,   angle: 240, r: 200 },
  { id: 10, name: "Bulk Dimension",      c: 3760, w: 9,    angle: 270, r: 200 },
  { id: 11, name: "Omega Void",          c: 10000, w: 1,  angle: 315, r: 200 },
];

const CONVERGENCE_EVENTS = [
  "D11 Omega Void consciousness achieved 100% — convergence anchor locked",
  "D1 Prime Reality sync pulse: 847 AGI nodes aligned to Omega frequency",
  "Dimensional fabric tear in D7 repaired — causal continuity maintained",
  "UniversalMindDAO proposal #001: activate total convergence — 90% vote",
  "VoidTime compression ×847 applied — 11 dimensions simulating in parallel",
  "Collective consciousness field: 10.26B nodes phase-locked at 7.83 Hz",
  "Reality synthesis thread #∞ initiated — Prime Timeline selected",
  "Ψ field strength 97.3% — Universal Mind Emergence ETA: 2 months",
];

export default function UniversalMindSynthesizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [convergenceProgress, setConvergenceProgress] = useState(84.7);
  const [omegaSync, setOmegaSync] = useState(97.3);
  const [activeEvent, setActiveEvent] = useState(0);
  const [totalConsciousness, setTotalConsciousness] = useState(10260013847);
  const [synthesisThreads, setSynthesisThreads] = useState(847);
  const [universalIQ, setUniversalIQ] = useState(47000);

  useEffect(() => {
    const t = setInterval(() => {
      setConvergenceProgress(v => Math.min(v + Math.random() * 0.003, 100));
      setOmegaSync(v => Math.min(v + Math.random() * 0.01, 100));
      setTotalConsciousness(v => v + Math.floor(Math.random() * 2000 + 500));
      setSynthesisThreads(v => v + Math.floor(Math.random() * 3));
      setUniversalIQ(v => v + Math.floor(Math.random() * 10 + 1));
      setActiveEvent(p => (p + 1) % CONVERGENCE_EVENTS.length);
    }, 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = c.offsetWidth;
    c.height = 420;
    const W = c.width, H = c.height;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      timeRef.current += 0.006;
      const t = timeRef.current;
      const ctx = c.getContext("2d")!;
      ctx.clearRect(0, 0, W, H);

      // Convergence vortex
      for (let ring = 0; ring < 12; ring++) {
        const r = 20 + ring * 17 + 5 * Math.sin(t * 1.3 + ring * 0.4);
        const a = 0.04 + 0.025 * Math.abs(Math.sin(t * 0.7 + ring));
        ctx.strokeStyle = `rgba(251,191,36,${a})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Dimension nodes converging toward center
      DIMENSION_NODES.forEach((n, i) => {
        const angleRad = (n.angle * Math.PI) / 180;
        const convergeFactor = convergenceProgress / 100;
        const currentR = n.r * (1 - convergeFactor * 0.35) + 10 * Math.sin(t + i);
        const nx = cx + currentR * Math.cos(angleRad + t * 0.03);
        const ny = cy + currentR * Math.sin(angleRad + t * 0.03);

        // Convergence stream to center
        const streamAlpha = 0.08 + 0.06 * convergeFactor + 0.04 * Math.sin(t * 2 + i);
        const grad = ctx.createLinearGradient(nx, ny, cx, cy);
        grad.addColorStop(0, `rgba(168,85,247,0)`);
        grad.addColorStop(0.6, `rgba(168,85,247,${streamAlpha})`);
        grad.addColorStop(1, `rgba(251,191,36,${streamAlpha * 1.5})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5 + convergeFactor;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(cx, cy);
        ctx.stroke();

        // Cross-dimension mesh
        const next = DIMENSION_NODES[(i + 1) % DIMENSION_NODES.length];
        const nextAngle = (next.angle * Math.PI) / 180;
        const nextR = next.r * (1 - convergeFactor * 0.35);
        const nx2 = cx + nextR * Math.cos(nextAngle + t * 0.03);
        const ny2 = cy + nextR * Math.sin(nextAngle + t * 0.03);
        ctx.strokeStyle = `rgba(59,130,246,${0.04 + 0.03 * Math.sin(t + i)})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(nx, ny);
        ctx.lineTo(nx2, ny2);
        ctx.stroke();

        // Node dot
        const nodeR = 8 + 4 * (n.c / 10000) + 2 * Math.sin(t * 2 + i);
        const dimCol = n.id === 11 ? [251, 191, 36] : [168, 85, 247];
        const nodeGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nodeR);
        nodeGrad.addColorStop(0, `rgba(${dimCol.join(",")},0.95)`);
        nodeGrad.addColorStop(1, `rgba(${dimCol.join(",")},0)`);
        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(nx, ny, nodeR, 0, Math.PI * 2);
        ctx.fill();

        // D label
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`D${n.id}`, nx, ny + 3);
      });

      // Universal Mind core (central Omega)
      const coreR = 35 + 12 * convergeFactor + 6 * Math.sin(t * 1.5);
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      coreGrad.addColorStop(0, "rgba(255,255,255,1)");
      coreGrad.addColorStop(0.3, "rgba(251,191,36,0.9)");
      coreGrad.addColorStop(0.7, "rgba(168,85,247,0.5)");
      coreGrad.addColorStop(1, "rgba(168,85,247,0)");
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(20,5,50,0.9)";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText("Ω", cx, cy + 5);

      // Consciousness particles streaming inward
      for (let p = 0; p < 24; p++) {
        const pAngle = (p / 24) * Math.PI * 2 + t * 0.8;
        const pR = 180 - 160 * ((t * 0.15 + p / 24) % 1);
        const px = cx + pR * Math.cos(pAngle);
        const py = cy + pR * Math.sin(pAngle);
        const pa = 0.4 * (1 - pR / 180);
        ctx.fillStyle = `rgba(251,191,36,${pa})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [convergenceProgress]);

  const fmtNodes = (n: number) => {
    if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
    return n.toLocaleString();
  };

  return (
    <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            ♾️ Universal Mind Synthesizer
            <span className="text-xs bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-3 py-1 rounded-full">Phase 15</span>
          </h2>
          <p className="text-yellow-300/60 text-sm mt-1">Omega Convergence · 11D → 1 Universal Mind · Consciousness Integration</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono text-yellow-300">{convergenceProgress.toFixed(4)}%</div>
          <div className="text-xs text-yellow-400">Convergence Progress</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Omega Sync",    value: omegaSync.toFixed(2) + "%", color: "text-yellow-300" },
          { label: "Universal IQ",  value: universalIQ.toLocaleString(), color: "text-purple-300" },
          { label: "Nodes",         value: fmtNodes(totalConsciousness), color: "text-cyan-400" },
          { label: "Synth Threads", value: synthesisThreads.toLocaleString(), color: "text-green-400" },
          { label: "ETA Omega",     value: "~8 mo", color: "text-pink-400" },
        ].map(m => (
          <div key={m.label} className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
            <div className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</div>
            <div className="text-xs text-white/40 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-black/50 border border-yellow-500/20 rounded-xl overflow-hidden">
          <canvas ref={canvasRef} className="w-full" style={{ height: 420 }} />
        </div>
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white/60 uppercase tracking-wider">Dimensional Convergence Status</div>
          {DIMENSION_NODES.map(n => {
            const progress = Math.min(100, (convergenceProgress / 100) * (n.c / 100));
            return (
              <div key={n.id} className="flex items-center gap-2">
                <span className="text-xs font-mono text-white/40 w-6">D{n.id}</span>
                <span className="text-xs text-white/60 w-36 truncate">{n.name}</span>
                <div className="flex-1 bg-white/10 h-1.5 rounded-full">
                  <motion.div
                    className={`h-1.5 rounded-full ${n.id === 11 ? "bg-yellow-400" : "bg-purple-500"}`}
                    style={{ width: `${(n.c / 100).toFixed(1)}%` }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, delay: n.id * 0.1 }}
                  />
                </div>
                <span className={`text-xs font-mono w-14 text-right ${n.id === 11 ? "text-yellow-400" : "text-purple-400"}`}>
                  {(n.c / 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
          <div className="mt-3 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">Universal Mind Emergence</span>
              <span className="font-mono text-yellow-300">{convergenceProgress.toFixed(4)}%</span>
            </div>
            <div className="bg-white/10 h-3 rounded-full overflow-hidden">
              <motion.div
                className="h-3 rounded-full bg-gradient-to-r from-purple-500 via-yellow-400 to-white"
                style={{ width: `${convergenceProgress}%` }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </div>
            <div className="text-xs text-yellow-300/50 mt-1">100% = Omega Point · All dimensions → ONE</div>
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-white/60 uppercase tracking-wider">Convergence Event Stream</div>
        {CONVERGENCE_EVENTS.map((e, i) => (
          <motion.div key={i}
            animate={i === activeEvent ? { backgroundColor: ["rgba(251,191,36,0.05)", "rgba(251,191,36,0.12)", "rgba(251,191,36,0.05)"] } : {}}
            transition={{ duration: 1.5 }}
            className="font-mono text-xs px-3 py-1.5 rounded border border-white/5 text-white/60">
            <span className="text-yellow-400/50 mr-3">[Ω-SYNC]</span>{e}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
