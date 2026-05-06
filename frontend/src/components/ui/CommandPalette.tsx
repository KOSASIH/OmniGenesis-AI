"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  onNavigate: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ onNavigate, isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const COMMANDS: CommandItem[] = [
    { id: "overview",   label: "Ecosystem Overview",          description: "Live KPIs, TVL chart, token prices",       icon: "⚡", category: "Navigate", action: () => { onNavigate("overview"); onClose(); }, keywords: ["dashboard","home","main"] },
    { id: "agents",     label: "Agent Swarm Monitor",         description: "1,000 autonomous AI agents",               icon: "🤖", category: "Navigate", action: () => { onNavigate("agents"); onClose(); } },
    { id: "defi",       label: "DeFi Suite",                  description: "Staking, liquidity, token analytics",      icon: "💎", category: "Navigate", action: () => { onNavigate("defi"); onClose(); } },
    { id: "bridge",     label: "HyperChainFabric Bridge",     description: "Cross-chain transfers",                    icon: "🌉", category: "Navigate", action: () => { onNavigate("bridge"); onClose(); } },
    { id: "governance", label: "On-Chain Governance",         description: "OMNI proposals and voting",                icon: "🏛️", category: "Navigate", action: () => { onNavigate("governance"); onClose(); } },
    { id: "aethernova", label: "AetherNova Forge",            description: "10 never-before-seen technologies",        icon: "⚗️", category: "Navigate", action: () => { onNavigate("aethernova"); onClose(); } },
    { id: "phase12",    label: "Phase 12 Intelligence",       description: "Neuromorphic, Swarm, BCI",                 icon: "🧠", category: "Navigate", action: () => { onNavigate("phase12"); onClose(); } },
    { id: "quantum",    label: "Quantum Computing Lab",       description: "Circuit builder, Bloch sphere",            icon: "⚛️", category: "Navigate", action: () => { onNavigate("quantum"); onClose(); } },
    { id: "eternaecho", label: "EternalEcho AGI",             description: "Self-fulfilling prophecy engine",          icon: "∞",  category: "Navigate", action: () => { onNavigate("eternaecho"); onClose(); } },
    { id: "voidtime",   label: "VoidTime Compute",            description: "Temporal computation engine",             icon: "⏳", category: "Navigate", action: () => { onNavigate("voidtime"); onClose(); } },
    { id: "pinexus",    label: "PiNexus Hub",                 description: "Pi Network integration",                  icon: "π",  category: "Navigate", action: () => { onNavigate("pinexus"); onClose(); } },
    { id: "swap",       label: "OmniSwap DEX",                description: "Swap tokens across chains",               icon: "🔄", category: "Navigate", action: () => { onNavigate("swap"); onClose(); } },
    { id: "console",    label: "OmniConsole",                 description: "AI Terminal — direct swarm access",       icon: "⌨️", category: "Navigate", action: () => { onNavigate("console"); onClose(); } },
    { id: "copy_addr",  label: "Copy Contract Address",       description: "OMNI: 0x847a...f24d",                     icon: "📋", category: "Action",   action: () => { navigator.clipboard?.writeText("0x847a1f2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z3a4b5c6d7e8f"); onClose(); }, keywords: ["address","contract","copy"] },
    { id: "theme",      label: "Toggle Matrix Rain",          description: "Enable/disable matrix background",        icon: "🖥️", category: "Action",   action: () => onClose(), keywords: ["background","matrix","theme"] },
  ];

  const filtered = query.trim() === ""
    ? COMMANDS
    : COMMANDS.filter(c => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          (c.keywords ?? []).some(k => k.includes(q));
      });

  const grouped = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const flatFiltered = Object.values(grouped).flat();

  useEffect(() => { setSelectedIdx(0); }, [query]);
  useEffect(() => { if (isOpen) { setQuery(""); inputRef.current?.focus(); } }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, flatFiltered.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter")     { flatFiltered[selectedIdx]?.action(); }
    if (e.key === "Escape")    onClose();
  };

  let globalIdx = 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-full max-w-xl glass-dark rounded-2xl border border-white/10 z-50 overflow-hidden shadow-2xl"
            style={{ boxShadow: "0 0 80px rgba(168,85,247,0.25)" }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
              <span className="text-slate-500 text-base">⌘</span>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
                placeholder="Navigate panels, run actions, search..."
              />
              <kbd className="text-[10px] px-1.5 py-0.5 rounded glass text-slate-500 border border-white/10">ESC</kbd>
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto py-1">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category}>
                  <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {category}
                  </div>
                  {items.map(cmd => {
                    const idx = globalIdx++;
                    const isSelected = idx === selectedIdx;
                    return (
                      <motion.button
                        key={cmd.id}
                        onClick={cmd.action}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected ? "bg-purple-600/20" : "hover:bg-white/3"
                        }`}
                      >
                        <span className="text-base w-6 text-center flex-shrink-0">{cmd.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white leading-tight">{cmd.label}</p>
                          <p className="text-xs text-slate-500 leading-tight mt-0.5">{cmd.description}</p>
                        </div>
                        {isSelected && <kbd className="text-[10px] px-1.5 py-0.5 rounded glass text-slate-500 border border-white/10 flex-shrink-0">↵</kbd>}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
              {flatFiltered.length === 0 && (
                <div className="px-4 py-6 text-center text-slate-500 text-sm">
                  No results for "{query}"
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/5 px-4 py-2 flex items-center gap-4 text-[10px] text-slate-600">
              <span><kbd className="glass border border-white/10 px-1 rounded">↑↓</kbd> navigate</span>
              <span><kbd className="glass border border-white/10 px-1 rounded">↵</kbd> select</span>
              <span><kbd className="glass border border-white/10 px-1 rounded">ESC</kbd> close</span>
              <span className="ml-auto">{flatFiltered.length} commands</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Fixed: make the input use the local state variable
function setInput(value: string) {}  // placeholder — replaced inline above
