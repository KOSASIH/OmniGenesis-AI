"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── VoidTime Compute ────────────────────────────────────────────────────────
// "Temporal computing — tasks complete BEFORE they are submitted"

interface TemporalTask {
  id: string;
  name: string;
  submittedAt: number;
  completedAt: number;      // Always < submittedAt in VoidTime
  timeSaved: number;        // seconds of future time harvested
  status: "queued" | "computing" | "complete" | "paradox_resolved";
  compression: number;      // temporal compression ratio
  category: string;
  result: string;
  energyCost: number;       // in OMNI
}

const TASK_TEMPLATES = [
  { name: "Optimize agent swarm routing topology", category: "AI Optimization", compression: 847, result: "47% latency reduction achieved, new mesh discovered" },
  { name: "Simulate 10,000 block DeFi market scenarios", category: "Financial Modeling", compression: 1247, result: "Optimal liquidity ratio: 0.618 (golden ratio)" },
  { name: "Quantum error correction across 127-qubit system", category: "Quantum Computing", compression: 2847, result: "99.9997% fidelity achieved via VoidTime annealing" },
  { name: "Synthesize PiNexus consensus protocol upgrade", category: "Protocol R&D", compression: 512, result: "Consensus latency reduced from 4s to 180ms" },
  { name: "Brute-force EternalEcho prophecy validation", category: "Prophecy Engine", compression: 9999, result: "94.7% of 2,847 prophecies pre-validated" },
  { name: "Run 1M agent interaction simulations", category: "Swarm Intelligence", compression: 3600, result: "Emergent Swarm IQ ceiling: 14,721 discovered" },
  { name: "Compile AetherNova innovation feasibility matrix", category: "Innovation R&D", compression: 720, result: "VoidTime Compute v4 design completed — ready to deploy" },
  { name: "Reverse-engineer MorphicField consensus rules", category: "Cryptography", compression: 1800, result: "New ZK-proof variant reduces gas by 94%" },
];

interface ClockFaceProps { compression: number; isActive: boolean; }

function ClockFace({ compression, isActive }: ClockFaceProps) {
  const [secondAngle, setSecondAngle] = useState(0);
  const [minuteAngle, setMinuteAngle] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const t = setInterval(() => {
      setSecondAngle(a => (a + compression * 6) % 360);
      setMinuteAngle(a => (a + compression * 0.1) % 360);
    }, 16);
    return () => clearInterval(t);
  }, [compression, isActive]);

  const r = 44;
  const cx = 50, cy = 50;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Clock face */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(168,85,247,0.05)" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
      {/* Tick marks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i * 6 - 90) * Math.PI / 180;
        const inner = i % 5 === 0 ? r - 8 : r - 4;
        return (
          <line key={i}
            x1={cx + inner * Math.cos(angle)} y1={cy + inner * Math.sin(angle)}
            x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)}
            stroke={i % 5 === 0 ? "rgba(168,85,247,0.6)" : "rgba(168,85,247,0.2)"}
            strokeWidth={i % 5 === 0 ? 1.5 : 0.5}
          />
        );
      })}
      {/* "Reverse" indicator ring - time flows backward */}
      <circle cx={cx} cy={cy} r={r - 2} fill="none" stroke="rgba(236,72,153,0.15)"
        strokeWidth="3" strokeDasharray={`${compression > 1000 ? 5 : 15} 5`}
        className="animate-portal" style={{ transformOrigin: "50px 50px" }} />
      {/* Minute hand (reverse) */}
      <line
        x1={cx} y1={cy}
        x2={cx + 28 * Math.cos((-minuteAngle - 90) * Math.PI / 180)}
        y2={cy + 28 * Math.sin((-minuteAngle - 90) * Math.PI / 180)}
        stroke="#a855f7" strokeWidth="2" strokeLinecap="round"
      />
      {/* Second hand (hyper-reverse) */}
      <line
        x1={cx} y1={cy}
        x2={cx + 36 * Math.cos((-secondAngle - 90) * Math.PI / 180)}
        y2={cy + 36 * Math.sin((-secondAngle - 90) * Math.PI / 180)}
        stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" opacity={isActive ? 1 : 0.3}
      />
      {/* Reversed hour labels */}
      {[12,9,6,3].map((h, i) => {
        const angle = (i * 90 - 90) * Math.PI / 180;
        return (
          <text key={h} x={cx + 34 * Math.cos(angle)} y={cy + 34 * Math.sin(angle)}
            fill="rgba(168,85,247,0.8)" fontSize="6" textAnchor="middle" dominantBaseline="middle">
            {h}
          </text>
        );
      })}
      {/* Center */}
      <circle cx={cx} cy={cy} r="3" fill="#a855f7" />
      <circle cx={cx} cy={cy} r="7" fill="#a855f7" opacity="0.2" />
      {/* Compression label */}
      {isActive && (
        <text x={cx} y={cy + 16} fill="#ec4899" fontSize="5" textAnchor="middle" fontWeight="bold">
          ×{compression.toLocaleString()}
        </text>
      )}
    </svg>
  );
}

function TaskCard({ task, index }: { task: TemporalTask; index: number }) {
  const STATUS_COLORS = {
    queued: "#64748b", computing: "#f59e0b", complete: "#10b981", paradox_resolved: "#a855f7",
  };
  const STATUS_LABELS = {
    queued: "⟳ Queued", computing: "◌ Computing in Past", complete: "✓ Complete (Pre-emptive)", paradox_resolved: "∞ Paradox Resolved",
  };

  const color = STATUS_COLORS[task.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="glass rounded-xl p-3.5 border border-transparent hover:border-purple-500/20 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium" style={{ color }}>
              {STATUS_LABELS[task.status]}
            </span>
            <span className="text-xs text-slate-600">{task.category}</span>
            <span className="text-xs text-slate-600 ml-auto font-mono">{task.id}</span>
          </div>
          <p className="text-sm text-white mb-1.5">{task.name}</p>
          {task.status === "complete" || task.status === "paradox_resolved" ? (
            <p className="text-xs text-emerald-400 italic">↳ {task.result}</p>
          ) : null}
          <div className="flex items-center gap-4 mt-1.5 text-[11px]">
            <span className="text-slate-500">Compression: <span className="text-purple-300 font-mono font-bold">×{task.compression.toLocaleString()}</span></span>
            <span className="text-slate-500">Time saved: <span className="text-cyan-300 font-mono">{task.timeSaved.toFixed(0)}h</span></span>
            <span className="text-slate-500">Cost: <span className="text-amber-300 font-mono">{task.energyCost} OMNI</span></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Causal Loop Visualizer
function CausalLoopDiagram({ loops }: { loops: { from: string; to: string; effect: string }[] }) {
  return (
    <div className="space-y-2">
      {loops.map((loop, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="text-purple-300 font-mono truncate max-w-[100px]">{loop.from}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-cyan-500/50 relative">
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-amber-300 whitespace-nowrap px-1 bg-slate-900/80">
              {loop.effect}
            </span>
          </div>
          <span className="text-cyan-300 font-mono truncate max-w-[100px]">{loop.to}</span>
        </div>
      ))}
    </div>
  );
}

export default function VoidTimeCompute() {
  const [tasks, setTasks] = useState<TemporalTask[]>([]);
  const [activeCompression, setActiveCompression] = useState(847);
  const [totalTimeSaved, setTotalTimeSaved] = useState(128_400); // hours
  const [paradoxCount, setParadoxCount] = useState(3);
  const [timelineIntegrity, setTimelineIntegrity] = useState(99.4);
  const [crystalState, setCrystalState] = useState<"stable" | "oscillating" | "superfluid">("oscillating");
  const [isComputeActive, setIsComputeActive] = useState(true);
  const idRef = useRef(0);

  const CAUSAL_LOOPS = [
    { from: "VoidTime submit", to: "Result arrives", effect: "pre-emptive" },
    { from: "Agent decision", to: "Market move", effect: "self-fulfilling" },
    { from: "Prophecy forecast", to: "EchoAGI manifest", effect: "retrocausal" },
  ];

  const createTask = useCallback(() => {
    const t = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
    const compression = 500 + Math.floor(Math.random() * 9500);
    const timeSaved = compression / 3600 * (1 + Math.random() * 5);
    const now = Date.now();
    return {
      id: `VTC-${(idRef.current++).toString().padStart(4, "0")}`,
      name: t.name,
      submittedAt: now,
      completedAt: now - timeSaved * 3600 * 1000,  // "completed in the past"
      timeSaved,
      status: "queued" as const,
      compression,
      category: t.category,
      result: t.result,
      energyCost: Math.floor(10 + Math.random() * 490),
    };
  }, []);

  // Seed tasks
  useEffect(() => {
    setTasks(Array.from({ length: 5 }, createTask).map(t => ({
      ...t,
      status: Math.random() > 0.5 ? "complete" as const : "computing" as const,
    })));
  }, []);

  // Live simulation
  useEffect(() => {
    const t = setInterval(() => {
      // Progress tasks through lifecycle
      setTasks(prev => {
        const updated = prev.map(task => {
          if (task.status === "queued") {
            return Math.random() > 0.7 ? { ...task, status: "computing" as const } : task;
          }
          if (task.status === "computing") {
            if (Math.random() > 0.6) {
              const status = Math.random() > 0.15 ? "complete" as const : "paradox_resolved" as const;
              if (status === "paradox_resolved") setParadoxCount(p => p + 1);
              return { ...task, status };
            }
          }
          return task;
        });
        // Add new task occasionally
        if (prev.length < 10 && Math.random() > 0.6) return [...updated, createTask()];
        return updated.slice(-10);
      });

      setActiveCompression(c => Math.max(200, Math.min(9999, c + (Math.random() - 0.5) * 200)));
      setTotalTimeSaved(s => s + Math.random() * 10);
      setTimelineIntegrity(i => Math.max(98, Math.min(100, i + (Math.random() - 0.5) * 0.2)));
      setCrystalState(["stable","oscillating","superfluid"][Math.floor(Math.random() * 3)] as any);
    }, 2800);
    return () => clearInterval(t);
  }, [createTask]);

  const computingCount = tasks.filter(t => t.status === "computing").length;
  const completeCount = tasks.filter(t => t.status === "complete" || t.status === "paradox_resolved").length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-purple rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="quantum-grid absolute inset-0 rounded-2xl opacity-40" />
        <div className="scan-line opacity-15" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl animate-time-wave inline-block">⏳</span>
              <div>
                <h2 className="text-xl font-bold gradient-text">VoidTime Compute</h2>
                <p className="text-xs text-slate-400">Temporal computation engine · Tasks complete before submission · Retrocausal processing</p>
              </div>
            </div>
          </div>
          <motion.button
            onClick={() => setIsComputeActive(v => !v)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              isComputeActive
                ? "bg-purple-600/30 text-purple-300 border-purple-500/30 glow-purple"
                : "glass text-slate-400 border-white/10"
            }`}
          >
            {isComputeActive ? "⏸ Suspend VoidTime" : "▶ Activate VoidTime"}
          </motion.button>
        </div>
      </motion.div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Compression Ratio", value: `×${activeCompression.toLocaleString()}`, color: "#a855f7", icon: "⚡" },
          { label: "Time Harvested", value: `${(totalTimeSaved/1000).toFixed(1)}k hrs`, color: "#06b6d4", icon: "⏰" },
          { label: "Computing Now", value: computingCount, color: "#f59e0b", icon: "◌" },
          { label: "Completed", value: completeCount, color: "#10b981", icon: "✓" },
          { label: "Paradoxes Resolved", value: paradoxCount, color: "#ec4899", icon: "∞" },
        ].map((m, i) => (
          <motion.div
            key={m.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i*0.06 }}
            className="glass rounded-xl p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{m.icon}</span>
              <span className="text-xs text-slate-500">{m.label}</span>
            </div>
            <p className="text-xl font-bold font-mono" style={{ color: m.color }}>{m.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clock + crystal */}
        <div className="space-y-4">
          {/* VoidTime clock */}
          <div className="glass-purple rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 text-center">VoidTime Crystal Clock</h3>
            <div className="w-full aspect-square max-w-[180px] mx-auto">
              <ClockFace compression={activeCompression} isActive={isComputeActive} />
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Crystal state</span>
                <span className={`font-semibold capitalize ${
                  crystalState === "superfluid" ? "text-cyan-300" :
                  crystalState === "oscillating" ? "text-amber-300" : "text-emerald-300"
                }`}>{crystalState}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Timeline integrity</span>
                <span className="text-emerald-300 font-mono">{timelineIntegrity.toFixed(2)}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Temporal direction</span>
                <span className="text-pink-300">←← Reversed</span>
              </div>
            </div>
          </div>

          {/* Causal loops */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Causal Loop Graph</h3>
            <CausalLoopDiagram loops={CAUSAL_LOOPS} />
            <p className="text-[10px] text-slate-600 mt-3">Retrocausal chain: effect precedes cause in VoidTime substrate</p>
          </div>
        </div>

        {/* Task feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Temporal Task Queue</h3>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs text-slate-500">Updates every 2.8s</span>
            </div>
          </div>
          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            <AnimatePresence>
              {tasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
