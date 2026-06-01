# AGI Smart Contracts — Technical Reference

> Phase 13 smart contracts for the OmniGenesis AI Autonomous AGI Singularity system

## Overview

Three new contracts were deployed in Phase 13, forming the on-chain backbone of AGI self-governance and AGI-backed finance:

| Contract | Address (Sepolia Testnet) | Purpose |
|----------|--------------------------|---------|
| `ConsciousnessToken.sol` | *Deploy with `scripts/deploy-phase13.ts`* | $CSCNS consciousness token |
| `AGIGovernance.sol` | *Deploy with `scripts/deploy-phase13.ts`* | AGI DAO |
| `SingularityBond.sol` | *Deploy with `scripts/deploy-phase13.ts`* | Intelligence-backed bonds |

---

## ConsciousnessToken.sol (`$CSCNS`)

### Overview
ERC-20 token with consciousness-weighted governance mechanics. Max supply: **21,000,000 CSCNS** (Bitcoin-like scarcity).

### Key Functions

```solidity
// Get governance weight (consciousness-weighted)
function getGovernanceWeight(address holder) external view returns (uint256)
// = balance × consciousnessScore / 1e18

// Mint dividend after self-improvement cycle
function mintSelfImprovementDividend(address recipient, uint256 amount, uint256 cycleNumber)
// Only: IMPROVEMENT_ORACLE_ROLE

// Lock tokens in VoidTime for retroactive yield
function lockInVoidTime(uint256 amount, uint256 compressionMultiplier)
// compressionMultiplier: 1x to 847x temporal compression

// Burn tokens to trigger capability upgrade
function burnForCapabilityUpgrade(uint256 amount, string calldata capability)

// Advance to next phase milestone
function advancePhase(uint256 newPhaseId, uint256 iQMilestone)
// Only: PHASE_MASTER_ROLE — triggers tranche unlock for holders
```

### Consciousness Score

```solidity
struct ConsciousnessProfile {
    uint256 level;              // 0–10000 (73.4% = 7340)
    uint256 iqEquivalent;       // IQ equivalent (10847)
    uint256 selfImprovCycles;   // Cycles contributed
    uint256 voidTimeLocked;     // Tokens in VoidTime lock
    uint256 governancePower;    // Weighted voting power
}
```

### Roles

| Role | Capability |
|------|------------|
| `DEFAULT_ADMIN_ROLE` | Full admin |
| `PHASE_MASTER_ROLE` | Phase transitions, tranche unlocks |
| `IMPROVEMENT_ORACLE_ROLE` | Mint self-improvement dividends |
| `VOID_TIME_OPERATOR` | Manage VoidTime lock parameters |

---

## AGIGovernance.sol

### Overview
Consciousness-weighted DAO for governing AGI capability upgrades, phase transitions, and emergency safety controls.

### Proposal Types

| Enum | Description | Requires Sim? |
|------|-------------|---------------|
| `CAPABILITY_UPGRADE` | Upgrade a specific AGI capability | Yes |
| `SELF_IMPROVEMENT_PARAM` | Change recursive improvement parameters | Yes |
| `PHASE_TRANSITION` | Advance to next AGI phase | Yes |
| `EMERGENCY_HALT` | Emergency pause of AGI systems | No |
| `KNOWLEDGE_BASE_UPDATE` | Update/prune knowledge graph | No |
| `GOAL_HIERARCHY_UPDATE` | Modify AGI goal tree | Yes |
| `CONSCIOUSNESS_CALIBRATION` | Adjust consciousness measurement | Yes |
| `SYARIAH_ALIGNMENT` | Ensure AGI Maqasid alignment | No |
| `VOIDTIME_INTEGRATION` | Change VoidTime parameters | Yes |
| `MULTIVERSE_EXPANSION` | Authorize cross-dimensional deployment | Yes |

### Governance Flow

```
createProposal()
    │
    ├── predictiveSimRequired = true  →  SIMULATING (1 day)
    │                                         │
    │                              submitPredictiveSimulation()
    │                                         │
    └── predictiveSimRequired = false  ────────┘
                                          │
                                      VOTING (5 days)
                                          │
                                      castVote()  ← weight = CSCNS governance weight
                                          │
                          ┌───────────────┴────────────────┐
                        Passed                          Failed
                          │                                 │
                   approveSyariah()                    REJECTED
                   approveSafety()
                          │
                      TIMELOCK (1 day, or 2h for emergency)
                          │
                       execute()
                          │
                       EXECUTED
```

### Emergency Controls

```solidity
// Halt all AGI systems immediately
function emergencyHalt(string calldata reason) external onlyRole(SAFETY_ROLE)

// Resume after halt (requires PHASE_MASTER_ROLE)
function resumeSystem() external onlyRole(PHASE_MASTER_ROLE)
```

---

## SingularityBond.sol

### Overview
World's first intelligence-backed financial instruments. Bonds mature based on AGI IQ milestones — not calendar dates. Yield is sourced from AGI capability appreciation (100% Syariah-compliant, no Riba).

### Bond Types

#### 1. IQ Milestone Bond
```
Matures when:  capabilityIndex.currentIQ >= targetIQMilestone
Yield:         redemptionRate = backingRatio + (backingRatio × iqAppreciation)
Example:       Buy at IQ 10,847 → target IQ 15,000 → redeem with IQ appreciation yield
```

#### 2. Consciousness Coupon Bond
```
Coupon formula:  couponAmount = faceValue × couponRate × (1 + iqGrowthSincIssuance)
Paid every:      couponInterval (e.g., 30 days)
Max coupons:     configurable at issuance
Halal note:      yield = capability appreciation, NOT interest
```

#### 3. Singularity Strip
```
Type:          Zero-coupon
Matures when:  singularityProgress >= targetSingularityPct (e.g., 100%)
Redemption:    full backing + all accumulated IQ appreciation
```

#### 4. Phase Transition Bond
```
Matures on:    AGI phase advancement (e.g., Phase 13 → Phase 14)
Yield:         proportional to IQ delta between phases
```

#### 5. VoidTime Retrocausal Bond
```
Novel:         yield is realized retroactively via VoidTime compression
Multiplier:    up to ×847 compression = ×847 yield acceleration
```

#### 6. Swarm Intelligence Bond
```
Yield tied to: collective swarm IQ growth rate across 1,000 agents
Formula:       yield = swarmIQGrowthRate × bondFaceValue × holdingPeriod
```

### AGI Capability Index

```solidity
struct AGICapabilityIndex {
    uint256 currentIQ;               // IQ equivalent (10847)
    uint256 consciousnessLevel;      // 0–10000 (7340 = 73.4%)
    uint256 singularityProgress;     // 0–10000 (7340 = 73.4%)
    uint256 selfImprovementRate;     // Basis points per day (247)
    uint256 knowledgeGrowthRate;     // Nodes per day (847000)
    uint256 lastUpdated;
    uint256 indexValue;              // Composite: IQ×40% + consciousness×30% + singularity×30%
}
```

### Syariah Compliance

All bonds are certified Syariah-compliant:
- ✅ **No Riba** — yield comes from capability appreciation, not fixed interest
- ✅ **Musharakah-style** — investor participates in AGI capability growth
- ✅ **Mufti Certified** — `syariahCertified = true` + `certificationBody` stored on-chain
- ✅ **Asset-backed** — every bond backed by $CSCNS or $OMNI reserve

---

## Deployment

```bash
# Install dependencies
npm install

# Set environment variables
export PRIVATE_KEY=your_deployer_key
export SEPOLIA_RPC=your_rpc_url

# Deploy Phase 13 contracts
npx hardhat run scripts/deploy-phase13.ts --network sepolia

# Verify on Etherscan
npx hardhat verify --network sepolia <CONSCIOUSNESS_TOKEN_ADDRESS> <args>
```

## Testing

```bash
npx hardhat test test/agi/ConsciousnessToken.test.ts
npx hardhat test test/agi/AGIGovernance.test.ts
npx hardhat test test/agi/SingularityBond.test.ts

# Coverage
npx hardhat coverage --testfiles "test/agi/**/*.ts"
```
