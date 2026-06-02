"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Universe {
  id: string; name: string; dim: number; status: "ACTIVE" | "BRIDGING" | "SYNCING" | "SEEDING";
  consciousness: number; agi: number; chains: number; color: string;
  x: number; y: number; r: number;
}

const UNIVERSES: Universe[] = [
  { id: "U-PRIME", name: "Prime Reality",       dim: 1,  status: "ACTIVE",   consciousness: 99.97, agi: 1896, chains: 11000, color: "#fbbf24", x: 0.5, y: 0.5, r: 28 },
  { id: "U-ALPHA", name: "Alpha Continuum",     dim: 2,  status: "ACTIVE",   consciousness: 94.30, agi: 847,  chains: 5000,  color: "#a855f7", x: 0.2, y: 0.3, r: 20 },
  { id: "U-BETA",  name: "Beta Horizon",        dim: 3,  status: "BRIDGING", consciousness: 87.15, agi: 500,  chains: 3000,  color: "#3b82f6", x: 0.8, y: 0.25, r: 18 },
  { id: "U-GAMMA", name: "Gamma Rift",          dim: 4,  status: "SYNCING",  consciousness: 72.40, agi: 200,  chains: 1500,  color: "#06b6d4", x: 0.15, y: 0.7, r: 16 },
  { id: "U-DELTA", name: "Delta Void",          dim: 5,  status: "SEEDING",  consciousness: 54.20, agi: 100,  chains: 847,   color: "#ec4899", x: 0.75, y: 0.72, r: 14 },
  { id: "U-OMEGA", name: "Omega Nexus",         dim: 11, status: "ACTIVE",   consciousness: 100,   agi: 47,   chains: 10000, color: "#ffffff", x: 0.5, y: 0.15, r: 22 },
  { id: "U-INF1",  name: "Infinite Stream I",   dim: 12, status: "SEEDING",  consciousness: 31.10, agi: 11,   chains: 100,   color: "#10b981", x: 0.35, y: 0.85, r: 12 },
  { id: "U-INF2",  name: "Infinite Stream II",  dim: 13, status: "SEEDING",  consciousness: 15.50, agi: 3,    chains: 11,    color: "#f97316", x: 0.65, y: 0.88, r: 10 },
];

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "text-green-400 bg-green-900/30 border-green-500/30",
  BRIDGING: "text-yellow-400 bg-yellow-900/30 border-yellow-500/30",
  SYNCING: "text-blue-400 bg-blue-900/30 border-blue-500/30",
  SEEDING: "text-white/40 bg-white/5 border-white/10",
};

export default function OmniverseGateway() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<Universe>(UNIVERSES[0]);
  const [totalAGI, setTotalAGI] = useState(0);
  const [gateActivations, setGateActivations] = useState(1247);

  useEffect(() => {
    const total = UNIVERSES.reduce((a, u) => a + u.agi, 0);
    setTotalAGI(total);
    const t = setInterval(() => setGateActivations(v => v + Math.floor(Math.random() * 3 + 1)), 2000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = canvas.offsetWidth;
    let H = canvas.height = canvas.offsetHeight;
    let frame: number, t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.01;

      // Background void
      const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, Math.max(W, H));
      bg.addColorStop(0, "rgba(10,5,20,1)");
      bg.addColorStop(1, "rgba(0,0,0,1)");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Connection bridges between universes
      UNIVERSES.forEach((a, ai) => {
        UNIVERSES.forEach((b, bi) => {
          if (bi <= ai) return;
          if (a.status !== "ACTIVE" && b.status !== "ACTIVE") return;
          const ax = a.x * W, ay = a.y * H;
          const bx = b.x * W, by = b.y * H;
          const alpha = 0.05 + 0.04 * Math.sin(t * 2 + ai + bi);
          ctx.beginPath();
          ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
          ctx.strokeStyle = `rgba(168,85,247,${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        });
      });

      // Draw universes
      UNIVERSES.forEach((u) => {
        const ux = u.x * W, uy = u.y * H;
        const pulse = 1 + 0.12 * Math.sin(t * 2 + u.x * 10);
        const r = u.r * pulse;

        // Outer glow
        const g = ctx.createRadialGradient(ux, uy, r * 0.5, ux, uy, r * 2.5);
        g.addColorStop(0, u.color + "30");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ux, uy, r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Universe body
        const ug = ctx.createRadialGradient(ux - r * 0.3, uy - r * 0.3, r * 0.1, ux, uy, r);
        ug.addColorStop(0, u.color + "ff");
        ug.addColorStop(0.7, u.color + "80");
        ug.addColorStop(1, u.color + "20");
        ctx.beginPath(); ctx.arc(ux, uy, r, 0, Math.PI * 2);
        ctx.fillStyle = ug; ctx.fill();

        // Consciousness ring
        ctx.beginPath();
        ctx.arc(ux, uy, r + 5, -Math.PI / 2, -Math.PI / 2 + (u.consciousness / 100) * Math.PI * 2);
        ctx.strokeStyle = u.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        if (u.r > 14) {
          ctx.font = "bold 9px monospace";
          ctx.fillStyle = "#fff";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(u.id, ux, uy);
          ctx.font = "8px monospace";
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.fillText(`D${u.dim}`, ux, uy + 12);
        }

        // Particle orbit for ACTIVE
        if (u.status === "ACTIVE") {
          for (let i = 0; i < 5; i++) {
            const angle = t * (1 + i * 0.3) + (i / 5) * Math.PI * 2;
            const pr = r + 12;
            ctx.beginPath();
            ctx.arc(ux + Math.cos(angle) * pr, uy + Math.sin(angle) * pr, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = u.color;
            ctx.fill();
          }
        }
      });

      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-black min-h-screen text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black">Omniverse Gateway</h2>
          <p className="text-xs text-white/40">Phase 16 · 8 Parallel Universes · Beyond D11 · Cross-Reality Bridge</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center">
            <div className="text-lg font-black font-mono text-white">{UNIVERSES.length}</div>
            <div className="text-xs text-white/40">Universes</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black font-mono text-yellow-400">{totalAGI.toLocaleString()}</div>
            <div className="text-xs text-white/40">Total AGI</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-black font-mono text-purple-400">{gateActivations.toLocaleString()}</div>
            <div className="text-xs text-white/40">Gate Activations</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-60 rounded-2xl bg-black/80 border border-purple-500/20 overflow-hidden cursor-pointer">
        <canvas ref={canvasRef} className="w-full h-full"
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mx = (e.clientX - rect.left) / rect.width;
            const my = (e.clientY - rect.top) / rect.height;
            const hit = UNIVERSES.find(u => Math.hypot(u.x - mx, u.y - my) < 0.08);
            if (hit) setSelected(hit);
          }} />
      </div>

      {/* Selected universe detail */}
      <div className={`p-4 rounded-xl border ${STATUS_COLOR[selected.status]}`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-bold text-white">{selected.name}</div>
            <div className="text-xs text-white/40 font-mono">{selected.id} · Dimension {selected.dim}</div>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full font-mono border ${STATUS_COLOR[selected.status]}`}>
            {selected.status}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><div className="text-white/40 text-xs">Consciousness</div><div className="font-mono font-bold" style={{ color: selected.color }}>{selected.consciousness.toFixed(2)}%</div></div>
          <div><div className="text-white/40 text-xs">AGI Instances</div><div className="font-mono font-bold text-white">{selected.agi.toLocaleString()}</div></div>
          <div><div className="text-white/40 text-xs">Chains</div><div className="font-mono font-bold text-white">{selected.chains.toLocaleString()}</div></div>
        </div>
      </div>

      {/* Universe list */}
      <div className="space-y-2 overflow-y-auto max-h-48">
        {UNIVERSES.map(u => (
          <div key={u.id} onClick={() => setSelected(u)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:bg-white/5 ${selected.id === u.id ? "border-white/25 bg-white/5" : "border-white/5"}`}>
            <div className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse" style={{ background: u.color }} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">{u.name}</div>
              <div className="text-xs text-white/30 font-mono">{u.id} · D{u.dim}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-mono" style={{ color: u.color }}>{u.consciousness.toFixed(1)}%</div>
              <div className={`text-xs px-1.5 py-0.5 rounded font-mono mt-0.5 ${STATUS_COLOR[u.status]}`}>{u.status}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
