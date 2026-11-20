"use client";
import { Fragment } from "react";
import data from "@/data/phase18-benchmark.json";

type Row = { accuracy: number; meanCost: number; accuracyMin: number; accuracyMax: number };
const LABELS: Record<string, string> = {
  adaptive: "Adaptive router (UCB + audits)",
  always_index: "Always exact index",
  always_stale: "Always stale snapshot",
  random: "Random routing",
  always_sample10: "Always 10% sample",
};

export default function AgentBenchmarkLab() {
  const summary = data.summary as Record<string, Row>;
  const rows = Object.entries(summary).sort((a, b) => b[1].accuracy - a[1].accuracy);
  const policy = (data as any)["learnedPolicy(seed1)"] as Record<string, Record<string, number>>;
  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-300 via-sky-300 to-white bg-clip-text text-transparent">
          Agent Benchmark Lab
        </h1>
        <p className="text-white/50 text-sm mt-1">
          Phase 18 · measured results from a reproducible benchmark (not a live feed). Solvers are deterministic code, not LLMs.
        </p>
        <p className="text-white/30 text-xs mt-1 font-mono">
          {data.setup.seeds.length} seeds · {data.setup.trainTasks} train / {data.setup.testTasks} test tasks · audit rate {data.setup.auditRate}
        </p>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5">
        <div className="grid grid-cols-12 text-xs text-white/40 uppercase tracking-wider pb-2 border-b border-white/10">
          <div className="col-span-5">Policy</div><div className="col-span-4">Accuracy (mean, min–max)</div><div className="col-span-3 text-right">Mean cost</div>
        </div>
        {rows.map(([k, r]) => (
          <div key={k} className="grid grid-cols-12 items-center py-2.5 border-b border-white/5 text-sm">
            <div className={`col-span-5 ${k === "adaptive" ? "text-emerald-300 font-bold" : "text-white/70"}`}>{LABELS[k] ?? k}</div>
            <div className="col-span-4">
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-sky-400" style={{ width: `${r.accuracy * 100}%` }} />
              </div>
              <span className="font-mono text-xs text-white/60">
                {(r.accuracy * 100).toFixed(1)}% ({(r.accuracyMin * 100).toFixed(0)}–{(r.accuracyMax * 100).toFixed(0)})
              </span>
            </div>
            <div className="col-span-3 text-right font-mono text-white/70">{r.meanCost.toFixed(3)}</div>
          </div>
        ))}
        <p className="text-white/40 text-xs mt-3">
          Cost units: exact index = 1.0, 10% sample = 0.1, stale snapshot = 0.05. The adaptive router keeps ~97% accuracy at about half the cost of
          always using the exact index; a stale snapshot is cheaper still but less accurate.
        </p>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-white/10 p-5">
        <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-3">Learned policy (seed 1, mean reward per solver)</div>
        <div className="grid grid-cols-4 gap-2 text-xs font-mono">
          <div className="text-white/30">task</div>
          {Object.keys(Object.values(policy)[0]).map((s) => <div key={s} className="text-white/50">{s}</div>)}
          {Object.entries(policy).map(([task, vals]) => (
            <Fragment key={task}>
              <div className="text-white/70">{task}</div>
              {Object.entries(vals).map(([s, v]) => <div key={task + s} className={v === Math.max(...Object.values(vals)) ? "text-emerald-300" : "text-white/40"}>{v.toFixed(3)}</div>)}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
