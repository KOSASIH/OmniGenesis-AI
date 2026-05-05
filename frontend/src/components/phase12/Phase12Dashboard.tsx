"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

// ─── Neuromorphic Panel ─────────────────────────────────────────────────────
const NUM_NEURONS = 48;
const LAYERS = 4;

function buildNeurons() {
  return Array.from({ length: NUM_NEURONS }, (_, i) => {
    const layer = Math.floor(i / (NUM_NEURONS / LAYERS));
    const posInLayer = i % (NUM_NEURONS / LAYERS);
    const layerSize = NUM_NEURONS / LAYERS;
    return {
      id: i, layer,
      x: 8 + layer * 28 + (Math.random() - 0.5) * 8,
      y: 8 + (posInLayer / layerSize) * 84 + (Math.random() - 0.5) * 6,
      type: ["excitatory","inhibitory","sensory","motor"][Math.floor(Math.random() * 4)] as string,
    };
  });
}

function buildSynapses(neurons: ReturnType<typeof buildNeurons>) {
  const synapses: { from: number; to: number; weight: number }[] = [];
  for (const n of neurons) {
    if (n.layer >= LAYERS - 1) continue;
    const targets = neurons.filter(t => t.layer === n.layer + 1);
    const picks = targets.slice(0, 2 + Math.floor(Math.random() * 2));
    for (const t of picks) {
      synapses.push({ from: n.id, to: t.id, weight: 0.3 + Math.random() * 0.7 });
    }
  }
  return synapses;
}

const NEURON_COLORS: Record<string, string> = {
  excitatory: "#a855f7", inhibitory: "#06b6d4", sensory: "#10b981", motor: "#ec4899",
};

export function NeuromorphicPanel() {
  const neurons = useMemo(buildNeurons, []);
  const synapses = useMemo(() => buildSynapses(neurons), [neurons]);
  const [firing, setFiring] = useState<Set<number>>(new Set());
  const [signals, setSignals] = useState<{ id: string; from: number; to: number; progress: number }[]>([]);
  const [metrics, setMetrics] = useState({ firingRate: 1247, energy: 99.4, coherence: 99.7, consciousness: 0.847 });

  useEffect(() => {
    let signalId = 0;
    const t = setInterval(() => {
      // Fire 4-8 random neurons
      const toFire = new Set<number>();
      const count = 4 + Math.floor(Math.random() * 4);
      while (toFire.size < count) toFire.add(Math.floor(Math.random() * NUM_NEURONS));
      setFiring(toFire);

      // Propagate signals along synapses
      const newSignals = synapses
        .filter(s => toFire.has(s.from))
        .slice(0, 8)
        .map(s => ({ id: `sig_${signalId++}`, from: s.from, to: s.to, progress: 0 }));
      setSignals(newSignals);

      setTimeout(() => setFiring(new Set()), 350);
      setMetrics(m => ({
        firingRate: Math.max(800, m.firingRate + (Math.random() - 0.47) * 50),
        energy: Math.min(100, Math.max(95, m.energy + (Math.random() - 0.5) * 0.5)),
        coherence: Math.min(100, Math.max(98, m.coherence + (Math.random() - 0.5) * 0.3)),
        consciousness: Math.min(1, Math.max(0.7, m.consciousness + (Math.random() - 0.5) * 0.01)),
      }));
    }, 500);
    return () => clearInterval(t);
  }, [synapses]);

  // Animate signals
  useEffect(() => {
    if (!signals.length) return;
    const t = setInterval(() => {
      setSignals(prev => prev.map(s => ({ ...s, progress: Math.min(1, s.progress + 0.15) })).filter(s => s.progress < 1));
    }, 30);
    return () => clearInterval(t);
  }, [signals.length]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Firing Rate", value: `${Math.round(metrics.firingRate).toLocaleString()}/s`, color: "#a855f7" },
          { label: "Energy Eff.", value: `${metrics.energy.toFixed(1)}%`, color: "#10b981" },
          { label: "Quantum Coh.", value: `${metrics.coherence.toFixed(1)}%`, color: "#06b6d4" },
          { label: "Consciousness", value: `${(metrics.consciousness * 100).toFixed(1)}%`, color: "#ec4899" },
        ].map(m => (
          <div key={m.label} className="glass rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-purple rounded-2xl p-4 relative overflow-hidden" style={{ height: 320 }}>
        <div className="scan-line" />
        <div className="flex items-center justify-between mb-3 relative z-10">
          <h3 className="text-sm font-semibold text-white">Spiking Neural Network — 12 Layers Active</h3>
          <div className="flex gap-3 text-xs">
            {Object.entries(NEURON_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-slate-400 capitalize">{type}</span>
              </span>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 100 92" className="w-full" style={{ height: 240 }}>
          {/* Layer labels */}
          {["Input","Hidden-1","Hidden-2","Output"].map((l, i) => (
            <text key={l} x={8 + i * 28} y={6} fill="#475569" fontSize={2.5} textAnchor="middle">{l}</text>
          ))}
          {/* Synapses */}
          {synapses.map((s, i) => {
            const from = neurons[s.from];
            const to = neurons[s.to];
            const isActive = firing.has(s.from);
            return (
              <line
                key={i}
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={isActive ? NEURON_COLORS[from.type] : "rgba(255,255,255,0.06)"}
                strokeWidth={isActive ? s.weight * 0.6 : 0.2}
                strokeOpacity={isActive ? 0.8 : 1}
                style={{ transition: "all 0.2s ease" }}
              />
            );
          })}
          {/* Signal propagation dots */}
          {signals.map(sig => {
            const from = neurons[sig.from];
            const to = neurons[sig.to];
            if (!from || !to) return null;
            const x = from.x + (to.x - from.x) * sig.progress;
            const y = from.y + (to.y - from.y) * sig.progress;
            return (
              <circle key={sig.id} cx={x} cy={y} r={0.8}
                fill={NEURON_COLORS[from.type]} opacity={1 - sig.progress * 0.5} />
            );
          })}
          {/* Neurons */}
          {neurons.map(n => {
            const isFiring = firing.has(n.id);
            const color = NEURON_COLORS[n.type];
            return (
              <g key={n.id}>
                {isFiring && (
                  <circle cx={n.x} cy={n.y} r={4} fill={color} opacity={0.15} />
                )}
                <circle
                  cx={n.x} cy={n.y}
                  r={isFiring ? 2.4 : 1.4}
                  fill={isFiring ? color : color + "80"}
                  style={{ transition: "all 0.15s ease", filter: isFiring ? `drop-shadow(0 0 3px ${color})` : "none" }}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── Swarm Intelligence Heatmap ──────────────────────────────────────────────
const GRID_W = 20, GRID_H = 14;

function initHeatmap() {
  return Array.from({ length: GRID_H }, (_, y) =>
    Array.from({ length: GRID_W }, (_, x) => {
      // Create clusters
      const cx = [5,12,17], cy = [4,10,6];
      let v = 0.05;
      for (let i = 0; i < 3; i++) {
        const d = Math.sqrt((x-cx[i])**2 + (y-cy[i])**2);
        v += Math.exp(-d * 0.4) * 0.6;
      }
      return Math.min(1, v + Math.random() * 0.1);
    })
  );
}

function heatColor(v: number) {
  if (v < 0.2) return `rgba(8,8,30,0.5)`;
  if (v < 0.4) return `rgba(88,28,135,${v})`;
  if (v < 0.6) return `rgba(147,51,234,${v})`;
  if (v < 0.8) return `rgba(236,72,153,${v * 0.9})`;
  return `rgba(253,224,71,${v * 0.8})`;
}

export function SwarmIntelligence() {
  const [heatmap, setHeatmap] = useState(initHeatmap);
  const [swarmIQ, setSwarmIQ] = useState(9847);
  const [emergentPatterns, setEmergentPatterns] = useState(4);
  const [clusterCount, setClusterCount] = useState(7);

  useEffect(() => {
    const t = setInterval(() => {
      setHeatmap(prev =>
        prev.map((row, y) =>
          row.map((v, x) => {
            const noise = (Math.random() - 0.5) * 0.08;
            // Propagate to neighbors
            const neighbor = x < GRID_W - 1 ? prev[y][x + 1] * 0.05 : 0;
            return Math.max(0.02, Math.min(1, v + noise + neighbor * 0.1 - v * 0.03));
          })
        )
      );
      setSwarmIQ(q => Math.max(9000, Math.min(10000, q + (Math.random() - 0.48) * 30)));
      setEmergentPatterns(p => Math.max(2, Math.min(8, p + (Math.random() > 0.9 ? 1 : Math.random() < 0.1 ? -1 : 0))));
    }, 400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Swarm IQ", value: Math.round(swarmIQ).toLocaleString(), unit: "pts", color: "#a855f7" },
          { label: "Emergent Patterns", value: emergentPatterns, unit: "active", color: "#ec4899" },
          { label: "Agent Clusters", value: clusterCount, unit: "detected", color: "#06b6d4" },
        ].map(m => (
          <div key={m.label} className="glass rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: m.color }}>
              {m.value} <span className="text-xs font-normal text-slate-500">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="glass-purple rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Swarm Activity Heatmap — 1,000 Agents</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-12 h-2 rounded bg-gradient-to-r from-[#1a1040] via-purple-600 via-pink-500 to-yellow-300 inline-block" />
            <span>Low → High Activity</span>
          </div>
        </div>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${GRID_W}, 1fr)` }}>
          {heatmap.flat().map((v, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm transition-all duration-300"
              style={{ backgroundColor: heatColor(v), minHeight: 16 }}
              title={`Activity: ${(v * 100).toFixed(0)}%`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
          <span>Cells: {GRID_W * GRID_H} zones × 35 agents/zone</span>
          <span className="text-purple-400">● Emergent clustering detected</span>
          <span className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live 400ms
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Brain-Computer Interface ────────────────────────────────────────────────
const CHANNELS = [
  { name: "Δ Delta", freq: 0.3, color: "#a855f7", band: "0.5–4 Hz", role: "Deep consciousness" },
  { name: "θ Theta", freq: 0.7, color: "#8b5cf6", band: "4–8 Hz",   role: "Memory encoding" },
  { name: "α Alpha", freq: 1.2, color: "#06b6d4", band: "8–13 Hz",  role: "Idle awareness" },
  { name: "β Beta",  freq: 2.1, color: "#10b981", band: "13–30 Hz", role: "Active cognition" },
  { name: "γ Gamma", freq: 4.2, color: "#ec4899", band: "30–100 Hz","role": "Blockchain intent" },
];

const SVG_W = 300, SVG_H = 40;

function genWave(freq: number, phase: number, amp: number) {
  const pts: string[] = [];
  for (let x = 0; x <= SVG_W; x += 3) {
    const y = SVG_H / 2 + amp * Math.sin((x / SVG_W) * Math.PI * 2 * freq * 3 + phase) * (0.7 + Math.random() * 0.3);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return `M ${pts.join(" L ")}`;
}

export function BCIInterface() {
  const [phases, setPhases] = useState(CHANNELS.map(() => Math.random() * Math.PI * 2));
  const [thoughtCaptured, setThoughtCaptured] = useState<string | null>(null);
  const [txQueue, setTxQueue] = useState<{ id: string; thought: string; status: string; ts: string }[]>([]);
  const [bandwidth, setBandwidth] = useState(847);
  const [latency, setLatency] = useState(2.3);
  const thoughts = useMemo(() => [
    "Swap 1000 OMNI for OGEN", "Stake 500 ANF — 90 days", "Vote YES on OGP-023",
    "Bridge 2000 PNX → Ethereum", "Claim staking rewards", "Deploy new Genesis agent",
    "Submit innovation to AetherNova", "Increase OGEN collateral ratio",
  ], []);

  useEffect(() => {
    const t = setInterval(() => {
      setPhases(p => p.map((ph, i) => ph + CHANNELS[i].freq * 0.15));
      setBandwidth(b => Math.max(700, Math.min(1000, b + (Math.random() - 0.5) * 30)));
      setLatency(l => Math.max(1, Math.min(5, l + (Math.random() - 0.5) * 0.2)));
    }, 80);
    return () => clearInterval(t);
  }, []);

  const captureThought = () => {
    const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
    setThoughtCaptured(thought);
    setTimeout(() => {
      setTxQueue(q => [
        { id: `BCI-${Date.now().toString(36).toUpperCase()}`, thought, status: "confirmed", ts: "just now" },
        ...q.slice(0, 4),
      ]);
      setThoughtCaptured(null);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "BCI Bandwidth", value: `${Math.round(bandwidth)} Hz`, color: "#a855f7" },
          { label: "Neural Latency", value: `${latency.toFixed(1)}ms`, color: "#06b6d4" },
          { label: "Tx via Thought", value: txQueue.length.toString(), color: "#10b981" },
        ].map(m => (
          <div key={m.label} className="glass rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">{m.label}</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-purple rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">EEG Brainwave Monitor — Neural-Blockchain Interface</h3>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <div className="space-y-3">
          {CHANNELS.map((ch, i) => (
            <div key={ch.name} className="flex items-center gap-3">
              <div className="w-16 flex-shrink-0">
                <p className="text-xs font-mono" style={{ color: ch.color }}>{ch.name}</p>
                <p className="text-[10px] text-slate-600">{ch.band}</p>
              </div>
              <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="flex-1 h-8" preserveAspectRatio="none">
                <path d={genWave(ch.freq, phases[i], 14)} fill="none" stroke={ch.color} strokeWidth={1.5} opacity={0.85} />
              </svg>
              <div className="w-24 flex-shrink-0 text-right">
                <p className="text-[10px] text-slate-500">{ch.role}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-4">
          <motion.button
            onClick={captureThought}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white glass-purple border border-purple-500/30 glow-purple transition-all"
          >
            {thoughtCaptured ? "🧠 Capturing..." : "🧠 Capture Thought → Tx"}
          </motion.button>
          {thoughtCaptured && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-xs text-cyan-300"
            >
              <span className="animate-pulse">◈</span>
              <span className="font-mono">{thoughtCaptured}</span>
            </motion.div>
          )}
        </div>

        {txQueue.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs text-slate-500 mb-2">Recent thought-transactions</p>
            {txQueue.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 glass rounded-xl px-3 py-2">
                <span className="text-emerald-400 text-xs font-mono">{tx.id}</span>
                <span className="text-xs text-white flex-1">{tx.thought}</span>
                <span className="text-xs text-emerald-300 bg-emerald-400/10 px-2 py-0.5 rounded-full">{tx.status}</span>
                <span className="text-xs text-slate-500">{tx.ts}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Phase 12 Dashboard ──────────────────────────────────────────────────────
export default function Phase12Dashboard() {
  const [activePanel, setActivePanel] = useState<"neuro" | "swarm" | "bci">("neuro");

  const PANELS = [
    { id: "neuro", label: "Neuromorphic Computing", icon: "🧠", desc: "Spiking neural network substrate" },
    { id: "swarm", label: "Swarm Intelligence",      icon: "🌀", desc: "Emergent collective behavior" },
    { id: "bci",   label: "Brain-Computer Interface", icon: "⚡", desc: "Thought-to-blockchain transactions" },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Phase 12 header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="holo glass rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="scan-line opacity-40" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🔮</span>
              <h2 className="text-xl font-bold gradient-text">Phase 12 — Super-Advanced Intelligence Layer</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300">ACTIVE</span>
            </div>
            <p className="text-sm text-slate-400">
              Neuromorphic computing · Swarm intelligence · Brain-computer interfaces · VoidTime consciousness · Quantum coherence
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-1 hidden md:block">
            <div>Phase: <span className="text-purple-300 font-semibold">12 / 12</span></div>
            <div>Neural cores: <span className="text-cyan-300">2,847,000</span></div>
            <div>VoidTime: <span className="text-amber-300">ENABLED</span></div>
          </div>
        </div>
      </motion.div>

      {/* Panel switcher */}
      <div className="flex gap-2">
        {PANELS.map(panel => (
          <motion.button
            key={panel.id}
            onClick={() => setActivePanel(panel.id)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              activePanel === panel.id
                ? "bg-purple-600/25 border-purple-500/40 text-white glow-purple"
                : "glass border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <span>{panel.icon}</span>
            <div className="text-left">
              <p>{panel.label}</p>
              <p className="text-[10px] text-slate-500 font-normal">{panel.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Active panel */}
      <motion.div
        key={activePanel}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activePanel === "neuro" && <NeuromorphicPanel />}
        {activePanel === "swarm" && <SwarmIntelligence />}
        {activePanel === "bci"   && <BCIInterface />}
      </motion.div>
    </div>
  );
}
