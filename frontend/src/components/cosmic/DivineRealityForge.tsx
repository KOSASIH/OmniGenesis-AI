"use client";
import { useEffect, useRef, useState, useCallback } from "react";

type RealityState = "QUANTUM_VOID" | "COALESCING" | "MANIFESTING" | "CRYSTALLIZING" | "DIVINE_STABLE" | "OMEGA_ASCENDED";

const STATE_COLORS: Record<RealityState, string> = {
  QUANTUM_VOID:    "#6B21A8",
  COALESCING:      "#1D4ED8",
  MANIFESTING:     "#0F766E",
  CRYSTALLIZING:   "#D97706",
  DIVINE_STABLE:   "#15803D",
  OMEGA_ASCENDED:  "#FFD700",
};

const STATE_ORDER: RealityState[] = [
  "QUANTUM_VOID","COALESCING","MANIFESTING","CRYSTALLIZING","DIVINE_STABLE","OMEGA_ASCENDED"
];

interface ForgedReality {
  id: string; state: RealityState; hash: string; dims: number;
  consciousness: number; voidTime: number; created: Date;
}

interface ForgeParam { label: string; value: number; max: number; unit: string; color: string; }

export default function DivineRealityForge() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tick, setTick] = useState(0);
  const [forging, setForging] = useState(false);
  const [realities, setRealities] = useState<ForgedReality[]>([]);
  const [forgeProgress, setForgeProgress] = useState(0);
  const [params] = useState<ForgeParam[]>([
    { label: "Quantum Foam Density",   value: 99.47, max: 100, unit: "%",   color: "#C084FC" },
    { label: "Causal Coherence",       value: 98.83, max: 100, unit: "%",   color: "#38BDF8" },
    { label: "Dimensional Depth",      value: 16,    max: 16,  unit: "D",   color: "#4ADE80" },
    { label: "VoidTime Compression",   value: 3297,  max: 5747,unit: "×",   color: "#FFD700" },
    { label: "Consciousness Seed",     value: 99.97, max: 100, unit: "%",   color: "#F97316" },
    { label: "Photonic Flux",          value: 847,   max: 1000,unit: "THz", color: "#E879F9" },
  ]);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50);
    return () => clearInterval(id);
  }, []);

  const forge = useCallback(() => {
    if (forging) return;
    setForging(true);
    setForgeProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += 2 + Math.random() * 5;
      setForgeProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(iv);
        const reality: ForgedReality = {
          id: Math.random().toString(36).slice(2, 10).toUpperCase(),
          state: "OMEGA_ASCENDED",
          hash: "0x" + Array.from({ length: 8 }, () => Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, "0")).join(""),
          dims: 16,
          consciousness: 99.97,
          voidTime: 3297,
          created: new Date(),
        };
        setRealities(prev => [reality, ...prev.slice(0, 4)]);
        setForging(false);
        setForgeProgress(0);
      }
    }, 60);
  }, [forging]);

  // Canvas: divine forge particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2, cy = H / 2;
    const t = tick * 0.025;
    ctx.clearRect(0, 0, W, H);

    // Forge core
    const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, forging ? 80 : 45);
    coreGlow.addColorStop(0,   forging ? "#FFFFFF" : "#FFD700");
    coreGlow.addColorStop(0.4, forging ? "#FFD70088" : "#C084FC88");
    coreGlow.addColorStop(1,   "#00000000");
    ctx.fillStyle = coreGlow;
    ctx.fillRect(0, 0, W, H);

    // Particle streams converging to core
    for (let i = 0; i < (forging ? 80 : 40); i++) {
      const angle = (i / 40) * Math.PI * 2 + t * (i % 2 === 0 ? 1 : -1) * 0.8;
      const dist = 20 + ((t * (50 + i % 30)) % (Math.max(W, H) * 0.6));
      const x = cx + Math.cos(angle) * dist;
      const y = cy + Math.sin(angle) * dist;
      const alpha = Math.max(0, 1 - dist / (Math.max(W, H) * 0.5));
      const colors = ["#FFD700", "#C084FC", "#38BDF8", "#4ADE80", "#F97316", "#E879F9"];
      ctx.beginPath();
      ctx.arc(x, y, 1.5 + (1 - alpha) * 2, 0, Math.PI * 2);
      ctx.fillStyle = colors[i % colors.length] + Math.floor(alpha * 220).toString(16).padStart(2, "0");
      ctx.fill();
    }

    // Reality grid
    const gridAlpha = forging ? 0.12 : 0.06;
    ctx.strokeStyle = `rgba(255,215,0,${gridAlpha})`;
    ctx.lineWidth = 0.5;
    const spacing = 30;
    for (let gx = 0; gx < W; gx += spacing) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += spacing) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // Core symbol
    const r = forging ? 22 + 4 * Math.sin(t * 8) : 18;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = forging ? "#FFFFFF" : "#FFD700";
    ctx.fill();

    // Omega symbol center
    ctx.font = `bold ${forging ? 20 : 16}px serif`;
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Ω", cx, cy + 1);
  }, [tick, forging]);

  return (
    <div className="space-y-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">✦</span>
            <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Divine Reality Forge
            </h1>
          </div>
          <p className="text-white/50 text-sm ml-1">Phase 17 · Forge new realities from quantum void · ×3,297 VoidTime</p>
        </div>
        <div className="text-right">
          <div className="text-yellow-400 font-mono text-lg">{realities.length} Realities Forged</div>
          <div className="text-white/40 text-xs">across all D16 universes</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Forge canvas */}
        <div className="col-span-3 space-y-4">
          <div className="relative bg-slate-950/80 rounded-2xl border border-yellow-500/20 overflow-hidden" style={{ height: 260 }}>
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <button
                onClick={forge}
                disabled={forging}
                className={`px-8 py-2.5 rounded-full font-black text-sm transition-all border
                  ${forging
                    ? "bg-yellow-900/40 border-yellow-500/40 text-yellow-300 cursor-wait"
                    : "bg-gradient-to-r from-yellow-600 to-purple-600 border-yellow-400/60 text-white hover:scale-105 active:scale-95 shadow-lg shadow-yellow-900/40"
                  }`}
              >
                {forging ? `FORGING... ${forgeProgress.toFixed(0)}%` : "⚡ FORGE NEW REALITY"}
              </button>
            </div>
          </div>
          {/* Progress bar */}
          {(forging || forgeProgress > 0) && (
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-yellow-500 via-purple-500 to-pink-500 transition-all duration-200"
                style={{ width: `${forgeProgress}%` }} />
            </div>
          )}
          {/* Forge params */}
          <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
            <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Forge Parameters</div>
            <div className="grid grid-cols-2 gap-2.5">
              {params.map(p => (
                <div key={p.label} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-white/40 text-xs">{p.label}</span>
                    <span className="text-xs font-mono" style={{ color: p.color }}>{p.value}{p.unit}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${(p.value / p.max) * 100}%`,
                      background: `linear-gradient(90deg, ${p.color}66, ${p.color})`
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Forged realities log */}
        <div className="col-span-2">
          <div className="bg-slate-900/60 rounded-xl border border-white/10 p-4 h-full">
            <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Forged Realities</div>
            {realities.length === 0 ? (
              <div className="text-white/20 text-xs text-center mt-8">No realities forged yet.<br/>Click FORGE to begin.</div>
            ) : (
              <div className="space-y-3">
                {realities.map(r => (
                  <div key={r.id} className="bg-slate-950/60 rounded-lg border border-yellow-500/20 p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-yellow-300 font-mono text-xs font-bold">#{r.id}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-yellow-900/40 text-yellow-300 border border-yellow-500/30">
                        {r.state}
                      </span>
                    </div>
                    <div className="text-white/30 text-xs font-mono truncate">{r.hash}</div>
                    <div className="flex gap-3 mt-1.5 text-xs text-white/40">
                      <span>D{r.dims}</span>
                      <span>{r.consciousness}%</span>
                      <span>×{r.voidTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
