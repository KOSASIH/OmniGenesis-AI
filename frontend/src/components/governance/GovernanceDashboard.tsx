"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { GOVERNANCE_PROPOSALS, type GovernanceProposal } from "@/lib/mock-data";

const STATUS_STYLES: Record<GovernanceProposal["status"], { bg: string; text: string; border: string }> = {
  active:   { bg: "bg-purple-400/10", text: "text-purple-300",  border: "border-purple-400/30" },
  passed:   { bg: "bg-emerald-400/10",text: "text-emerald-400", border: "border-emerald-400/30" },
  failed:   { bg: "bg-red-400/10",    text: "text-red-400",     border: "border-red-400/30" },
  queued:   { bg: "bg-amber-400/10",  text: "text-amber-400",   border: "border-amber-400/30" },
  executed: { bg: "bg-cyan-400/10",   text: "text-cyan-400",    border: "border-cyan-400/30" },
};

function VoteBar({ votesFor, votesAgainst, votesAbstain, quorum }: { votesFor: number; votesAgainst: number; votesAbstain: number; quorum: number }) {
  const total = votesFor + votesAgainst + votesAbstain || 1;
  const forPct = (votesFor / total) * 100;
  const againstPct = (votesAgainst / total) * 100;
  const abstainPct = (votesAbstain / total) * 100;
  const quorumPct = Math.min(100, (total / quorum) * 100);

  return (
    <div className="space-y-2 mt-3">
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        <div className="bg-emerald-500 rounded-l-full transition-all duration-500" style={{ width: `${forPct}%` }} />
        <div className="bg-red-500 transition-all duration-500" style={{ width: `${againstPct}%` }} />
        <div className="bg-slate-600 rounded-r-full transition-all duration-500" style={{ width: `${abstainPct}%` }} />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex gap-3">
          <span className="text-emerald-400">✓ {(votesFor/1e6).toFixed(1)}M ({forPct.toFixed(1)}%)</span>
          <span className="text-red-400">✗ {(votesAgainst/1e6).toFixed(1)}M</span>
          <span className="text-slate-500">~ {(votesAbstain/1e6).toFixed(1)}M</span>
        </div>
        <span className={`text-xs ${quorumPct >= 100 ? "text-emerald-400" : "text-amber-400"}`}>
          Quorum: {quorumPct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default function GovernanceDashboard() {
  const [selectedProposal, setSelectedProposal] = useState<GovernanceProposal | null>(null);
  const [filter, setFilter] = useState<GovernanceProposal["status"] | "all">("all");

  const filtered = filter === "all" ? GOVERNANCE_PROPOSALS : GOVERNANCE_PROPOSALS.filter(p => p.status === filter);
  const activeCount = GOVERNANCE_PROPOSALS.filter(p => p.status === "active").length;
  const totalVotingPower = GOVERNANCE_PROPOSALS.reduce((s, p) => s + p.votesFor + p.votesAgainst + p.votesAbstain, 0);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Proposals", value: activeCount, color: "text-purple-300", icon: "🏛️" },
          { label: "Total Proposals", value: GOVERNANCE_PROPOSALS.length, color: "text-white", icon: "📜" },
          { label: "Your Voting Power", value: "0 OMNI", color: "text-slate-400", icon: "⚡" },
          { label: "Quorum Required", value: "10M OMNI", color: "text-cyan-300", icon: "🎯" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.06 }} className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><span>{s.icon}</span><span className="text-xs text-slate-500">{s.label}</span></div>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {(["all","active","passed","queued","executed","failed"] as const).map(f => {
          const style = f === "all" ? null : STATUS_STYLES[f];
          return (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all capitalize border ${
                filter === f
                  ? f === "all" ? "bg-purple-600/30 text-purple-300 border-purple-500/30" : `${style?.bg} ${style?.text} ${style?.border}`
                  : "glass border-transparent text-slate-400 hover:text-white"
              }`}
            >{f}</button>
          );
        })}
      </div>

      {/* Proposals */}
      <div className="space-y-3">
        {filtered.map((proposal, i) => {
          const style = STATUS_STYLES[proposal.status];
          const isSelected = selectedProposal?.id === proposal.id;
          return (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className={`glass rounded-2xl p-5 cursor-pointer transition-all duration-200 border ${
                isSelected ? "border-purple-500/40 glow-purple" : "border-transparent hover:border-white/10"
              }`}
              onClick={() => setSelectedProposal(isSelected ? null : proposal)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-slate-500">{proposal.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${style.bg} ${style.text} ${style.border}`}>
                      {proposal.status}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full glass text-slate-400">{proposal.category}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm leading-tight">{proposal.title}</h3>
                  {isSelected && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-slate-400 mt-2 leading-relaxed">
                      {proposal.description}
                    </motion.p>
                  )}
                </div>
                <div className="text-right flex-shrink-0 text-xs text-slate-500">
                  <p>By {proposal.proposer}</p>
                  <p className="mt-0.5">{proposal.endsAt}</p>
                </div>
              </div>

              <VoteBar
                votesFor={proposal.votesFor}
                votesAgainst={proposal.votesAgainst}
                votesAbstain={proposal.votesAbstain}
                quorum={proposal.quorum}
              />

              {proposal.status === "active" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 mt-3">
                  <button className="flex-1 py-2 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 transition-all">
                    ✓ Vote For
                  </button>
                  <button className="flex-1 py-2 rounded-xl text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 hover:bg-red-400/20 transition-all">
                    ✗ Vote Against
                  </button>
                  <button className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 bg-slate-400/10 border border-slate-400/20 hover:bg-slate-400/20 transition-all">
                    Abstain
                  </button>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
