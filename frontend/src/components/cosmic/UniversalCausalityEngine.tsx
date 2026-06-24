"use client";
import { useEffect, useRef, useState } from "react";

interface CausalNode {
  id: string; label: string; x: number; y: number;
  cause: string[]; effect: string[]; certainty: number; color: string;
}

const NODES: CausalNode[] = [
  { id: "qv",  label: "Quantum\nVoid",        x: 0.12, y: 0.50, cause: [],           effect: ["qf","te"],  certainty: 100, color: "#C084FC" },
  { id: "qf",  label: "Quantum\nFoam",        x: 0.28, y: 0.28, cause: ["qv"],       effect: ["rt","ci"],  certainty: 99,  color: "#818CF8" },
  { id: "te",  label: "Temporal\nEntanglement",x: 0.28, y: 0.72, cause: ["qv"],       effect: ["ci","rg"],  certainty: 97,  color: "#38BDF8" },
  { id: "ci",  label: "Causal\nInception",    x: 0.50, y: 0.50, cause: ["qf","te"],  effect: ["rm","rc"],  certainty: 98,  color: "#FACC15" },
  { id: "rt",  label: "Reality\nThread",      x: 0.42, y: 0.18, cause: ["qf"],       effect: ["rm"],       certainty: 96,  color: "#4ADE80" },
  { id: "rg",  label: "Reality\nGrid",        x: 0.42, y: 0.82, cause: ["te"],       effect: ["rc"],       certainty: 95,  color: "#FB923C" },
  { id: "rm",  label: "Reality\nManifest",    x: 0.68, y: 0.30, cause: ["ci","rt"],  effect: ["os"],       certainty: 99,  color: "#F472B6" },
  { id: "rc",  label: "Reality\nCollapse",    x: 0.68, y: 0.70, cause: ["ci","rg"],  effect: ["os"],       certainty: 94,  color: "#E879F9" },
  { id: "os",  label: "Omega\nSingularity",   x: 0.88, y: 0.50, cause: ["rm","rc"],  effect: [],           certainty: 100, color: "#FFD700" },
];

export default function UniversalCausalityEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [interventions, setInterventions] = useState<Record<string, number>>({});

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60);
    return () => clearInterval(id);
  }, []);

  const getNodeAt = (px: number, py: number, W: number, H: number) => {
    return NODES.find(n => {
      const dx = n.x * W - px, dy = n.y * H - py;
      return Math.sqrt(dx * dx + dy * dy) < 24;
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const t = tick * 0.03;
    ctx.clearRect(0, 0, W, H);

    const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]));

    // Draw edges with directional animation
    NODES.forEach(n => {
      n.effect.forEach(eid => {
        const target = nodeMap[eid];
        if (!target) return;
        const x1 = n.x * W, y1 = n.y * H;
        const x2 = target.x * W, y2 = target.y * H;

        // Edge gradient
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, n.color + "80");
        grad.addColorStop(1, target.color + "80");
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = grad;
        ctx.lineWidth = selected === n.id || selected === eid ? 3 : 1.5;
        ctx.stroke();

        // Animated particle along edge
        const progress = ((t * 0.6 + NODES.indexOf(n) * 0.2) % 1);
        const px = x1 + (x2 - x1) * progress;
        const py = y1 + (y2 - y1) * progress;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = n.color + "CC";
        ctx.fill();

        // Arrow tip
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const ax = x2 - 20 * Math.cos(angle);
        const ay = y2 - 20 * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(x2 - 18 * Math.cos(angle - 0.4), y2 - 18 * Math.sin(angle - 0.4));
        ctx.lineTo(ax + 14 * Math.cos(angle), ay + 14 * Math.sin(angle));
        ctx.lineTo(x2 - 18 * Math.cos(angle + 0.4), y2 - 18 * Math.sin(angle + 0.4));
        ctx.fillStyle = target.color + "90";
        ctx.fill();
      });
    });

    // Draw nodes
    NODES.forEach(n => {
      const nx = n.x * W, ny = n.y * H;
      const isSelected = selected === n.id;
      const r = isSelected ? 22 : 17;
      const hasIntervention = !!interventions[n.id];

      // Node glow
      const glow = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 2);
      glow.addColorStop(0, n.color + "50");
      glow.addColorStop(1, "#00000000");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(nx, ny, r * 2, 0, Math.PI * 2);
      ctx.fill();

      // Node circle
      ctx.beginPath();
      ctx.arc(nx, ny, r, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? n.color : n.color + "55";
      ctx.fill();
      ctx.strokeStyle = n.color + (isSelected ? "FF" : "88");
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();

      // Intervention ring
      if (hasIntervention) {
        ctx.beginPath();
        ctx.arc(nx, ny, r + 5 + 3 * Math.sin(t * 4), 0, Math.PI * 2);
        ctx.strokeStyle = "#FFD70080";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      const lines = n.label.split("\n");
      ctx.fillStyle = isSelected ? "#FFFFFF" : "#FFFFFFAA";
      ctx.font = `${isSelected ? "bold " : ""}9px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      lines.forEach((line, li) => ctx.fillText(line, nx, ny + (li - (lines.length - 1) / 2) * 10));

      // Certainty badge
      ctx.fillStyle = n.color + "CC";
      ctx.font = "8px monospace";
      ctx.fillText(`${n.certainty}%`, nx, ny + r + 9);
    });

    // Click handler
    canvas.onclick = (e) => {
      const rect = canvas.getBoundingClientRect();
      const px = (e.clientX - rect.left) * (W / rect.width);
      const py = (e.clientY - rect.top) * (H / rect.height);
      const hit = getNodeAt(px, py, W, H);
      setSelected(hit ? hit.id : null);
    };
  }, [tick, selected, interventions]);

  const selectedNode = NODES.find(n => n.id === selected);

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🔗</span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-sky-300 via-yellow-300 to-green-300 bg-clip-text text-transparent">
              Universal Causality Engine
            </h1>
          </div>
          <p className="text-white/50 text-sm ml-1">Phase 17 · Causal graph of all reality · Click nodes to inspect</p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-mono text-lg">{NODES.length} Causal Nodes</div>
          <div className="text-white/40 text-xs">Omega Singularity convergence</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Causal graph */}
        <div className="col-span-2 bg-slate-950/80 rounded-2xl border border-sky-500/20 overflow-hidden" style={{ height: 400 }}>
          <div className="p-2 border-b border-white/5">
            <span className="text-white/40 text-xs font-mono">CAUSAL DAG · UNIVERSAL REALITY CAUSALITY</span>
          </div>
          <canvas ref={canvasRef} className="w-full cursor-pointer" style={{ height: 364 }} />
        </div>

        {/* Selected node detail + intervention */}
        <div className="space-y-3">
          {selectedNode ? (
            <div className="bg-slate-900/70 rounded-xl border p-4 space-y-3" style={{ borderColor: selectedNode.color + "50" }}>
              <div className="font-bold text-lg" style={{ color: selectedNode.color }}>
                {selectedNode.label.replace("\n", " ")}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/40">Certainty</span>
                  <span className="font-mono" style={{ color: selectedNode.color }}>{selectedNode.certainty}%</span>
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-1">Causes (Parents)</div>
                  {selectedNode.cause.length === 0
                    ? <div className="text-white/20 text-xs">Root cause — no parents</div>
                    : selectedNode.cause.map(c => {
                        const n = NODES.find(x => x.id === c);
                        return <div key={c} className="text-xs font-mono" style={{ color: n?.color }}>{n?.label.replace("\n"," ")}</div>;
                      })
                  }
                </div>
                <div>
                  <div className="text-white/40 text-xs mb-1">Effects (Children)</div>
                  {selectedNode.effect.length === 0
                    ? <div className="text-white/20 text-xs">Terminal node</div>
                    : selectedNode.effect.map(e => {
                        const n = NODES.find(x => x.id === e);
                        return <div key={e} className="text-xs font-mono" style={{ color: n?.color }}>{n?.label.replace("\n"," ")}</div>;
                      })
                  }
                </div>
              </div>
              <button
                onClick={() => setInterventions(prev => ({ ...prev, [selectedNode.id]: (prev[selectedNode.id] || 0) + 1 }))}
                className="w-full py-2 rounded-lg text-xs font-bold border transition-all hover:opacity-80 active:scale-95"
                style={{ background: selectedNode.color + "22", borderColor: selectedNode.color + "55", color: selectedNode.color }}
              >
                ⚡ INTERVENE
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/40 rounded-xl border border-white/10 p-4 text-center text-white/20 text-sm">
              Click a node to inspect causality
            </div>
          )}

          {/* Intervention log */}
          {Object.keys(interventions).length > 0 && (
            <div className="bg-slate-900/60 rounded-xl border border-yellow-500/20 p-3">
              <div className="text-white/40 text-xs font-bold uppercase mb-2">Interventions</div>
              {Object.entries(interventions).map(([id, count]) => {
                const n = NODES.find(x => x.id === id);
                return (
                  <div key={id} className="flex justify-between text-xs mb-1">
                    <span style={{ color: n?.color }}>{n?.label.replace("\n"," ")}</span>
                    <span className="text-white/40">×{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Causal metrics */}
          <div className="bg-slate-900/60 rounded-xl border border-white/10 p-3 space-y-2">
            <div className="text-white/40 text-xs font-bold uppercase">Engine Metrics</div>
            {[
              { label: "Causal Completeness", v: "100%",    c: "#FFD700" },
              { label: "Counterfactuals/s",   v: "∞",       c: "#C084FC" },
              { label: "DAG Depth",           v: "9 layers",c: "#38BDF8" },
              { label: "Backdoor Paths",      v: "0",       c: "#4ADE80" },
            ].map(m => (
              <div key={m.label} className="flex justify-between text-xs">
                <span className="text-white/40">{m.label}</span>
                <span className="font-mono" style={{ color: m.c }}>{m.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
