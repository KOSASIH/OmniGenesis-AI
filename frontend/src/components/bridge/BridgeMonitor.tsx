"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BRIDGE_TRANSACTIONS, type BridgeTransaction } from "@/lib/mock-data";

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: "#627EEA", BSC: "#F0B90B", Polygon: "#8247E5",
  Arbitrum: "#28A0F0", Base: "#0052FF", PiNexus: "#00C4B4",
};
const CHAIN_ICONS: Record<string, string> = {
  Ethereum: "⟠", BSC: "⬡", Polygon: "⬡", Arbitrum: "⟡", Base: "🔵", PiNexus: "π",
};

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  confirmed: { bg: "bg-emerald-400/10", text: "text-emerald-400", dot: "bg-emerald-400" },
  pending:   { bg: "bg-yellow-400/10",  text: "text-yellow-400",  dot: "bg-yellow-400 animate-pulse" },
  failed:    { bg: "bg-red-400/10",     text: "text-red-400",     dot: "bg-red-400" },
};

const CHAINS = ["Ethereum","BSC","Polygon","Arbitrum","Base","PiNexus"];
const CHAIN_STATS = CHAINS.map(chain => ({
  chain, icon: CHAIN_ICONS[chain], color: CHAIN_COLORS[chain],
  volume: Math.floor(Math.random() * 2_000_000 + 500_000),
  txCount: Math.floor(Math.random() * 500 + 100),
  avgTime: (1.5 + Math.random() * 4).toFixed(1),
  health: Math.random() > 0.1 ? "operational" : "degraded",
}));

export default function BridgeMonitor() {
  const [txs, setTxs] = useState<BridgeTransaction[]>(BRIDGE_TRANSACTIONS);
  const [totalVolume, setTotalVolume] = useState(8_943_200);
  const [totalTx, setTotalTx] = useState(4_827);
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "failed">("all");

  // Simulate new bridge transactions
  useEffect(() => {
    const CHAINS_LIST = Object.keys(CHAIN_COLORS);
    const TOKENS = ["OMNI","OGEN","PNX","PINEX","ANF"];
    let txId = 100;
    const t = setInterval(() => {
      if (Math.random() > 0.5) {
        const from = CHAINS_LIST[Math.floor(Math.random() * CHAINS_LIST.length)];
        const to = CHAINS_LIST.filter(c => c !== from)[Math.floor(Math.random() * 5)];
        const token = TOKENS[Math.floor(Math.random() * TOKENS.length)];
        const amount = Math.floor(500 + Math.random() * 50000);
        const newTx: BridgeTransaction = {
          id: `tx_${txId++}`, fromChain: from, toChain: to, token, amount,
          usdValue: amount * (token === "OGEN" ? 1 : 0.15),
          status: Math.random() > 0.15 ? "confirmed" : "pending",
          timestamp: "just now",
          txHash: "0x" + Math.random().toString(16).slice(2, 10),
          validators: 3,
        };
        setTxs(prev => [newTx, ...prev.slice(0, 24)]);
        setTotalVolume(v => v + newTx.usdValue);
        setTotalTx(n => n + 1);
      }
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const filtered = filter === "all" ? txs : txs.filter(t => t.status === filter);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "24h Bridge Volume", value: `$${(totalVolume/1e6).toFixed(2)}M`, color: "text-purple-300", icon: "🌉" },
          { label: "Total Transactions", value: totalTx.toLocaleString(), color: "text-cyan-300", icon: "📊" },
          { label: "Avg Bridge Time", value: "3.2s", color: "text-emerald-300", icon: "⚡" },
          { label: "Active Validators", value: "21/21", color: "text-amber-300", icon: "🛡️" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.06 }} className="glass rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1"><span>{s.icon}</span><span className="text-xs text-slate-500">{s.label}</span></div>
            <p className={`text-xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Chain health grid */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white text-sm mb-4">HyperChainFabric — 6-Chain Network Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {CHAIN_STATS.map((c, i) => (
            <motion.div
              key={c.chain}
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i*0.05 }}
              className="glass rounded-xl p-3 text-center relative overflow-hidden"
              style={{ borderColor: c.color + "30" }}
            >
              <div className="absolute inset-0 opacity-5 rounded-xl" style={{ backgroundColor: c.color }} />
              <div className="text-2xl mb-1">{c.icon}</div>
              <p className="text-xs font-semibold text-white">{c.chain}</p>
              <p className="text-[10px] text-slate-500 mb-2">${(c.volume/1e6).toFixed(1)}M vol</p>
              <div className={`text-[10px] px-1.5 py-0.5 rounded-full ${c.health === "operational" ? "bg-emerald-400/10 text-emerald-400" : "bg-yellow-400/10 text-yellow-400"}`}>
                {c.health}
              </div>
              <p className="text-[10px] text-slate-600 mt-1">{c.txCount} tx · {c.avgTime}s</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transaction feed */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white text-sm">Live Bridge Transactions</h3>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="flex gap-1">
            {(["all","confirmed","pending","failed"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all capitalize ${filter === f ? "bg-purple-600/30 text-purple-300 border border-purple-500/30" : "glass text-slate-400 hover:text-white"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {filtered.map((tx, i) => {
              const s = STATUS_STYLES[tx.status];
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i < 5 ? i * 0.04 : 0 }}
                  className="flex items-center gap-3 glass rounded-xl px-3 py-2.5 hover:border-white/10 transition-all"
                >
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-sm">{CHAIN_ICONS[tx.fromChain] ?? "?"}</span>
                    <span className="text-xs" style={{ color: CHAIN_COLORS[tx.fromChain] }}>{tx.fromChain}</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-sm">{CHAIN_ICONS[tx.toChain] ?? "?"}</span>
                    <span className="text-xs" style={{ color: CHAIN_COLORS[tx.toChain] }}>{tx.toChain}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-xs font-mono text-white">{tx.amount.toLocaleString()}</span>
                    <span className="text-xs text-purple-300">{tx.token}</span>
                    <span className="text-xs text-slate-500">(${tx.usdValue.toLocaleString(undefined, {maximumFractionDigits:0})})</span>
                  </div>
                  <div className="hidden md:flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span>{tx.validators}/3 validators</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600">{tx.txHash}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${s.bg} ${s.text} flex-shrink-0`}>{tx.status}</span>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">{tx.timestamp}</span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
