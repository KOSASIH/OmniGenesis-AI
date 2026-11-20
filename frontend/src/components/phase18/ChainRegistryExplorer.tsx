"use client";
import summary from "@/data/phase17-chain-summary.json";

export default function ChainRegistryExplorer() {
  const cats = Object.entries(summary.byCategory as Record<string, number>);
  const status = Object.entries(summary.byStatus as Record<string, number>);
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-yellow-300 via-white to-sky-300 bg-clip-text text-transparent">Chain Registry Explorer</h1>
        <p className="text-white/50 text-sm mt-1">
          Phase 18 · {summary.total.toLocaleString()} registry entries (IDs 12001–13000), checksum-verified. These are configuration records —{" "}
          <span className="text-yellow-300">{summary.deployed} are deployed networks</span>.
        </p>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[
          ["Entries", summary.total.toLocaleString()],
          ["Deployed", String(summary.deployed)],
          ["Max target TPS", summary.maxTargetTps.toLocaleString()],
          ["Mean target TPS", summary.meanTargetTps.toLocaleString()],
        ].map(([l, v]) => (
          <div key={l} className="bg-slate-900/60 rounded-xl border border-white/10 p-4">
            <div className="text-white/40 text-xs">{l}</div>
            <div className="font-mono text-xl font-bold text-yellow-200">{v}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5">
          <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">By category</div>
          {cats.map(([c, n]) => (
            <div key={c} className="flex items-center gap-3 py-1 text-sm">
              <span className="w-44 text-white/70">{c}</span>
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-yellow-400/70" style={{ width: `${(n / 100) * 100}%` }} /></div>
              <span className="font-mono text-xs text-white/50 w-8 text-right">{n}</span>
            </div>
          ))}
        </div>
        <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5">
          <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">By status</div>
          {status.map(([s, n]) => (
            <div key={s} className="flex justify-between py-1 text-sm"><span className="text-white/70">{s}</span><span className="font-mono text-white/60">{n}</span></div>
          ))}
          <p className="text-white/30 text-xs mt-3">PLANNED / SEEDING only. Validate locally with <code>python -m agents.phase18.chain_indexer verify</code>.</p>
        </div>
      </div>
    </div>
  );
}
