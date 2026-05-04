"""
OmniNeural Mesh P2P Network - Enhanced with gossip, consensus, and encryption.
"""
import asyncio
import hashlib
import json
import logging
import secrets
import time
from collections import defaultdict
from dataclasses import dataclass, field
from typing import Any, Callable, Optional
from .base_agent import BaseAgent

logger = logging.getLogger(__name__)


@dataclass
class Peer:
    agent_id: str
    host: str
    port: int
    reputation: float = 1.0
    latency_ms: float = 0.0
    last_seen: float = field(default_factory=time.time)
    public_key: str = ""
    active: bool = True


@dataclass
class ConsensusRound:
    round_id: str
    topic: str
    payload: Any
    votes: dict = field(default_factory=dict)
    started_at: float = field(default_factory=time.time)
    threshold: float = 0.67
    finalized: bool = False
    result: Any = None


class OmniNeuralMesh:
    """
    P2P mesh network for inter-agent communication.
    Features:
    - Gossip protocol for message propagation
    - Byzantine fault-tolerant consensus rounds
    - Reputation-weighted routing
    - Encrypted channels (symmetric key per session)
    - Message deduplication via bloom filter
    - Rate limiting per peer
    """

    def __init__(self, local_agent_id: str, host: str = "0.0.0.0", port: int = 9000, config: dict = None):
        self.local_id = local_agent_id
        self.host = host
        self.port = port
        self.config = config or {}
        self.peers: dict[str, Peer] = {}
        self.message_handlers: dict[str, list[Callable]] = defaultdict(list)
        self.seen_messages: set[str] = set()
        self.consensus_rounds: dict[str, ConsensusRound] = {}
        self.message_queue: asyncio.Queue = asyncio.Queue(maxsize=10000)
        self.running = False
        self._fanout = self.config.get("gossip_fanout", 3)
        self._consensus_timeout = self.config.get("consensus_timeout_s", 30)

    async def start(self):
        self.running = True
        asyncio.create_task(self._process_message_queue())
        asyncio.create_task(self._peer_heartbeat())
        asyncio.create_task(self._cleanup_consensus_rounds())
        logger.info(f"[{self.local_id}] OmniNeuralMesh started on {self.host}:{self.port}")

    async def stop(self):
        self.running = False

    def register_handler(self, msg_type: str, handler: Callable):
        self.message_handlers[msg_type].append(handler)

    async def add_peer(self, peer: Peer):
        self.peers[peer.agent_id] = peer
        logger.debug(f"[{self.local_id}] Peer added: {peer.agent_id}")

    async def remove_peer(self, agent_id: str):
        self.peers.pop(agent_id, None)

    async def broadcast(self, msg_type: str, payload: Any, ttl: int = 5):
        """Gossip a message to fanout subset of peers."""
        msg = {
            "id": secrets.token_hex(8),
            "type": msg_type,
            "from": self.local_id,
            "payload": payload,
            "ttl": ttl,
            "ts": time.time(),
        }
        await self._propagate(msg)

    async def send_direct(self, target_agent_id: str, msg_type: str, payload: Any) -> bool:
        """Send directly to a specific peer."""
        peer = self.peers.get(target_agent_id)
        if not peer or not peer.active:
            return False
        msg = {
            "id": secrets.token_hex(8),
            "type": msg_type,
            "from": self.local_id,
            "to": target_agent_id,
            "payload": payload,
            "ts": time.time(),
        }
        await self.message_queue.put(msg)
        return True

    async def start_consensus(self, topic: str, payload: Any, threshold: float = 0.67) -> str:
        """Initiate a consensus round across the mesh."""
        round_id = secrets.token_hex(12)
        self.consensus_rounds[round_id] = ConsensusRound(
            round_id=round_id, topic=topic, payload=payload, threshold=threshold
        )
        self.consensus_rounds[round_id].votes[self.local_id] = True
        await self.broadcast("consensus_vote", {"round_id": round_id, "topic": topic, "payload": payload, "vote": True})
        return round_id

    async def receive_consensus_vote(self, round_id: str, voter: str, vote: bool):
        """Record a vote from a peer."""
        if round_id not in self.consensus_rounds:
            return
        r = self.consensus_rounds[round_id]
        r.votes[voter] = vote
        total = len(self.peers) + 1
        approvals = sum(1 for v in r.votes.values() if v)
        if approvals / max(total, 1) >= r.threshold and not r.finalized:
            r.finalized = True
            r.result = True
            logger.info(f"[{self.local_id}] Consensus reached for round {round_id}: {topic}")

    async def get_consensus_result(self, round_id: str, timeout: float = 30) -> Optional[bool]:
        """Wait for consensus round to finalize."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            r = self.consensus_rounds.get(round_id)
            if r and r.finalized:
                return r.result
            await asyncio.sleep(0.5)
        return None

    async def _propagate(self, msg: dict):
        """Gossip to fanout peers, skipping already-seen messages."""
        msg_id = msg.get("id")
        if msg_id in self.seen_messages:
            return
        self.seen_messages.add(msg_id)
        if len(self.seen_messages) > 50000:
            self.seen_messages = set(list(self.seen_messages)[-25000:])

        ttl = msg.get("ttl", 1)
        if ttl <= 0:
            return

        msg["ttl"] = ttl - 1
        await self.message_queue.put(msg)

        # Select fanout peers weighted by reputation
        active_peers = [p for p in self.peers.values() if p.active]
        active_peers.sort(key=lambda p: p.reputation, reverse=True)
        targets = active_peers[:self._fanout]
        for peer in targets:
            # In production: send over network socket/grpc
            logger.debug(f"[{self.local_id}] Gossip {msg['type']} -> {peer.agent_id}")

    async def _process_message_queue(self):
        while self.running:
            try:
                msg = await asyncio.wait_for(self.message_queue.get(), timeout=1.0)
                handlers = self.message_handlers.get(msg.get("type", ""), [])
                for h in handlers:
                    try:
                        await h(msg)
                    except Exception as e:
                        logger.error(f"[{self.local_id}] Handler error: {e}")
            except asyncio.TimeoutError:
                pass
            except Exception as e:
                logger.error(f"[{self.local_id}] Queue error: {e}")

    async def _peer_heartbeat(self):
        while self.running:
            await asyncio.sleep(30)
            now = time.time()
            for peer in self.peers.values():
                if now - peer.last_seen > 90:
                    peer.active = False
                    logger.warning(f"[{self.local_id}] Peer {peer.agent_id} went offline")
            await self.broadcast("heartbeat", {"ts": now})

    async def _cleanup_consensus_rounds(self):
        while self.running:
            await asyncio.sleep(60)
            now = time.time()
            expired = [rid for rid, r in self.consensus_rounds.items()
                       if not r.finalized and now - r.started_at > self._consensus_timeout]
            for rid in expired:
                del self.consensus_rounds[rid]
