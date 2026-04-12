"""
BaseAgent - Abstract base class for all OmniGenesis AI agents.

All agent types (Genesis Creators, Blockchain Assimilators, Quantum Guardians,
Econ Architects, etc.) inherit from this base class.
"""

import asyncio
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from loguru import logger
from pydantic import BaseModel, Field


class AgentStatus(str, Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"
    TERMINATED = "terminated"


class AgentCategory(str, Enum):
    GENESIS_CREATOR = "genesis_creator"
    PINEXUS_OVERLORD = "pinexus_overlord"
    BLOCKCHAIN_ASSIMILATOR = "blockchain_assimilator"
    QUANTUM_GUARDIAN = "quantum_guardian"
    ECON_ARCHITECT = "econ_architect"
    METAVERSE_DEITY = "metaverse_deity"
    INNOVATION_SCOUT = "innovation_scout"


class AgentConfig(BaseModel):
    """Configuration for an agent instance."""
    name: str
    category: AgentCategory
    priority: int = Field(default=5, ge=1, le=10)
    max_retries: int = 3
    heartbeat_interval: int = 30  # seconds
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TaskResult(BaseModel):
    """Result of an agent task execution."""
    task_id: str
    agent_id: str
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    execution_time_ms: float = 0
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class BaseAgent(ABC):
    """
    Abstract base agent for the OmniGenesis swarm.

    Lifecycle:
        1. __init__() - Configuration
        2. initialize() - Setup resources (async)
        3. execute() - Main task loop (async)
        4. shutdown() - Cleanup (async)

    All agents communicate via the OmniNeural Net mesh.
    """

    def __init__(self, config: AgentConfig):
        self.id = str(uuid.uuid4())
        self.config = config
        self.status = AgentStatus.IDLE
        self.created_at = datetime.utcnow()
        self.last_heartbeat = None
        self.task_count = 0
        self.error_count = 0
        self._running = False
        self._task_queue: asyncio.Queue = asyncio.Queue()

        logger.info(f"Agent created: {self.config.name} [{self.config.category}] ({self.id})")

    @property
    def name(self) -> str:
        return self.config.name

    @property
    def category(self) -> AgentCategory:
        return self.config.category

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize agent resources (connections, models, etc.)."""
        pass

    @abstractmethod
    async def execute_task(self, task: Dict[str, Any]) -> TaskResult:
        """Execute a single task. Must be implemented by each agent type."""
        pass

    @abstractmethod
    async def shutdown(self) -> None:
        """Clean up agent resources."""
        pass

    async def start(self) -> None:
        """Start the agent's main loop."""
        self._running = True
        self.status = AgentStatus.RUNNING
        logger.info(f"Agent starting: {self.name}")

        await self.initialize()

        # Start heartbeat and task processing concurrently
        await asyncio.gather(
            self._heartbeat_loop(),
            self._task_loop(),
        )

    async def stop(self) -> None:
        """Stop the agent gracefully."""
        self._running = False
        self.status = AgentStatus.TERMINATED
        await self.shutdown()
        logger.info(f"Agent stopped: {self.name}")

    async def submit_task(self, task: Dict[str, Any]) -> None:
        """Submit a task to this agent's queue."""
        task.setdefault("task_id", str(uuid.uuid4()))
        task.setdefault("submitted_at", datetime.utcnow().isoformat())
        await self._task_queue.put(task)
        logger.debug(f"Task submitted to {self.name}: {task.get('task_id')}")

    async def _task_loop(self) -> None:
        """Process tasks from the queue."""
        while self._running:
            try:
                task = await asyncio.wait_for(self._task_queue.get(), timeout=1.0)
                self.task_count += 1

                for attempt in range(self.config.max_retries):
                    try:
                        result = await self.execute_task(task)
                        if result.success:
                            logger.info(f"Task completed: {task.get('task_id')} by {self.name}")
                            break
                        else:
                            logger.warning(f"Task failed (attempt {attempt + 1}): {result.error}")
                    except Exception as e:
                        logger.error(f"Task error (attempt {attempt + 1}): {e}")
                        self.error_count += 1
                        if attempt == self.config.max_retries - 1:
                            self.status = AgentStatus.ERROR

            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Task loop error: {e}")

    async def _heartbeat_loop(self) -> None:
        """Send periodic heartbeats."""
        while self._running:
            self.last_heartbeat = datetime.utcnow()
            await asyncio.sleep(self.config.heartbeat_interval)

    def get_stats(self) -> Dict[str, Any]:
        """Get agent statistics."""
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category.value,
            "status": self.status.value,
            "task_count": self.task_count,
            "error_count": self.error_count,
            "uptime_seconds": (datetime.utcnow() - self.created_at).total_seconds(),
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
        }
