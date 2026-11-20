# Phase 18 — Measured Intelligence

Phase 18 replaces claims with things you can run. Nothing here is deployed to a live network, and no
"IQ" or "consciousness" figure in the dashboards is a measurement — those panels from earlier phases are
simulated visualizations.

## What was added

| Area | Files | How to verify |
|---|---|---|
| Contract fixes + tests | `contracts/phase17/*.sol`, `tests-phase17/*.test.js`, `hardhat.phase17.config.js` | `npm install --no-save hardhat@2 @nomicfoundation/hardhat-toolbox@4 @openzeppelin/contracts@4.9.6 && npx hardhat --config hardhat.phase17.config.js test` → 32 passing |
| Chain registry (1,000 entries, IDs 12001–13000) | `data/chains/phase17/chains-00..09.json`, `manifest.json` | `python -m agents.phase18.chain_indexer verify` |
| Registry indexer / validator | `agents/phase18/chain_indexer.py` | `pytest` |
| Agent orchestration + audited self-evaluation | `agents/phase18/orchestrator.py` | `pytest` |
| Reproducible benchmark | `agents/phase18/benchmark.py`, `docs/benchmarks/phase18-benchmark.json` | `python -m agents.phase18.benchmark` |
| Solidity anti-pattern linter | `agents/phase18/solidity_lint.py` | `python -m agents.phase18.solidity_lint contracts/phase17` |
| Dashboard | `AgentBenchmarkLab`, `ChainRegistryExplorer`, `ContractAssuranceBoard` panels | renders the JSON above |

## Contract defects found by compiling and testing the Phase 17 contracts

The contracts committed in Phase 17 **did not compile** (non-ASCII characters in string literals, a duplicate
`Math` identifier). After compiling, tests exposed logic defects, all fixed in this phase:

- `CosmicSovereigntyToken`: `unstake()` read the stake after `delete`, transferring 0 and losing principal; yield
  formula could divide by zero; intervention outcome used block data as randomness (now oracle-resolved).
- `DivineRealityProtocol`: `advanceState` skipped the Omega threshold checks; merges were not owner-restricted.
- `NeuromorphicConsensus`: consensus was unreachable; any neuron could fire any column.
- `OmegaPointDAO`: voters supplied their own weight; proposals could never be finalized.
- `PhotonicComputeOracle`: "verified" compared nanoseconds to metres/second.
- `UniversalCausalDAG`: accepted cycles.

Known limits: DAO voting has no snapshot (balance can be borrowed — use `ERC20Votes` before any real use);
none of this has had an external audit.

## Chain registry

The 1,000 entries are **configuration records** (`deployed: false`, status `PLANNED`/`SEEDING`). The schema
rejects `deployed: true` and `ACTIVE`. The earlier generator output labelled 800 of them "ACTIVE"; that was
inaccurate and has been replaced.

## Benchmark

Task: answer registry queries (category counts, TPS lookups, top-TPS chain). Three deterministic solvers with
different cost/accuracy (exact index, 10% sample, stale snapshot). A UCB1 router learns which solver to use per
task type, receiving feedback only from audits (comparison with the exact solver on 25% of training tasks).
Evaluation uses an independent brute-force reference over 5 seeds. See `docs/benchmarks/phase18-benchmark.json`.

Result summary (mean of 5 seeds): adaptive ≈97% accuracy at ≈0.50 cost vs. always-exact 100% at 1.0, random ≈68%,
always-stale ≈89% at 0.05. The router does not beat the exact solver on accuracy and a stale snapshot is cheaper;
the gain is a better accuracy/cost trade-off than random routing. This is a narrow, synthetic task suite — it is
not evidence of general intelligence, and "1000× smarter" is not a measurable claim.

## Next steps

Slither/Foundry fuzzing for the contracts; `ERC20Votes` snapshots in the DAO; swapping the stub solvers for real
LLM-backed agents behind the same `Solver` protocol so the router and audits measure them on real tasks.
