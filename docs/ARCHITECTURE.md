# OmniGenesis AI — System Architecture

## Overview

OmniGenesis AI follows a layered architecture with clear separation of concerns:

```
┌──────────────────────────────────────────────────┐
│  Layer 4: Frontend / Dashboard                    │
│  React + TypeScript + Wagmi + RainbowKit         │
├──────────────────────────────────────────────────┤
│  Layer 3: Backend API                             │
│  FastAPI + SQLAlchemy + WebSocket                │
├──────────────────────────────────────────────────┤
│  Layer 2: Agent Swarm Framework                   │
│  Python + AsyncIO + libp2p + LLM Integration     │
├──────────────────────────────────────────────────┤
│  Layer 1: Smart Contracts                         │
│  Solidity 0.8.24 + OpenZeppelin + Hardhat        │
├──────────────────────────────────────────────────┤
│  Layer 0: Multi-Chain Infrastructure              │
│  Ethereum · BSC · Polygon · Arbitrum · Base      │
└──────────────────────────────────────────────────┘
```

## Layer 1: Smart Contracts

### Token Contracts
- **OMNI.sol** — ERC-20 with ERC20Votes, ERC20Permit, snapshot, and halving logic
- **OGEN.sol** — Stablecoin with multi-collateral vault, mint/burn, AI rebalancing hooks

### Governance
- **OmniGovernor.sol** — OpenZeppelin Governor with timelock, quorum, and configurable thresholds

### DeFi
- **OmniStaking.sol** — Multi-token staking with dynamic reward rates
- **QuadLiquidityPool.sol** — Custom AMM supporting 4 tokens with weighted balances

### Bridge
- **PiNexusOmniBridge.sol** — Lock-and-mint bridge with multi-sig validation

### Oracle
- **OmniOracle.sol** — Aggregated price feeds from agent consensus

## Layer 2: Agent Framework

### Core Components
- `BaseAgent` — Abstract base class with lifecycle methods
- `SwarmOrchestrator` — Manages agent registry, task allocation, and communication
- `OmniNeuralNet` — P2P mesh network for inter-agent messaging

### Agent Types
Each agent type inherits from `BaseAgent` and implements domain-specific logic.

## Layer 3: Backend API

### Endpoints
- `GET /api/agents` — List active agents and their status
- `GET /api/agents/{id}` — Agent details and task history
- `GET /api/tokens/omni` — $OMNI token metrics
- `GET /api/tokens/ogen` — $OGEN stablecoin status and collateral ratio
- `POST /api/governance/propose` — Submit governance proposal
- `GET /api/bridge/status` — Cross-chain bridge status

## Layer 4: Frontend

### Pages
- **Dashboard** — Overview of ecosystem metrics
- **Agent Monitor** — Real-time agent swarm visualization
- **Governance** — Proposal listing and voting
- **DeFi** — Staking, farming, and liquidity management
- **Bridge** — Cross-chain token transfers
