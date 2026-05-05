"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import MetricsGrid from "@/components/dashboard/MetricsGrid";

// Lazy-load heavy panels
const AgentSwarmMonitor = dynamic(() => import("@/components/agents/AgentSwarmMonitor"), { ssr: false });
const DeFiDashboard     = dynamic(() => import("@/components/defi/DeFiDashboard"), { ssr: false });
const BridgeMonitor     = dynamic(() => import("@/components/bridge/BridgeMonitor"), { ssr: false });
const GovernanceDashboard = dynamic(() => import("@/components/governance/GovernanceDashboard"), { ssr: false });
const AetherNovaForge   = dynamic(() => import("@/components/aethernova/AetherNovaForge"), { ssr: false });
const Phase12Dashboard  = dynamic(() => import("@/components/phase12/Phase12Dashboard"), { ssr: false });

type Tab = "overview" | "agents" | "defi" | "bridge" | "governance" | "aethernova" | "phase12";

const TAB_META: Record<Tab, { title: string; subtitle: string; badge?: string }> = {
  overview:    { title: "Ecosystem Overview",                     subtitle: "Real-time OmniGenesis AI telemetry" },
  agents:      { title: "Agent Swarm Monitor",                   subtitle: "1,000 autonomous AI agents across 6 chains" },
  defi:        { title: "DeFi Suite",                            subtitle: "Staking, liquidity pools, and token analytics" },
  bridge:      { title: "HyperChainFabric Bridge",               subtitle: "Cross-chain transfers with multi-validator consensus" },
  governance:  { title: "On-Chain Governance",                   subtitle: "OMNI-powered proposals and voting" },
  aethernova:  { title: "AetherNova Forge",                      subtitle: "10 never-before-seen technologies", badge: "10 Live" },
  phase12:     { title: "Phase 12 — Neuromorphic Intelligence",  subtitle: "Neural computing · Swarm intelligence · BCI", badge: "⚡ NEW" },
};

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const meta = TAB_META[tab];

  return (
    <div className="min-h-screen bg-[#020209]">
      <Sidebar activeTab={tab} onChange={(t) => setTab(t as Tab)} />
      <TopBar activeTab={tab} />

      <main className="pl-16 pt-14">
        <div className="max-w-[1400px] mx-auto px-5 py-6">
          {/* Page header */}
          <motion.div
            key={tab + "-header"}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{meta.title}</h1>
                {meta.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 font-medium">
                    {meta.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{meta.subtitle}</p>
            </div>

            {tab === "overview" && (
              <div className="hidden md:flex items-center gap-3">
                <div className="glass rounded-xl px-3 py-2 text-xs text-center">
                  <p className="text-slate-500">Protocol Status</p>
                  <p className="text-emerald-400 font-semibold">All Systems Nominal</p>
                </div>
                <div className="glass rounded-xl px-3 py-2 text-xs text-center">
                  <p className="text-slate-500">Network</p>
                  <p className="text-cyan-400 font-semibold">6 Chains Active</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              {tab === "overview"   && <MetricsGrid />}
              {tab === "agents"     && <AgentSwarmMonitor />}
              {tab === "defi"       && <DeFiDashboard />}
              {tab === "bridge"     && <BridgeMonitor />}
              {tab === "governance" && <GovernanceDashboard />}
              {tab === "aethernova" && <AetherNovaForge />}
              {tab === "phase12"    && <Phase12Dashboard />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
