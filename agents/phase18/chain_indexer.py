"""Phase 18 chain-registry indexer.

Generates, validates and indexes the Phase 17 chain *registry entries*
(IDs 12001-13000). These are configuration records, NOT deployed networks.

CLI:
    python -m agents.phase18.chain_indexer generate   # (re)write data/chains/phase17/*.json + manifest
    python -m agents.phase18.chain_indexer verify     # validate files against manifest, print summary
"""
from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Iterable

from pydantic import BaseModel, Field, ValidationError, field_validator

ROOT = Path(__file__).resolve().parents[2]
CHAIN_DIR = ROOT / "data" / "chains" / "phase17"
FIRST_ID, LAST_ID, CHUNK = 12001, 13000, 100

CATEGORIES = {
    "CosmicSovereignty": ["Apex", "Crown", "Sovereign", "Realm", "Dominion", "Throne", "Empire", "Dynasty", "Kingdom", "Imperium"],
    "DivineReality": ["Genesis", "Creation", "Architect", "Weaver", "Sculptor", "Dreamer", "Builder", "Shaper", "Forger", "Crafter"],
    "Neuromorphic": ["Synapse", "Dendrite", "Cortex", "Myelin", "Axon", "Neuron", "Glia", "Astro", "Plasticity", "Engram"],
    "Photonic": ["Photon", "Lumens", "Optica", "Spectra", "Prism", "Refract", "Radiance", "Luminary", "Aureole", "Lambent"],
    "CausalAI": ["Cause", "Effect", "Nexus", "Chain", "Origin", "Root", "Prime", "Seed", "Source", "Wellspring"],
    "TemporalSovereignty": ["Chrono", "Aion", "Tempo", "Epoch", "Kairos", "Eon", "Cycle", "Flux", "Tide", "Current"],
    "OmegaPoint": ["Omega", "Telos", "Final", "Apex", "Zenith", "Culmination", "Terminus", "Threshold", "Horizon", "Asymptote"],
    "QuantumNeural": ["Qubit", "Entangle", "Superpose", "Cohere", "Tunnel", "Anneal", "Hamilton", "Eigenvec", "Bloch", "Hilbert"],
    "DivineMind": ["Logos", "Nous", "Pneuma", "Sophia", "Gnosis", "Theoria", "Noesis", "Dianoia", "Episteme", "Phronesis"],
    "CosmicDAO": ["Council", "Senate", "Forum", "Assembly", "Conclave", "Synod", "Parliament", "Congress", "Tribunal", "Archon"],
}
CONSENSUS = ["CosmicPoS", "DivineRealityBFT", "NeuromorphicPoW", "PhotonicPoA", "CausalDAGPoS",
             "TemporalDPoS", "OmegaPointBFT", "QuantumNeuralPoS", "DivineConsciousnessPoA", "CosmicDAOPoS"]
TOKENS = ["$CSOV", "$DRLT", "$NRMPH", "$PHTN", "$CAUSAL", "$TEMP", "$OMGPT", "$QNRL", "$DMND", "$CDAO"]


class ChainEntry(BaseModel):
    chainId: int = Field(ge=FIRST_ID, le=LAST_ID)
    name: str = Field(min_length=3)
    shortName: str
    category: str
    phase: int = 17
    consensus: str
    nativeToken: str
    blockTimeSec: float = Field(gt=0)
    targetTps: int = Field(gt=0)
    dimensions: int = Field(ge=1, le=16)
    consciousnessPct: float = Field(ge=0, le=100)
    voidTimeFactor: int = Field(ge=1)
    syariahCompliant: bool
    status: str  # PLANNED | SEEDING - never "ACTIVE": nothing here is deployed
    deployed: bool = False
    note: str = "registry configuration entry; not a deployed network"

    @field_validator("category")
    @classmethod
    def _cat(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(f"unknown category {v}")
        return v

    @field_validator("status")
    @classmethod
    def _status(cls, v: str) -> str:
        if v not in {"PLANNED", "SEEDING"}:
            raise ValueError("status must be PLANNED or SEEDING")
        return v

    @field_validator("deployed")
    @classmethod
    def _deployed(cls, v: bool) -> bool:
        if v:
            raise ValueError("registry entries must not claim deployment")
        return v


def build_entries() -> list[dict]:
    out: list[dict] = []
    cid = FIRST_ID
    for cat_idx, (category, variants) in enumerate(CATEGORIES.items()):
        for i in range(100):
            out.append(ChainEntry(
                chainId=cid,
                name=f"OmniGenesis {category} {variants[i % 10]} Chain {i + 1}",
                shortName=f"OG-P17-{category[:3].upper()}-{i + 1:03d}",
                category=category,
                consensus=CONSENSUS[(i + cat_idx) % len(CONSENSUS)],
                nativeToken=TOKENS[cat_idx],
                blockTimeSec=round(0.1 + (i % 5) * 0.05, 2),
                targetTps=2000 + (i % 50) * 1247,
                dimensions=12 + (i % 5),
                consciousnessPct=round(95 + (i % 50) * 0.1, 2),
                voidTimeFactor=847 + (i % 50) * 100,
                syariahCompliant=True,
                status="SEEDING" if i % 5 == 0 else "PLANNED",
            ).model_dump())
            cid += 1
    return out


def _sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_chunks(directory: Path = CHAIN_DIR) -> dict:
    directory.mkdir(parents=True, exist_ok=True)
    entries = build_entries()
    files = []
    for n in range(0, len(entries), CHUNK):
        chunk = entries[n:n + CHUNK]
        p = directory / f"chains-{n // CHUNK:02d}.json"
        p.write_text(json.dumps(chunk, indent=1, ensure_ascii=True) + "\n")
        files.append({"file": p.name, "count": len(chunk), "firstId": chunk[0]["chainId"],
                      "lastId": chunk[-1]["chainId"], "sha256": _sha(p)})
    manifest = {"phase": 17, "total": len(entries), "firstId": FIRST_ID, "lastId": LAST_ID,
                "deployed": False, "files": files}
    (directory / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n")
    return manifest


def load_entries(directory: Path = CHAIN_DIR) -> list[ChainEntry]:
    entries: list[ChainEntry] = []
    for p in sorted(directory.glob("chains-*.json")):
        entries.extend(ChainEntry(**row) for row in json.loads(p.read_text()))
    return entries


def verify(directory: Path = CHAIN_DIR) -> dict:
    """Raises on any inconsistency; returns a summary."""
    manifest = json.loads((directory / "manifest.json").read_text())
    for f in manifest["files"]:
        p = directory / f["file"]
        if _sha(p) != f["sha256"]:
            raise ValueError(f"checksum mismatch: {f['file']}")
    entries = load_entries(directory)
    ids = [e.chainId for e in entries]
    if len(set(ids)) != len(ids):
        raise ValueError("duplicate chain ids")
    if sorted(ids) != list(range(manifest["firstId"], manifest["lastId"] + 1)):
        raise ValueError("chain ids are not a contiguous range")
    if len(entries) != manifest["total"]:
        raise ValueError("count mismatch with manifest")
    return summarize(entries)


def summarize(entries: Iterable[ChainEntry]) -> dict:
    entries = list(entries)
    return {
        "total": len(entries),
        "byCategory": dict(sorted(Counter(e.category for e in entries).items())),
        "byStatus": dict(sorted(Counter(e.status for e in entries).items())),
        "byConsensus": dict(sorted(Counter(e.consensus for e in entries).items())),
        "maxTargetTps": max(e.targetTps for e in entries),
        "meanTargetTps": round(sum(e.targetTps for e in entries) / len(entries), 1),
        "deployed": sum(e.deployed for e in entries),
    }


class ChainIndex:
    """In-memory index for O(1) id lookup and category queries."""

    def __init__(self, entries: Iterable[ChainEntry]):
        self.by_id = {e.chainId: e for e in entries}
        self.by_category: dict[str, list[ChainEntry]] = {}
        for e in self.by_id.values():
            self.by_category.setdefault(e.category, []).append(e)

    def get(self, chain_id: int) -> ChainEntry:
        return self.by_id[chain_id]

    def top_tps(self, n: int = 5, category: str | None = None) -> list[ChainEntry]:
        pool = self.by_category.get(category, []) if category else list(self.by_id.values())
        return sorted(pool, key=lambda e: (-e.targetTps, e.chainId))[:n]


def main(argv: list[str]) -> int:
    cmd = argv[1] if len(argv) > 1 else "verify"
    try:
        if cmd == "generate":
            write_chunks()
        print(json.dumps(verify(), indent=1))
        return 0
    except (ValueError, ValidationError, FileNotFoundError) as exc:
        print(f"FAILED: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
