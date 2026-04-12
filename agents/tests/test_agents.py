"""Tests for the OmniGenesis Agent Framework."""

import asyncio
import pytest
from agents.core.base_agent import AgentConfig, AgentCategory, AgentStatus
from agents.core.swarm import SwarmOrchestrator
from agents.genesis.creator_agent import GenesisCreatorAgent


@pytest.fixture
def swarm():
    return SwarmOrchestrator(max_agents=10)


@pytest.fixture
def genesis_config():
    return AgentConfig(
        name="Test Genesis Agent",
        category=AgentCategory.GENESIS_CREATOR,
    )


class TestBaseAgent:
    def test_agent_creation(self, genesis_config):
        agent = GenesisCreatorAgent(genesis_config)
        assert agent.name == "Test Genesis Agent"
        assert agent.category == AgentCategory.GENESIS_CREATOR
        assert agent.status == AgentStatus.IDLE
        assert agent.task_count == 0

    def test_agent_stats(self, genesis_config):
        agent = GenesisCreatorAgent(genesis_config)
        stats = agent.get_stats()
        assert stats["name"] == "Test Genesis Agent"
        assert stats["status"] == "idle"
        assert stats["task_count"] == 0


class TestSwarmOrchestrator:
    def test_swarm_creation(self, swarm):
        assert swarm.max_agents == 10
        assert len(swarm.agents) == 0

    def test_register_agent_type(self, swarm):
        swarm.register_agent_type(AgentCategory.GENESIS_CREATOR, GenesisCreatorAgent)
        assert AgentCategory.GENESIS_CREATOR in swarm.agent_types

    @pytest.mark.asyncio
    async def test_spawn_agent(self, swarm, genesis_config):
        swarm.register_agent_type(AgentCategory.GENESIS_CREATOR, GenesisCreatorAgent)
        agent_id = await swarm.spawn_agent(genesis_config)
        assert agent_id in swarm.agents
        assert len(swarm.agents) == 1

    @pytest.mark.asyncio
    async def test_max_agents_limit(self, genesis_config):
        swarm = SwarmOrchestrator(max_agents=1)
        swarm.register_agent_type(AgentCategory.GENESIS_CREATOR, GenesisCreatorAgent)
        await swarm.spawn_agent(genesis_config)
        with pytest.raises(RuntimeError):
            await swarm.spawn_agent(genesis_config)

    def test_swarm_stats(self, swarm):
        stats = swarm.get_swarm_stats()
        assert stats["total_agents"] == 0
        assert stats["max_agents"] == 10
