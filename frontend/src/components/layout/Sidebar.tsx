"use client";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "overview",    icon: "⚡", label: "Overview" },
  { id: "agents",      icon: "🤖", label: "Agent Swarm" },
  { id: "defi",        icon: "💎", label: "DeFi Suite" },
  { id: "bridge",      icon: "🌉", label: "Bridge" },
  { id: "governance",  icon: "🏛️", label: "Governance" },
  { id: "aethernova",  icon: "⚗️", label: "AetherNova" },
  { id: "phase12",     icon: "🧠", label: "Phase 12" },
];

interface SidebarProps { activeTab: string; onChange: (tab: string) => void; }

export default function Sidebar({ activeTab, onChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-black/50 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col items-center py-4 gap-1.5">
      <motion.div
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-lg font-bold mb-3 glow-purple cursor-pointer select-none"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        title="OmniGenesis AI"
      >
        Ω
      </motion.div>

      <div className="w-8 h-px bg-white/10 mb-1" />

      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <motion.button
            key={item.id}
            onClick={() => onChange(item.id)}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.93 }}
            title={item.label}
            className={`relative w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-200 group ${
              isActive
                ? "bg-purple-600/25 border border-purple-500/40 text-white glow-purple"
                : "text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            }`}
          >
            {item.icon}
            {isActive && (
              <motion.div
                layoutId="active-indicator"
                className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full"
              />
            )}
            <div className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border border-white/10">
              {item.label}
            </div>
          </motion.button>
        );
      })}

      <div className="flex-1" />

      <div className="flex flex-col items-center gap-2 mb-2">
        <div className="flex flex-col items-center gap-1" title="System Health: 99.97%">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-400 font-mono">LIVE</span>
        </div>
        <div className="w-8 h-px bg-white/5" />
        <div className="text-[9px] text-slate-600 font-mono">v2.0</div>
      </div>
    </aside>
  );
}
