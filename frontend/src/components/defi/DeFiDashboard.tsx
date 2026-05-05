"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, RadialBarChart, RadialBar, Legend,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { TOKENS, STAKING_POOLS, PRICE_HISTORY } from "@/lib/mock-data";

const DeFiTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 border border-white/10 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" && p.value > 10 ? p.value.toLocaleString() : p.value?.toFixed(5)}
        </p>
      ))}
    </div>
  );
};

export default function DeFiDashboard() {
  const [selectedToken, setSelectedToken] = useState("OMNI");
  const [priceData, setPriceData] = useState(PRICE_HISTORY[selectedToken]);
  const [livePrice, setLivePrice] = useState(TOKENS[selectedToken].price);

  useEffect(() => {
    setPriceData(PRICE_HISTORY[selectedToken]);
    setLivePrice(TOKENS[selectedToken].price);
  }, [selectedToken]);

  // Simulate live price fluctuation
  useEffect(() => {
    const t = setInterval(() => {
      setLivePrice(prev => {
        const base = TOKENS[selectedToken].price;
        const drift = (Math.random() - 0.49) * base * 0.002;
        return Math.max(prev + drift, base * 0.95);
      });
      setPriceData(prev => {
        const newData = [...prev];
        const last = newData[newData.length - 1];
        const drift = (Math.random() - 0.48) * last.price * 0.003;
        newData[newData.length - 1] = { ...last, price: Math.max(last.price + drift, last.price * 0.97) };
        return newData;
      });
    }, 3000);
    return () => clearInterval(t);
  }, [selectedToken]);

  const token = TOKENS[selectedToken];
  const radialData = STAKING_POOLS.map(p => ({ name: p.token, value: p.apr, color: p.color }));

  return (
    <div className="space-y-5">
      {/* Token selector */}
      <div className="flex gap-2 flex-wrap">
        {Object.values(TOKENS).map(t => (
          <motion.button
            key={t.symbol}
            onClick={() => setSelectedToken(t.symbol)}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
              selectedToken === t.symbol
                ? "border-opacity-60 text-white"
                : "glass border-transparent text-slate-400 hover:text-white"
            }`}
            style={selectedToken === t.symbol ? { borderColor: t.color, backgroundColor: t.color + "18", boxShadow: `0 0 20px ${t.color}25` } : {}}
          >
            <span>{t.icon}</span>
            <span>{t.symbol}</span>
            <span className={`text-xs ${t.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {t.change24h >= 0 ? "+" : ""}{t.change24h}%
            </span>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Price chart */}
        <div className="lg:col-span-2 glass-purple rounded-2xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{token.icon}</span>
                <h3 className="text-lg font-bold text-white">{token.symbol}</h3>
                <span className="text-xs text-slate-500">{token.name}</span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <p className="text-3xl font-bold tabular-nums" style={{ color: token.color }}>
                  ${livePrice < 0.01 ? livePrice.toFixed(6) : livePrice.toFixed(4)}
                </p>
                <span className={`text-sm font-medium ${token.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {token.change24h >= 0 ? "▲" : "▼"} {Math.abs(token.change24h)}% 24h
                </span>
                <span className="text-xs text-slate-500">7d: {token.change7d >= 0 ? "+" : ""}{token.change7d}%</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400 space-y-1">
              <p>MCap: <span className="text-white">${(token.marketCap / 1e6).toFixed(1)}M</span></p>
              <p>Vol 24h: <span className="text-white">${(token.volume24h / 1e6).toFixed(1)}M</span></p>
              <p>Supply: <span className="text-white">{(token.circulatingSupply / 1e9).toFixed(1)}B</span></p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={token.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={token.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="time" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v < 0.01 ? `$${v.toFixed(5)}` : `$${v.toFixed(3)}`} domain={["auto","auto"]} width={65} />
              <Tooltip content={<DeFiTooltip />} />
              <Area type="monotone" dataKey="price" stroke={token.color} strokeWidth={2} fill="url(#priceGrad)" name="Price" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Staking APY radial */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Staking APY</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="100%" data={radialData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "rgba(255,255,255,0.03)" }}>
                {radialData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </RadialBar>
              <Tooltip formatter={(v: any) => [`${v}% APY`]} contentStyle={{ background: "rgba(15,10,30,0.9)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 12, fontSize: 12 }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {STAKING_POOLS.map(pool => (
              <div key={pool.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pool.color }} />
                  <span className="text-slate-300">{pool.token} → {pool.rewardToken}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold" style={{ color: pool.color }}>{pool.apr}%</span>
                  <span className="text-slate-500 ml-1">{pool.lockDays > 0 ? `${pool.lockDays}d lock` : "flex"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staking pools table */}
      <div className="glass rounded-2xl p-5">
        <h3 className="font-semibold text-white text-sm mb-4">Liquidity & Staking Pools</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-white/5">
                <th className="pb-2 text-left">Pool</th>
                <th className="pb-2 text-right">APR</th>
                <th className="pb-2 text-right">TVL</th>
                <th className="pb-2 text-right">Lock Period</th>
                <th className="pb-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {STAKING_POOLS.map((pool, i) => (
                <motion.tr
                  key={pool.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.07 }}
                  className="border-b border-white/3 hover:bg-white/2 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: pool.color }} />
                      <span className="text-white font-medium">{pool.token}</span>
                      <span className="text-slate-500">→ {pool.rewardToken}</span>
                    </div>
                  </td>
                  <td className="py-3 text-right font-bold" style={{ color: pool.color }}>{pool.apr}%</td>
                  <td className="py-3 text-right text-white">${(pool.tvl / 1e6).toFixed(1)}M</td>
                  <td className="py-3 text-right text-slate-400">{pool.lockDays > 0 ? `${pool.lockDays} days` : "Flexible"}</td>
                  <td className="py-3 text-right">
                    <button className="px-3 py-1 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: pool.color + "40", border: `1px solid ${pool.color}50` }}>
                      Stake
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
