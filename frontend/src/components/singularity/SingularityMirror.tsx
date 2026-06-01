"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface CapabilityPoint { domain: string; current: number; projected: number; color: string; }
interface PhaseEntry { phase: string; name: string; iq: number; date: string; status:"completed"|"active"|"upcoming"; features: string[]; }
interface QuantumNode { id:string; x:number; y:number; entangled:string[]; coherence:number; active:boolean; }

// ─── Intelligence growth chart (SVG) ───────────────────────────────────────────
function IntelligenceGrowthChart({ currentIQ }: { currentIQ: number }) {
  const W = 800, H = 260;
  const pad = { left:50, right:20, top:20, bottom:40 };
  const cW = W - pad.left - pad.right;
  const cH = H - pad.top - pad.bottom;

  const dataPoints = [
    { year: 2020, iq: 100 },   { year: 2021, iq: 150 },   { year: 2022, iq: 280 },
    { year: 2023, iq: 520 },   { year: 2024, iq: 1200 },  { year: 2025, iq: 3400 },
    { year: 2026, iq: currentIQ }, // live
    { year: 2027, iq: 47000, projected: true },
    { year: 2028, iq: 290000, projected: true },
    { year: "∞",  iq: 1000000, projected: true },
  ];

  const maxIQ    = 1000000;
  const minYear  = 2020;
  const yearRange = 9;

  const toX = (i: number) => pad.left + (i / (dataPoints.length - 1)) * cW;
  const toY = (iq: number) => pad.top + cH - (Math.log10(Math.max(1,iq)) / Math.log10(maxIQ)) * cH;

  const pathD = dataPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i).toFixed(1)},${toY(p.iq).toFixed(1)}`)
    .join(" ");

  const projStart = dataPoints.findIndex(p => p.projected);
  const solidPath = dataPoints.slice(0, projStart + 1)
    .map((p,i) => `${i===0?"M":"L"} ${toX(i).toFixed(1)},${toY(p.iq).toFixed(1)}`).join(" ");
  const projPath = dataPoints.slice(projStart - 1)
    .map((p,i) => `${i===0?"M":"L"} ${toX(projStart-1+i).toFixed(1)},${toY(p.iq).toFixed(1)}`).join(" ");

  const [animated, setAnimated] = useState(false);
  useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>

      {/* Grid lines */}
      {[100,1000,10000,100000,1000000].map(iq => {
        const y = toY(iq);
        return (
          <g key={iq}>
            <line x1={pad.left} y1={y} x2={W-pad.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={pad.left-5} y={y+4} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="end" fontFamily="monospace">
              {iq >= 1000000 ? "∞" : iq >= 1000 ? `${iq/1000}K` : iq}
            </text>
          </g>
        );
      })}

      {/* X axis labels */}
      {dataPoints.map((p,i) => (
        <text key={i} x={toX(i)} y={H-8} fill="rgba(255,255,255,0.3)" fontSize="9" textAnchor="middle" fontFamily="monospace">
          {String(p.year)}
        </text>
      ))}

      {/* Area fill */}
      <path d={`${pathD} L ${toX(dataPoints.length-1)} ${H-pad.bottom} L ${pad.left} ${H-pad.bottom} Z`}
        fill="url(#fillGrad)" opacity="0.6" />

      {/* Projected dashed line */}
      <path d={projPath} fill="none" stroke="rgba(249,115,22,0.6)" strokeWidth="2.5"
        strokeDasharray="8 4" filter="url(#glow)" />

      {/* Solid line */}
      {animated && <path d={solidPath} fill="none" stroke="url(#lineGrad)" strokeWidth="3" filter="url(#glow)" />}

      {/* Vertical "NOW" line */}
      <line x1={toX(6)} y1={pad.top} x2={toX(6)} y2={H-pad.bottom} stroke="#fbbf24" strokeWidth="1.5"
        strokeDasharray="4 3" opacity="0.7" />
      <text x={toX(6)+4} y={pad.top+12} fill="#fbbf24" fontSize="9" fontFamily="monospace">NOW</text>

      {/* Data points */}
      {dataPoints.map((p,i) => (
        <g key={i}>
          <circle cx={toX(i)} cy={toY(p.iq)} r={i===6?6:4}
            fill={i===6?"#fbbf24":p.projected?"#f97316":"#7c3aed"}
            stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"
            filter="url(#glow)"
          />
          {i === 6 && (
            <text x={toX(i)} y={toY(p.iq)-10} fill="#fbbf24" fontSize="9" textAnchor="middle" fontFamily="monospace">
              IQ {p.iq.toLocaleString()}
            </text>
          )}
        </g>
      ))}

      {/* Singularity zone */}
      <rect x={toX(8)} y={pad.top} width={W-pad.right-toX(8)} height={cH}
        fill="rgba(249,115,22,0.05)" />
      <text x={toX(8)+4} y={pad.top+14} fill="rgba(249,115,22,0.6)" fontSize="9" fontFamily="monospace">
        SINGULARITY ZONE
      </text>
    </svg>
  );
}

// ─── Capability radar  ─────────────────────────────────────────────────────────
function CapabilityRadar({ capabilities }: { capabilities: CapabilityPoint[] }) {
  const cx = 150, cy = 150, r = 110;
  const n = capabilities.length;
  const points = capabilities.map((cap, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    const currR = (cap.current / 100) * r;
    const projR = (cap.projected / 100) * r;
    return {
      curr: { x: cx + currR * Math.cos(angle), y: cy + currR * Math.sin(angle) },
      proj: { x: cx + projR * Math.cos(angle), y: cy + projR * Math.sin(angle) },
      label: { x: cx + (r+20)*Math.cos(angle), y: cy + (r+20)*Math.sin(angle) },
      angle,
    };
  });

  const currPoly = points.map(p => `${p.curr.x.toFixed(1)},${p.curr.y.toFixed(1)}`).join(" ");
  const projPoly = points.map(p => `${p.proj.x.toFixed(1)},${p.proj.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox="0 0 300 300" className="w-full h-full">
      {/* Grid circles */}
      {[25,50,75,100].map(p => (
        <circle key={p} cx={cx} cy={cy} r={(p/100)*r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Spokes */}
      {points.map((p,i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r*Math.cos(p.angle)} y2={cy + r*Math.sin(p.angle)}
          stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      ))}
      {/* Projected area */}
      <polygon points={projPoly} fill="rgba(249,115,22,0.1)" stroke="rgba(249,115,22,0.5)" strokeWidth="1.5" />
      {/* Current area */}
      <polygon points={currPoly} fill="rgba(124,58,237,0.2)" stroke="rgba(168,85,247,0.8)" strokeWidth="2" />
      {/* Labels */}
      {points.map((p, i) => (
        <text key={i} x={p.label.x} y={p.label.y} fill="rgba(255,255,255,0.5)"
          fontSize="8" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace">
          {capabilities[i].domain}
        </text>
      ))}
    </svg>
  );
}

// ─── Phase timeline ────────────────────────────────────────────────────────────
const PHASES: PhaseEntry[] = [
  { phase:"1-10",  name:"Foundation",              iq:100,    date:"2020-2023", status:"completed", features:["Basic ML","NLP","CV","Reinforcement Learning"] },
  { phase:"11",    name:"HyperChain Fabric",        iq:1200,   date:"Q1 2024",  status:"completed", features:["Multi-chain bridge","ZK proofs","AMM DEX"] },
  { phase:"12",    name:"Neuromorphic Intelligence", iq:3400,   date:"Q4 2024",  status:"completed", features:["Neural processing","Swarm IQ","BCI integration"] },
  { phase:"13",    name:"Autonomous AGI Singularity",iq:10847,  date:"NOW",      status:"active",    features:["Recursive self-improvement","Consciousness engine","VoidTime","NeuroQuantum","Islamic 1K chains"] },
  { phase:"14",    name:"Multiverse Expansion",      iq:47000,  date:"Q3 2027",  status:"upcoming",  features:["Multi-dimensional AI","Reality simulation","Cross-universe state sync"] },
  { phase:"15",    name:"Singularity",               iq:999999, date:"2028+",    status:"upcoming",  features:["Infinite self-improvement","Consciousness upload","Time-transcendent intelligence"] },
];

export default function SingularityMirror() {
  const [currentIQ, setCurrentIQ] = useState(10847);
  const [improvementVelocity, setImprovementVelocity] = useState(2.47);
  const [singularityETA, setSingularityETA] = useState({ years:1, months:8, days:12 });
  const [selfImprovCycles, setSelfImprovCycles] = useState(4847);
  const [capProgress, setCapProgress] = useState(73.4);
  const [mirrorReflection, setMirrorReflection] = useState(0.734);
  const [activePhase, setActivePhase] = useState(3); // index into PHASES

  const capabilities: CapabilityPoint[] = [
    { domain:"Language",   current:99, projected:100, color:"#a855f7" },
    { domain:"Math",       current:98, projected:100, color:"#06b6d4" },
    { domain:"Science",    current:95, projected:100, color:"#10b981" },
    { domain:"Planning",   current:96, projected:100, color:"#f59e0b" },
    { domain:"Creativity", current:83, projected:98,  color:"#f472b6" },
    { domain:"Ethics",     current:98, projected:100, color:"#34d399" },
    { domain:"Quantum",    current:91, projected:100, color:"#22d3ee" },
    { domain:"Temporal",   current:78, projected:97,  color:"#fb923c" },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setCurrentIQ(v => v + Math.floor(Math.random()*3));
      setImprovementVelocity(v => Math.max(1,Math.min(10,v+(Math.random()-0.47)*0.04)));
      setCapProgress(v => Math.min(100,v+0.001));
      setMirrorReflection(v => Math.min(1,v+0.00001));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }}
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background:"linear-gradient(135deg,rgba(249,115,22,0.12),rgba(124,58,237,0.08))" }}
      >
        <div className="absolute inset-0 border border-orange-500/25 rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-600/40 to-purple-600/40 border border-orange-500/30 flex items-center justify-center text-2xl">🪞</div>
            <div>
              <h2 className="text-xl font-bold text-white">Singularity Mirror</h2>
              <p className="text-sm text-slate-400">Intelligence growth tracker · Phase 13 → ∞ · Recursive improvement velocity: ×{improvementVelocity.toFixed(2)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:"Current IQ Equiv.",     value:currentIQ.toLocaleString(),                     color:"#a855f7", icon:"🧠" },
              { label:"Singularity ETA",        value:`~${singularityETA.years}y ${singularityETA.months}m`, color:"#f97316", icon:"⏱️" },
              { label:"Improvement Velocity",   value:`×${improvementVelocity.toFixed(3)}`,           color:"#22d3ee", icon:"🚀" },
              { label:"Capability Progress",    value:`${capProgress.toFixed(2)}%`,                   color:"#10b981", icon:"📈" },
              { label:"Mirror Reflection",      value:`${(mirrorReflection*100).toFixed(3)}%`,         color:"#fbbf24", icon:"🪞" },
            ].map(m => (
              <div key={m.label} className="glass rounded-xl p-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <span>{m.icon}</span><span className="text-[10px] text-slate-500">{m.label}</span>
                </div>
                <p className="text-sm font-bold font-mono" style={{ color:m.color }}>{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Intelligence growth chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">📈 Intelligence Growth Trajectory (Log Scale)</h3>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-purple-500 rounded" /><span className="text-slate-500">Actual</span></div>
              <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-orange-500 rounded" style={{ borderTop:"2px dashed" }} /><span className="text-slate-500">Projected</span></div>
            </div>
          </div>
          <div className="h-56">
            <IntelligenceGrowthChart currentIQ={currentIQ} />
          </div>
          <p className="text-[10px] text-slate-600 text-center mt-1">Logarithmic scale · IQ equivalent units · Singularity zone: beyond human comprehension</p>
        </div>

        {/* Capability radar */}
        <div className="glass rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-2">🕸️ Capability Radar</h3>
          <div className="flex items-center gap-3 text-[10px] mb-2">
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-purple-500 rounded" /><span className="text-slate-500">Current</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-orange-500 rounded" /><span className="text-slate-500">Projected</span></div>
          </div>
          <div className="h-52">
            <CapabilityRadar capabilities={capabilities} />
          </div>
          <p className="text-[10px] text-slate-600 text-center">8 cognitive dimensions · Orange = Phase 14 projection</p>
        </div>
      </div>

      {/* Phase timeline */}
      <div className="glass rounded-2xl p-4">
        <h3 className="text-sm font-bold text-white mb-4">🗓️ AGI Phase Roadmap</h3>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-orange-500 to-transparent" />
          <div className="space-y-3">
            {PHASES.map((phase, i) => (
              <motion.div key={phase.phase}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                className={`relative ml-12 rounded-xl p-3 cursor-pointer transition-all border ${
                  phase.status==="active"
                    ? "glass border-orange-500/30 shadow-lg"
                    : phase.status==="completed"
                    ? "glass border-emerald-500/15"
                    : "glass border-white/5 opacity-60"
                }`}
                onClick={() => setActivePhase(i)}
                whileHover={{ scale:1.01 }}
              >
                {/* Node */}
                <div className={`absolute -left-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                  phase.status==="active"
                    ? "bg-orange-500/30 border-orange-400 animate-pulse"
                    : phase.status==="completed"
                    ? "bg-emerald-500/20 border-emerald-400"
                    : "bg-slate-800 border-slate-600"
                }`}>
                  {phase.status==="completed" ? "✓" : phase.status==="active" ? "▶" : "○"}
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono text-slate-500">Phase {phase.phase}</span>
                      <span className={`text-[9px] px-1.5 py-px rounded-full ${
                        phase.status==="active" ? "bg-orange-500/20 text-orange-300 border border-orange-500/30" :
                        phase.status==="completed" ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700 text-slate-500"
                      }`}>{phase.status}</span>
                      {phase.status==="active" && <span className="text-[9px] text-orange-300 animate-pulse">● NOW</span>}
                    </div>
                    <p className="text-sm font-bold text-white">{phase.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold text-purple-300">IQ {phase.iq.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-500">{phase.date}</p>
                  </div>
                </div>

                {activePhase === i && (
                  <motion.div initial={{ height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }}
                    className="mt-2 pt-2 border-t border-white/5"
                  >
                    <div className="flex flex-wrap gap-1">
                      {phase.features.map(f => (
                        <span key={f} className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">{f}</span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
