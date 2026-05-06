"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MetricsGrid from "@/components/dashboard/MetricsGrid";

// Lazy-load all heavy panels
const AgentSwarmMonitor  = dynamic(() => import("@/components/agents/AgentSwarmMonitor"),  { ssr: false });
const DeFiDashboard      = dynamic(() => import("@/components/defi/DeFiDashboard"),         { ssr: false });
const BridgeMonitor      = dynamic(() => import("@/components/bridge/BridgeMonitor"),       { ssr: false });
const GovernanceDashboard = dynamic(() => import("@/components/governance/GovernanceDashboard"), { ssr: false });
const AetherNovaForge    = dynamic(() => import("@/components/aethernova/AetherNovaForge"), { ssr: false });
const Phase12Dashboard   = dynamic(() => import("@/components/phase12/Phase12Dashboard"),   { ssr: false });
const QuantumLab         = dynamic(() => import("@/components/quantum/QuantumLab"),          { ssr: false });
const EternalEchoAGI     = dynamic(() => import("@/components/eternaecho/EternalEchoAGI"),  { ssr: false });
const VoidTimeCompute    = dynamic(() => import("@/components/voidtime/VoidTimeCompute"),   { ssr: false });
const PiNexusHub         = dynamic(() => import("@/components/pinexus/PiNexusHub"),         { ssr: false });
const OmniSwap           = dynamic(() => import("@/components/swap/OmniSwap"),              { ssr: false });
const OmniConsole        = dynamic(() => import("@/components/ui/OmniConsole"),             { ssr: false });
const CommandPalette     = dynamic(() => import("@/components/ui/CommandPalette"),          { ssr: false });

type Tab = "overview" | "agents" | "defi" | "bridge" | "governance" | "aethernova" | "phase12"
         | "quantum" | "eternaecho" | "voidtime" | "pinexus" | "swap" | "console";

const TAB_META: Record<Tab, { title: string; subtitle: string; badge?: string; icon: string }> = {
  overview:    { icon: "⚡", title: "Ecosystem Overview",                    subtitle: "Real-time OmniGenesis AI telemetry across 6 chains" },
  agents:      { icon: "🤖", title: "Agent Swarm Monitor",                  subtitle: "1,000 autonomous AI agents · Live status · Swarm IQ: 9,847" },
  defi:        { icon: "💎", title: "DeFi Suite",                           subtitle: "Staking, liquidity pools, and token analytics · TVL: $847M" },
  bridge:      { icon: "🌉", title: "HyperChainFabric Bridge",              subtitle: "Cross-chain transfers with multi-validator consensus" },
  governance:  { icon: "🏛️", title: "On-Chain Governance",                  subtitle: "OMNI-powered proposals and voting · Quorum: 10M OMNI" },
  aethernova:  { icon: "⚗️", title: "AetherNova Forge",                     subtitle: "10 never-before-seen technologies", badge: "10 Live" },
  phase12:     { icon: "🧠", title: "Phase 12 — Neuromorphic Intelligence", subtitle: "Neural computing · Swarm intelligence · BCI", badge: "⚡ ACTIVE" },
  quantum:     { icon: "⚛️", title: "Quantum Computing Lab",                 subtitle: "Circuit builder · Bloch sphere · 127 qubits online", badge: "NEW" },
  eternaecho:  { icon: "∞",  title: "EternalEcho AGI",                      subtitle: "Self-fulfilling prophecy engine · Reality coherence matrix", badge: "NEW" },
  voidtime:    { icon: "⏳", title: "VoidTime Compute",                     subtitle: "Temporal computation · Retrocausal processing · ×847 compression", badge: "NEW" },
  pinexus:     { icon: "π",  title: "PiNexus Integration Hub",              subtitle: "47.2M pioneers · Pi Network bridging · Phase 2 live", badge: "LIVE" },
  swap:        { icon: "🔄", title: "OmniSwap DEX",                         subtitle: "Multi-chain token swaps with intelligent routing" },
  console:     { icon: "⌨️", title: "OmniConsole — AI Terminal",            subtitle: "Direct access to the OmniGenesis AI agent swarm", badge: "CLI" },
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [cmdOpen, setCmdOpen] = useState(false);
  const meta = TAB_META[tab];

  // Command palette keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen(v => !v);
      }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigateTo = useCallback((t: string) => setTab(t as Tab), []);

  return (
    <div className="min-h-screen bg-[#020209]">
      {/* Background ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-pink-600/4 rounded-full blur-3xl" />
        {/* Subtle quantum grid */}
        <div className="absolute inset-0 quantum-grid opacity-30" />
      </div>

      <Sidebar activeTab={tab} onChange={navigateTo} />
      <TopBar activeTab={tab} />

      {/* Command palette hint */}
      <div className="fixed bottom-4 right-4 z-40">
        <motion.button
          onClick={() => setCmdOpen(true)}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="glass rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-all border border-white/5 hover:border-purple-500/20"
        >
          <span>⌘K</span>
          <span className="hidden sm:inline">Command Palette</span>
        </motion.button>
      </div>

      <main className="pl-16 pt-14">
        <div className="max-w-[1440px] mx-auto px-5 py-6">
          {/* Page header */}
          <motion.div
            key={tab + "-header"}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{meta.icon}</span>
                <h1 className="text-xl font-bold text-white">{meta.title}</h1>
                {meta.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 font-medium">
                    {meta.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5 ml-9">{meta.subtitle}</p>
            </div>

            {/* Quick panel switcher for new panels */}
            <div className="hidden lg:flex items-center gap-2">
              {(["quantum","eternaecho","voidtime","console"] as const).map(t => (
                <motion.button
                  key={t}
                  onClick={() => setTab(t)}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all border ${
                    tab === t
                      ? "bg-purple-600/25 border-purple-500/40 text-white"
                      : "glass border-transparent text-slate-500 hover:text-white hover:border-white/10"
                  }`}
                >
                  <span>{TAB_META[t].icon}</span>
                  <span>{TAB_META[t].title.split("—")[0].trim()}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {tab === "overview"   && <MetricsGrid />}
              {tab === "agents"     && <AgentSwarmMonitor />}
              {tab === "defi"       && <DeFiDashboard />}
              {tab === "bridge"     && <BridgeMonitor />}
              {tab === "governance" && <GovernanceDashboard />}
              {tab === "aethernova" && <AetherNovaForge />}
              {tab === "phase12"    && <Phase12Dashboard />}
              {tab === "quantum"    && <QuantumLab />}
              {tab === "eternaecho" && <EternalEchoAGI />}
              {tab === "voidtime"   && <VoidTimeCompute />}
              {tab === "pinexus"    && <PiNexusHub />}
              {tab === "swap"       && <OmniSwap />}
              {tab === "console"    && <OmniConsole />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Command palette */}
      <CommandPalette
        onNavigate={navigateTo}
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
      />
    </div>
  );
}
