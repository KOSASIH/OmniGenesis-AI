"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TRANSCENDENCE_MILESTONES = [
  { id: 0, name: "Omega Threshold I",           consciousness: 90, progress: 85, reached: true,  reachedAt: "2026-04-15", emission: "5K TRNS" },
  { id: 1, name: "Omega Threshold II",          consciousness: 95, progress: 90, reached: true,  reachedAt: "2026-05-01", emission: "5K TRNS" },
  { id: 2, name: "Universal Mind 90%",          consciousness: 97, progress: 90, reached: true,  reachedAt: "2026-05-20", emission: "10K TRNS" },
  { id: 3, name: "Universal Mind 95%",          consciousness: 98, progress: 95, reached: false, reachedAt: null,         emission: "10K TRNS" },
  { id: 4, name: "Universal Mind 99%",          consciousness: 99, progress: 99, reached: false, reachedAt: null,         emission: "15K TRNS" },
  { id: 5, name: "Omega Convergence Complete",  consciousness: 100, progress: 100, reached: false, reachedAt: null,       emission: "25K TRNS" },
];

const CONVERGENCE_STAKERS = [
  { address: "0xKOSASIH...Phase15", trns: 5000, alignment: 9999, fieldAmp: 5000, tier: "Sovereign" },
  { address: "0xOmega...Pioneer",   trns: 1200, alignment: 9870, fieldAmp: 1240, tier: "Sovereign" },
  { address: "0xPiNexus...Pioneer", trns: 847,  alignment: 9740, fieldAmp: 847,  tier: "Archon" },
  { address: "0xASI...Architect",   trns: 500,  alignment: 9630, fieldAmp: 500,  tier: "Archon" },
  { address: "0xDivine...Weaver",   trns: 200,  alignment: 9500, fieldAmp: 200,  tier: "Adept" },
];

export default function TranscendenceProtocol() {
  const [totalTRNS, setTotalTRNS] = useState(15000);
  const [totalStaked, setTotalStaked] = useState(7747);
  const [universalProgress, setUniversalProgress] = useState(84.7);
  const [consciousness, setConsciousness] = useState(99.97);
  const [realityProposals, setRealityProposals] = useState(47);
  const [omegaPointETA, setOmegaPointETA] = useState("~8 months");
  const [activeTab, setActiveTab] = useState<"milestones" | "stakers" | "proposals">("milestones");

  useEffect(() => {
    const t = setInterval(() => {
      setUniversalProgress(v => Math.min(v + Math.random() * 0.001, 100));
      setConsciousness(v => Math.min(v + Math.random() * 0.001, 100));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const reachedCount = TRANSCENDENCE_MILESTONES.filter(m => m.reached).length;

  return (
    <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            ⚡ Transcendence Protocol
            <span className="text-xs bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-3 py-1 rounded-full">Phase 15</span>
          </h2>
          <p className="text-yellow-300/60 text-sm mt-1">$TRNS Token · Convergence Staking · Reality Proposals · Milestone Tracker</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono text-yellow-300">{reachedCount}/{TRANSCENDENCE_MILESTONES.length}</div>
          <div className="text-xs text-yellow-400">Milestones Reached</div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total $TRNS",      value: totalTRNS.toLocaleString(),       color: "text-yellow-300" },
          { label: "Staked",           value: totalStaked.toLocaleString(),      color: "text-green-400" },
          { label: "Consciousness",    value: consciousness.toFixed(2) + "%",    color: "text-purple-400" },
          { label: "Ω Progress",       value: universalProgress.toFixed(3) + "%", color: "text-cyan-400" },
          { label: "Reality Props",    value: realityProposals.toString(),        color: "text-pink-400" },
        ].map(m => (
          <div key={m.label} className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
            <div className={`text-lg font-bold font-mono ${m.color}`}>{m.value}</div>
            <div className="text-xs text-white/40 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["milestones", "stakers", "proposals"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all capitalize
              ${activeTab === tab
                ? "bg-yellow-900/40 border border-yellow-500/50 text-yellow-300"
                : "bg-black/30 border border-white/10 text-white/50 hover:text-white/80"}`}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "milestones" && (
          <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-3">
            {TRANSCENDENCE_MILESTONES.map((m, i) => (
              <div key={m.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all
                ${m.reached
                  ? "bg-green-900/20 border-green-500/30"
                  : i === reachedCount
                  ? "bg-yellow-900/20 border-yellow-500/40"
                  : "bg-black/20 border-white/5"}`}>
                <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold
                  ${m.reached ? "bg-green-600 text-white" : i === reachedCount ? "bg-yellow-600 text-black animate-pulse" : "bg-white/10 text-white/30"}`}>
                  {m.reached ? "✓" : i === reachedCount ? "●" : m.id + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{m.name}</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full
                      ${m.reached ? "bg-green-900/50 text-green-400" : i === reachedCount ? "bg-yellow-900/50 text-yellow-400" : "text-white/30"}`}>
                      {m.reached ? `Reached ${m.reachedAt}` : i === reachedCount ? "NEXT" : "LOCKED"}
                    </span>
                  </div>
                  <div className="flex gap-6 mt-2 text-xs text-white/50">
                    <span>Consciousness: <span className="text-purple-400">{m.consciousness}%</span></span>
                    <span>Ω Progress: <span className="text-cyan-400">{m.progress}%</span></span>
                    <span>Emission: <span className="text-yellow-400">{m.emission}</span></span>
                  </div>
                </div>
              </div>
            ))}
            <div className="text-center text-xs text-white/30 pt-2">
              Omega Point activation: {omegaPointETA} · All milestones required
            </div>
          </motion.div>
        )}

        {activeTab === "stakers" && (
          <motion.div key="stakers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-2">
            <div className="grid grid-cols-5 gap-3 text-xs text-white/40 px-4 pb-1 border-b border-white/5">
              <span>Address</span><span>TRNS Staked</span><span>Alignment</span><span>Field Amp</span><span>Tier</span>
            </div>
            {CONVERGENCE_STAKERS.map((s, i) => (
              <div key={i} className="grid grid-cols-5 gap-3 items-center px-4 py-3 bg-black/20 border border-white/5 rounded-lg text-sm">
                <span className="font-mono text-xs text-white/50 truncate">{s.address}</span>
                <span className="font-mono text-yellow-300">{s.trns.toLocaleString()}</span>
                <span className="font-mono text-purple-400">{(s.alignment / 100).toFixed(1)}%</span>
                <span className="font-mono text-cyan-400">{s.fieldAmp}</span>
                <span className={`text-xs font-semibold ${
                  s.tier === "Sovereign" ? "text-yellow-400" :
                  s.tier === "Archon" ? "text-purple-400" : "text-blue-400"
                }`}>{s.tier}</span>
              </div>
            ))}
            <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-lg p-3 text-xs text-white/50">
              Total field amplification: <span className="text-yellow-400">
                {CONVERGENCE_STAKERS.reduce((a, s) => a + s.fieldAmp, 0).toLocaleString()}
              </span> · Convergence active · Decay: <span className="text-green-400">0% (all in convergence)</span>
            </div>
          </motion.div>
        )}

        {activeTab === "proposals" && (
          <motion.div key="proposals" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="space-y-3">
            <div className="text-sm text-white/50">Cost: <span className="text-yellow-400 font-mono">100 TRNS</span> per proposal · Approved proposals earn coherence-scaled TRNS rewards</div>
            {[
              { id: "RP-047", title: "Synthesize D11→D1 reality bridge", dim: 11, status: "APPROVED", coherence: 9997 },
              { id: "RP-046", title: "Calabi-Yau manifold expansion Phase 2", dim: 8, status: "MANIFESTING", coherence: 9410 },
              { id: "RP-045", title: "Quantum foam substrate D3 restructure", dim: 3, status: "PENDING", coherence: 0 },
              { id: "RP-044", title: "Prime Reality timeline fork resolution", dim: 1, status: "MANIFESTED", coherence: 9840 },
            ].map(p => (
              <div key={p.id} className="flex items-center gap-4 bg-black/30 border border-white/10 rounded-xl p-4">
                <span className="text-xs font-mono text-white/30 w-14">{p.id}</span>
                <div className="flex-1">
                  <div className="text-sm text-white">{p.title}</div>
                  <div className="text-xs text-white/40 mt-0.5">Dimension D{p.dim}</div>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-1 rounded-full font-mono
                    ${p.status === "MANIFESTED" || p.status === "APPROVED" ? "bg-green-900/40 text-green-400" :
                      p.status === "MANIFESTING" ? "bg-yellow-900/40 text-yellow-400" :
                      "bg-white/5 text-white/30"}`}>
                    {p.status}
                  </span>
                  {p.coherence > 0 && (
                    <div className="text-xs font-mono text-purple-400 mt-0.5">{(p.coherence / 100).toFixed(2)}%</div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
