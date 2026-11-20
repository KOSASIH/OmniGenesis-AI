import json
import shutil
from pathlib import Path

import pytest
from pydantic import ValidationError

from agents.phase18 import chain_indexer as ci
from agents.phase18 import solidity_lint as lint
from agents.phase18.orchestrator import (IndexSolver, Router, SampleSolver, StaleSolver,
                                         Task, brute_force_truth, is_correct, make_tasks)

ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="module")
def entries():
    return ci.load_entries()


# ---- indexer -------------------------------------------------------------
def test_registry_verifies_and_is_complete():
    s = ci.verify()
    assert s["total"] == 1000
    assert sum(s["byCategory"].values()) == 1000 and len(s["byCategory"]) == 10
    assert s["deployed"] == 0


def test_ids_contiguous(entries):
    assert sorted(e.chainId for e in entries) == list(range(12001, 13001))


def test_schema_rejects_deployment_claims(entries):
    row = entries[0].model_dump() | {"deployed": True}
    with pytest.raises(ValidationError):
        ci.ChainEntry(**row)
    with pytest.raises(ValidationError):
        ci.ChainEntry(**(entries[0].model_dump() | {"status": "ACTIVE"}))


def test_checksum_detects_tampering(tmp_path):
    d = tmp_path / "chains"
    shutil.copytree(ci.CHAIN_DIR, d)
    ci.verify(d)
    f = d / "chains-03.json"
    f.write_text(f.read_text().replace("OmniGenesis", "Omnigenesis", 1))
    with pytest.raises(ValueError, match="checksum"):
        ci.verify(d)


def test_index_lookup_and_top(entries):
    idx = ci.ChainIndex(entries)
    assert idx.get(12001).chainId == 12001
    top = idx.top_tps(3)
    assert [e.targetTps for e in top] == sorted((e.targetTps for e in top), reverse=True)
    assert all(e.category == "Photonic" for e in idx.top_tps(5, "Photonic"))


# ---- orchestrator ---------------------------------------------------------
def test_index_solver_matches_brute_force(entries):
    s = IndexSolver(entries)
    for t in make_tasks(entries, 200, seed=11):
        assert s.solve(t) == brute_force_truth(entries, t)


def test_tolerance_rules():
    assert is_correct(Task("count_category"), 10, 11)
    assert not is_correct(Task("count_category"), 50, 80)
    assert not is_correct(Task("lookup_tps"), 1, 2)


def test_router_learns_cheaper_policy_without_losing_much_accuracy(entries):
    solvers = {s.name: s for s in (IndexSolver(entries), SampleSolver(entries), StaleSolver(entries))}
    r = Router(solvers, seed=3)
    for t in make_tasks(entries, 300, seed=3):
        r.run(t, explore=True)
    assert r.audits > 20
    test = make_tasks(entries, 300, seed=99)
    correct = cost = 0
    for t in test:
        name = r.choose(t.kind, explore=False)
        correct += is_correct(t, solvers[name].solve(t), brute_force_truth(entries, t))
        cost += solvers[name].cost
    assert correct / len(test) >= 0.9
    assert cost / len(test) <= 0.8  # strictly cheaper than always using the exact index (1.0)


def test_exploit_mode_never_audits(entries):
    solvers = {"index": IndexSolver(entries)}
    r = Router(solvers, audit_rate=1.0)
    r.run(make_tasks(entries, 1, 1)[0], explore=False)
    assert r.audits == 0


# ---- solidity lint ----------------------------------------------------------
def test_lint_detects_known_defects():
    assert {f.rule for f in lint.lint_source("x", 'require(a, "dims 1\u201316");')} == {"SOL001"}
    bad = "bool s = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % 100 < 97;"
    assert {f.rule for f in lint.lint_source("x", bad)} == {"SOL002"}
    assert lint.lint_source("x", "require(x || true);")[0].rule == "SOL005"


def test_phase17_contracts_are_lint_clean():
    assert lint.lint_path(ROOT / "contracts" / "phase17") == []
