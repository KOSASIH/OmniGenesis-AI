"use client";

const CONTRACTS = [
  { name: "CosmicSovereigntyToken", tests: 6, fixed: "unstake() zeroed the stake before transferring (principal lost); yield formula could divide by zero; on-chain pseudo-random intervention outcome" },
  { name: "DivineRealityProtocol", tests: 5, fixed: "advanceState bypassed Omega thresholds; any architect could merge others' realities; duplicate Math library did not compile" },
  { name: "NeuromorphicConsensus", tests: 7, fixed: "consensus was unreachable (only the caller was ever FIRING); non-members could fire columns" },
  { name: "OmegaPointDAO", tests: 6, fixed: "voters declared their own weight; proposals could never finalize; consciousness boost was self-declared" },
  { name: "PhotonicComputeOracle", tests: 4, fixed: "'verified' compared nanoseconds with m/s; now an explicit attestation flag only" },
  { name: "UniversalCausalDAG", tests: 4, fixed: "accepted cycles despite the name; now rejects cycles with a bounded DFS" },
];

export default function ContractAssuranceBoard() {
  const total = CONTRACTS.reduce((a, c) => a + c.tests, 0);
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-lime-300 via-white to-emerald-300 bg-clip-text text-transparent">Contract Assurance Board</h1>
        <p className="text-white/50 text-sm mt-1">
          Phase 18 · Hardhat suite for the six Phase 17 contracts: {total} tests, run locally on Hardhat (not audited, not deployed to any chain).
        </p>
      </div>
      <div className="space-y-3">
        {CONTRACTS.map((c) => (
          <div key={c.name} className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
            <div className="flex justify-between"><span className="font-bold text-lime-200">{c.name}</span><span className="font-mono text-xs text-white/50">{c.tests} tests</span></div>
            <p className="text-white/50 text-xs mt-1.5"><span className="text-white/70">Defects fixed:</span> {c.fixed}</p>
          </div>
        ))}
      </div>
      <p className="text-white/30 text-xs">Run: <code>npx hardhat --config hardhat.phase17.config.js test</code></p>
    </div>
  );
}
