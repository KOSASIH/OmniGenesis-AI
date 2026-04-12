"""
OmniGenesis AI - Backend API Server
FastAPI application for managing agents, tokens, and ecosystem operations.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Any, Dict, List, Optional
from datetime import datetime

app = FastAPI(
    title="OmniGenesis AI API",
    description="Backend API for the OmniGenesis AI ecosystem",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ Models ============

class AgentResponse(BaseModel):
    id: str
    name: str
    category: str
    status: str
    task_count: int
    error_count: int
    uptime_seconds: float


class TokenMetrics(BaseModel):
    symbol: str
    total_supply: str
    circulating_supply: str
    holders: int
    price_usd: Optional[float] = None


class GovernanceProposal(BaseModel):
    title: str
    description: str
    targets: List[str]
    values: List[int]
    calldatas: List[str]


class SwarmStats(BaseModel):
    total_agents: int
    active_agents: int
    total_tasks_completed: int
    total_errors: int
    categories: Dict[str, int]


# ============ Agent Endpoints ============

@app.get("/api/agents", response_model=List[AgentResponse])
async def list_agents():
    """List all active agents in the swarm."""
    # In production: query from SwarmOrchestrator
    return [
        AgentResponse(
            id="agent-001",
            name="Genesis Alpha",
            category="genesis_creator",
            status="running",
            task_count=142,
            error_count=2,
            uptime_seconds=86400,
        )
    ]


@app.get("/api/agents/{agent_id}", response_model=AgentResponse)
async def get_agent(agent_id: str):
    """Get details for a specific agent."""
    return AgentResponse(
        id=agent_id,
        name="Genesis Alpha",
        category="genesis_creator",
        status="running",
        task_count=142,
        error_count=2,
        uptime_seconds=86400,
    )


@app.get("/api/swarm/stats", response_model=SwarmStats)
async def get_swarm_stats():
    """Get overall swarm statistics."""
    return SwarmStats(
        total_agents=10,
        active_agents=8,
        total_tasks_completed=1250,
        total_errors=15,
        categories={
            "genesis_creator": 3,
            "econ_architect": 2,
            "quantum_guardian": 2,
            "blockchain_assimilator": 3,
        },
    )


# ============ Token Endpoints ============

@app.get("/api/tokens/omni", response_model=TokenMetrics)
async def get_omni_metrics():
    """Get $OMNI token metrics."""
    return TokenMetrics(
        symbol="OMNI",
        total_supply="1000000000000",
        circulating_supply="50000000000",
        holders=0,
        price_usd=None,
    )


@app.get("/api/tokens/ogen", response_model=TokenMetrics)
async def get_ogen_metrics():
    """Get $OGEN stablecoin metrics."""
    return TokenMetrics(
        symbol="OGEN",
        total_supply="0",
        circulating_supply="0",
        holders=0,
        price_usd=1.0,
    )


# ============ Governance Endpoints ============

@app.post("/api/governance/propose")
async def create_proposal(proposal: GovernanceProposal):
    """Submit a new governance proposal."""
    return {
        "proposal_id": "prop-001",
        "status": "pending",
        "title": proposal.title,
        "created_at": datetime.utcnow().isoformat(),
    }


# ============ Bridge Endpoints ============

@app.get("/api/bridge/status")
async def get_bridge_status():
    """Get PiNexus OmniBridge status."""
    return {
        "status": "operational",
        "supported_chains": ["ethereum", "bsc", "polygon", "arbitrum", "base"],
        "total_bridged_value": "0",
        "daily_volume": "0",
        "pending_transfers": 0,
    }


# ============ Health ============

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}
