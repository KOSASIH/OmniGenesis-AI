"use client";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  // Core
  { id:"overview",     icon:"⚡",  label:"Overview",           group:"core" },
  { id:"agents",       icon:"🤖",  label:"Agent Swarm",        group:"core" },
  { id:"defi",         icon:"💎",  label:"DeFi Suite",         group:"core" },
  { id:"bridge",       icon:"🌉",  label:"Bridge",             group:"core" },
  { id:"governance",   icon:"🏛️",  label:"Governance",         group:"core" },
  // AetherNova
  { id:"aethernova",   icon:"⚗️",  label:"AetherNova",         group:"nova" },
  { id:"phase12",      icon:"🧠",  label:"Phase 12",           group:"nova" },
  { id:"quantum",      icon:"⚛️",  label:"Quantum Lab",        group:"nova" },
  { id:"eternaecho",   icon:"∞",   label:"EternalEcho",        group:"nova" },
  { id:"voidtime",     icon:"⏳",  label:"VoidTime",           group:"nova" },
  { id:"pinexus",      icon:"π",   label:"PiNexus",            group:"nova" },
  { id:"swap",         icon:"🔄",  label:"OmniSwap",           group:"nova" },
  { id:"islamic",      icon:"🕌",  label:"Islamic Net",        group:"nova" },
  { id:"console",      icon:"⌨️",  label:"Console",            group:"nova" },
  // Phase 13 AGI — highlighted
  { id:"agi",          icon:"🧬",  label:"AGI Consciousness",  group:"p13",  badge:"🔴" },
  { id:"singularity",  icon:"🪞",  label:"Singularity",        group:"p13",  badge:"NEW" },
  { id:"neuroquantum", icon:"🔬",  label:"NeuroQuantum",       group:"p13",  badge:"NEW" },
];

interface SidebarProps { activeTab:string; onChange:(tab:string)=>void; }

export default function Sidebar({ activeTab, onChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-black/50 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col items-center py-4 gap-0.5">
      {/* Logo */}
      <motion.div
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-lg font-bold mb-2 glow-purple cursor-pointer select-none flex-shrink-0"
        whileHover={{ scale:1.08 }} whileTap={{ scale:0.95 }}
        title="OmniGenesis AI v3" onClick={() => onChange("overview")}
      >Ω</motion.div>

      <div className="w-8 h-px bg-white/10 mb-1 flex-shrink-0" />

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-0.5 scrollbar-none"
        style={{ scrollbarWidth:"none" }}>

        {/* Section divider: Phase 13 */}
        {NAV_ITEMS.map((item, idx) => {
          const isFirst13 = item.group==="p13" && (idx===0 || NAV_ITEMS[idx-1].group!=="p13");
          const isActive  = activeTab===item.id;
          const isP13     = item.group==="p13";

          return (
            <div key={item.id} className="w-full flex flex-col items-center">
              {isFirst13 && (
                <div className="w-8 my-1.5 flex-shrink-0">
                  <div className="h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
                  <p className="text-[7px] text-orange-400/50 text-center mt-0.5 font-mono">P13</p>
                </div>
              )}
              <motion.button
                onClick={() => onChange(item.id)}
                whileHover={{ scale:1.12 }} whileTap={{ scale:0.93 }}
                title={item.label}
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-200 group flex-shrink-0 border ${
                  isActive
                    ? isP13
                      ? "bg-orange-500/20 border-orange-500/35 text-white"
                      : item.id==="islamic"
                      ? "bg-amber-500/20 border-amber-500/35 text-white"
                      : "bg-purple-600/25 border-purple-500/40 text-white glow-purple"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5 border-transparent"
                }`}
              >
                {item.icon}
                {/* Active indicator */}
                {isActive && (
                  <motion.div layoutId="active-indicator"
                    className={`absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full ${
                      isP13 ? "bg-gradient-to-b from-orange-400 to-pink-400" :
                      item.id==="islamic" ? "bg-gradient-to-b from-amber-400 to-yellow-500" :
                      "bg-gradient-to-b from-purple-400 to-pink-400"
                    }`} />
                )}
                {/* Badge */}
                {item.badge && !isActive && (
                  <div className={`absolute -top-0.5 -right-0.5 px-1 py-px rounded text-[6px] font-bold leading-none ${
                    item.badge==="🔴" ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                  }`}>
                    {item.badge==="🔴" ? "•" : "N"}
                  </div>
                )}
                {/* Tooltip */}
                <div className="absolute left-14 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 border border-white/10">
                  {item.label}
                  {isP13 && <span className="ml-1 text-orange-400 text-[10px]">Phase 13</span>}
                </div>
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex flex-col items-center gap-1.5 mt-1 flex-shrink-0">
        <div className="flex flex-col items-center gap-0.5" title="System Health: 99.97%">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[8px] text-emerald-400 font-mono">LIVE</span>
        </div>
        <div className="w-8 h-px bg-white/5" />
        <div className="text-[8px] text-slate-600 font-mono">v3.0</div>
      </div>
    </aside>
  );
}
