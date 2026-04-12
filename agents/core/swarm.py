"""
SwarmOrchestrator - Manages the OmniGenesis agent swarm.

Responsible for:
- Agent registry and lifecycle management
- Task allocation using weighted reputation scores
- Inter-agent communication via OmniNeural Net
- Swarm health monitoring and auto-scaling
"""

import asyncio
from datetime import datetime
from typing import Any, Dict, List, Optional, Type

from loguru import logger

from .base_agent import (
    AgentCategory,
    AgentConfig,
    AgentStatus,
    BaseAgent,
)


class SwarmOrchestrator:
    """
    Central orchestrator for the OmniGenesis agent swarm.

    Manages agent lifecycle, task distribution, and swarm coordination.
    """

    def __init__(self, max_agents: int = 1000):
        self.max_agents = max_agents
        self.agents: Dict[str, BaseAgent] = {}
        self.agent_types: Dict[AgentCategory, Type[BaseAgent]] = {}
        self.reputation_scores: Dict[str, float] = {}
        self._running = False
        self.created_at = datetime.utcnow()

        logger.info(f"SwarmOrchestrator initialized (max_agents={max_agents})")

    def register_agent_type(self, category: AgentCategory, agent_class: Type[BaseAgent]) -> None:
        """Register an agent class for a category."""
        self.agent_types[category] = agent_class
        logger.info(f"Registered agent type: {category.value} -> {agent_class.__name__}")

    async def spawn_agent(self, config: AgentConfig) -> str:
        """Spawn a new agent and add to the swarm."""
        if len(self.agents) >= self.max_agents:
            raise RuntimeError(f"Max agent limit reached ({self.max_agents})")

        agent_class = self.agent_types.get(config.category)
        if not agent_class:
            raise ValueError(f"No agent type registered for: {config.category}")

        agent = agent_class(config)
        self.agents[agent.id] = agent
        self.reputation_scores[agent.id] = 1.0  # Start with neutral reputation

        logger.info(f"Agent spawned: {agent.name} ({agent.id})")
        return agent.id

    async def start_agent(self, agent_id: str) -> None:
        """Start a specific agent."""
        agent = self.agents.get(agent_id)
        if not agent:
            raise ValueError(f"Agent not found: {agent_id}")

        asyncio.create_task(agent.start())
        logger.info(f"Agent started: {agent.name}")

    async def stop_agent(self, agent_id: str) -> None:
        """Stop a specific agent."""
        agent = self.agents.get(agent_id)
        if agent:
            await agent.stop()
            logger.info(f"Agent stopped: {agent.name}")

    async def dispatch_task(
        self,
        task: Dict[str, Any],
        category: Optional[AgentCategory] = None,
    ) -> Optional[str]:
        """
        Dispatch a task to the best available agent.

        Selection criteria:
        1. Category match (if specified)
        2. Agent status (must be RUNNING)
        3. Reputation score (higher is better)
        4. Current queue size (prefer less loaded)
        """
        candidates = []

        for agent_id, agent in self.agents.items():
            if agent.status != AgentStatus.RUNNING:
                continue
            if category and agent.category != category:
                continue

            score = self.reputation_scores.get(agent_id, 0)
            queue_penalty = agent._task_queue.qsize() * 0.1
            candidates.append((agent_id, score - queue_penalty))

        if not candidates:
            logger.warning(f"No available agents for task (category={category})")
            return None

        # Sort by score (highest first)
        candidates.sort(key=lambda x: x[1], reverse=True)
        best_agent_id = candidates[0][0]

        agent = self.agents[best_agent_id]
        await agent.submit_task(task)

        logger.debug(f"Task dispatched to {agent.name} ({best_agent_id})")
        return best_agent_id

    async def broadcast_task(
        self,
        task: Dict[str, Any],
        category: Optional[AgentCategory] = None,
    ) -> List[str]:
        """Broadcast a task to all matching agents."""
        dispatched = []
        for agent_id, agent in self.agents.items():
            if agent.status != AgentStatus.RUNNING:
                continue
            if category and agent.category != category:
                continue
            await agent.submit_task(task)
            dispatched.append(agent_id)

        logger.info(f"Task broadcast to {len(dispatched)} agents")
        return dispatched

    def update_reputation(self, agent_id: str, delta: float) -> None:
        """Update an agent's reputation score."""
        current = self.reputation_scores.get(agent_id, 1.0)
        new_score = max(0.0, min(10.0, current + delta))
        self.reputation_scores[agent_id] = new_score

    def get_swarm_stats(self) -> Dict[str, Any]:
        """Get overall swarm statistics."""
        status_counts = {}
        category_counts = {}

        for agent in self.agents.values():
            status_counts[agent.status.value] = status_counts.get(agent.status.value, 0) + 1
            category_counts[agent.category.value] = category_counts.get(agent.category.value, 0) + 1

        return {
            "total_agents": len(self.agents),
            "max_agents": self.max_agents,
            "status_distribution": status_counts,
            "category_distribution": category_counts,
            "total_tasks": sum(a.task_count for a in self.agents.values()),
            "total_errors": sum(a.error_count for a in self.agents.values()),
            "uptime_seconds": (datetime.utcnow() - self.created_at).total_seconds(),
        }

    async def start_all(self) -> None:
        """Start all registered agents."""
        self._running = True
        tasks = [self.start_agent(aid) for aid in self.agents]
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info(f"All agents started ({len(self.agents)} total)")

    async def stop_all(self) -> None:
        """Stop all agents."""
        self._running = False
        tasks = [self.stop_agent(aid) for aid in self.agents]
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("All agents stopped")
