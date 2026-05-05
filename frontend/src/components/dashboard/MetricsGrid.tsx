"use client";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ECOSYSTEM_KPIS, TVL_HISTORY, TOKENS } from "@/lib/mock-data";

interface KPI { label: string; value: string; change: string; positive: boolean; icon: string; color: string; sublabel?: string; }

const KPIS: KPI[] = [
  { label: "Total Value Locked", value: "$847.3M", change: "+12.4%", positive: true, icon: "💰", color: "purple", sublabel: "Across 6 chains" },
  { label: "Active Agents", value: "1,000", change: "99.97% uptime", positive: true, icon: "🤖", color: "cyan", sublabel: "Swarm IQ: 9,847" },
  { label: "OMNI Price", value: "$0.00847", change: "+8.2%", positive: true, icon: "⚡", color: "purple", sublabel: "Vol: $2.1M" },
  { label: "OGEN Peg", value: "$1.0012", change: "+0.12%", positive: true, icon: "💎", color: "emerald", sublabel: "Deviation: 0.12%" },
  { label: "Daily Volume", value: "$42.7M", change: "+23.1%", positive: true, icon: "📊", color: "pink", sublabel: "24h transactions" },
  { label: "PiNexus Pioneers", value: "47.2M", change: "+5.7%", positive: true, icon: "π", color: "teal", sublabel: "KYC verified" },
  { label: "Bridge Volume", value: "$8.9M", change: "+31.2%", positive: true, icon: "🌉", color: "blue", sublabel: "24h cross-chain" },
  { label: "Innovations Live", value: "10", change: "+2 this week", positive: true, icon: "⚗️", color: "amber", sublabel: "AetherNova Forge" },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  purple:  { bg: "bg-purple-500/10",  border: "border-purple-500/20", text: "text-purple-400",  glow: "hover:glow-purple" },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",   text: "text-cyan-400",    glow: "hover:glow-cyan" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20",text: "text-emerald-400", glow: "hover:glow-emerald" },
  pink:    { bg: "bg-pink-500/10",    border: "border-pink-500/20",   text: "text-pink-400",    glow: "" },
  teal:    { bg: "bg-teal-500/10",    border: "border-teal-500/20",   text: "text-teal-400",    glow: "" },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",   text: "text-blue-400",    glow: "" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",  text: "text-amber-400",   glow: "hover:glow-amber" },
};

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

function KPICard({ kpi, index }: { kpi: KPI; index: number }) {
  const colors = COLOR_MAP[kpi.color] ?? COLOR_MAP.purple;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className={`glass rounded-2xl p-4 border ${colors.border} ${colors.glow} transition-all duration-300 cursor-default relative overflow-hidden group`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 shimmer-bg rounded-2xl" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <span className="text-2xl">{kpi.icon}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${kpi.positive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
            {kpi.change}
          </span>
        </div>
        <p className={`text-2xl font-bold ${colors.text} tabular-nums`}>{kpi.value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
        {kpi.sublabel && <p className="text-[11px] text-slate-600 mt-0.5">{kpi.sublabel}</p>}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 border border-purple-500/20">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-purple-300">${(payload[0].value / 1e6).toFixed(1)}M TVL</p>
      <p className="text-xs text-cyan-400">{payload[1]?.value} agents</p>
    </div>
  );
};

export default function MetricsGrid() {
  const [tvlData, setTvlData] = useState(TVL_HISTORY);

  // Simulate live TVL updates
  useEffect(() => {
    const t = setInterval(() => {
      setTvlData(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = { ...last, tvl: last.tvl + (Math.random() - 0.48) * 1_000_000 };
        return updated;
      });
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KPIS.map((kpi, i) => <KPICard key={kpi.label} kpi={kpi} index={i} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* TVL Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 glass-purple rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-white text-sm">Total Value Locked</h3>
              <p className="text-2xl font-bold gradient-text mt-0.5">$847.3M</p>
            </div>
            <div className="flex gap-2">
              {["1D","7D","30D","All"].map((p, i) => (
                <button key={p} className={`text-xs px-2 py-1 rounded-lg transition-all ${i === 2 ? "bg-purple-600/30 text-purple-300 border border-purple-500/30" : "text-slate-500 hover:text-white"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={tvlData}>
              <defs>
                <linearGradient id="tvlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="agentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1e6).toFixed(0)}M`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="tvl" stroke="#a855f7" strokeWidth={2} fill="url(#tvlGrad)" />
              <Area type="monotone" dataKey="agents" stroke="#06b6d4" strokeWidth={1.5} fill="url(#agentGrad)" yAxisId={1} hide />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Token prices mini */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="font-semibold text-white text-sm mb-4">Token Prices</h3>
          <div className="space-y-3">
            {Object.values(TOKENS).map((token) => (
              <div key={token.symbol} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">{token.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{token.symbol}</p>
                    <p className="text-[10px] text-slate-500">{token.name.slice(0,14)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-white">${token.price < 0.01 ? token.price.toFixed(5) : token.price.toFixed(4)}</p>
                  <p className={`text-[10px] font-medium ${token.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {token.change24h >= 0 ? "+" : ""}{token.change24h}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
