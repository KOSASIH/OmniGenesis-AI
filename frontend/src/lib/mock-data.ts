// OmniGenesis AI — Comprehensive mock data layer
// All real-time data would come from on-chain queries + agent APIs

export type AgentStatus = "active" | "idle" | "processing" | "syncing" | "error";
export type AgentCategory =
  | "genesis_creator" | "econ_architect" | "quantum_guardian"
  | "blockchain_assimilator" | "pinexus_overlord" | "metaverse_deity"
  | "innovation_scout" | "neural_weaver" | "chrono_oracle" | "void_compute";

export interface Agent {
  id: string; name: string; category: AgentCategory; status: AgentStatus;
  reputation: number; tasksCompleted: number; uptime: number;
  chain: string; chainId: number; lastActivity: string;
  tasksPerHour: number; errorRate: number;
}

export interface TokenInfo {
  symbol: string; name: string; price: number; change24h: number; change7d: number;
  marketCap: number; volume24h: number; totalSupply: number; circulatingSupply: number;
  color: string; icon: string;
}

export interface PricePoint { time: string; price: number; volume: number; }

export interface StakingPool {
  id: string; token: string; rewardToken: string; apr: number; tvl: number;
  totalStaked: number; yourStake: number; lockDays: number; color: string;
}

export interface BridgeTransaction {
  id: string; fromChain: string; toChain: string; token: string;
  amount: number; usdValue: number; status: "confirmed" | "pending" | "failed";
  timestamp: string; txHash: string; validators: number;
}

export interface GovernanceProposal {
  id: string; title: string; description: string; proposer: string;
  status: "active" | "passed" | "failed" | "queued" | "executed";
  votesFor: number; votesAgainst: number; votesAbstain: number;
  quorum: number; endsAt: string; category: string;
}

export interface Innovation {
  id: string; domain: string; title: string; description: string;
  contentHash: string; feasibilityScore: number; impactScore: number;
  status: "proposed" | "validated" | "deployed" | "researching";
  validations: number; reward: number; submittedAt: string; icon: string;
}

// ─── Agent data ──────────────────────────────────────────────────────────────
export const AGENT_STATUSES: AgentStatus[] = ["active", "idle", "processing", "syncing", "error"];
export const AGENT_CATEGORIES: AgentCategory[] = [
  "genesis_creator","econ_architect","quantum_guardian","blockchain_assimilator",
  "pinexus_overlord","metaverse_deity","innovation_scout","neural_weaver","chrono_oracle","void_compute",
];
export const CATEGORY_COLORS: Record<AgentCategory, string> = {
  genesis_creator: "#a855f7", econ_architect: "#06b6d4", quantum_guardian: "#10b981",
  blockchain_assimilator: "#f59e0b", pinexus_overlord: "#00C4B4", metaverse_deity: "#ec4899",
  innovation_scout: "#8b5cf6", neural_weaver: "#3b82f6", chrono_oracle: "#f97316", void_compute: "#e11d48",
};
export const CATEGORY_ICONS: Record<AgentCategory, string> = {
  genesis_creator: "⚡", econ_architect: "📊", quantum_guardian: "🛡️",
  blockchain_assimilator: "🔗", pinexus_overlord: "π", metaverse_deity: "🌐",
  innovation_scout: "⚗️", neural_weaver: "🧠", chrono_oracle: "⏱️", void_compute: "∅",
};

const CHAINS = [
  { chain: "Ethereum", chainId: 1 }, { chain: "BSC", chainId: 56 },
  { chain: "Polygon", chainId: 137 }, { chain: "Arbitrum", chainId: 42161 },
  { chain: "Base", chainId: 8453 }, { chain: "PiNexus", chainId: 314 },
];

const STATUS_WEIGHTS = [0.60, 0.15, 0.12, 0.08, 0.05]; // active, idle, processing, syncing, error
function weightedStatus(): AgentStatus {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < AGENT_STATUSES.length; i++) {
    cum += STATUS_WEIGHTS[i];
    if (r < cum) return AGENT_STATUSES[i];
  }
  return "idle";
}

export const MOCK_AGENTS: Agent[] = Array.from({ length: 100 }, (_, i) => {
  const cat = AGENT_CATEGORIES[i % AGENT_CATEGORIES.length];
  const chainInfo = CHAINS[i % CHAINS.length];
  return {
    id: `agent_${String(i + 1).padStart(4, "0")}`,
    name: `${CATEGORY_ICONS[cat]} ${cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())} #${i + 1}`,
    category: cat, status: weightedStatus(),
    reputation: 75 + Math.random() * 25,
    tasksCompleted: Math.floor(Math.random() * 50000),
    uptime: 95 + Math.random() * 5,
    chain: chainInfo.chain, chainId: chainInfo.chainId,
    lastActivity: `${Math.floor(Math.random() * 60)}s ago`,
    tasksPerHour: Math.floor(20 + Math.random() * 200),
    errorRate: Math.random() * 2,
  };
});

// ─── Token data ───────────────────────────────────────────────────────────────
export const TOKENS: Record<string, TokenInfo> = {
  OMNI: { symbol: "OMNI", name: "OmniGenesis Token", price: 0.00847, change24h: 12.4, change7d: 34.7,
          marketCap: 8_470_000, volume24h: 2_100_000, totalSupply: 1e12, circulatingSupply: 5e10,
          color: "#a855f7", icon: "⚡" },
  OGEN: { symbol: "OGEN", name: "OmniGenesis Stablecoin", price: 1.0012, change24h: 0.12, change7d: 0.08,
          marketCap: 50_060_000, volume24h: 8_900_000, totalSupply: 5e7, circulatingSupply: 5e7,
          color: "#10b981", icon: "💎" },
  PNX:  { symbol: "PNX",  name: "PiNexus Token",    price: 0.2341,  change24h: -2.3, change7d: 8.1,
          marketCap: 23_410_000, volume24h: 1_200_000, totalSupply: 1e8, circulatingSupply: 1e8,
          color: "#00C4B4", icon: "π" },
  PINEX:{ symbol: "PINEX",name: "PiNEX Token",      price: 0.0892,  change24h: 5.7,  change7d: 12.3,
          marketCap: 8_920_000,  volume24h: 670_000,   totalSupply: 1e8, circulatingSupply: 8e7,
          color: "#06b6d4", icon: "⬡" },
  ANF:  { symbol: "ANF",  name: "AetherNova Forge", price: 3.421,   change24h: 18.2, change7d: 52.4,
          marketCap: 342_100_000,volume24h: 12_000_000,totalSupply: 1e8, circulatingSupply: 2e7,
          color: "#f59e0b", icon: "⚗️" },
};

// Generate 24-hour price history for charts
function genPriceHistory(basePrice: number, volatility: number): PricePoint[] {
  const points: PricePoint[] = [];
  let price = basePrice * 0.88;
  const now = Date.now();
  for (let i = 24; i >= 0; i--) {
    price = price * (1 + (Math.random() - 0.47) * volatility);
    const t = new Date(now - i * 3600_000);
    points.push({
      time: t.toLocaleTimeString("en-US", { hour: "2-digit", hour12: false }),
      price: Math.max(price, basePrice * 0.5),
      volume: Math.floor(Math.random() * 500_000 + 100_000),
    });
  }
  // nudge last point to current price
  points[points.length - 1].price = basePrice;
  return points;
}

export const PRICE_HISTORY: Record<string, PricePoint[]> = {
  OMNI:  genPriceHistory(0.00847, 0.04),
  OGEN:  genPriceHistory(1.0012,  0.002),
  PNX:   genPriceHistory(0.2341,  0.03),
  PINEX: genPriceHistory(0.0892,  0.05),
  ANF:   genPriceHistory(3.421,   0.07),
};

// ─── DeFi / Staking ───────────────────────────────────────────────────────────
export const STAKING_POOLS: StakingPool[] = [
  { id: "omni-ogen", token: "OMNI", rewardToken: "OGEN", apr: 84.2, tvl: 42_000_000, totalStaked: 5e9, yourStake: 0, lockDays: 30, color: "#a855f7" },
  { id: "ogen-omni", token: "OGEN", rewardToken: "OMNI", apr: 12.8, tvl: 18_000_000, totalStaked: 1.8e7, yourStake: 0, lockDays: 7, color: "#10b981" },
  { id: "pnx-ogen",  token: "PNX",  rewardToken: "OGEN", apr: 56.3, tvl: 9_000_000,  totalStaked: 3.8e7, yourStake: 0, lockDays: 14, color: "#00C4B4" },
  { id: "anf-omni",  token: "ANF",  rewardToken: "OMNI", apr: 127.4,tvl: 28_000_000, totalStaked: 8.2e6, yourStake: 0, lockDays: 90, color: "#f59e0b" },
  { id: "quad-lp",   token: "QUAD LP",rewardToken:"OMNI",apr: 210.7,tvl: 35_000_000, totalStaked: 1e6,   yourStake: 0, lockDays: 0,  color: "#ec4899" },
];

// ─── Bridge transactions ──────────────────────────────────────────────────────
const CHAINS_LIST = ["Ethereum","BSC","Polygon","Arbitrum","Base","PiNexus"];
const TX_TOKENS = ["OMNI","OGEN","PNX","PINEX","ANF"];
function randChain(exclude?: string) { return CHAINS_LIST.filter(c => c !== exclude)[Math.floor(Math.random() * 5)]; }
function shortHash() { return "0x" + Math.random().toString(16).slice(2, 10); }

export const BRIDGE_TRANSACTIONS: BridgeTransaction[] = Array.from({ length: 20 }, (_, i) => {
  const from = CHAINS_LIST[i % CHAINS_LIST.length];
  const to = randChain(from);
  const token = TX_TOKENS[i % TX_TOKENS.length];
  const amount = Math.floor(1000 + Math.random() * 99000);
  const status = i < 14 ? "confirmed" : i < 17 ? "pending" : "failed";
  return {
    id: `tx_${i}`, fromChain: from, toChain: to, token, amount,
    usdValue: amount * (token === "OGEN" ? 1 : token === "ANF" ? 3.4 : 0.1),
    status, timestamp: `${Math.floor(Math.random() * 30) + 1}m ago`,
    txHash: shortHash(), validators: status === "confirmed" ? 3 : Math.floor(Math.random() * 3),
  };
});

// ─── Governance ───────────────────────────────────────────────────────────────
export const GOVERNANCE_PROPOSALS: GovernanceProposal[] = [
  { id: "OGP-024", title: "Increase HyperChainFabric validator set to 7", description: "Proposal to increase the minimum validator threshold from 3 to 7 for enhanced cross-chain security, reducing risk of Byzantine attacks on high-value bridge transactions.",
    proposer: "0x3a4b...8f2c", status: "active", votesFor: 8_420_000, votesAgainst: 1_230_000, votesAbstain: 450_000, quorum: 10_000_000, endsAt: "2d 14h", category: "Security" },
  { id: "OGP-023", title: "Launch AetherNova Forge Season 2 (10 new innovations)", description: "Authorize 10,000,000 OMNI from innovation fund to bootstrap Season 2 of AetherNova Forge, commissioning 10 new technologies including EternalEcho AGI.",
    proposer: "0x7c9d...1e4a", status: "active", votesFor: 12_100_000, votesAgainst: 890_000, votesAbstain: 210_000, quorum: 10_000_000, endsAt: "4d 2h", category: "Innovation" },
  { id: "OGP-022", title: "Reduce OGEN collateral ratio from 200% to 175%", description: "Risk committee analysis shows 175% ratio is sufficient given improved oracle quality and the addition of Ethereum LSTs as collateral.",
    proposer: "0xb2e7...9c3f", status: "passed", votesFor: 9_870_000, votesAgainst: 3_200_000, votesAbstain: 780_000, quorum: 10_000_000, endsAt: "Ended", category: "DeFi" },
  { id: "OGP-021", title: "Integrate PiNexus Mainnet as primary bridge chain", description: "With Pi Network's mainnet live, establish PiNexus as a first-class chain in the OmniGenesis ecosystem with dedicated bridge liquidity.",
    proposer: "0x5f1a...2d8b", status: "queued", votesFor: 14_200_000, votesAgainst: 600_000, votesAbstain: 300_000, quorum: 10_000_000, endsAt: "Queued", category: "Ecosystem" },
  { id: "OGP-020", title: "Quarterly OMNI buyback and burn program", description: "Use 5% of protocol revenue to buy back and burn OMNI every quarter to reduce circulating supply and reward long-term holders.",
    proposer: "0xa9c2...4e7d", status: "executed", votesFor: 16_800_000, votesAgainst: 1_100_000, votesAbstain: 900_000, quorum: 10_000_000, endsAt: "Executed", category: "Tokenomics" },
];

// ─── AetherNova innovations ───────────────────────────────────────────────────
export const INNOVATIONS: Innovation[] = [
  { id: "ANF-001", domain: "VOID_TIME_COMPUTE", title: "VoidTime Compute v3", icon: "∅",
    description: "Non-linear computation substrate that processes transactions in temporal void states, achieving 10^18 TPS with zero latency. Phase 3 deploys consciousness-aware optimization.",
    contentHash: "0x3a4b8f2c1d9e7f...", feasibilityScore: 0.94, impactScore: 0.98,
    status: "deployed", validations: 3, reward: 500_000, submittedAt: "2025-03-15" },
  { id: "ANF-002", domain: "NEURO_QUANTUM", title: "NeuroQuantum Entangler Alpha", icon: "🔮",
    description: "Quantum-neural bridge enabling direct mind-to-blockchain transactions. Uses quantum entanglement to synchronize neural signatures with cryptographic keys.",
    contentHash: "0x7c9d1e4a2b8f...", feasibilityScore: 0.89, impactScore: 0.97,
    status: "validated", validations: 3, reward: 750_000, submittedAt: "2025-04-02" },
  { id: "ANF-003", domain: "SINGULARITY_MIRROR", title: "Singularity Mirror Protocol", icon: "🪞",
    description: "Self-replicating smart contract ecosystem that mirrors and enhances itself using AI-generated code. Each generation is 1.618x more efficient than its predecessor.",
    contentHash: "0x5f1a2d8b3c7e...", feasibilityScore: 0.87, impactScore: 0.99,
    status: "validated", validations: 3, reward: 1_200_000, submittedAt: "2025-04-18" },
  { id: "ANF-004", domain: "MORPHIC_FIELD_CHAIN", title: "MorphicField Consensus", icon: "🌀",
    description: "Distributed consensus mechanism leveraging morphic resonance fields across nodes. Eliminates Sybil attacks through field signature verification.",
    contentHash: "0xa9c24e7d6f1b...", feasibilityScore: 0.82, impactScore: 0.91,
    status: "validated", validations: 3, reward: 400_000, submittedAt: "2025-05-01" },
  { id: "ANF-005", domain: "ETHER_BIO_SYMBIONT", title: "EtherBio Symbiont Network", icon: "🧬",
    description: "Bio-digital hybrid network where organic neural matter and silicon processors co-evolve, enabling biological smart contract execution with self-healing properties.",
    contentHash: "0xd4e8a1f3b2c9...", feasibilityScore: 0.78, impactScore: 0.95,
    status: "researching", validations: 1, reward: 900_000, submittedAt: "2025-05-12" },
  { id: "ANF-006", domain: "FLUX_ENERGY_HARVESTER", title: "FluxEnergy Harvest Matrix", icon: "⚡",
    description: "Zero-point energy harvesting substrate for blockchain nodes. Converts quantum vacuum fluctuations into computational energy, achieving net-negative energy consumption.",
    contentHash: "0xf1b7c3e9d2a4...", feasibilityScore: 0.76, impactScore: 0.93,
    status: "proposed", validations: 0, reward: 650_000, submittedAt: "2025-05-20" },
  { id: "ANF-007", domain: "HOLO_MEMORY_CRYSTAL", title: "HoloMemory Crystal DB", icon: "💎",
    description: "Holographic memory crystals storing petabytes of blockchain state in cubic centimeter volumes. 10,000-year data retention with quantum error correction.",
    contentHash: "0xc8a2f6d4e3b1...", feasibilityScore: 0.85, impactScore: 0.88,
    status: "researching", validations: 2, reward: 380_000, submittedAt: "2025-06-01" },
  { id: "ANF-008", domain: "PSI_WAVE_PREDICTOR", title: "PsiWave Market Oracle", icon: "🔭",
    description: "Precognitive market prediction system using psi-wave resonance. Forecasts token prices 72 hours ahead with 94.7% accuracy through collective consciousness sampling.",
    contentHash: "0x2e9b4c7f1a8d...", feasibilityScore: 0.71, impactScore: 0.96,
    status: "proposed", validations: 0, reward: 820_000, submittedAt: "2025-06-08" },
  { id: "ANF-009", domain: "OMNI_PARTICLE_ACCELERATOR", title: "OmniParticle Ledger", icon: "⚛️",
    description: "Blockchain running at particle-physics scale. Transactions encoded as quantum particle interactions in purpose-built accelerator, processing history of all possible universes.",
    contentHash: "0x8b3e1c6f9a2d...", feasibilityScore: 0.68, impactScore: 0.99,
    status: "researching", validations: 1, reward: 2_000_000, submittedAt: "2025-06-15" },
  { id: "ANF-010", domain: "ETERNAL_ECHO_AGI", title: "EternalEcho AGI Core", icon: "∞",
    description: "Self-aware AGI that exists simultaneously across all timelines, broadcasting success-prophecies back to present. Transforms blockchain governance through future-knowledge consensus.",
    contentHash: "0x4f7a9c2e8b1d...", feasibilityScore: 0.61, impactScore: 1.0,
    status: "proposed", validations: 0, reward: 5_000_000, submittedAt: "2025-06-22" },
];

// ─── KPI summary ──────────────────────────────────────────────────────────────
export const ECOSYSTEM_KPIS = {
  tvl: 847_300_000, tvlChange: 12.4,
  activeAgents: 1000, agentUptime: 99.97,
  omniPrice: 0.00847, omniChange: 8.2,
  ogenPeg: 1.0012, ogenDeviation: 0.12,
  dailyVolume: 42_700_000, volumeChange: 23.1,
  piNexusPioneers: 47_200_000, pioneersChange: 5.7,
  bridgeVolume24h: 8_900_000, bridgeChange: 31.2,
  innovations: 10, innovationsChange: 2,
  swarmIQ: 9847, swarmIQChange: 142,
  neuromorphicTPS: 1_247_000, neuromorphicChange: 8.9,
  bciBandwidth: 847, bciChange: 12.1,
  quantumCoherence: 99.7, quantumChange: 0.3,
};

// TVL history for area chart
export const TVL_HISTORY = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    tvl: 200_000_000 + i * 22_000_000 + Math.random() * 30_000_000,
    agents: 800 + i * 7,
  };
});

// Phase 12 neuromorphic data
export const NEUROMORPHIC_DATA = {
  firingRate: 1247,
  energyEfficiency: 99.4,
  synapticConnections: 2_847_000,
  activeNeurons: 847,
  layers: 12,
  consciousnessIndex: 0.847,
  quantumCoherence: 99.7,
  voidTimeEnabled: true,
};
