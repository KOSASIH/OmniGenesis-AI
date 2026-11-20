"""Phase 18 agent orchestration with audited self-evaluation.

A `Router` picks a solver per task type with UCB1 over
reward = correct - COST_WEIGHT * cost. Feedback comes only from *audits*:
on a fraction of tasks the answer is compared with the exact solver, so the
router never sees ground truth it would not have in production.

Solvers are plain deterministic Python (no LLM). "Smarter" here means a
measurable improvement in accuracy-per-cost on this task suite, nothing more.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import Callable, Protocol

from .chain_indexer import ChainEntry, ChainIndex

COST_WEIGHT = 0.05
TASK_TYPES = ("count_category", "lookup_tps", "top_tps_id")


@dataclass(frozen=True)
class Task:
    kind: str
    category: str | None = None
    chain_id: int | None = None
    min_dimensions: int | None = None


class Solver(Protocol):
    name: str
    cost: float

    def solve(self, task: Task) -> int: ...


class IndexSolver:
    """Exact, uses the in-memory index."""
    name, cost = "index", 1.0

    def __init__(self, entries: list[ChainEntry]):
        self.index = ChainIndex(entries)

    def solve(self, task: Task) -> int:
        if task.kind == "count_category":
            return sum(1 for e in self.index.by_category[task.category] if e.dimensions >= (task.min_dimensions or 0))
        if task.kind == "lookup_tps":
            return self.index.get(task.chain_id).targetTps
        if task.kind == "top_tps_id":
            return self.index.top_tps(1, task.category)[0].chainId
        raise ValueError(task.kind)


class SampleSolver:
    """Cheap estimator over a fixed 10% sample; exact only by luck for point queries."""
    name, cost = "sample10", 0.1

    def __init__(self, entries: list[ChainEntry], seed: int = 7):
        rng = random.Random(seed)
        self.sample = rng.sample(entries, max(1, len(entries) // 10))
        self.scale = len(entries) / len(self.sample)

    def solve(self, task: Task) -> int:
        if task.kind == "count_category":
            hits = sum(1 for e in self.sample if e.category == task.category and e.dimensions >= (task.min_dimensions or 0))
            return round(hits * self.scale)
        if task.kind == "lookup_tps":
            near = min(self.sample, key=lambda e: abs(e.chainId - task.chain_id))
            return near.targetTps
        if task.kind == "top_tps_id":
            pool = [e for e in self.sample if e.category == task.category] or self.sample
            return max(pool, key=lambda e: (e.targetTps, -e.chainId)).chainId
        raise ValueError(task.kind)


class StaleSolver:
    """Answers from a stale snapshot (every 7th chain is missing): cheapest, often wrong."""
    name, cost = "stale_snapshot", 0.05

    def __init__(self, entries: list[ChainEntry]):
        self.entries = [e for e in entries if e.chainId % 7 != 0]
        self.inner = IndexSolver(self.entries)

    def solve(self, task: Task) -> int:
        if task.kind == "lookup_tps":
            e = self.inner.index.by_id.get(task.chain_id)
            return e.targetTps if e else 0
        return self.inner.solve(task)


def is_correct(task: Task, answer: int, truth: int) -> bool:
    if task.kind == "count_category":
        return abs(answer - truth) <= max(3, 0.15 * truth)  # estimates allowed within 15% / +-3
    return answer == truth


@dataclass
class Stat:
    n: int = 0
    total: float = 0.0

    @property
    def mean(self) -> float:
        return self.total / self.n if self.n else 0.0


@dataclass
class Router:
    solvers: dict[str, Solver]
    exact: str = "index"
    audit_rate: float = 0.25
    seed: int = 1
    stats: dict[tuple[str, str], Stat] = field(default_factory=dict)
    audits: int = 0
    audit_cost: float = 0.0

    def __post_init__(self) -> None:
        self.rng = random.Random(self.seed)

    def _ucb(self, kind: str, name: str, t: int) -> float:
        s = self.stats.get((kind, name), Stat())
        if s.n == 0:
            return math.inf
        return s.mean + math.sqrt(2 * math.log(max(t, 2)) / s.n)

    def choose(self, kind: str, explore: bool) -> str:
        names = list(self.solvers)
        if explore:
            t = sum(self.stats.get((kind, n), Stat()).n for n in names) + 1
            return max(names, key=lambda n: self._ucb(kind, n, t))
        return max(names, key=lambda n: (self.stats.get((kind, n), Stat()).mean, -self.solvers[n].cost))

    def run(self, task: Task, explore: bool = True) -> tuple[str, int]:
        name = self.choose(task.kind, explore)
        answer = self.solvers[name].solve(task)
        if explore and self.rng.random() < self.audit_rate:
            ref = self.solvers[self.exact].solve(task)
            self.audits += 1
            self.audit_cost += self.solvers[self.exact].cost
            reward = float(is_correct(task, answer, ref)) - COST_WEIGHT * self.solvers[name].cost
            s = self.stats.setdefault((task.kind, name), Stat())
            s.n += 1
            s.total += reward
        return name, answer

    def policy_table(self) -> dict[str, dict[str, float]]:
        return {k: {n: round(self.stats.get((k, n), Stat()).mean, 3) for n in self.solvers} for k in TASK_TYPES}


def make_tasks(entries: list[ChainEntry], n: int, seed: int) -> list[Task]:
    rng = random.Random(seed)
    cats = sorted({e.category for e in entries})
    ids = [e.chainId for e in entries]
    out: list[Task] = []
    for _ in range(n):
        kind = rng.choice(TASK_TYPES)
        if kind == "count_category":
            out.append(Task(kind, category=rng.choice(cats), min_dimensions=rng.choice([12, 13, 14, 15])))
        elif kind == "lookup_tps":
            out.append(Task(kind, chain_id=rng.choice(ids)))
        else:
            out.append(Task(kind, category=rng.choice(cats)))
    return out


def brute_force_truth(entries: list[ChainEntry], task: Task) -> int:
    """Independent reference used only by the benchmark (plain loops, no index)."""
    if task.kind == "count_category":
        return sum(1 for e in entries if e.category == task.category and e.dimensions >= task.min_dimensions)
    if task.kind == "lookup_tps":
        return next(e.targetTps for e in entries if e.chainId == task.chain_id)
    pool = [e for e in entries if e.category == task.category]
    best = pool[0]
    for e in pool[1:]:
        if e.targetTps > best.targetTps or (e.targetTps == best.targetTps and e.chainId < best.chainId):
            best = e
    return best.chainId
