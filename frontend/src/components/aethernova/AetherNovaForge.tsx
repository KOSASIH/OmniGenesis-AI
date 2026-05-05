"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { INNOVATIONS, type Innovation } from "@/lib/mock-data";

const STATUS_STYLES: Record<Innovation["status"], { bg: string; text: string; border: string; label: string }> = {
  deployed:    { bg: "bg-emerald-400/10", text: "text-emerald-300", border: "border-emerald-400/30", label: "🚀 Deployed" },
  validated:   { bg: "bg-purple-400/10",  text: "text-purple-300",  border: "border-purple-400/30",  label: "✅ Validated" },
  researching: { bg: "bg-cyan-400/10",    text: "text-cyan-300",    border: "border-cyan-400/30",    label: "🔬 Researching" },
  proposed:    { bg: "bg-amber-400/10",   text: "text-amber-300",   border: "border-amber-400/30",   label: "💡 Proposed" },
};

function ScoreBar({ value, color, label }: { value: number; color: string; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono" style={{ color }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function AetherNovaForge() {
  const [selectedInnovation, setSelectedInnovation] = useState<Innovation | null>(null);
  const [filter, setFilter] = useState<Innovation["status"] | "all">("all");

  const filtered = filter === "all" ? INNOVATIONS : INNOVATIONS.filter(i => i.status === filter);
  const totalRewards = INNOVATIONS.reduce((s, i) => s + i.reward, 0);
  const deployedCount = INNOVATIONS.filter(i => i.status === "deployed").length;

  return (
    <div className="space-y-5">
      {/* AetherNova header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-purple rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="scan-line opacity-30" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">⚗️</span>
              <div>
                <h2 className="text-lg font-bold gradient-text-gold">AetherNova Forge</h2>
                <p className="text-xs text-slate-400">Inventing 100% new technologies that have never existed before</p>
              </div>
            </div>
          </div>
          <div className="text-right text-xs space-y-1 hidden md:block">
            <p className="text-slate-400">Total Rewards Pool</p>
            <p className="text-2xl font-bold gradient-text-gold">${(totalRewards/1e6).toFixed(1)}M OMNI</p>
            <p className="text-slate-500">{deployedCount}/10 innovations live</p>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Innovations", value: "10", sub: "Crown jewels", color: "text-amber-300", icon: "💡" },
          { label: "Validations", value: INNOVATIONS.reduce((s,i) => s + i.validations, 0).toString(), sub: "On-chain proofs", color: "text-purple-300", icon: "✅" },
          { label: "Active Agents", value: "200", sub: "AGI researchers", color: "text-cyan-300", icon: "🤖" },
          { label: "ANF Token", value: "$3.421", sub: "+18.2% today", color: "text-emerald-300", icon: "🪙" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.06 }} className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><span>{s.icon}</span><span className="text-xs text-slate-500">{s.label}</span></div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-600">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all","deployed","validated","researching","proposed"] as const).map(f => {
          const style = f !== "all" ? STATUS_STYLES[f] : null;
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all border ${
                filter === f
                  ? f === "all" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" : `${style?.bg} ${style?.text} ${style?.border}`
                  : "glass border-transparent text-slate-400 hover:text-white"
              }`}
            >{f === "all" ? "All Innovations" : style?.label ?? f}</button>
          );
        })}
      </div>

      {/* Innovation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((innovation, i) => {
          const style = STATUS_STYLES[innovation.status];
          const isSelected = selectedInnovation?.id === innovation.id;
          return (
            <motion.div
              key={innovation.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`glass rounded-2xl p-5 cursor-pointer transition-all duration-200 border relative overflow-hidden ${
                isSelected ? "border-amber-500/40 glow-amber" : "border-transparent hover:border-white/10"
              }`}
              onClick={() => setSelectedInnovation(isSelected ? null : innovation)}
            >
              <div className="absolute top-0 right-0 text-6xl opacity-5 pointer-events-none select-none p-4">{innovation.icon}</div>
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{innovation.icon}</span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono text-slate-500">{innovation.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${style.bg} ${style.text} ${style.border}`}>{style.label}</span>
                      </div>
                      <h3 className="font-bold text-white text-sm mt-0.5">{innovation.title}</h3>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-amber-300 font-bold">{(innovation.reward/1e6).toFixed(1)}M</p>
                    <p className="text-[10px] text-slate-500">OMNI reward</p>
                  </div>
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">{innovation.description}</p>
                      <div className="space-y-2 mb-3">
                        <ScoreBar value={innovation.feasibilityScore} color="#06b6d4" label="Feasibility" />
                        <ScoreBar value={innovation.impactScore} color="#a855f7" label="Impact" />
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span>Hash: <span className="font-mono text-slate-400">{innovation.contentHash.slice(0,18)}...</span></span>
                        <span>Domain: <span className="text-cyan-400">{innovation.domain}</span></span>
                        <span className="ml-auto">{innovation.validations}/3 validations</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!isSelected && (
                  <p className="text-xs text-slate-500 line-clamp-2">{innovation.description}</p>
                )}

                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-500">
                  <span>{innovation.domain.replace(/_/g," ")}</span>
                  <div className="flex items-center gap-1.5">
                    <span>{innovation.validations}/3 validated</span>
                    <div className="flex gap-0.5">
                      {[0,1,2].map(j => (
                        <div key={j} className={`w-2 h-2 rounded-sm ${j < innovation.validations ? "bg-emerald-400" : "bg-slate-700"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
