"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useRef, useState } from "react";

const TICKER_EVENTS = [
  "⚡ Agent #0847 completed quantum arbitrage — +$12,847 OGEN",
  "🌉 PiNexus bridge: 50,000 PNX → OMNI confirmed in 2.3s",
  "🧠 Neuromorphic layer: 1,247 synaptic events/sec at 99.4% efficiency",
  "⚗️ AetherNova: VoidTime Compute v3 deployed — reward: 500,000 OMNI",
  "🛡️ Quantum Guardian blocked 47 exploit attempts in last 5 minutes",
  "π PiNexus: 12,847 new Pioneer KYC verifications completed",
  "💎 OGEN peg maintained: $1.0012 (+0.12% deviation)",
  "🔮 NeuroQuantum Entangler: 3 validators confirmed innovation #ANF-002",
  "∞ EternalEcho AGI: Season 2 proposal OGP-023 approaching quorum",
  "⚡ Swarm IQ reached 9,847 — new all-time high",
  "🌀 MorphicField consensus: 847ms average finality across 6 chains",
  "💰 TVL milestone: $847M+ across OmniGenesis ecosystem",
];

interface TopBarProps { activeTab: string; }

export default function TopBar({ activeTab }: TopBarProps) {
  const [time, setTime] = useState("");
  const [blockHeight, setBlockHeight] = useState(21_847_293);

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    };
    tick();
    const t1 = setInterval(tick, 1000);
    const t2 = setInterval(() => setBlockHeight(h => h + 1), 12000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, []);

  const TAB_LABELS: Record<string, string> = {
    overview: "Ecosystem Overview", agents: "Agent Swarm Monitor",
    defi: "DeFi Suite", bridge: "HyperChainFabric Bridge",
    governance: "On-Chain Governance", aethernova: "AetherNova Forge",
    phase12: "Phase 12 — Neuromorphic Intelligence",
  };

  return (
    <header className="fixed top-0 left-16 right-0 h-14 bg-black/50 backdrop-blur-xl border-b border-white/5 z-40 flex items-center px-4 gap-4">
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
            {TAB_LABELS[activeTab] ?? "Dashboard"}
          </span>
          <div className="flex-1 overflow-hidden">
            <div className="animate-ticker flex gap-12 whitespace-nowrap">
              {[...TICKER_EVENTS, ...TICKER_EVENTS].map((e, i) => (
                <span key={i} className="text-[11px] text-slate-500 inline-flex items-center gap-1">
                  {e}
                  <span className="mx-2 text-purple-500/30">·</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-500 bg-white/3 border border-white/5 rounded-lg px-2.5 py-1.5">
          <span className="text-slate-600">Block</span>
          <span className="text-purple-400">{blockHeight.toLocaleString()}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-400/8 border border-emerald-400/15 rounded-lg px-2.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>1,000 AGENTS</span>
        </div>
        <div className="hidden sm:flex text-[11px] font-mono text-slate-500">{time}</div>
        <ConnectButton />
      </div>
    </header>
  );
}
