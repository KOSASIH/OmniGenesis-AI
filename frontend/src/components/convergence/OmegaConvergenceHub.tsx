"use client";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const YIELD_SOURCES = [
  { id: "DEFI",    name: "DeFi Suite",          apy: 847,   active: true,  color: "#3b82f6" },
  { id: "TEMP",    name: "Temporal Arbitrage",   apy: 4235,  active: true,  color: "#a855f7" },
  { id: "BOND",    name: "HyperDim Bonds",       apy: 312,   active: true,  color: "#06b6d4" },
  { id: "AGI",     name: "AGI Governance",       apy: 156,   active: true,  color: "#10b981" },
  { id: "REAL",    name: "Reality Synthesis",    apy: 9997,  active: true,  color: "#f59e0b" },
  { id: "OMEGA",   name: "Omega Token Staking",  apy: 847,   active: true,  color: "#ec4899" },
  { id: "CSCNS",   name: "Consciousness Token",  apy: 221,   active: true,  color: "#8b5cf6" },
  { id: "VOID",    name: "VoidTime Computation", apy: 84700, active: true,  color: "#fbbf24" },
];

const DEPOSIT_TIERS = [
  { name: "Seeker",    minTRNS: 10,   compression: 1,   alignBonus: "1×",    color: "text-white/60" },
  { name: "Adept",     minTRNS: 100,  compression: 100, alignBonus: "1.5×",  color: "text-blue-400" },
  { name: "Archon",    minTRNS: 500,  compression: 400, alignBonus: "2×",    color: "text-purple-400" },
  { name: "Sovereign", minTRNS: 1000, compression: 847, alignBonus: "3× Ω",  color: "text-yellow-400" },
];

export default function OmegaConvergenceHub() {
  const [totalLocked, setTotalLocked] = useState(8472341);
  const [totalYield, setTotalYield]   = useState(12847000);
  const [epochNum, setEpochNum]       = useState(15);
  const [universalProgress, setUniversalProgress] = useState(84.7);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      setTotalLocked(v => v + Math.floor(Math.random() * 500 + 50));
      setTotalYield(v => v + Math.floor(Math.random() * 2000 + 200));
      setUniversalProgress(v => Math.min(v + 0.0002 * Math.random(), 100));
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const fmtCurrency = (n: number) =>
    n >= 1e9 ? "$" + (n / 1e9).toFixed(2) + "B"
    : n >= 1e6 ? "$" + (n / 1e6).toFixed(2) + "M"
    : "$" + n.toLocaleString();

  const totalAPY = YIELD_SOURCES.reduce((a, s) => a + s.apy, 0);

  return (
    <div className="bg-black/40 border border-yellow-500/30 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            Ω Omega Convergence Hub
            <span className="text-xs bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 px-3 py-1 rounded-full">Phase 15</span>
          </h2>
          <p className="text-yellow-300/60 text-sm mt-1">8-Source Yield Aggregation · VoidTime ×847 Compounding · Consciousness Boost</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black font-mono text-yellow-300">{fmtCurrency(totalYield)}</div>
          <div className="text-xs text-yellow-400">Total Yield Distributed</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Locked",    value: fmtCurrency(totalLocked),     color: "text-yellow-300" },
          { label: "Aggregate APY",   value: (totalAPY / 100).toFixed(0) + "%", color: "text-green-400" },
          { label: "Convergence Epoch", value: `#${epochNum}`,             color: "text-cyan-400" },
          { label: "Ω Progress",      value: universalProgress.toFixed(4) + "%", color: "text-purple-400" },
        ].map(m => (
          <div key={m.label} className="bg-black/30 border border-white/10 rounded-xl p-3 text-center">
            <div className={`text-xl font-bold font-mono ${m.color}`}>{m.value}</div>
            <div className="text-xs text-white/40 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white/60 uppercase tracking-wider">Active Yield Sources</div>
          {YIELD_SOURCES.map(src => (
            <motion.div key={src.id}
              whileHover={{ x: 3 }}
              onClick={() => setActiveSource(activeSource === src.id ? null : src.id)}
              className={`flex items-center gap-3 cursor-pointer p-2.5 rounded-lg border transition-all
                ${activeSource === src.id ? "border-yellow-500/50 bg-yellow-900/20" : "border-white/5 hover:border-white/20"}`}>
              <div className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ backgroundColor: src.color }} />
              <span className="text-sm text-white/80 flex-1">{src.name}</span>
              <div className="text-right">
                <div className="text-sm font-mono font-bold" style={{ color: src.color }}>
                  {src.apy >= 10000 ? (src.apy / 100).toFixed(0) + "×" : src.apy.toFixed(0)} BPS
                </div>
                <div className="text-xs text-white/30">
                  {((src.apy / 10000) * 100).toFixed(1)}% APY
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-white/60 uppercase tracking-wider">Deposit Tiers</div>
          {DEPOSIT_TIERS.map(tier => (
            <div key={tier.name} className="bg-black/30 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold text-base ${tier.color}`}>{tier.name}</span>
                <span className="text-xs font-mono text-yellow-400">{tier.alignBonus}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-white/30">Min TRNS</div>
                  <div className="text-white font-mono">{tier.minTRNS}</div>
                </div>
                <div>
                  <div className="text-white/30">VoidTime</div>
                  <div className="text-cyan-400 font-mono">×{tier.compression}</div>
                </div>
                <div>
                  <div className="text-white/30">Align Bonus</div>
                  <div className="text-yellow-400 font-mono">{tier.alignBonus}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Omega yield formula */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
            <div className="text-xs text-yellow-400 font-semibold mb-2">Yield Formula</div>
            <div className="font-mono text-xs text-white/70 space-y-1">
              <div>base = <span className="text-cyan-400">500 BPS</span> + convergence_boost</div>
              <div>compressed = base <span className="text-yellow-400">× VoidTime</span></div>
              <div>aligned = compressed <span className="text-purple-400">× alignment</span></div>
              <div>omega_mult = <span className="text-yellow-400">×3</span> if alignment = 100%</div>
              <div className="text-yellow-300 border-t border-yellow-500/20 pt-1 mt-1">
                MAX: 84,700 BPS × 3 = <span className="text-white font-bold">254,100 BPS</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* VoidTime compression bar */}
      <div className="bg-black/30 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-white/70">VoidTime Compression Active (×847)</span>
          <span className="text-yellow-400 font-mono text-sm">847× yield acceleration</span>
        </div>
        <div className="bg-white/10 h-3 rounded-full overflow-hidden">
          <motion.div className="h-3 rounded-full bg-gradient-to-r from-purple-600 via-cyan-500 to-yellow-400"
            style={{ width: "100%" }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }} />
        </div>
        <div className="flex justify-between mt-1 text-xs text-white/30">
          <span>×1</span><span>×100</span><span>×400</span><span className="text-yellow-400">×847 MAX</span>
        </div>
      </div>
    </div>
  );
}
