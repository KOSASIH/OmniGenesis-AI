"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

// ─── PiNexus Hub ─────────────────────────────────────────────────────────────

const PIONEER_REGIONS = [
  { region: "Asia Pacific",    pioneers: 18_400_000, growth: 8.2,  color: "#a855f7" },
  { region: "South Asia",      pioneers: 12_100_000, growth: 12.1, color: "#06b6d4" },
  { region: "Africa",          pioneers: 7_200_000,  growth: 18.4, color: "#10b981" },
  { region: "Latin America",   pioneers: 5_400_000,  growth: 9.7,  color: "#f59e0b" },
  { region: "North America",   pioneers: 2_100_000,  growth: 3.2,  color: "#ec4899" },
  { region: "Europe",          pioneers: 1_600_000,  growth: 4.1,  color: "#8b5cf6" },
  { region: "Middle East",     pioneers: 400_000,    growth: 15.3, color: "#f97316" },
];

const INTEGRATION_STATUS = [
  { feature: "OMNI ↔ PNX Bridge", status: "live", detail: "$8.9M vol/24h" },
  { feature: "PiNexus Pioneer KYC", status: "live", detail: "47.2M verified" },
  { feature: "PiNEX Staking Vault", status: "live", detail: "28.3M TVL" },
  { feature: "Agent Overlord Network", status: "live", detail: "200 agents active" },
  { feature: "Pi App Wallet Connect", status: "live", detail: "1.2M wallets linked" },
  { feature: "PiNexus Governance Vote", status: "beta", detail: "Phase 2 launch" },
  { feature: "Pi NFT Bridge", status: "development", detail: "Q3 2026 target" },
  { feature: "Pioneer Rewards Streaming", status: "development", detail: "Q4 2026 target" },
];

function generateTxHistory() {
  const data = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      volume: 200_000 + Math.random() * 600_000 + (29 - i) * 20_000,
      txCount: 40_000 + Math.floor(Math.random() * 80_000),
      pioneers: 47_000_000 + (29 - i) * 10_000,
    });
  }
  return data;
}

const TX_HISTORY = generateTxHistory();

const PiTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-2.5 border border-teal-500/20 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-teal-300">${(payload[0]?.value/1e6).toFixed(2)}M vol</p>
      {payload[1] && <p className="text-purple-300">{payload[1]?.value?.toLocaleString()} tx</p>}
    </div>
  );
};

const STATUS_META = {
  live:        { text: "🟢 Live", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/25" },
  beta:        { text: "🟡 Beta", color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/25" },
  development: { text: "🔵 Dev",  color: "text-blue-400",    bg: "bg-blue-400/10",     border: "border-blue-400/25" },
};

export default function PiNexusHub() {
  const [pioneers, setPioneers] = useState(47_200_000);
  const [dailyKYC, setDailyKYC] = useState(847);
  const [bridgeVol, setBridgeVol] = useState(8_943_200);
  const [nodeCount, setNodeCount] = useState(3_847);
  const [txHistory, setTxHistory] = useState(TX_HISTORY);

  useEffect(() => {
    const t = setInterval(() => {
      setPioneers(p => p + Math.floor(Math.random() * 20));
      setDailyKYC(k => Math.max(400, Math.min(2000, k + Math.floor((Math.random() - 0.5) * 50))));
      setBridgeVol(v => v + Math.random() * 5000);
      setNodeCount(n => Math.max(3000, Math.min(5000, n + (Math.random() > 0.9 ? 1 : Math.random() < 0.1 ? -1 : 0))));
      setTxHistory(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        updated[updated.length - 1] = {
          ...last,
          volume: last.volume + (Math.random() - 0.4) * 20000,
          txCount: last.txCount + Math.floor((Math.random() - 0.45) * 500),
        };
        return updated;
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const total = PIONEER_REGIONS.reduce((s, r) => s + r.pioneers, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(0,196,180,0.1), rgba(168,85,247,0.08))" }}
      >
        <div className="absolute inset-0 border border-teal-500/20 rounded-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl font-bold" style={{ color: "#00C4B4" }}>π</span>
              <div>
                <h2 className="text-xl font-bold" style={{ background: "linear-gradient(135deg,#00C4B4,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  PiNexus Integration Hub
                </h2>
                <p className="text-xs text-slate-400">Bridging Pi Network ecosystem with OmniGenesis AI</p>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs px-3 py-2 rounded-xl glass border border-teal-500/20">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 font-semibold">Phase 2 — Full Integration LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Pioneers", value: pioneers.toLocaleString(), color: "#00C4B4", icon: "π", sub: `+${dailyKYC}/day KYC` },
          { label: "Bridge Volume 24h", value: `$${(bridgeVol/1e6).toFixed(2)}M`, color: "#a855f7", icon: "🌉", sub: "OMNI↔PNX↔ETH" },
          { label: "Consensus Nodes", value: nodeCount.toLocaleString(), color: "#06b6d4", icon: "⬡", sub: "4.2s avg block" },
          { label: "Linked Wallets", value: "1.2M", color: "#10b981", icon: "👛", sub: "Pi App Wallet" },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.06 }} className="glass rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1"><span>{m.icon}</span><span className="text-xs text-slate-500">{m.label}</span></div>
            <p className="text-xl font-bold tabular-nums" style={{ color: m.color }}>{m.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{m.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bridge chart */}
        <div className="lg:col-span-2 glass-purple rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white text-sm">Bridge Volume & Transaction History</h3>
            <span className="text-xs text-teal-400 animate-pulse">◈ Live</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={txHistory}>
              <defs>
                <linearGradient id="piVolGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C4B4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00C4B4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="piTxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={6} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1e6).toFixed(1)}M`} />
              <Tooltip content={<PiTooltip />} />
              <Area type="monotone" dataKey="volume" stroke="#00C4B4" strokeWidth={2} fill="url(#piVolGrad)" name="Volume" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pioneer distribution */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Pioneer Distribution</h3>
          <div className="space-y-2.5">
            {PIONEER_REGIONS.map(r => {
              const pct = (r.pioneers / total) * 100;
              return (
                <div key={r.region}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300">{r.region}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 text-[10px]">+{r.growth}%</span>
                      <span className="text-white font-mono">{(r.pioneers/1e6).toFixed(1)}M</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white text-sm mb-4">Integration Feature Matrix</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {INTEGRATION_STATUS.map((f, i) => {
            const meta = STATUS_META[f.status];
            return (
              <motion.div
                key={f.feature}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.05 }}
                className="flex items-center gap-3 glass rounded-xl px-3 py-2.5"
              >
                <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${meta.bg} ${meta.color} ${meta.border}`}>
                  {meta.text}
                </span>
                <span className="text-sm text-white flex-1">{f.feature}</span>
                <span className="text-xs text-slate-500">{f.detail}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
