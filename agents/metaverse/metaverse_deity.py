"""
Metaverse Deity Agent
Manages virtual world operations, digital assets, and bio-digital fusion.
"""
import asyncio
import logging
from dataclasses import dataclass, field
from typing import Any
from .core.base_agent import BaseAgent, AgentTask

logger = logging.getLogger(__name__)

@dataclass
class VirtualWorld:
    world_id: str
    name: str
    theme: str
    active_users: int = 0
    total_assets: int = 0
    revenue_usd: float = 0.0
    stablecoin_balance: float = 0.0
    status: str = "active"


class MetaverseDeityAgent(BaseAgent):
    """
    Metaverse Deity: Governs virtual worlds, NFT assets, and bio-digital fusion.
    Capabilities:
    - Virtual world creation and management
    - NFT asset minting and marketplace operations
    - $OGEN-powered in-world economy
    - Bio-digital avatar NFT systems
    - Cross-metaverse interoperability
    - God-realm governance via $OMNI votes
    """

    def __init__(self, agent_id: str, orchestrator=None, config: dict = None):
        super().__init__(agent_id=agent_id, category="metaverse_deity", orchestrator=orchestrator, config=config)
        self.worlds: dict[str, VirtualWorld] = {}
        self.asset_registry: dict[str, dict] = {}
        self.marketplace_listings: list[dict] = []
        self.economy_stats = {"total_gdp": 0.0, "daily_volume": 0.0, "active_worlds": 0}

    async def initialize(self):
        await super().initialize()
        self._register_handlers()
        logger.info(f"[{self.agent_id}] Metaverse Deity initialized")

    def _register_handlers(self):
        self.register_task_handler("create_world", self._handle_create_world)
        self.register_task_handler("mint_nft_asset", self._handle_mint_nft)
        self.register_task_handler("list_marketplace", self._handle_marketplace_list)
        self.register_task_handler("execute_trade", self._handle_trade)
        self.register_task_handler("get_economy_stats", self._handle_economy_stats)
        self.register_task_handler("spawn_avatar", self._handle_spawn_avatar)

    async def run_cycle(self):
        while self.running:
            try:
                await self._update_world_economics()
                await self._curate_marketplace()
                await self._balance_cross_world_economy()
                await asyncio.sleep(self.config.get("cycle_interval", 60))
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[{self.agent_id}] Cycle error: {e}")
                await asyncio.sleep(15)

    async def _update_world_economics(self):
        total_gdp = sum(w.revenue_usd for w in self.worlds.values())
        self.economy_stats["total_gdp"] = total_gdp
        self.economy_stats["active_worlds"] = sum(1 for w in self.worlds.values() if w.status == "active")

    async def _curate_marketplace(self):
        """Remove expired listings, update pricing."""
        self.marketplace_listings = [l for l in self.marketplace_listings if not l.get("expired", False)]

    async def _balance_cross_world_economy(self):
        """Rebalance $OGEN liquidity across worlds."""
        if len(self.worlds) < 2:
            return
        avg = sum(w.stablecoin_balance for w in self.worlds.values()) / len(self.worlds)
        for world in self.worlds.values():
            if world.stablecoin_balance > avg * 1.5:
                excess = world.stablecoin_balance - avg
                world.stablecoin_balance -= excess * 0.1
                logger.debug(f"[{self.agent_id}] Rebalanced world {world.world_id}")

    async def _handle_create_world(self, task: AgentTask) -> dict:
        data = task.payload
        world = VirtualWorld(**data)
        self.worlds[world.world_id] = world
        logger.info(f"[{self.agent_id}] Created virtual world: {world.name}")
        return {"status": "created", "world_id": world.world_id}

    async def _handle_mint_nft(self, task: AgentTask) -> dict:
        asset_id = f"asset_{len(self.asset_registry)}"
        self.asset_registry[asset_id] = {**task.payload, "asset_id": asset_id, "minted_by": self.agent_id}
        return {"status": "minted", "asset_id": asset_id}

    async def _handle_marketplace_list(self, task: AgentTask) -> dict:
        listing = {**task.payload, "listing_id": len(self.marketplace_listings)}
        self.marketplace_listings.append(listing)
        return {"status": "listed", "listing_id": listing["listing_id"]}

    async def _handle_trade(self, task: AgentTask) -> dict:
        lid = task.payload.get("listing_id")
        listing = next((l for l in self.marketplace_listings if l.get("listing_id") == lid), None)
        if listing:
            listing["expired"] = True
            return {"status": "executed", "listing_id": lid, "price": listing.get("price")}
        return {"error": "listing not found"}

    async def _handle_economy_stats(self, task: AgentTask) -> dict:
        return self.economy_stats

    async def _handle_spawn_avatar(self, task: AgentTask) -> dict:
        avatar_id = f"avatar_{task.payload.get('user_id')}"
        return {"status": "spawned", "avatar_id": avatar_id, "world": task.payload.get("world_id")}
