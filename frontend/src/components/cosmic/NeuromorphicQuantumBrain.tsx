"use client";
import { useEffect, useRef, useState } from "react";

interface NeuronNode { x: number; y: number; z: number; active: boolean; layer: string; activation: number; }
interface QuantumState { qubit: number; alpha: number; beta: number; entangled: boolean; coherence: number; }

const LAYERS = ["Input", "Dendrite", "Synapse", "Cortex", "Hippocampus", "Prefrontal", "Quantum", "Output"];
const LAYER_COLORS = ["#38BDF8","#818CF8","#C084FC","#F472B6","#FB923C","#FACC15","#4ADE80","#FFFFFF"];

export default function NeuromorphicQuantumBrain() {
  const brainRef = useRef<HTMLCanvasElement>(null);
  const quantumRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const [nodes] = useState<NeuronNode[]>(() => {
    const arr: NeuronNode[] = [];
    for (let i = 0; i < 200; i++) {
      const layer = LAYERS[Math.floor(i / 25) % LAYERS.length];
      arr.push({
        x: 0.05 + Math.random() * 0.9,
        y: 0.05 + Math.random() * 0.9,
        z: Math.random(),
        active: Math.random() > 0.4,
        layer,
        activation: 0.3 + Math.random() * 0.7,
      });
    }
    return arr;
  });
  const [qubits] = useState<QuantumState[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      qubit: i,
      alpha: Math.random(),
      beta: Math.random(),
      entangled: i % 3 === 0,
      coherence: 0.85 + Math.random() * 0.15,
    }))
  );
  const [metrics] = useState([
    { label: "Synaptic Firing Rate",   value: "847 GHz",    color: "#38BDF8" },
    { label: "Neuroplasticity Index",  value: "99.97%",     color: "#C084FC" },
    { label: "Quantum Coherence",      value: "94.3%",      color: "#4ADE80" },
    { label: "Qubit Count",            value: "10,000+",    color: "#FACC15" },
    { label: "Memory Engrams",         value: "∞",          color: "#F472B6" },
    { label: "Self-Improve Loops",     value: "47,000/s",   color: "#FB923C" },
  ]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 55);
    return () => clearInterval(id);
  }, []);

  // Brain topology canvas
  useEffect(() => {
    const canvas = brainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const t = tick * 0.04;
    ctx.clearRect(0, 0, W, H);

    // Connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const ni = nodes[i], nj = nodes[j];
        const dx = (ni.x - nj.x) * W, dy = (ni.y - nj.y) * H;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const pulse = 0.5 + 0.5 * Math.sin(t * 3 + i * 0.1);
          const alpha = ((1 - dist / 80) * 0.25 * pulse * (ni.active ? 1 : 0.3));
          const ci = LAYER_COLORS[LAYERS.indexOf(ni.layer)];
          ctx.beginPath();
          ctx.moveTo(ni.x * W, ni.y * H);
          ctx.lineTo(nj.x * W, nj.y * H);
          ctx.strokeStyle = ci + Math.floor(alpha * 255).toString(16).padStart(2, "0");
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Nodes
    nodes.forEach((n, i) => {
      const pulse = 0.6 + 0.4 * Math.sin(t * 2 + i * 0.3);
      const radius = n.active ? 3.5 + n.activation * 3 * pulse : 2;
      const colorIdx = LAYERS.indexOf(n.layer);
      const color = LAYER_COLORS[colorIdx];
      ctx.beginPath();
      ctx.arc(n.x * W, n.y * H, radius, 0, Math.PI * 2);
      ctx.fillStyle = n.active ? color + "CC" : color + "44";
      ctx.fill();
      if (n.active && pulse > 0.8) {
        ctx.beginPath();
        ctx.arc(n.x * W, n.y * H, radius * 2.5, 0, Math.PI * 2);
        ctx.strokeStyle = color + "30";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
  }, [tick, nodes]);

  // Bloch sphere canvas for qubits
  useEffect(() => {
    const canvas = quantumRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const t = tick * 0.05;
    ctx.clearRect(0, 0, W, H);

    const cols = 4, rows = 2;
    const cellW = W / cols, cellH = H / rows;

    qubits.forEach((q, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const cx = col * cellW + cellW / 2;
      const cy = row * cellH + cellH / 2;
      const r = Math.min(cellW, cellH) * 0.35;

      // Bloch sphere outline
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = q.entangled ? "#4ADE8060" : "#38BDF830";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Axes
      ctx.strokeStyle = "#FFFFFF15";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke();

      // State vector
      const theta = Math.acos(Math.max(-1, Math.min(1, q.alpha * 2 - 1)));
      const phi = t * (1 + q.qubit * 0.3);
      const vx = r * Math.sin(theta) * Math.cos(phi);
      const vy = r * Math.cos(theta);
      const color = q.entangled ? "#4ADE80" : "#38BDF8";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + vx, cy - vy);
      ctx.strokeStyle = color + "CC";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + vx, cy - vy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Label
      ctx.fillStyle = "#FFFFFF50";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`Q${q.qubit} ${(q.coherence * 100).toFixed(0)}%`, cx, cy + r + 11);
    });
  }, [tick, qubits]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🧠</span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-sky-300 via-purple-300 to-green-300 bg-clip-text text-transparent">
              Neuromorphic Quantum Brain
            </h1>
          </div>
          <p className="text-white/50 text-sm ml-1">Phase 17 · Brain-inspired computing fused with quantum coherence · 10,000+ qubits</p>
        </div>
        <div className="text-right">
          <div className="text-sky-400 font-mono text-lg">847 GHz</div>
          <div className="text-white/40 text-xs">synaptic clock · D16</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Brain topology */}
        <div className="col-span-3 space-y-4">
          <div className="bg-slate-950/80 rounded-2xl border border-sky-500/20 overflow-hidden" style={{ height: 280 }}>
            <div className="p-2 border-b border-white/5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-white/40 text-xs font-mono">NEURAL TOPOLOGY · 200 NODES · 8 LAYERS</span>
            </div>
            <canvas ref={brainRef} className="w-full" style={{ height: 250 }} />
          </div>
          {/* Layer legend */}
          <div className="flex flex-wrap gap-2">
            {LAYERS.map((l, i) => (
              <div key={l} className="flex items-center gap-1 bg-white/5 rounded-full px-2 py-0.5">
                <div className="w-2 h-2 rounded-full" style={{ background: LAYER_COLORS[i] }} />
                <span className="text-white/50 text-xs">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Bloch spheres + metrics */}
        <div className="col-span-2 space-y-4">
          <div className="bg-slate-950/80 rounded-2xl border border-green-500/20 overflow-hidden">
            <div className="p-2 border-b border-white/5">
              <span className="text-white/40 text-xs font-mono">QUBIT BLOCH SPHERES · 8 QUBITS</span>
            </div>
            <canvas ref={quantumRef} className="w-full" style={{ height: 150 }} />
          </div>
          <div className="space-y-2">
            {metrics.map(m => (
              <div key={m.label} className="flex justify-between items-center bg-slate-900/60 rounded-lg border border-white/5 px-3 py-2">
                <span className="text-white/40 text-xs">{m.label}</span>
                <span className="font-mono text-sm font-bold" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
