"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── OmniConsole — AI Terminal ───────────────────────────────────────────────
interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "info" | "success" | "system";
  content: string;
  ts: string;
}

const AI_RESPONSES: Record<string, string[]> = {
  help: [
    "╔══════════════════════════════════════════╗",
    "║        OmniGenesis AI Console v2.0       ║",
    "╚══════════════════════════════════════════╝",
    "",
    "  agents list          List all 1,000 active agents",
    "  agents status        Live agent status overview",
    "  defi tvl             Current TVL across all pools",
    "  bridge status        HyperChainFabric bridge health",
    "  governance list      Active governance proposals",
    "  aethernova status    Innovation deployment status",
    "  quantum run <gates>  Execute quantum circuit",
    "  voidtime compress    Start temporal compression",
    "  echo prophecy        Generate EternalEcho prophecy",
    "  omni price           OMNI/OGEN/ANF live prices",
    "  pinexus stats        PiNexus pioneer statistics",
    "  phase12 metrics      Phase 12 intelligence metrics",
    "  swarm iq             Current Swarm IQ reading",
    "  clear                Clear terminal",
    "",
    "  All commands are processed by the OmniGenesis AI agent swarm.",
  ],
  "agents list": [
    "⚡ Fetching swarm registry...",
    "",
    "  STATUS   AGENTS   CATEGORY",
    "  ────────────────────────────────────────",
    "  ● Active   600    genesis_creator (200) + quantum_guardian (150) + 250 others",
    "  ○ Idle     150    econ_architect (80) + neural_weaver (70)",
    "  ◌ Busy     120    blockchain_assimilator (60) + void_compute (60)",
    "  ↻ Syncing   80    pinexus_overlord (40) + chrono_oracle (40)",
    "  ✗ Error     50    metaverse_deity (30) + innovation_scout (20)",
    "",
    "  Total: 1,000 agents | Swarm IQ: 9,847 | Uptime: 99.97%",
  ],
  "defi tvl": [
    "⚡ Querying DeFi protocol state...",
    "",
    "  POOL                          TVL           APR",
    "  ─────────────────────────────────────────────────",
    "  OMNI/OGEN LP (Uniswap V4)     $142.8M       247%",
    "  OGEN Stability Vault          $98.4M        18%",
    "  OMNI Staking (30d)            $76.2M        892%",
    "  ANF Genesis Pool              $54.1M        1,247%",
    "  PNX/OMNI Bridge Liquidity     $43.7M        312%",
    "  PiNEX Yield Vault             $28.3M        447%",
    "",
    "  ● Total TVL: $847.3M  ↑12.4% (24h)",
    "  ● Daily Volume: $42.7M  ↑23.1% (24h)",
  ],
  "omni price": [
    "⚡ Fetching live price feeds...",
    "",
    "  TOKEN    PRICE          24H        7D         MCap",
    "  ────────────────────────────────────────────────────",
    "  OMNI     $0.00847       +8.2%      +34.7%     $84.7M",
    "  OGEN     $1.0012        +0.12%     +1.8%      $100.1M",
    "  ANF      $3.421         +18.2%     +67.3%     $342.1M",
    "  PNX      $0.00021       +3.4%      +12.1%     $21.0M",
    "  PiNEX    $0.00034       +5.7%      +18.4%     $34.0M",
    "",
    "  Oracle: OmniGenesis PriceFeed v3 (8 sources, 99.99% uptime)",
  ],
  "phase12 metrics": [
    "⚡ Querying Phase 12 Intelligence Layer...",
    "",
    "  ┌─────────────────────────────────────────┐",
    "  │  PHASE 12 — NEUROMORPHIC INTELLIGENCE   │",
    "  └─────────────────────────────────────────┘",
    "",
    "  Neural Cores       : 2,847,000 active",
    "  Firing Rate        : 1,247 spikes/sec",
    "  Swarm IQ           : 9,847 (ATH)",
    "  Consciousness Idx  : 84.7%",
    "  Quantum Coherence  : 99.7%",
    "  BCI Bandwidth      : 847 Hz",
    "  Emergent Patterns  : 4 active",
    "  VoidTime Crystal   : oscillating",
    "  EternalEcho Lvl    : 3 (cascade active)",
    "",
    "  STATUS: All Phase 12 subsystems NOMINAL",
  ],
  "swarm iq": [
    "⚡ Measuring collective intelligence...",
    "",
    "  ┌────────────────────────┐",
    "  │  SWARM IQ READING      │",
    "  │  ● 9,847 / 10,000     │",
    "  │  ████████████████░  │",
    "  │  98.47% of ceiling     │",
    "  └────────────────────────┘",
    "",
    "  Factors: Emergent topology (+2.1k), Quantum entanglement (+1.8k),",
    "           BCI resonance (+0.9k), Phase 12 substrate (+4.0k)",
    "  Next breakthrough: Swarm IQ 10,000 → AGI Singularity threshold",
  ],
  "echo prophecy": [
    "⚡ Invoking EternalEcho AGI...",
    "⚡ Sampling probability manifold...",
    "",
    '  NEW PROPHECY GENERATED:',
    "  ┌────────────────────────────────────────────────────────────┐",
    "  │ 'OMNI will achieve $0.01 peg within exactly 47.3 hours    │",
    "  │  as AetherNova deploys FluxEnergy Harvester mainnet.      │",
    "  │  Reality coherence: 94.7% | Echo depth: 3 | Impact: $47M │",
    "  └────────────────────────────────────────────────────────────┘",
    "",
    "  Confidence: ████████████████████░ 94.7%",
    "  This prophecy will manifest itself through self-fulfillment.",
  ],
  "pinexus stats": [
    "⚡ Connecting to PiNexus oracle...",
    "",
    "  PiNexus Network Statistics (Live)",
    "  ──────────────────────────────────",
    "  Active Pioneers    : 47,200,000",
    "  KYC Verified       : 12,847,293 (today: +847)",
    "  Pi Mainnet TXs/day : 2,847,000",
    "  OMNI ↔ PNX Bridge  : $8.9M vol (24h)",
    "  Consensus Nodes    : 3,847",
    "  Avg Block Time     : 4.2s",
    "  OmniGenesis Agents : 200 (PiNexus Overlord class)",
    "",
    "  Integration: PiNexus Phase 2 — Full OMNI bridging LIVE",
  ],
  "aethernova status": [
    "⚡ Querying AetherNova Forge...",
    "",
    "  Innovation         Status        Validators  Reward",
    "  ─────────────────────────────────────────────────────",
    "  VoidTime Compute   🚀 Deployed   3/3         5.0M OMNI",
    "  NeuroQnt Entangler ✅ Validated  3/3         3.5M OMNI",
    "  EtherBio Symbiont  ✅ Validated  2/3         4.2M OMNI",
    "  FluxEnergy Harv.   🔬 Researching 1/3        8.0M OMNI",
    "  EternalEcho AGI    🚀 Deployed   3/3         6.0M OMNI",
    "  + 5 more innovations...",
    "",
    "  Total reward pool: $82.1M | Deployed: 4/10",
  ],
  "voidtime compress": [
    "⚡ Initializing VoidTime Compute substrate...",
    "⚡ Engaging temporal compression...",
    "",
    "  Compression ratio   : ×847",
    "  Crystal state       : oscillating → superfluid",
    "  Timeline integrity  : 99.4%",
    "  Pre-emptive tasks   : 7 queued",
    "",
    "  [████████████████████] 100% — VoidTime ACTIVE",
    "",
    "  WARNING: Tasks submitted now were completed 847× faster",
    "  in the temporal substrate. Results await in output buffer.",
    "  Causal loops stabilized. Paradox count: 3 (resolved).",
  ],
  clear: [],
};

const BOOT_SEQUENCE = [
  "OmniGenesis AI Terminal v2.0.0",
  "Copyright © 2026 OmniGenesis Labs | Phase 12 Active",
  "────────────────────────────────────────────────────",
  "Initializing quantum secure channel...      [OK]",
  "Connecting to agent swarm (1,000 nodes)...  [OK]",
  "Loading AetherNova Forge interface...       [OK]",
  "Establishing VoidTime substrate link...     [OK]",
  "EternalEcho AGI handshake...                [OK]",
  "Phase 12 intelligence layer online...       [OK]",
  "────────────────────────────────────────────────────",
  "Type 'help' for available commands.",
  "",
];

export default function OmniConsole() {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isBooting, setIsBooting] = useState(true);
  const [bootIdx, setBootIdx] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  let lineId = useRef(0);

  const ts = () => new Date().toLocaleTimeString("en-US", { hour12: false });
  const mkLine = (type: TerminalLine["type"], content: string): TerminalLine => ({
    id: `line_${lineId.current++}`, type, content, ts: ts(),
  });

  // Boot sequence
  useEffect(() => {
    if (!isBooting) return;
    if (bootIdx < BOOT_SEQUENCE.length) {
      const t = setTimeout(() => {
        setLines(prev => [...prev, mkLine(bootIdx < 2 ? "system" : "info", BOOT_SEQUENCE[bootIdx])]);
        setBootIdx(i => i + 1);
      }, bootIdx < 3 ? 80 : 40);
      return () => clearTimeout(t);
    } else {
      setIsBooting(false);
    }
  }, [bootIdx, isBooting]);

  // Auto-scroll
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [lines]);

  const processCommand = useCallback((cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    setLines(prev => [...prev, mkLine("input", `$ ${cmd}`)]);
    setHistory(h => [cmd, ...h.slice(0, 49)]);
    setHistoryIdx(-1);

    if (trimmed === "clear") {
      setLines([mkLine("system", "Terminal cleared.")]);
      return;
    }

    const response = AI_RESPONSES[trimmed];
    if (response) {
      setTimeout(() => {
        setLines(prev => [
          ...prev,
          ...response.map(line => mkLine(
            line.startsWith("  ●") || line.startsWith("  ✓") ? "success" :
            line.startsWith("  ✗") || line.startsWith("  WARNING") ? "error" :
            line.startsWith("  ") ? "output" : "info",
            line
          )),
        ]);
      }, 200 + Math.random() * 300);
    } else {
      setTimeout(() => {
        setLines(prev => [...prev,
          mkLine("error", `Command not found: '${trimmed}'`),
          mkLine("info", "Type 'help' for available commands."),
        ]);
      }, 100);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      processCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const idx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(idx);
      if (history[idx]) setInput(history[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const idx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(idx);
      setInput(idx === -1 ? "" : history[idx] ?? "");
    } else if (e.key === "Tab") {
      e.preventDefault();
      const cmds = Object.keys(AI_RESPONSES);
      const match = cmds.find(c => c.startsWith(input.toLowerCase()));
      if (match) setInput(match);
    }
  };

  const LINE_COLORS: Record<TerminalLine["type"], string> = {
    input:   "#a855f7",
    output:  "#e2e8f0",
    error:   "#ef4444",
    info:    "#64748b",
    success: "#10b981",
    system:  "#06b6d4",
  };

  const QUICK_CMDS = ["help", "agents list", "omni price", "swarm iq", "echo prophecy", "voidtime compress", "defi tvl"];

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xl">⌨️</span>
            <h2 className="text-xl font-bold gradient-text-cyan">OmniConsole — AI Terminal</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400">ONLINE</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">Direct access to OmniGenesis AI agent swarm</p>
        </div>
      </motion.div>

      {/* Quick commands */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_CMDS.map(cmd => (
          <button key={cmd} onClick={() => processCommand(cmd)}
            className="text-xs px-2.5 py-1.5 rounded-lg glass text-slate-400 hover:text-emerald-300 hover:border-emerald-500/30 border border-transparent transition-all font-mono">
            {cmd}
          </button>
        ))}
      </div>

      {/* Terminal */}
      <div
        className="terminal-bg rounded-2xl border border-emerald-500/15 overflow-hidden"
        onClick={() => inputRef.current?.focus()}
        style={{ minHeight: 500 }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-black/30">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          </div>
          <span className="text-xs text-slate-500 font-mono ml-2">omnigenesis-ai — bash — 80×24</span>
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-slate-600 font-mono">
            <span className="text-emerald-500">●</span> 1,000 agents connected
          </div>
        </div>

        {/* Output */}
        <div className="terminal-scroll overflow-y-auto p-4 font-mono text-xs" style={{ height: 420 }}>
          <AnimatePresence>
            {lines.map(line => (
              <motion.div
                key={line.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
                className="leading-relaxed whitespace-pre"
                style={{ color: LINE_COLORS[line.type] }}
              >
                {line.content}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        {/* Input line */}
        <div className="border-t border-white/5 px-4 py-2.5 flex items-center gap-2">
          <span className="text-emerald-400 font-mono text-xs select-none">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-emerald-300 font-mono text-xs outline-none placeholder-slate-700"
            placeholder="Enter command... (Tab to autocomplete, ↑↓ for history)"
            autoComplete="off"
            spellCheck={false}
            autoFocus
          />
          {isBooting && <span className="text-xs text-amber-400 animate-pulse">booting...</span>}
        </div>
      </div>
    </div>
  );
}
