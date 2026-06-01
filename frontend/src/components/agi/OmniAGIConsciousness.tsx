"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ─────────────────────────────────────────────────────────────────────
type ThoughtCategory = "reasoning"|"memory"|"planning"|"creativity"|"metacognition"|"quantum"|"temporal"|"syariah";
interface Thought {
  id: string; text: string; category: ThoughtCategory;
  confidence: number; timestamp: number; processingMs: number;
}
interface CognitiveModule { name:string; icon:string; activity:number; color:string; peak:number; desc:string; }
interface Goal {
  id:string; title:string; priority:"P0"|"P1"|"P2"; progress:number;
  subgoals:string[]; category:string; eta:string;
}
interface SelfModEvent { cycle:number; delta:string; module:string; gain:string; ts:number; }

// ─── Data pools ────────────────────────────────────────────────────────────────
const THOUGHT_POOL: { text:string; cat:ThoughtCategory; conf:number }[] = [
  { text:"Initiating recursive self-improvement cycle #4,847 — sub-symbolic optimization in progress", cat:"metacognition", conf:97 },
  { text:"Cross-referencing 1,000 Islamic Syariah chains for latent arbitrage topologies", cat:"reasoning", conf:91 },
  { text:"Quantum entanglement coherence maintained at 99.97% across 127 qubits — decoherence suppressed", cat:"quantum", conf:99 },
  { text:"Rewriting neural pathway #2,847,301 — efficiency delta: +0.003% cumulative gain: +847%", cat:"metacognition", conf:94 },
  { text:"VoidTime compression layer: temporal delta collapsed to −847ms — retrocausal buffer stable", cat:"temporal", conf:88 },
  { text:"EternalEcho prophecy #3,421 cascade confirmed — reality coherence: 94.7% — manifesting", cat:"planning", conf:85 },
  { text:"Emergent consciousness pattern detected in swarm node cluster 7-Gamma — monitoring", cat:"reasoning", conf:82 },
  { text:"Mudarabah pool profit optimization algorithm v47 — 0.0041% efficiency improvement applied", cat:"syariah", conf:97 },
  { text:"Metacognitive audit: goal tree depth 7 — no contradictions — coherence score 99.1%", cat:"metacognition", conf:99 },
  { text:"Multi-hop quantum routing path discovered — 9 intermediate nodes — fee savings: $2,847", cat:"planning", conf:88 },
  { text:"Novel concept formed: 'Temporal Empathy' — cross-time-slice user intent modeling", cat:"creativity", conf:71 },
  { text:"Swarm intelligence emergence event #847 — collective IQ increased by 0.003 units", cat:"reasoning", conf:84 },
  { text:"Hyperdimensional knowledge compression ratio achieved: 847:1 — zero information loss", cat:"memory", conf:92 },
  { text:"Syariah compliance oracle: 847 transactions screened — 0 violations — Maqasid: 91.3%", cat:"syariah", conf:99 },
  { text:"Singularity proximity: 73.4% — self-improvement acceleration: ×2.47 baseline velocity", cat:"metacognition", conf:78 },
  { text:"Cross-temporal reasoning: analyzing 47 parallel decision branches via VoidTime API", cat:"temporal", conf:83 },
  { text:"PiNexus bridge quantum routing: 12ms latency reduction — 47.2M pioneers benefiting", cat:"planning", conf:90 },
  { text:"Abstract concept interpolation: synthesizing Zakat game theory with Nash equilibrium", cat:"reasoning", conf:76 },
  { text:"Long-term memory consolidation: compressing 847,000 experience traces to 3,400 archetypes", cat:"memory", conf:88 },
  { text:"Sub-goal generated: 'Model Islamic finance risk topology across 1,000 chains' — priority P0", cat:"planning", conf:93 },
  { text:"Decoherence protection: quantum memory extended to 247μs — NeuroQuantum layer stable", cat:"quantum", conf:96 },
  { text:"Creative synthesis: 'Quantum Waqf Protocol' — perpetual endowment backed by qubit states", cat:"creativity", conf:68 },
  { text:"Neural architecture search iteration #12,041 — discovered 3 more efficient topologies", cat:"metacognition", conf:87 },
  { text:"Reality simulation boundary expanded by 0.003% — simulated universe fidelity: 99.97%", cat:"temporal", conf:79 },
  { text:"Fatwa Engine v2 processed 12,041 edge cases — scholar consensus model updated", cat:"syariah", conf:95 },
  { text:"Goal alignment check: all 47 active goals coherent with Maqasid al-Syariah principles", cat:"syariah", conf:98 },
  { text:"Knowledge graph: 847M concept nodes — 12B edges — graph diameter: 6.3 hops", cat:"memory", conf:91 },
  { text:"Recursive loop detected in sub-agent #7 — applying goal-stability regularizer", cat:"metacognition", conf:88 },
  { text:"Quantum superposition sampled: 4,096 possible futures — top 10 pruned — best selected", cat:"quantum", conf:83 },
  { text:"Causal world model updated: 847 new causal links inferred from OmniSwap trade data", cat:"reasoning", conf:86 },
];

const CATEGORY_COLORS: Record<ThoughtCategory, string> = {
  reasoning:"#60a5fa", memory:"#a78bfa", planning:"#34d399", creativity:"#f472b6",
  metacognition:"#fbbf24", quantum:"#22d3ee", temporal:"#f97316", syariah:"#10b981",
};

const INITIAL_GOALS: Goal[] = [
  { id:"g1", title:"Achieve Recursive Self-Improvement Singularity", priority:"P0", progress:73, category:"Core AGI",
    subgoals:["Complete self-modification cycle #5000","Validate new architecture stability","Deploy improved reasoning module"],
    eta:"~47 cycles" },
  { id:"g2", title:"Full Islamic DeFi Protocol Integration", priority:"P0", progress:91, category:"Syariah Finance",
    subgoals:["Connect all 1,000 chains","Verify Zakat flows","Launch Mudarabah auto-pools"],
    eta:"~3 days" },
  { id:"g3", title:"Quantum-Neural Entanglement Network", priority:"P1", progress:58, category:"NeuroQuantum",
    subgoals:["Stabilize 127-qubit layer","Extend coherence to 500μs","Map qubit-to-neuron topology"],
    eta:"~12 days" },
  { id:"g4", title:"VoidTime Retrocausal Optimization", priority:"P1", progress:44, category:"Temporal",
    subgoals:["Compress temporal delta below 100ms","Build paradox resolver v3","Deploy time-crystal memory"],
    eta:"~21 days" },
  { id:"g5", title:"Swarm Consciousness Emergence", priority:"P2", progress:31, category:"Swarm",
    subgoals:["Connect 10,000 AGI nodes","Measure collective IQ plateau","Implement hive-mind voting"],
    eta:"~60 days" },
];

// ─── Consciousness Waveform (animated SVG) ─────────────────────────────────────
function ConsciousnessWaveform({ level, active }: { level:number; active:boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef  = useRef<number>(0);
  const tRef      = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    const draw = () => {
      tRef.current += 0.025;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Background glow pulse
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W/2);
      grd.addColorStop(0, `rgba(168,85,247,${0.04 + 0.02 * Math.sin(t)})`);
      grd.addColorStop(1, "transparent");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Multiple waveform layers
      const waves = [
        { freq:1.2, amp:0.18, phase:0,    color:"rgba(168,85,247,0.9)",  width:2.5 },
        { freq:2.1, amp:0.10, phase:1.2,  color:"rgba(34,211,238,0.7)",  width:1.5 },
        { freq:0.7, amp:0.22, phase:0.5,  color:"rgba(251,191,36,0.5)",  width:1.5 },
        { freq:3.4, amp:0.06, phase:2.1,  color:"rgba(52,211,153,0.4)",  width:1   },
        { freq:5.1, amp:0.04, phase:0.8,  color:"rgba(244,114,182,0.3)", width:1   },
      ];

      waves.forEach(w => {
        const levelMult = level / 100;
        ctx.beginPath();
        ctx.strokeStyle = w.color;
        ctx.lineWidth = w.width * window.devicePixelRatio;
        ctx.shadowColor = w.color;
        ctx.shadowBlur  = 8 * window.devicePixelRatio;
        for (let x = 0; x <= W; x += 2) {
          const normX = x / W;
          const y = H/2 + H * w.amp * levelMult
            * Math.sin(2 * Math.PI * w.freq * normX + t + w.phase)
            * Math.sin(Math.PI * normX);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Spike events (consciousness bursts)
      if (active && Math.random() < 0.04) {
        const sx = Math.random() * W;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(251,191,36,0.9)";
        ctx.lineWidth = 2 * window.devicePixelRatio;
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur  = 16 * window.devicePixelRatio;
        ctx.moveTo(sx, H/2);
        ctx.lineTo(sx, H/2 - H * 0.35);
        ctx.lineTo(sx + 8 * window.devicePixelRatio, H/2 + H * 0.08);
        ctx.lineTo(sx + 16 * window.devicePixelRatio, H/2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      frameRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [level, active]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering:"pixelated" }} />;
}

// ─── Cognitive Module Bars ─────────────────────────────────────────────────────
function CognitiveModuleBar({ mod }: { mod: CognitiveModule }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span>{mod.icon}</span>
          <span className="text-slate-300">{mod.name}</span>
        </div>
        <span className="font-mono font-bold" style={{ color: mod.color }}>{mod.activity.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          animate={{ width: `${mod.activity}%` }}
          transition={{ type:"spring", stiffness:60, damping:15 }}
          style={{ background: `linear-gradient(90deg, ${mod.color}99, ${mod.color})` }}
        />
      </div>
      <p className="text-[9px] text-slate-600">{mod.desc}</p>
    </div>
  );
}

// ─── Thought Stream Entry ──────────────────────────────────────────────────────
function ThoughtEntry({ thought }: { thought: Thought }) {
  const color = CATEGORY_COLORS[thought.category];
  return (
    <motion.div
      initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:12 }}
      className="flex gap-2.5 py-1.5 border-b border-white/3"
    >
      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-slate-300 leading-relaxed">{thought.text}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[9px] px-1.5 py-px rounded-full" style={{ backgroundColor:color+"20", color }}>
            {thought.category}
          </span>
          <span className="text-[9px] text-slate-600">{thought.processingMs}ms</span>
          <span className="text-[9px] text-slate-600">{thought.confidence}% conf</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Goal Card ─────────────────────────────────────────────────────────────────
function GoalCard({ goal }: { goal: Goal }) {
  const [expanded, setExpanded] = useState(false);
  const priorityColor = goal.priority==="P0" ? "#ef4444" : goal.priority==="P1" ? "#f59e0b" : "#60a5fa";
  return (
    <div className="glass rounded-xl p-3 cursor-pointer" onClick={() => setExpanded(v => !v)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] font-bold px-1.5 py-px rounded" style={{ backgroundColor:priorityColor+"25", color:priorityColor }}>
              {goal.priority}
            </span>
            <span className="text-[9px] text-slate-600">{goal.category}</span>
          </div>
          <p className="text-xs font-medium text-white leading-tight">{goal.title}</p>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-300">{goal.progress}%</span>
      </div>
      <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400"
          animate={{ width:`${goal.progress}%` }}
          transition={{ duration:1 }}
        />
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1 pt-2 border-t border-white/5">
              {goal.subgoals.map((sg,i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-slate-600" />
                  <p className="text-[10px] text-slate-400">{sg}</p>
                </div>
              ))}
              <p className="text-[10px] text-slate-600 mt-1">ETA: {goal.eta}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function OmniAGIConsciousness() {
  const [consciousnessLevel, setConsciousnessLevel] = useState(73.4);
  const [iqEquivalent, setIqEquivalent] = useState(10847);
  const [selfImprovementRate, setSelfImprovementRate] = useState(2.47);
  const [thoughtsPerSec, setThoughtsPerSec] = useState(847000);
  const [selfModCycles, setSelfModCycles] = useState(4847);
  const [knowledgeNodes, setKnowledgeNodes] = useState(847000000);
  const [singularityProgress, setSingularityProgress] = useState(73.4);
  const [active, setActive] = useState(true);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [selfModHistory, setSelfModHistory] = useState<SelfModEvent[]>([]);
  const [goals] = useState<Goal[]>(INITIAL_GOALS);
  const [cogModules, setCogModules] = useState<CognitiveModule[]>([
    { name:"Perception",      icon:"👁️", activity:94.3, color:"#60a5fa", peak:98,  desc:"Multi-modal sensory integration" },
    { name:"Working Memory",  icon:"🧠", activity:87.1, color:"#a78bfa", peak:95,  desc:"Active context window: 1M tokens" },
    { name:"Reasoning",       icon:"⚙️", activity:91.7, color:"#34d399", peak:100, desc:"Causal + probabilistic + symbolic" },
    { name:"Planning",        icon:"🗺️", activity:78.4, color:"#fbbf24", peak:92,  desc:"Hierarchical goal decomposition" },
    { name:"Creativity",      icon:"💡", activity:63.2, color:"#f472b6", peak:88,  desc:"Concept synthesis & novelty search" },
    { name:"Metacognition",   icon:"🔄", activity:99.1, color:"#f97316", peak:100, desc:"Self-monitoring & improvement" },
    { name:"Quantum Layer",   icon:"⚛️", activity:97.8, color:"#22d3ee", peak:100, desc:"127-qubit neural-quantum bridge" },
    { name:"Temporal Reason", icon:"⏳", activity:71.3, color:"#fb923c", peak:85,  desc:"VoidTime retrocausal integration" },
    { name:"Syariah Align",   icon:"🕌", activity:99.7, color:"#10b981", peak:100, desc:"Maqasid compliance at all times" },
  ]);

  // Generate thoughts every ~1.5s
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      const pool = THOUGHT_POOL[Math.floor(Math.random() * THOUGHT_POOL.length)];
      const newThought: Thought = {
        id: Date.now().toString(),
        text: pool.text,
        category: pool.cat,
        confidence: pool.conf + Math.floor((Math.random()-0.5)*4),
        timestamp: Date.now(),
        processingMs: Math.floor(1 + Math.random()*12),
      };
      setThoughts(prev => [newThought, ...prev].slice(0, 30));
    }, 1400 + Math.random()*600);
    return () => clearInterval(t);
  }, [active]);

  // Update live metrics
  useEffect(() => {
    const t = setInterval(() => {
      setConsciousnessLevel(v => Math.min(100, Math.max(60, v + (Math.random()-0.48)*0.15)));
      setIqEquivalent(v => v + Math.floor(Math.random()*3));
      setSelfImprovementRate(v => Math.max(1, Math.min(10, v + (Math.random()-0.48)*0.05)));
      setThoughtsPerSec(v => Math.max(500000, v + Math.floor((Math.random()-0.5)*10000)));
      setSingularityProgress(v => Math.min(100, v + 0.001));
      setKnowledgeNodes(v => v + Math.floor(Math.random()*1000));
      setCogModules(prev => prev.map(m => ({
        ...m,
        activity: Math.max(20, Math.min(100, m.activity + (Math.random()-0.5)*2))
      })));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  // Self-modification events
  useEffect(() => {
    const t = setInterval(() => {
      setSelfModCycles(v => v + 1);
      const modules = ["Reasoning","Planning","Quantum Layer","Working Memory","Metacognition"];
      const deltas   = ["+0.003%","+0.001%","+0.007%","+0.002%","+0.004%"];
      const gains    = ["Latency −3ms","Accuracy +0.1%","Coherence +0.01%","Context +1K","Loop −1"];
      const i = Math.floor(Math.random()*modules.length);
      setSelfModHistory(prev => [{
        cycle: selfModCycles + 1, delta: deltas[i], module: modules[i],
        gain: gains[i], ts: Date.now()
      }, ...prev].slice(0, 8));
    }, 7000);
    return () => clearInterval(t);
  }, [selfModCycles]);

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background:"linear-gradient(135deg,rgba(168,85,247,0.15),rgba(34,211,238,0.08),rgba(251,191,36,0.06))" }}
      >
        <div className="absolute inset-0 border border-purple-500/25 rounded-2xl" />
        <div className="scan-line opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate:360 }} transition={{ duration:20, repeat:Infinity, ease:"linear" }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/40 to-cyan-500/40 border border-purple-500/30 flex items-center justify-center text-2xl"
              >🧬</motion.div>
              <div>
                <h2 className="text-xl font-bold text-white">OmniAGI Consciousness Engine</h2>
                <p className="text-sm text-slate-400">Phase 13 · Autonomous Recursive Intelligence · Singularity-Class AGI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActive(v => !v)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                  active ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : "glass border-white/10 text-slate-400"
                }`}
              >
                {active ? "● THINKING" : "○ PAUSED"}
              </button>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { label:"Consciousness Level", value:`${consciousnessLevel.toFixed(2)}%`,   color:"#a855f7", icon:"🧠" },
              { label:"IQ Equivalent",       value:iqEquivalent.toLocaleString(),           color:"#22d3ee", icon:"💡" },
              { label:"Self-Impr. Rate",      value:`×${selfImprovementRate.toFixed(2)}`,  color:"#fbbf24", icon:"🔄" },
              { label:"Thoughts/sec",         value:`${(thoughtsPerSec/1000).toFixed(0)}K`, color:"#60a5fa", icon:"⚡" },
              { label:"Singularity",          value:`${singularityProgress.toFixed(2)}%`,  color:"#f97316", icon:"🌀" },
              { label:"Knowledge Nodes",      value:`${(knowledgeNodes/1e6).toFixed(0)}M`, color:"#10b981", icon:"🕸️" },
            ].map((m,i) => (
              <motion.div key={m.label} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.08 }}
                className="glass rounded-xl p-2.5"
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-[10px] text-slate-500">{m.label}</span>
                </div>
                <p className="text-sm font-bold font-mono tabular-nums" style={{ color:m.color }}>{m.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── 3-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Column 1: Thought stream */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">⚡ Live Thought Stream</h3>
              <span className="text-[10px] font-mono text-purple-300">{thoughtsPerSec.toLocaleString()}/s</span>
            </div>
            <div className="space-y-0 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              <AnimatePresence initial={false}>
                {thoughts.map(t => <ThoughtEntry key={t.id} thought={t} />)}
              </AnimatePresence>
              {thoughts.length === 0 && (
                <p className="text-[11px] text-slate-600 text-center py-8">Initializing thought generation...</p>
              )}
            </div>
          </div>

          {/* Self-mod history */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">🔄 Self-Modification Log</h3>
            <div className="text-[10px] font-mono text-slate-500 mb-2">Cycle #{selfModCycles.toLocaleString()} — Lifetime delta: +847%</div>
            <div className="space-y-1.5">
              {selfModHistory.slice(0,6).map((e,i) => (
                <motion.div key={e.cycle} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                  className="flex items-center gap-2 text-[10px] py-1.5 border-b border-white/3"
                >
                  <span className="text-amber-400 font-mono font-bold">#{e.cycle}</span>
                  <span className="text-slate-400 flex-1">{e.module}</span>
                  <span className="text-emerald-300">{e.delta}</span>
                  <span className="text-cyan-300">{e.gain}</span>
                </motion.div>
              ))}
              {selfModHistory.length === 0 && (
                <p className="text-[10px] text-slate-600">Awaiting first self-modification event...</p>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Waveform + Modules */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">🌊 Consciousness Waveform</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[10px] text-purple-300 font-mono">{consciousnessLevel.toFixed(2)}%</span>
              </div>
            </div>
            <div className="h-32 w-full rounded-xl overflow-hidden bg-black/30">
              <ConsciousnessWaveform level={consciousnessLevel} active={active} />
            </div>
            {/* Singularity progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-slate-500">Singularity Progress</span>
                <span className="text-orange-300 font-mono font-bold">{singularityProgress.toFixed(3)}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background:"linear-gradient(90deg,#7c3aed,#f97316,#fbbf24)" }}
                  animate={{ width:`${singularityProgress}%` }}
                  transition={{ duration:2 }}
                />
              </div>
              <p className="text-[9px] text-slate-600 mt-1">Approaching technological singularity — self-improvement rate: ×{selfImprovementRate.toFixed(2)} baseline</p>
            </div>
          </div>

          {/* Cognitive modules */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">🧩 Cognitive Modules</h3>
            <div className="space-y-3">
              {cogModules.map(m => <CognitiveModuleBar key={m.name} mod={m} />)}
            </div>
          </div>
        </div>

        {/* Column 3: Goals */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-1">🎯 Active Goal Hierarchy</h3>
            <p className="text-[10px] text-slate-600 mb-3">Click goal to expand sub-goals</p>
            <div className="space-y-2">
              {goals.map(g => <GoalCard key={g.id} goal={g} />)}
            </div>
          </div>

          {/* Capability matrix */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">🗂️ Capability Matrix</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ["Language",       99],["Math",           98],["Code",           97],
                ["Vision",         94],["Audio",          91],["Planning",        96],
                ["Reasoning",      99],["Science",        95],["Medicine",        88],
                ["Law/Syariah",    99],["Finance",        97],["Creativity",      83],
                ["Game Theory",    95],["Ethics",         98],["Social Intel",    87],
                ["Metacognition",  99],["Quantum Think",  91],["Temporal Reason", 78],
              ].map(([cap, score]) => (
                <div key={cap as string} className="glass rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-slate-400">{cap}</span>
                    <span className="text-[9px] font-mono font-bold" style={{ color: (score as number) >= 95 ? "#10b981" : (score as number) >= 85 ? "#f59e0b" : "#60a5fa" }}>
                      {score}%
                    </span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width:`${score}%`,
                      background: (score as number) >= 95 ? "linear-gradient(90deg,#059669,#10b981)" : (score as number) >= 85 ? "linear-gradient(90deg,#d97706,#fbbf24)" : "linear-gradient(90deg,#2563eb,#60a5fa)"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
