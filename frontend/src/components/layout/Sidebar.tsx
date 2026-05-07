"use client";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { id: "overview",    icon: "⚡",  label: "Overview" },
  { id: "agents",      icon: "🤖",  label: "Agent Swarm" },
  { id: "defi",        icon: "💎",  label: "DeFi Suite" },
  { id: "bridge",      icon: "🌉",  label: "Bridge" },
  { id: "governance",  icon: "🏛️",  label: "Governance" },
  { id: "aethernova",  icon: "⚗️",  label: "AetherNova" },
  { id: "phase12",     icon: "🧠",  label: "Phase 12" },
  { id: "quantum",     icon: "⚛️",  label: "Quantum Lab" },
  { id: "eternaecho",  icon: "∞",   label: "EternalEcho" },
  { id: "voidtime",    icon: "⏳",  label: "VoidTime" },
  { id: "pinexus",     icon: "π",   label: "PiNexus" },
  { id: "swap",        icon: "🔄",  label: "OmniSwap" },
  { id: "islamic",     icon: "🕌",  label: "Islamic Net" },
  { id: "console",     icon: "⌨️",  label: "Console" },
];

interface SidebarProps { activeTab: string; onChange: (tab: string) => void; }

export default function Sidebar({ activeTab, onChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-black/50 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col items-center py-4 gap-1">
      <motion.div
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-lg font-bold mb-2 glow-purple cursor-pointer select-none flex-shrink-0"
        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
        title="OmniGenesis AI" onClick={() => onChange("overview")}
      >Ω</motion.div>

      <div className="w-8 h-px bg-white/10 mb-1 flex-shrink-0" />

      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-1 scrollbar-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const isIslamic = item.id === "islamic";
          return (
            <motion.button
              key={item.id}
              onClick={() => onChange(item.id)}
              whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.93 }}
              title={item.label}
              className={`relative w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-200 group flex-shrink-0 ${
                isActive
                  ? isIslamic
                    ? "bg-amber-500/20 border border-amber-500/40 text-white"
                    : "bg-purple-600/25 border border-purple-500/40 text-white glow-purple"
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent"
              }`}
            >
              {item.icon}
              {isActive && (
                <motion.div
                  layoutId="active-indicator"
                  className={`absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full ${
                    isIslamic ? "bg-gradient-to-b from-amber-400 to-yellow-500" : "bg-gradient-to-b from-purple-400 to-pink-400"
                  }`}
                />
              )}
              {isIslamic && !isActive && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 text-[7px] flex items-center justify-center" />
              )}
              <div className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border border-white/10">
                {item.label}
              </div>
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-2 mt-1 flex-shrink-0">
        <div className="flex flex-col items-center gap-1" title="System Health: 99.97%">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[9px] text-emerald-400 font-mono">LIVE</span>
        </div>
        <div className="w-8 h-px bg-white/5" />
        <div className="text-[9px] text-slate-600 font-mono">v2.2</div>
      </div>
    </aside>
  );
}
