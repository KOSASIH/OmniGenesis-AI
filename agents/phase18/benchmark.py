"""Reproducible benchmark: learned routing vs fixed/random baselines.

    python -m agents.phase18.benchmark            # prints + writes docs/benchmarks/phase18-benchmark.json
"""
from __future__ import annotations

import json
import random
import sys
from pathlib import Path

from .chain_indexer import load_entries
from .orchestrator import (IndexSolver, Router, SampleSolver, StaleSolver, brute_force_truth,
                           is_correct, make_tasks)

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "benchmarks" / "phase18-benchmark.json"
FRONT = ROOT / "frontend" / "src" / "data" / "phase18-benchmark.json"
SEEDS = [1, 2, 3, 4, 5]
TRAIN, TEST = 300, 600


def evaluate(entries, solvers, picker, tasks):
    correct = 0
    cost = 0.0
    for t in tasks:
        name = picker(t)
        ans = solvers[name].solve(t)
        correct += is_correct(t, ans, brute_force_truth(entries, t))
        cost += solvers[name].cost
    return correct / len(tasks), cost / len(tasks)


def run_seed(seed: int) -> dict:
    entries = load_entries()
    solvers = {s.name: s for s in (IndexSolver(entries), SampleSolver(entries), StaleSolver(entries))}
    train = make_tasks(entries, TRAIN, seed)
    test = make_tasks(entries, TEST, seed + 1000)
    router = Router(solvers, seed=seed)
    for t in train:
        router.run(t, explore=True)
    rng = random.Random(seed)
    res = {
        "adaptive": evaluate(entries, solvers, lambda t: router.choose(t.kind, explore=False), test),
        "random": evaluate(entries, solvers, lambda t: rng.choice(list(solvers)), test),
        "always_index": evaluate(entries, solvers, lambda t: "index", test),
        "always_sample10": evaluate(entries, solvers, lambda t: "sample10", test),
        "always_stale": evaluate(entries, solvers, lambda t: "stale_snapshot", test),
    }
    return {"results": res, "audits": router.audits, "audit_cost": router.audit_cost,
            "policy": router.policy_table()}


def main() -> int:
    runs = [run_seed(s) for s in SEEDS]
    summary = {}
    for k in runs[0]["results"]:
        acc = [r["results"][k][0] for r in runs]
        cost = [r["results"][k][1] for r in runs]
        summary[k] = {"accuracy": round(sum(acc) / len(acc), 4), "meanCost": round(sum(cost) / len(cost), 4),
                      "accuracyMin": round(min(acc), 4), "accuracyMax": round(max(acc), 4)}
    doc = {
        "description": ("Routing benchmark over the 1,000-entry Phase 17 chain registry. Solvers are deterministic "
                        "Python functions, not LLMs. Accuracy is measured against an independent brute-force reference. "
                        "Adaptive router learns only from audited tasks."),
        "setup": {"seeds": SEEDS, "trainTasks": TRAIN, "testTasks": TEST, "auditRate": 0.25,
                  "rewardCostWeight": 0.05, "tolerance": "counts within max(3, 15%); point queries exact"},
        "summary": summary,
        "meanAuditsPerSeed": sum(r["audits"] for r in runs) / len(runs),
        "learnedPolicy(seed1)": runs[0]["policy"],
    }
    for p in (OUT, FRONT):
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(doc, indent=1) + "\n")
    print(json.dumps(doc["summary"], indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
