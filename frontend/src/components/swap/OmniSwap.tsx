"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TOKENS = [
  { symbol: "OMNI",  name: "OmniGenesis",     price: 0.00847, icon: "⚡", color: "#a855f7", decimals: 18, change24h: 8.2 },
  { symbol: "OGEN",  name: "OmniGen Stable",  price: 1.0012,  icon: "💎", color: "#10b981", decimals: 18, change24h: 0.12 },
  { symbol: "ANF",   name: "AetherNova Forge",price: 3.421,   icon: "⚗️", color: "#f59e0b", decimals: 18, change24h: 18.2 },
  { symbol: "PNX",   name: "PiNexus",         price: 0.00021, icon: "π",  color: "#00C4B4", decimals: 18, change24h: 3.4 },
  { symbol: "ETH",   name: "Ethereum",        price: 3847.21, icon: "⟠",  color: "#627EEA", decimals: 18, change24h: -1.2 },
  { symbol: "BNB",   name: "BNB Chain",       price: 612.84,  icon: "⬡",  color: "#F0B90B", decimals: 18, change24h: 2.1 },
];

const ROUTES = [
  ["OMNI","OGEN"],["OMNI","ANF"],["OMNI","ETH"],
  ["OGEN","ANF"],["ANF","PNX"],["PNX","OMNI"],["ETH","OMNI"],
];

function getRoute(from: string, to: string) {
  // Direct route check
  if (ROUTES.some(r => (r[0] === from && r[1] === to) || (r[1] === from && r[0] === to))) {
    return [from, to];
  }
  // Multi-hop via OMNI
  if (from !== "OMNI" && to !== "OMNI") return [from, "OMNI", to];
  return [from, to];
}

function RouteViz({ route }: { route: string[] }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {route.map((token, i) => {
        const t = TOKENS.find(t => t.symbol === token);
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-500 text-sm">→</span>}
            <span className="text-xs px-2 py-0.5 rounded-lg flex items-center gap-1"
              style={{ backgroundColor: (t?.color ?? "#a855f7") + "20", color: t?.color ?? "#a855f7" }}>
              {t?.icon} {token}
            </span>
          </span>
        );
      })}
    </div>
  );
}

const RECENT_SWAPS = [
  { from: "ETH", to: "OMNI", amount: "0.5 ETH", received: "226,870 OMNI", time: "2m ago", address: "0x847a...f24d" },
  { from: "OMNI", to: "OGEN", amount: "50,000 OMNI", received: "423.5 OGEN", time: "5m ago", address: "0x3b2c...91ae" },
  { from: "ANF", to: "OMNI", amount: "100 ANF", received: "40,413 OMNI", time: "8m ago", address: "0xab1d...c84f" },
  { from: "PNX", to: "OGEN", amount: "1M PNX", received: "210 OGEN", time: "12m ago", address: "0x927f...2d3a" },
  { from: "OMNI", to: "ANF", amount: "10,000 OMNI", received: "24.74 ANF", time: "15m ago", address: "0x4d8e...7fb2" },
];

export default function OmniSwap() {
  const [fromToken, setFromToken] = useState("OMNI");
  const [toToken, setToToken] = useState("OGEN");
  const [fromAmount, setFromAmount] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [isSwapping, setIsSwapping] = useState(false);
  const [recentSwaps, setRecentSwaps] = useState(RECENT_SWAPS);
  const [prices, setPrices] = useState<Record<string, number>>(
    Object.fromEntries(TOKENS.map(t => [t.symbol, t.price]))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setPrices(prev => {
        const updated = { ...prev };
        TOKENS.forEach(t => {
          updated[t.symbol] = Math.max(t.price * 0.95, prev[t.symbol] + (Math.random() - 0.495) * t.price * 0.002);
        });
        return updated;
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const fromT = TOKENS.find(t => t.symbol === fromToken)!;
  const toT = TOKENS.find(t => t.symbol === toToken)!;
  const route = useMemo(() => getRoute(fromToken, toToken), [fromToken, toToken]);

  const fromPrice = prices[fromToken] ?? fromT.price;
  const toPrice = prices[toToken] ?? toT.price;
  const inputNum = parseFloat(fromAmount) || 0;
  const rawOutput = inputNum * fromPrice / toPrice;
  const priceImpact = inputNum > 0 ? Math.min(5, inputNum * fromPrice / 1_000_000) : 0;
  const outputAmount = rawOutput * (1 - priceImpact / 100) * (1 - slippage / 100);
  const exchangeRate = fromPrice / toPrice;

  const handleSwap = async () => {
    if (!fromAmount || !inputNum) return;
    setIsSwapping(true);
    await new Promise(r => setTimeout(r, 1500));
    const newSwap = {
      from: fromToken, to: toToken,
      amount: `${fromAmount} ${fromToken}`,
      received: `${outputAmount.toFixed(toT.price > 1 ? 4 : 0)} ${toToken}`,
      time: "just now",
      address: "0x" + Math.random().toString(16).slice(2, 10) + "..." + Math.random().toString(16).slice(2, 6),
    };
    setRecentSwaps(prev => [newSwap, ...prev.slice(0, 4)]);
    setFromAmount("");
    setIsSwapping(false);
  };

  const flip = () => { setFromToken(toToken); setToToken(fromToken); setFromAmount(""); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <span className="text-2xl">🔄</span>
        <div>
          <h2 className="text-xl font-bold gradient-text">OmniSwap DEX</h2>
          <p className="text-xs text-slate-400">Multi-chain token swaps with intelligent routing · 6 chains · 0.1% fee</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Swap card */}
        <div className="lg:col-span-1">
          <div className="glass-purple rounded-2xl p-5 space-y-3">
            {/* From */}
            <div className="glass rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">From</span>
                <span className="text-xs text-slate-500">Balance: <span className="text-white">∞</span></span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={e => setFromAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-2xl font-bold text-white outline-none placeholder-slate-700"
                />
                <select
                  value={fromToken}
                  onChange={e => setFromToken(e.target.value)}
                  className="glass rounded-xl px-3 py-2 text-sm font-semibold text-white outline-none appearance-none cursor-pointer border border-white/10"
                  style={{ color: fromT.color }}
                >
                  {TOKENS.map(t => (
                    <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs text-slate-500">
                <span>${inputNum > 0 ? (inputNum * fromPrice).toFixed(2) : "0.00"}</span>
                <button onClick={() => setFromAmount("1000")} className="text-purple-400 hover:text-purple-300">MAX</button>
              </div>
            </div>

            {/* Flip button */}
            <div className="flex justify-center">
              <motion.button
                onClick={flip}
                whileHover={{ scale: 1.15, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 glass rounded-xl flex items-center justify-center text-purple-400 hover:text-purple-300 transition-all border border-purple-500/20 glow-purple"
              >
                ⇅
              </motion.button>
            </div>

            {/* To */}
            <div className="glass rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">To</span>
                <span className="text-xs text-emerald-400">{priceImpact > 0 ? `${priceImpact.toFixed(3)}% impact` : ""}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 text-2xl font-bold text-white tabular-nums">
                  {outputAmount > 0 ? (
                    <span>{outputAmount < 0.001 ? outputAmount.toFixed(8) : outputAmount.toFixed(toT.price > 1 ? 4 : 2)}</span>
                  ) : <span className="text-slate-700">0.0</span>}
                </div>
                <select
                  value={toToken}
                  onChange={e => setToToken(e.target.value)}
                  className="glass rounded-xl px-3 py-2 text-sm font-semibold outline-none appearance-none cursor-pointer border border-white/10"
                  style={{ color: toT.color }}
                >
                  {TOKENS.filter(t => t.symbol !== fromToken).map(t => (
                    <option key={t.symbol} value={t.symbol}>{t.icon} {t.symbol}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">${outputAmount > 0 ? (outputAmount * toPrice).toFixed(2) : "0.00"}</p>
            </div>

            {/* Route */}
            <div className="glass rounded-xl px-3 py-2">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500">Route</span>
                <span className="text-slate-500">Best path</span>
              </div>
              <RouteViz route={route} />
            </div>

            {/* Rate + slippage */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Exchange rate</span>
                <span className="text-white font-mono">1 {fromToken} = {exchangeRate.toFixed(6)} {toToken}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Slippage tolerance</span>
                <div className="flex gap-1">
                  {[0.1, 0.5, 1.0].map(s => (
                    <button key={s} onClick={() => setSlippage(s)}
                      className={`px-2 py-0.5 rounded text-xs transition-all ${slippage === s ? "bg-purple-600/30 text-purple-300" : "glass text-slate-400"}`}>
                      {s}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Protocol fee</span>
                <span className="text-white">0.1%</span>
              </div>
            </div>

            {/* Swap button */}
            <motion.button
              onClick={handleSwap}
              disabled={!fromAmount || !inputNum || isSwapping}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-40 transition-all glow-purple"
              style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}
            >
              {isSwapping ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">◌</span> Swapping...
                </span>
              ) : !fromAmount ? "Enter Amount" : "Swap"}
            </motion.button>
          </div>
        </div>

        {/* Right panel: token list + recent swaps */}
        <div className="lg:col-span-2 space-y-4">
          {/* Token prices */}
          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold text-white text-sm mb-4">Live Token Prices</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {TOKENS.map(token => {
                const currentPrice = prices[token.symbol] ?? token.price;
                return (
                  <motion.div
                    key={token.symbol}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => { setFromToken(token.symbol); if (toToken === token.symbol) setToToken(fromToken); }}
                    className={`glass rounded-xl p-3 cursor-pointer transition-all border ${
                      fromToken === token.symbol ? "border-opacity-60" : "border-transparent hover:border-white/10"
                    }`}
                    style={fromToken === token.symbol ? { borderColor: token.color } : {}}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{token.icon}</span>
                      <span className="text-xs font-semibold text-white">{token.symbol}</span>
                    </div>
                    <p className="text-sm font-bold font-mono" style={{ color: token.color }}>
                      ${currentPrice < 0.01 ? currentPrice.toFixed(5) : currentPrice.toFixed(3)}
                    </p>
                    <p className={`text-[10px] font-medium mt-0.5 ${token.change24h >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {token.change24h >= 0 ? "▲" : "▼"} {Math.abs(token.change24h)}%
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Recent swaps */}
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-white text-sm">Recent Swaps</h3>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="space-y-2">
              <AnimatePresence>
                {recentSwaps.map((s, i) => {
                  const fTok = TOKENS.find(t => t.symbol === s.from);
                  const tTok = TOKENS.find(t => t.symbol === s.to);
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 glass rounded-xl px-3 py-2"
                    >
                      <span className="text-lg">{fTok?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white"><span style={{ color: fTok?.color }}>{s.amount}</span> → <span style={{ color: tTok?.color }}>{s.received}</span></p>
                        <p className="text-[10px] text-slate-500 font-mono">{s.address}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">✓</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{s.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
