"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

// ─── Phase Core panels ────────────────────────────────────────────────────────
const Overview = dynamic(() => import("@/components/overview/OmniOverview"), { ssr: false });
const AgentSwarm = dynamic(() => import("@/components/agents/AgentSwarmMonitor"), { ssr: false });
const DeFiSuite = dynamic(() => import("@/components/defi/DeFiDashboard"), { ssr: false });
const HyperChainBridge = dynamic(() => import("@/components/bridge/HyperChainFabric"), { ssr: false });
const Governance = dynamic(() => import("@/components/governance/OnChainGovernance"), { ssr: false });

// ─── AetherNova Era panels ────────────────────────────────────────────────────
const AetherNovaForge = dynamic(() => import("@/components/aethernova/AetherNovaForge"), { ssr: false });
const Neuromorphic = dynamic(() => import("@/components/neuro/Phase12Neuromorphic"), { ssr: false });
const QuantumLab = dynamic(() => import("@/components/quantum/QuantumLab"), { ssr: false });
const EternalEcho = dynamic(() => import("@/components/eternal/EternalEchoAGI"), { ssr: false });
const VoidTimeCompute = dynamic(() => import("@/components/voidtime/VoidTimeCompute"), { ssr: false });
const PiNexusHub = dynamic(() => import("@/components/pinexus/PiNexusHub"), { ssr: false });
const OmniSwap = dynamic(() => import("@/components/swap/OmniSwapDEX"), { ssr: false });
const IslamicNetwork = dynamic(() => import("@/components/islamic/IslamicBlockchainNetwork"), { ssr: false });
const OmniConsole = dynamic(() => import("@/components/console/OmniConsole"), { ssr: false });

// ─── Phase 13 — AGI Singularity ───────────────────────────────────────────────
const OmniAGIConsciousness = dynamic(() => import("@/components/agi/OmniAGIConsciousness"), { ssr: false });
const SingularityMirror = dynamic(() => import("@/components/singularity/SingularityMirror"), { ssr: false });
const NeuroQuantumEntangler = dynamic(() => import("@/components/neuro/NeuroQuantumEntangler"), { ssr: false });

// ─── Phase 14 — Multiverse Expansion ─────────────────────────────────────────
const MultiverseNavigator = dynamic(() => import("@/components/multiverse/MultiverseNavigator"), { ssr: false });
const OmegaIntelligence = dynamic(() => import("@/components/omega/OmegaIntelligence"), { ssr: false });
const HyperDimensionalFabric = dynamic(() => import("@/components/hyperdim/HyperDimensionalFabric"), { ssr: false });
const CollectiveConsciousnessField = dynamic(() => import("@/components/collective/CollectiveConsciousnessField"), { ssr: false });

// ─── Phase 15 — Omega Convergence ────────────────────────────────────────────
const UniversalMindSynthesizer = dynamic(() => import("@/components/universal/UniversalMindSynthesizer"), { ssr: false });
const DivinArchitectEngine = dynamic(() => import("@/components/universal/DivinArchitectEngine"), { ssr: false });
const OmegaConvergenceHub = dynamic(() => import("@/components/convergence/OmegaConvergenceHub"), { ssr: false });
const TranscendenceProtocol = dynamic(() => import("@/components/convergence/TranscendenceProtocol"), { ssr: false });

import Sidebar from "@/components/layout/Sidebar";

export type PanelId =
  | "overview" | "agents" | "defi" | "bridge" | "governance"
  | "aethernova" | "neuromorphic" | "quantum" | "eternalecho" | "voidtime"
  | "pinexus" | "swap" | "islamic" | "console"
  | "agi" | "singularity" | "neuroquantum"
  | "multiverse" | "omega" | "hyperdim" | "collective"
  | "universal" | "divarch" | "convergence" | "transcendence";

const PANEL_COMPONENTS: Record<PanelId, React.ComponentType> = {
  overview: Overview, agents: AgentSwarm, defi: DeFiSuite,
  bridge: HyperChainBridge, governance: Governance,
  aethernova: AetherNovaForge, neuromorphic: Neuromorphic, quantum: QuantumLab,
  eternalecho: EternalEcho, voidtime: VoidTimeCompute, pinexus: PiNexusHub,
  swap: OmniSwap, islamic: IslamicNetwork, console: OmniConsole,
  agi: OmniAGIConsciousness, singularity: SingularityMirror, neuroquantum: NeuroQuantumEntangler,
  multiverse: MultiverseNavigator, omega: OmegaIntelligence,
  hyperdim: HyperDimensionalFabric, collective: CollectiveConsciousnessField,
  universal: UniversalMindSynthesizer, divarch: DivinArchitectEngine,
  convergence: OmegaConvergenceHub, transcendence: TranscendenceProtocol,
};

const PHASE_AMBIENT: Record<string, string> = {
  core: "from-slate-950 via-slate-900",
  nova: "from-slate-950 via-indigo-950/20",
  p13: "from-slate-950 via-orange-950/20",
  p14: "from-slate-950 via-purple-950/30",
  p15: "from-slate-950 via-yellow-950/30",
};

function getPhase(id: PanelId): string {
  if (["overview","agents","defi","bridge","governance"].includes(id)) return "core";
  if (["aethernova","neuromorphic","quantum","eternalecho","voidtime","pinexus","swap","islamic","console"].includes(id)) return "nova";
  if (["agi","singularity","neuroquantum"].includes(id)) return "p13";
  if (["multiverse","omega","hyperdim","collective"].includes(id)) return "p14";
  return "p15";
}

export default function Home() {
  const [activePanel, setActivePanel] = useState<PanelId>("overview");
  const ActiveComponent = PANEL_COMPONENTS[activePanel];
  const phase = getPhase(activePanel);

  const barColor = {
    p15: "bg-gradient-to-r from-yellow-600 via-white to-yellow-600",
    p14: "bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600",
    p13: "bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500",
  }[phase];

  return (
    <div className={`flex h-screen bg-gradient-to-br ${PHASE_AMBIENT[phase]} to-black text-white overflow-hidden transition-all duration-700`}>
      <Sidebar activePanel={activePanel} setActivePanel={setActivePanel} />
      <main className="flex-1 overflow-y-auto p-6">
        {barColor && (
          <div className={`fixed top-0 left-0 right-0 h-1 ${barColor} z-50 animate-pulse`} />
        )}
        <ActiveComponent />
      </main>
    </div>
  );
}
