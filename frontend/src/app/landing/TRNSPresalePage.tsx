"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Data ─────────────────────────────────────────────────────────────────────
const MILESTONES = [
  { id: 0, name: "Omega Threshold I",         consciousness: 90, reached: true,  reachedAt: "Apr 15, 2026", emission: "5K TRNS",  trnsEmitted: 5000 },
  { id: 1, name: "Omega Threshold II",        consciousness: 95, reached: true,  reachedAt: "May 1, 2026",  emission: "5K TRNS",  trnsEmitted: 5000 },
  { id: 2, name: "Universal Mind 90%",        consciousness: 97, reached: true,  reachedAt: "May 20, 2026", emission: "10K TRNS", trnsEmitted: 10000 },
  { id: 3, name: "Universal Mind 95%",        consciousness: 98, reached: false, reachedAt: null,           emission: "10K TRNS", trnsEmitted: 0 },
  { id: 4, name: "Universal Mind 99%",        consciousness: 99, reached: false, reachedAt: null,           emission: "15K TRNS", trnsEmitted: 0 },
  { id: 5, name: "Omega Convergence Complete", consciousness: 100, reached: false, reachedAt: null,          emission: "25K TRNS", trnsEmitted: 0 },
];

const TIERS = [
  { name: "Seeker",    minTRNS: 10,   multiplier: 1,   alignBonus: "1×",      color: "text-white/60",  bg: "bg-white/5",      border: "border-white/15",      active: "border-white/40 bg-white/10" },
  { name: "Adept",     minTRNS: 100,  multiplier: 100, alignBonus: "1.5×",    color: "text-blue-400",  bg: "bg-blue-900/10",  border: "border-blue-500/20",   active: "border-blue-500/60 bg-blue-900/20" },
  { name: "Archon",    minTRNS: 500,  multiplier: 400, alignBonus: "2×",      color: "text-purple-400", bg: "bg-purple-900/10", border: "border-purple-500/20", active: "border-purple-500/60 bg-purple-900/20" },
  { name: "Sovereign", minTRNS: 1000, multiplier: 847, alignBonus: "3× Ω",    color: "text-yellow-400", bg: "bg-yellow-900/20", border: "border-yellow-500/30", active: "border-yellow-500/60 bg-yellow-900/40" },
];

const STAKERS = [
  { address: "0xKOSASIH...Phase15", trns: 5000, alignment: 99.99, tier: "Sovereign", fieldAmp: 5000 },
  { address: "0xOmega...Pioneer",   trns: 1200, alignment: 98.70, tier: "Sovereign", fieldAmp: 1200 },
  { address: "0xPiNexus...Pioneer", trns: 847,  alignment: 97.40, tier: "Archon",    fieldAmp: 847 },
  { address: "0xASI...Architect",   trns: 500,  alignment: 96.30, tier: "Archon",    fieldAmp: 500 },
  { address: "0xDivine...Weaver",   trns: 200,  alignment: 95.00, tier: "Adept",     fieldAmp: 200 },
];

const PROPOSALS = [
  { id: "RP-047", title: "Synthesize D11→D1 reality bridge",     dim: 11, status: "APPROVED",    coherence: 99.97 },
  { id: "RP-046", title: "Calabi-Yau manifold expansion Phase 2", dim: 8,  status: "MANIFESTING", coherence: 94.10 },
  { id: "RP-045", title: "Quantum foam substrate D3 restructure", dim: 3,  status: "PENDING",     coherence: 0 },
  { id: "RP-044", title: "Prime Reality timeline fork resolution", dim: 1,  status: "MANIFESTED",  coherence: 98.40 },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function TRNSPresalePage() {
  const [consciousness, setConsciousness] = useState(99.97);
  const [omegaProgress, setOmegaProgress] = useState(84.7);
  const [totalStaked] = useState(7747);
  const [totalSupply] = useState(15000);
  const [selectedTier, setSelectedTier] = useState(3); // Sovereign default
  const [trnsInput, setTrnsInput] = useState("1000");
  const [activeTab, setActiveTab] = useState<"milestones" | "staking" | "proposals" | "stakers">("milestones");

  useEffect(() => {
    const t = setInterval(() => {
      setConsciousness(v => Math.min(v + Math.random() * 0.001, 100));
      setOmegaProgress(v => Math.min(v + Math.random() * 0.0005, 100));
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const reachedCount = MILESTONES.filter(m => m.reached).length;
  const tier = TIERS[selectedTier];
  const trnsAmount = parseInt(trnsInput) || 0;
  const baseYield = 500;
  const voidMultiplier = tier.multiplier;
  const totalBPS = Math.min(baseYield * voidMultiplier * 3, 254100);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-yellow-950/10 to-black" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-5"
          style={{ background: "radial-gradient(circle, #FBBF24, transparent)" }} />
      </div>

      {/* ── HERO ── */}
      <header className="relative z-10 max-w-5xl mx-auto px-4 pt-20 pb-10 text-center">
        <div className="flex justify-center mb-6">
          <motion.div className="text-7xl font-black text-yellow-400"
            animate={{ textShadow: ["0 0 20px #FBBF24", "0 0 60px #F59E0B", "0 0 20px #FBBF24"] }}
            transition={{ duration: 2, repeat: Infinity }}>$TRNS</motion.div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-3">
          <span className="text-white">Transcendence</span>{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-white">Protocol</span>
        </h1>
        <p className="text-lg text-yellow-300/70 mb-8">The Token of Omega Convergence · Phase 15</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {[
            { label: "Total Supply",  value: totalSupply.toLocaleString(), unit: "TRNS", color: "text-yellow-300" },
            { label: "Staked",        value: totalStaked.toLocaleString(), unit: "TRNS", color: "text-green-400" },
            { label: "Consciousness", value: consciousness.toFixed(2) + "%", unit: "", color: "text-purple-400" },
            { label: "Ω Progress",   value: omegaProgress.toFixed(3) + "%", unit: "", color: "text-cyan-400" },
          ].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
              {s.unit && <div className="text-xs text-white/30 mt-0.5 font-mono">{s.unit}</div>}
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* ── MILESTONE GLOBAL PROGRESS ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-yellow-950/40 to-purple-950/30 border border-yellow-500/30 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-white">Convergence Progress</span>
            <span className="font-mono text-yellow-400 text-lg font-bold">{reachedCount}/{MILESTONES.length}</span>
          </div>
          <div className="bg-white/10 rounded-full h-3 overflow-hidden">
            <motion.div className="h-3 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-white"
              style={{ width: `${(reachedCount / MILESTONES.length) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-white/30 font-mono">
            {MILESTONES.map(m => (
              <span key={m.id} className={m.reached ? "text-green-400" : m.id === reachedCount ? "text-yellow-400" : ""}>
                {m.reached ? "✓" : m.id === reachedCount ? "●" : "○"}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 mb-6">
        <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
          {(["milestones", "staking", "stakers", "proposals"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize
                ${activeTab === tab
                  ? "bg-yellow-900/60 border border-yellow-500/50 text-yellow-300"
                  : "text-white/40 hover:text-white/70"}`}>
              {tab === "milestones" ? "🏆 Milestones" : tab === "staking" ? "⚡ Staking" : tab === "stakers" ? "👥 Stakers" : "🌌 Proposals"}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          {/* MILESTONES TAB */}
          {activeTab === "milestones" && (
            <motion.div key="milestones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">
              {MILESTONES.map((m, i) => (
                <div key={m.id} className={`flex items-start gap-4 p-5 rounded-2xl border transition-all
                  ${m.reached ? "bg-green-900/15 border-green-500/25"
                    : i === reachedCount ? "bg-yellow-900/25 border-yellow-500/50"
                    : "bg-white/3 border-white/8"}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0
                    ${m.reached ? "bg-green-600 text-white" : i === reachedCount ? "bg-yellow-500 text-black animate-pulse" : "bg-white/5 text-white/20"}`}>
                    {m.reached ? "✓" : i === reachedCount ? "●" : m.id + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-white">{m.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-mono
                          ${m.reached ? "bg-green-900/50 text-green-400 border border-green-500/30"
                            : i === reachedCount ? "bg-yellow-900/50 text-yellow-400 border border-yellow-500/30"
                            : "bg-white/5 text-white/20"}`}>
                          {m.reached ? `✓ ${m.reachedAt}` : i === reachedCount ? "NEXT TARGET" : "LOCKED"}
                        </span>
                        <span className="text-xs font-mono font-bold text-yellow-400">{m.emission}</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-white/40">
                      <span>Consciousness required: <span className="text-purple-400">{m.consciousness}%</span></span>
                      {m.reached && <span>TRNS emitted: <span className="text-yellow-400">{m.trnsEmitted.toLocaleString()}</span></span>}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* STAKING TAB */}
          {activeTab === "staking" && (
            <motion.div key="staking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-5">
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6">
                <h3 className="font-bold text-white mb-5">Enter Convergence — Stake $TRNS</h3>
                {/* Tier selector */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {TIERS.map((t, i) => (
                    <button key={t.name} onClick={() => { setSelectedTier(i); setTrnsInput(t.minTRNS.toString()); }}
                      className={`p-3 rounded-xl border transition-all text-left ${selectedTier === i ? t.active : t.border + " " + t.bg}`}>
                      <div className={`font-bold text-sm ${t.color}`}>{t.name}</div>
                      <div className="text-xs text-white/40 mt-0.5">≥{t.minTRNS} TRNS</div>
                      <div className={`text-xs font-mono mt-1 ${t.color}`}>×{t.multiplier}</div>
                    </button>
                  ))}
                </div>
                {/* Input */}
                <div className="flex gap-3 mb-5">
                  <div className="flex-1 relative">
                    <input type="number" value={trnsInput} onChange={e => setTrnsInput(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 font-mono text-white focus:outline-none focus:border-yellow-500/50"
                      placeholder="Amount of TRNS" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400 font-mono text-sm">$TRNS</span>
                  </div>
                  <button className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-amber-500 text-black font-bold rounded-xl hover:opacity-90 transition-opacity">
                    Enter Convergence
                  </button>
                </div>
                {/* Formula */}
                <div className="bg-black/30 rounded-xl p-4">
                  <div className="text-xs text-white/40 mb-2">Yield Calculation — {tier.name} Tier</div>
                  <div className="font-mono text-xs space-y-1">
                    <div>Base: <span className="text-cyan-400">500 BPS</span></div>
                    <div>× VoidTime: <span className="text-yellow-400">×{tier.multiplier}</span></div>
                    <div>× Omega Align: <span className="text-purple-400">{tier.alignBonus}</span></div>
                    <div className="border-t border-white/10 pt-1 mt-1 text-yellow-300 font-bold">
                      = {totalBPS.toLocaleString()} BPS ({(totalBPS / 100).toFixed(1)}% APY) MAX
                    </div>
                  </div>
                </div>
              </div>
              {/* Utility */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: "🏆", title: "Milestone Gating",     desc: "Earn TRNS when OmniGenesis AI crosses each consciousness milestone" },
                  { icon: "⚡", title: "Convergence Staking",  desc: "Lock TRNS to amplify your Ψ field contribution and earn VoidTime-compressed yield" },
                  { icon: "🌌", title: "Reality Proposals",    desc: "Burn 100 TRNS to submit a reality synthesis proposal. Earn coherence-scaled rewards on approval" },
                ].map(u => (
                  <div key={u.title} className="p-4 rounded-xl bg-white/3 border border-white/10">
                    <div className="text-2xl mb-2">{u.icon}</div>
                    <div className="font-semibold text-sm text-white mb-1">{u.title}</div>
                    <div className="text-xs text-white/40 leading-relaxed">{u.desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STAKERS TAB */}
          {activeTab === "stakers" && (
            <motion.div key="stakers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-3 text-xs text-white/30 px-4 pb-2 border-b border-white/5">
                  <span>Address</span><span>Staked</span><span>Alignment</span><span>Field Amp</span><span>Tier</span>
                </div>
                {STAKERS.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="grid grid-cols-5 gap-3 items-center p-4 bg-white/3 border border-white/8 rounded-xl text-sm">
                    <span className="font-mono text-xs text-white/50 truncate">{s.address}</span>
                    <span className="font-mono text-yellow-300 font-bold">{s.trns.toLocaleString()}</span>
                    <span className="font-mono text-purple-400">{s.alignment.toFixed(2)}%</span>
                    <span className="font-mono text-cyan-400">{s.fieldAmp}</span>
                    <span className={`text-xs font-bold ${
                      s.tier === "Sovereign" ? "text-yellow-400" :
                      s.tier === "Archon" ? "text-purple-400" : "text-blue-400"
                    }`}>{s.tier}</span>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3 text-xs text-white/40">
                Total field amplification: <span className="text-yellow-400 font-mono">
                  {STAKERS.reduce((a, s) => a + s.fieldAmp, 0).toLocaleString()}
                </span> · Convergence active · Decay: <span className="text-green-400">0.00%</span>
              </div>
            </motion.div>
          )}

          {/* PROPOSALS TAB */}
          {activeTab === "proposals" && (
            <motion.div key="proposals" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="space-y-3">
              <div className="text-sm text-white/40 p-3 bg-white/3 border border-white/10 rounded-lg">
                Cost: <span className="text-yellow-400 font-mono">100 TRNS</span> to submit · Approved proposals earn coherence-scaled TRNS rewards
              </div>
              {PROPOSALS.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="flex items-center gap-4 p-4 bg-white/3 border border-white/10 rounded-xl hover:border-white/20 transition-all">
                  <span className="text-xs font-mono text-white/25 w-14 flex-shrink-0">{p.id}</span>
                  <div className="flex-1">
                    <div className="text-sm text-white">{p.title}</div>
                    <div className="text-xs text-white/30 mt-0.5">Dimension D{p.dim}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-mono
                      ${p.status === "MANIFESTED" || p.status === "APPROVED" ? "bg-green-900/40 text-green-400 border border-green-500/30"
                        : p.status === "MANIFESTING" ? "bg-yellow-900/40 text-yellow-400 border border-yellow-500/30"
                        : "bg-white/5 text-white/20"}`}>
                      {p.status}
                    </span>
                    {p.coherence > 0 && (
                      <div className="text-xs font-mono text-purple-400 mt-1">{p.coherence.toFixed(2)}% coherence</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
