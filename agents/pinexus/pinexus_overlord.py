"""
PiNexus Overlord Agent
Manages PiNexus ecosystem integration, Pioneer onboarding, and $PNX/$PiNEX synergy.
"""
import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any
from .core.base_agent import BaseAgent, AgentTask

logger = logging.getLogger(__name__)

@dataclass
class PioneerData:
    pioneer_id: str
    wallet: str
    mining_rate: float = 0.0
    pnx_balance: float = 0.0
    pinex_balance: float = 0.0
    airdrop_eligible: bool = False
    kyc_status: str = "pending"
    referrals: int = 0
    tier: str = "bronze"


class PiNexusOverlordAgent(BaseAgent):
    """
    PiNexus Overlord: Manages the PiNexus ecosystem integration.
    Capabilities:
    - Pioneer KYC and onboarding automation
    - $PNX mining rate optimization
    - $PiNEX <-> $OGEN cross-mint coordination
    - Airdrop eligibility calculation
    - Pioneer reward distribution
    - Dual Coin bridge operations ($PNX <-> $OMNI, $PiNEX <-> $OGEN)
    """

    def __init__(self, agent_id: str, orchestrator=None, config: dict = None):
        super().__init__(agent_id=agent_id, category="pinexus_overlord", orchestrator=orchestrator, config=config)
        self.pioneers: dict[str, PioneerData] = {}
        self.pending_kyc: list[str] = []
        self.airdrop_queue: list[str] = []
        self.bridge_stats = {"pnx_to_omni": 0, "pinex_to_ogen": 0, "total_volume": 0.0}

    async def initialize(self):
        await super().initialize()
        self._register_handlers()
        logger.info(f"[{self.agent_id}] PiNexus Overlord initialized")

    def _register_handlers(self):
        self.register_task_handler("onboard_pioneer", self._handle_onboard)
        self.register_task_handler("process_kyc", self._handle_kyc)
        self.register_task_handler("calculate_airdrop", self._handle_airdrop)
        self.register_task_handler("bridge_pnx_to_omni", self._handle_bridge_pnx)
        self.register_task_handler("bridge_pinex_to_ogen", self._handle_bridge_pinex)
        self.register_task_handler("optimize_mining", self._handle_optimize_mining)
        self.register_task_handler("get_ecosystem_stats", self._handle_stats)

    async def run_cycle(self):
        while self.running:
            try:
                await self._process_kyc_queue()
                await self._update_pioneer_rewards()
                await self._calculate_airdrop_eligibility()
                await self._sync_dual_coin_ratios()
                await asyncio.sleep(self.config.get("cycle_interval", 30))
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[{self.agent_id}] Cycle error: {e}")
                await asyncio.sleep(10)

    async def _process_kyc_queue(self):
        for pid in list(self.pending_kyc):
            pioneer = self.pioneers.get(pid)
            if pioneer:
                pioneer.kyc_status = "verified"
                pioneer.airdrop_eligible = True
                self.pending_kyc.remove(pid)
                logger.info(f"[{self.agent_id}] KYC approved for pioneer {pid}")

    async def _update_pioneer_rewards(self):
        for pid, pioneer in self.pioneers.items():
            if pioneer.kyc_status == "verified":
                reward = pioneer.mining_rate * 0.001
                pioneer.pnx_balance += reward

    async def _calculate_airdrop_eligibility(self):
        eligible = [p for p in self.pioneers.values() if p.airdrop_eligible and p.kyc_status == "verified"]
        self.airdrop_queue = [p.pioneer_id for p in eligible]

    async def _sync_dual_coin_ratios(self):
        """Sync $PNX/$OMNI and $PiNEX/$OGEN bridge ratios."""
        await self.broadcast_to_swarm({
            "type": "dual_coin_sync",
            "pnx_omni_ratio": 1.0,
            "pinex_ogen_ratio": 1.0,
            "from": self.agent_id
        })

    async def _handle_onboard(self, task: AgentTask) -> dict:
        data = task.payload
        pid = data.get("pioneer_id")
        pioneer = PioneerData(
            pioneer_id=pid,
            wallet=data.get("wallet", ""),
            mining_rate=data.get("mining_rate", 0.0),
        )
        self.pioneers[pid] = pioneer
        self.pending_kyc.append(pid)
        return {"status": "onboarded", "pioneer_id": pid, "kyc_status": "pending"}

    async def _handle_kyc(self, task: AgentTask) -> dict:
        pid = task.payload.get("pioneer_id")
        if pid in self.pioneers:
            self.pioneers[pid].kyc_status = "verified"
            self.pioneers[pid].airdrop_eligible = True
            return {"status": "verified", "pioneer_id": pid}
        return {"error": "pioneer not found"}

    async def _handle_airdrop(self, task: AgentTask) -> dict:
        return {"eligible_count": len(self.airdrop_queue), "pioneer_ids": self.airdrop_queue[:100]}

    async def _handle_bridge_pnx(self, task: AgentTask) -> dict:
        amount = task.payload.get("amount", 0)
        self.bridge_stats["pnx_to_omni"] += 1
        self.bridge_stats["total_volume"] += amount
        return {"status": "bridged", "pnx_in": amount, "omni_out": amount}

    async def _handle_bridge_pinex(self, task: AgentTask) -> dict:
        amount = task.payload.get("amount", 0)
        self.bridge_stats["pinex_to_ogen"] += 1
        self.bridge_stats["total_volume"] += amount
        return {"status": "cross_minted", "pinex_in": amount, "ogen_out": amount}

    async def _handle_optimize_mining(self, task: AgentTask) -> dict:
        pid = task.payload.get("pioneer_id")
        if pid in self.pioneers:
            self.pioneers[pid].mining_rate *= 1.05
            return {"status": "optimized", "new_rate": self.pioneers[pid].mining_rate}
        return {"error": "pioneer not found"}

    async def _handle_stats(self, task: AgentTask) -> dict:
        return {
            "total_pioneers": len(self.pioneers),
            "kyc_verified": sum(1 for p in self.pioneers.values() if p.kyc_status == "verified"),
            "airdrop_eligible": len(self.airdrop_queue),
            "bridge_stats": self.bridge_stats,
        }
