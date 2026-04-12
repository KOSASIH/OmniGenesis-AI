# OmniGenesis AI — Tokenomics Specification

## Dual Coin System Overview

OmniGenesis operates a **Smart Hybrid Dual Coin System** designed for long-term sustainability and ecosystem growth.

## $OMNI — Governance & Utility Token

### Parameters
| Parameter | Value |
|-----------|-------|
| Name | OmniGenesis Token |
| Symbol | OMNI |
| Standard | ERC-20 (ERC20Votes, ERC20Permit) |
| Total Supply | 1,000,000,000,000 (1T) |
| Decimals | 18 |
| Halving Schedule | 21% reduction per epoch (inspired by PiNexus) |

### Allocation
| Category | Percentage | Tokens | Vesting |
|----------|-----------|--------|--------|
| AI Agents Fuel | 40% | 400B | Linear 4yr |
| PiNexus Ecosystem | 20% | 200B | Linear 2yr |
| Liquidity & Staking | 15% | 150B | No lock |
| Team & Development | 10% | 100B | 1yr cliff + 3yr linear |
| Pioneer Airdrop | 10% | 100B | 6mo cliff |
| Innovation Fund | 5% | 50B | DAO-controlled |

### Utility
1. **Governance** — Vote on proposals, elect agent configurations
2. **Agent Fuel** — Required to spawn and operate AI agents
3. **Staking** — Earn rewards by staking $OMNI
4. **DeFi** — Provide liquidity, participate in yield farming
5. **Bridge Collateral** — Used as collateral in PiNexus OmniBridge

## $OGEN — Smart Hybrid Stablecoin

### Parameters
| Parameter | Value |
|-----------|-------|
| Name | OmniGenesis Stablecoin |
| Symbol | OGEN |
| Standard | ERC-20 |
| Peg Target | $1.00 USD |
| Min Collateral Ratio | 200% |
| Decimals | 18 |

### Collateral Basket
| Asset | Max Weight |
|-------|--------|
| $OMNI | 40% |
| $PNX | 20% |
| $PiNEX | 15% |
| ETH | 15% |
| USDC | 10% |

### Stability Mechanism
1. **Over-collateralization** — Minimum 200% collateral ratio
2. **AI Rebalancing** — Econ Architect agents continuously adjust collateral weights
3. **Liquidation Engine** — Automatic liquidation when ratio drops below 150%
4. **Emergency Shutdown** — Governance-triggered full redemption

## Cross-Ecosystem Synergy

### PiNexus Bridge Mechanics
- $PNX → $OMNI: 1:1 bridge via PiNexusOmniBridge contract
- $PiNEX → $OGEN: Cross-mint with collateral validation
- Quad Farming: $OMNI/$OGEN/$PNX/$PiNEX pools with boosted APY

### Revenue Model
1. **Bridge Fees** — 0.1% per cross-chain transfer
2. **Stablecoin Interest** — Spread on $OGEN collateral yields
3. **Agent Marketplace** — Fees for custom agent deployment
4. **Oracle Services** — Data feed subscription fees
