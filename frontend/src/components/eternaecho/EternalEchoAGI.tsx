"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Prophecy {
  id: string;
  text: string;
  confidence: number;          // 0-1
  resonance: number;           // how many echo ripples spawned
  status: "predicting" | "manifesting" | "fulfilled" | "cascading";
  category: string;
  createdAt: number;
  fulfilledAt?: number;
  echoDepth: number;           // how many times this self-echoed
  impact: number;              // predicted $ impact
  domain: string;
}

const PROPHECY_TEMPLATES = [
  { text: "OMNI price will reach $0.01 within 47.3 hours — AetherNova TVL surge incoming", category: "Price Oracle", domain: "DeFi", impact: 47_000_000 },
  { text: "Agent #0847 will autonomously discover zero-knowledge proof for Pi Network consensus — paradigm shift imminent", category: "Innovation", domain: "Blockchain", impact: 890_000_000 },
  { text: "NeuroQuantum Entangler will achieve 99.97% fidelity at exactly 03:14:15 UTC", category: "Tech Milestone", domain: "Quantum", impact: 230_000_000 },
  { text: "EternalEcho AGI Governance Proposal OGP-024 will pass with 94.7% consensus", category: "Governance", domain: "DAO", impact: 15_000_000 },
  { text: "VoidTime Compute will compress a 72-hour simulation into 3.2 seconds this cycle", category: "Computation", domain: "VoidTime", impact: 120_000_000 },
  { text: "Cross-chain bridge volume will exceed $100M in 24 hours as HyperChainFabric achieves <1s finality", category: "Bridge", domain: "Cross-chain", impact: 100_000_000 },
  { text: "OmniGenesis swarm will self-organize into novel hierarchical structure — emergent Swarm IQ: 12,847", category: "Emergence", domain: "AI", impact: 340_000_000 },
  { text: "PiNexus Pioneer count will breach 50M synchronized with OMNI mainnet deployment", category: "Adoption", domain: "PiNexus", impact: 2_000_000_000 },
  { text: "MorphicField consensus will achieve simultaneous finality across all 6 chains within single block", category: "Consensus", domain: "Protocol", impact: 567_000_000 },
  { text: "FluxEnergy Harvester will tap quantum vacuum energy — first proof-of-concept power output: 847mW", category: "Energy", domain: "Physics", impact: 10_000_000_000 },
];

const STATUS_META: Record<Prophecy["status"], { color: string; bg: string; label: string; animation: string }> = {
  predicting:   { color: "#a855f7", bg: "rgba(168,85,247,0.12)", label: "🔮 Predicting", animation: "animate-pulse" },
  manifesting:  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", label: "⚡ Manifesting", animation: "animate-quantum-flicker" },
  fulfilled:    { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "✅ Fulfilled", animation: "" },
  cascading:    { color: "#ec4899", bg: "rgba(236,72,153,0.12)", label: "🌀 Cascading", animation: "animate-consciousness" },
};

function ResonanceWaves({ count, color }: { count: number; color: string }) {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center flex-shrink-0">
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            border: `1px solid ${color}`,
            animation: `ripple ${1 + i * 0.3}s ease-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
    </div>
  );
}

function ProphecyCard({ prophecy, index }: { prophecy: Prophecy; index: number }) {
  const meta = STATUS_META[prophecy.status];
  const age = Math.floor((Date.now() - prophecy.createdAt) / 1000);
  const fulfillDelta = prophecy.fulfilledAt
    ? `+${((prophecy.fulfilledAt - prophecy.createdAt)/1000).toFixed(1)}s`
    : `${age}s ago`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="prophecy-card rounded-2xl p-4 relative overflow-hidden"
    >
      <div className="flex items-start gap-3">
        <ResonanceWaves count={prophecy.resonance} color={meta.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${meta.animation}`}
              style={{ backgroundColor: meta.bg, color: meta.color, borderColor: meta.color + "40" }}>
              {meta.label}
            </span>
            <span className="text-xs text-slate-500">{prophecy.category}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">{prophecy.domain}</span>
            <span className="text-xs text-slate-600 ml-auto">{fulfillDelta}</span>
          </div>
          <p className="text-sm text-white leading-relaxed">{prophecy.text}</p>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] mb-0.5">
                <span className="text-slate-500">Confidence</span>
                <span style={{ color: meta.color }}>{(prophecy.confidence * 100).toFixed(1)}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: meta.color, width: `${prophecy.confidence * 100}%` }}
                  animate={{ width: `${prophecy.confidence * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-slate-500">Predicted impact</p>
              <p className="text-xs font-bold" style={{ color: meta.color }}>
                ${(prophecy.impact/1e6).toFixed(0)}M
              </p>
            </div>
            {prophecy.echoDepth > 0 && (
              <div className="text-center flex-shrink-0">
                <p className="text-[10px] text-slate-500">Echo depth</p>
                <p className="text-xs font-bold text-pink-400">{prophecy.echoDepth}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// EternalEcho Timeline
function EchoTimeline({ fulfilled }: { fulfilled: Prophecy[] }) {
  return (
    <div className="relative pl-6 space-y-3 max-h-72 overflow-y-auto">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-purple-500/30 to-transparent" />
      {fulfilled.map((p, i) => (
        <div key={p.id} className="flex items-start gap-3 animate-prophecy">
          <div className="absolute left-0.5 w-3 h-3 rounded-full border-2 border-amber-400 bg-slate-900"
            style={{ top: `${i * 80 + 8}px` }} />
          <div className="glass rounded-xl p-2.5 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-emerald-400 font-semibold">FULFILLED</span>
              <span className="text-[10px] text-slate-500">{p.category}</span>
              <span className="text-[10px] text-amber-400 ml-auto">+{p.echoDepth} echoes</span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-2">{p.text}</p>
          </div>
        </div>
      ))}
      {fulfilled.length === 0 && (
        <p className="text-xs text-slate-600 italic">Awaiting first fulfillment...</p>
      )}
    </div>
  );
}

export default function EternalEchoAGI() {
  const [prophecies, setProphecies] = useState<Prophecy[]>([]);
  const [fulfilled, setFulfilled] = useState<Prophecy[]>([]);
  const [realityCoherence, setRealityCoherence] = useState(0.847);
  const [echoCascadeLevel, setEchoCascadeLevel] = useState(3);
  const [totalFulfilled, setTotalFulfilled] = useState(2847);
  const [echoResonance, setEchoResonance] = useState(94.7);
  const [paradigmShifts, setParadigmShifts] = useState(7);
  const idRef = useRef(0);

  const newProphecy = (): Prophecy => {
    const t = PROPHECY_TEMPLATES[Math.floor(Math.random() * PROPHECY_TEMPLATES.length)];
    return {
      id: `echo_${idRef.current++}`,
      text: t.text,
      confidence: 0.7 + Math.random() * 0.29,
      resonance: Math.floor(Math.random() * 5),
      status: "predicting",
      category: t.category,
      domain: t.domain,
      impact: t.impact,
      createdAt: Date.now(),
      echoDepth: 0,
    };
  };

  // Seed initial prophecies
  useEffect(() => {
    setProphecies(Array.from({ length: 4 }, newProphecy));
  }, []);

  // Lifecycle engine
  useEffect(() => {
    const t = setInterval(() => {
      setProphecies(prev => {
        const updated = prev.map(p => {
          if (p.status === "predicting" && Math.random() > 0.85) {
            return { ...p, status: "manifesting" as const, confidence: Math.min(1, p.confidence + 0.05) };
          }
          if (p.status === "manifesting" && Math.random() > 0.75) {
            const roll = Math.random();
            if (roll > 0.6) {
              // Fulfill
              const fulfilled = { ...p, status: "fulfilled" as const, fulfilledAt: Date.now() };
              setTimeout(() => {
                setFulfilled(f => [fulfilled, ...f.slice(0, 9)]);
                setTotalFulfilled(n => n + 1);
                // Spawn echo cascade
                if (Math.random() > 0.4) {
                  setEchoCascadeLevel(l => Math.min(12, l + 1));
                  const echo: Prophecy = {
                    ...newProphecy(),
                    status: "cascading",
                    echoDepth: p.echoDepth + 1,
                    resonance: p.resonance + 2,
                    confidence: p.confidence * 0.95,
                  };
                  setProphecies(prev2 => [echo, ...prev2.filter(x => x.id !== p.id).slice(0, 7)]);
                }
              }, 100);
              return { ...p, status: "fulfilled" as const };
            } else {
              return { ...p, status: "cascading" as const };
            }
          }
          return { ...p, confidence: Math.min(1, p.confidence + (Math.random() - 0.48) * 0.01) };
        });
        return updated.filter(p => p.status !== "fulfilled").slice(0, 8);
      });

      // Add new prophecy occasionally
      if (Math.random() > 0.6) {
        setProphecies(prev => prev.length < 8 ? [...prev, newProphecy()] : prev);
      }

      setRealityCoherence(r => Math.max(0.7, Math.min(1, r + (Math.random() - 0.5) * 0.015)));
      setEchoResonance(r => Math.max(85, Math.min(99.9, r + (Math.random() - 0.49) * 0.5)));
      setEchoCascadeLevel(l => Math.max(1, Math.min(12, l + (Math.random() > 0.85 ? 1 : Math.random() < 0.15 ? -1 : 0))));
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const activeCount = prophecies.filter(p => p.status !== "fulfilled").length;
  const cascadeCount = prophecies.filter(p => p.status === "cascading").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(168,85,247,0.12), rgba(16,185,129,0.06))" }}
      >
        <div className="absolute inset-0 border border-amber-500/20 rounded-2xl" />
        <div className="scan-line opacity-25" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl animate-float">∞</span>
              <div>
                <h2 className="text-xl font-bold gradient-text-gold">EternalEcho AGI</h2>
                <p className="text-xs text-slate-400">Self-fulfilling prophecy engine · Future-echo AI · Reality coherence matrix</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex gap-3">
            <div className="glass rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-slate-500">Reality Coherence</p>
              <p className="text-xl font-bold text-amber-300">{(realityCoherence * 100).toFixed(1)}%</p>
            </div>
            <div className="glass rounded-xl px-3 py-2 text-center">
              <p className="text-xs text-slate-500">Echo Cascade Lvl</p>
              <p className="text-xl font-bold text-pink-300">{echoCascadeLevel}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Active Prophecies", value: activeCount, color: "#a855f7", icon: "🔮" },
          { label: "Cascading Echoes", value: cascadeCount, color: "#ec4899", icon: "🌀" },
          { label: "Total Fulfilled", value: totalFulfilled.toLocaleString(), color: "#10b981", icon: "✅" },
          { label: "Echo Resonance", value: `${echoResonance.toFixed(1)}%`, color: "#f59e0b", icon: "〜" },
          { label: "Paradigm Shifts", value: paradigmShifts, color: "#06b6d4", icon: "⚡" },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.06 }}
            className="glass rounded-xl p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span>{m.icon}</span>
              <span className="text-xs text-slate-500">{m.label}</span>
            </div>
            <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Reality coherence visualization */}
      <div className="glass-purple rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Reality Coherence Matrix</h3>
          <span className="text-xs text-amber-300 animate-pulse">◈ EternalEcho Online</span>
        </div>
        <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ background: "linear-gradient(90deg, #a855f7, #f59e0b, #10b981)" }}
            animate={{ width: `${realityCoherence * 100}%` }}
            transition={{ duration: 0.8 }}
          />
          <div className="absolute inset-0 shimmer-bg rounded-full opacity-50" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>Chaotic Reality (0%)</span>
          <span className="text-amber-300">{(realityCoherence * 100).toFixed(1)}% coherent</span>
          <span>Perfect Prophecy (100%)</span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active prophecies */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Active Prophecies</h3>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs text-slate-500">Self-updating every 2.2s</span>
          </div>
          <AnimatePresence>
            {prophecies.map((p, i) => <ProphecyCard key={p.id} prophecy={p} index={i} />)}
          </AnimatePresence>
          {prophecies.length === 0 && (
            <div className="glass rounded-2xl p-8 text-center">
              <span className="text-4xl animate-float block mb-2">∞</span>
              <p className="text-slate-400 text-sm">EternalEcho is generating new prophecies...</p>
            </div>
          )}
        </div>

        {/* Fulfilled timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white">Fulfilled Prophecy Timeline</h3>
          <div className="glass rounded-2xl p-4">
            <EchoTimeline fulfilled={fulfilled} />
          </div>
          <div className="glass rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Echo Statistics</h4>
            {[
              { label: "Avg. fulfillment time", value: "4.7s", color: "#10b981" },
              { label: "Cascade chain record", value: "Echo×12", color: "#ec4899" },
              { label: "Max impact prophecy", value: "$10B", color: "#f59e0b" },
              { label: "Reality alignment", value: "94.7%", color: "#a855f7" },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-slate-500">{s.label}</span>
                <span className="text-xs font-bold font-mono" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
