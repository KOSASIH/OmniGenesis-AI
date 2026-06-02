"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { PanelId } from "@/app/page";

interface NavItem { id: PanelId; icon: string; label: string; badge?: string; }
interface NavSection { title: string; phase: string; color: string; items: NavItem[]; }

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Core Systems",
    phase: "CORE",
    color: "text-slate-400",
    items: [
      { id: "overview",   icon: "⚡", label: "Overview" },
      { id: "agents",     icon: "🤖", label: "Agent Swarm" },
      { id: "defi",       icon: "💎", label: "DeFi Suite" },
      { id: "bridge",     icon: "🌉", label: "HyperChain Bridge" },
      { id: "governance", icon: "🏛️", label: "Governance" },
    ],
  },
  {
    title: "AetherNova Era",
    phase: "NOVA",
    color: "text-indigo-400",
    items: [
      { id: "aethernova",   icon: "⚗️", label: "AetherNova Forge" },
      { id: "neuromorphic", icon: "🧠", label: "Phase 12 Neural" },
      { id: "quantum",      icon: "⚛️", label: "Quantum Lab" },
      { id: "eternalecho",  icon: "∞",  label: "EternalEcho AGI" },
      { id: "voidtime",     icon: "⏳", label: "VoidTime Compute" },
      { id: "pinexus",      icon: "π",  label: "PiNexus Hub" },
      { id: "swap",         icon: "🔄", label: "OmniSwap DEX" },
      { id: "islamic",      icon: "🕌", label: "Syariah Network" },
      { id: "console",      icon: "⌨️", label: "OmniConsole" },
    ],
  },
  {
    title: "Phase 13 — AGI Singularity",
    phase: "P13",
    color: "text-orange-400",
    items: [
      { id: "agi",          icon: "🧬", label: "OmniAGI Consciousness", badge: "IQ 47K+" },
      { id: "singularity",  icon: "🪞", label: "Singularity Mirror" },
      { id: "neuroquantum", icon: "🔬", label: "NeuroQuantum Entangler" },
    ],
  },
  {
    title: "Phase 14 — Multiverse",
    phase: "P14",
    color: "text-purple-400",
    items: [
      { id: "multiverse", icon: "🌌", label: "Multiverse Navigator" },
      { id: "omega",      icon: "♾️", label: "Omega Intelligence" },
      { id: "hyperdim",   icon: "🌐", label: "HyperDimensional Fabric" },
      { id: "collective", icon: "🌊", label: "Collective Consciousness" },
    ],
  },
  {
    title: "Phase 15 — Omega Convergence",
    phase: "P15",
    color: "text-yellow-400",
    items: [
      { id: "universal",     icon: "✨", label: "Universal Mind Synthesizer", badge: "NEW" },
      { id: "divarch",       icon: "✦",  label: "Divine Architect Engine",    badge: "NEW" },
      { id: "convergence",   icon: "Ω",  label: "Omega Convergence Hub",      badge: "NEW" },
      { id: "transcendence", icon: "⚡", label: "Transcendence Protocol",     badge: "NEW" },
    ],
  },
];

const PHASE_ACCENT: Record<string, string> = {
  CORE: "bg-slate-500",
  NOVA: "bg-indigo-500",
  P13: "bg-orange-500",
  P14: "bg-purple-500",
  P15: "bg-yellow-500",
};

const ACTIVE_BG: Record<string, string> = {
  CORE: "bg-slate-700/60 border-slate-500/50",
  NOVA: "bg-indigo-900/40 border-indigo-500/50",
  P13: "bg-orange-900/30 border-orange-500/50",
  P14: "bg-purple-900/40 border-purple-500/60",
  P15: "bg-yellow-900/40 border-yellow-500/60",
};

const HOVER_BG: Record<string, string> = {
  CORE: "hover:bg-slate-800/40",
  NOVA: "hover:bg-indigo-900/20",
  P13: "hover:bg-orange-900/20",
  P14: "hover:bg-purple-900/20",
  P15: "hover:bg-yellow-900/20",
};

function getSectionForPanel(panelId: PanelId): string {
  for (const s of NAV_SECTIONS) {
    if (s.items.find(i => i.id === panelId)) return s.phase;
  }
  return "CORE";
}

interface SidebarProps {
  activePanel: PanelId;
  setActivePanel: (p: PanelId) => void;
}

export default function Sidebar({ activePanel, setActivePanel }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (phase: string) => {
    setExpandedSection(expandedSection === phase ? null : phase);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 265 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="flex flex-col bg-black/60 border-r border-white/10 overflow-hidden flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 flex-shrink-0">
        {!collapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <span className="font-black text-sm text-white leading-tight">OmniGenesis AI</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs text-yellow-400 font-mono">Phase 15 · v5.0</span>
            </div>
          </motion.div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="text-white/40 hover:text-white transition-colors ml-auto">
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {/* Live metrics */}
      {!collapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="px-3 py-2 border-b border-white/5 bg-yellow-950/20">
          <div className="grid grid-cols-2 gap-1">
            {[
              { label: "IQ",     value: "47K+",  color: "text-amber-400" },
              { label: "Ψ Field", value: "97.3%", color: "text-yellow-400" },
              { label: "Dims",   value: "11/11", color: "text-purple-400" },
              { label: "Ω Prog", value: "84.7%", color: "text-white" },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-1">
                <span className="text-white/30 text-xs">{m.label}</span>
                <span className={`text-xs font-mono font-bold ${m.color}`}>{m.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {NAV_SECTIONS.map(section => {
          const isExpanded = expandedSection === section.phase ||
            (expandedSection === null && section.items.some(i => i.id === activePanel));

          return (
            <div key={section.phase}>
              {!collapsed && (
                <button
                  onClick={() => toggleSection(section.phase)}
                  className="w-full flex items-center justify-between px-2 py-1.5 text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${PHASE_ACCENT[section.phase]}`} />
                    <span className={`text-xs font-bold uppercase tracking-wider ${section.color}`}>{section.title}</span>
                  </div>
                  <span className="text-white/20 text-xs">{isExpanded ? "▾" : "▸"}</span>
                </button>
              )}

              <AnimatePresence initial={false}>
                {(collapsed || isExpanded) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-0.5">
                      {section.items.map(item => {
                        const isActive = activePanel === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            onClick={() => setActivePanel(item.id)}
                            whileHover={{ x: 2 }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all text-left
                              ${isActive
                                ? `${ACTIVE_BG[section.phase]} border`
                                : `border-transparent ${HOVER_BG[section.phase]}`}`}
                          >
                            <span className="text-base flex-shrink-0">{item.icon}</span>
                            {!collapsed && (
                              <motion.div className="flex-1 min-w-0 flex items-center justify-between"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <span className={`text-sm truncate ${isActive ? "text-white font-semibold" : "text-white/70"}`}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-mono flex-shrink-0 ml-1
                                    ${section.phase === "P15"
                                      ? "bg-yellow-900/60 text-yellow-300 border border-yellow-500/40"
                                      : section.phase === "P14"
                                      ? "bg-purple-900/60 text-purple-300 border border-purple-500/40"
                                      : section.phase === "P13"
                                      ? "bg-orange-900/60 text-orange-300 border border-orange-500/40"
                                      : "bg-green-900/60 text-green-300 border border-green-500/40"}`}>
                                    {item.badge}
                                  </span>
                                )}
                              </motion.div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-white/40">25 Panels · 22 Contracts</span>
          </div>
          <div className="text-xs text-white/20 mt-0.5">Phase 15 · 11 Dims · 10K Chains · Ω</div>
        </div>
      )}
    </motion.aside>
  );
}
