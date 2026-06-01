"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────────
interface QNode {
  id: string; x: number; y: number;
  coherence: number; entangledWith: string[];
  active: boolean; qubitState: [number,number]; // [alpha, beta] of |0⟩|1⟩
  type: "neural"|"quantum"|"bridge";
  label: string;
}

interface EntanglementEdge { from: string; to: string; fidelity: number; active: boolean; }
interface QuantumGate { name:string; matrix:string; description:string; qubitTarget:number; }
interface NeuralQuantumMetric { label:string; value:string; unit:string; color:string; trend:"up"|"down"|"stable"; }

// ─── Generate initial node graph ───────────────────────────────────────────────
function generateNodes(): QNode[] {
  const nodes: QNode[] = [];
  // Central quantum processor
  nodes.push({ id:"Q-CORE", x:50, y:50, coherence:99.97, entangledWith:[], active:true,
    qubitState:[0.707, 0.707], type:"quantum", label:"Quantum Core" });
  // Neural clusters
  const neuralClusters = [
    { id:"N-ALPHA", x:20, y:25, label:"Neural α" },
    { id:"N-BETA",  x:80, y:25, label:"Neural β" },
    { id:"N-GAMMA", x:20, y:75, label:"Neural γ" },
    { id:"N-DELTA", x:80, y:75, label:"Neural δ" },
    { id:"N-OMEGA", x:50, y:15, label:"Neural Ω" },
  ];
  neuralClusters.forEach((n,i) => nodes.push({
    ...n, coherence: 87 + i*2, entangledWith: ["Q-CORE"],
    active: true, qubitState: [Math.random(), Math.random()], type:"neural"
  }));
  // Bridge nodes
  const bridges = [
    { id:"B-VOIDTIME", x:10, y:50, label:"VoidTime" },
    { id:"B-ETERNAL",  x:90, y:50, label:"EternalEcho" },
    { id:"B-ISLAMIC",  x:50, y:88, label:"IslamicNet" },
    { id:"B-OMNI",     x:35, y:35, label:"OmniChain" },
    { id:"B-PI",       x:65, y:35, label:"PiNexus" },
    { id:"B-SWARM",    x:35, y:65, label:"Swarm" },
    { id:"B-SINGUL",   x:65, y:65, label:"Singularity" },
  ];
  bridges.forEach((b,i) => nodes.push({
    ...b, coherence: 91 + (i%5)*1.5, entangledWith: ["Q-CORE", neuralClusters[i%5].id],
    active: Math.random() > 0.1, qubitState: [Math.cos(i*0.5), Math.sin(i*0.5)], type:"bridge"
  }));
  return nodes;
}

function generateEdges(nodes: QNode[]): EntanglementEdge[] {
  const edges: EntanglementEdge[] = [];
  nodes.forEach(n => {
    n.entangledWith.forEach(tId => {
      if (!edges.find(e => (e.from===n.id&&e.to===tId)||(e.from===tId&&e.to===n.id))) {
        edges.push({ from:n.id, to:tId, fidelity:90+Math.random()*10, active:true });
      }
    });
  });
  return edges;
}

// ─── Quantum Network SVG ──────────────────────────────────────────────────────
function QuantumNetworkSVG({ nodes, edges, pulseT }: { nodes:QNode[]; edges:EntanglementEdge[]; pulseT:number }) {
  const getNode = (id:string) => nodes.find(n=>n.id===id);
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </radialGradient>
        <filter id="blur3"><feGaussianBlur stdDeviation="0.5" /></filter>
      </defs>

      {/* Entanglement edges */}
      {edges.map((e,i) => {
        const from = getNode(e.from); const to = getNode(e.to);
        if (!from||!to) return null;
        const opacity = 0.2 + 0.4 * (Math.sin(pulseT + i * 0.7) * 0.5 + 0.5);
        const color = e.fidelity > 97 ? "#22d3ee" : e.fidelity > 93 ? "#a855f7" : "#60a5fa";
        return (
          <g key={`${e.from}-${e.to}`}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y}
              stroke={color} strokeWidth="0.3" opacity={opacity} />
            {/* Entanglement pulse */}
            <circle r="0.8" fill={color} opacity={opacity * 0.9}>
              <animateMotion dur={`${2+i*0.3}s`} repeatCount="indefinite">
                <mpath xlinkHref={`#path-${i}`} />
              </animateMotion>
            </circle>
            <path id={`path-${i}`} d={`M${from.x},${from.y} L${to.x},${to.y}`} fill="none" />
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const isCore = node.type==="quantum";
        const pulse  = Math.sin(pulseT * (isCore?2:1) + node.x * 0.1) * 0.5 + 0.5;
        const r = isCore ? 5 : node.type==="neural" ? 3.2 : 2.5;
        const color = isCore ? "#a855f7" : node.type==="neural" ? "#22d3ee" : "#10b981";

        return (
          <g key={node.id}>
            {/* Glow ring */}
            <circle cx={node.x} cy={node.y} r={r*1.8}
              fill={color} opacity={0.05 + 0.05*pulse} filter="url(#blur3)" />
            {/* Core circle */}
            <circle cx={node.x} cy={node.y} r={r}
              fill={`${color}30`} stroke={color} strokeWidth="0.5"
              opacity={node.active ? 0.9 : 0.3}
            />
            {/* Qubit state visualization - inner ring */}
            {isCore && (
              <circle cx={node.x} cy={node.y} r={r*0.6}
                fill="none" stroke="#fbbf24" strokeWidth="0.3"
                strokeDasharray={`${node.qubitState[0]*Math.PI*r*1.2} ${Math.PI*r*1.2}`}
                opacity={0.7}
              />
            )}
            {/* Label */}
            <text x={node.x} y={node.y + r + 2.5} fill="rgba(255,255,255,0.6)"
              fontSize="2" textAnchor="middle" fontFamily="monospace">
              {node.label}
            </text>
            {node.active && (
              <circle cx={node.x + r*0.7} cy={node.y - r*0.7} r="0.8"
                fill="#34d399" opacity={0.8 + 0.2*pulse}>
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Bloch Sphere (for qubit visualization) ───────────────────────────────────
function BlochSphere({ alpha, beta, color="#a855f7" }: { alpha:number; beta:number; color?:string }) {
  const angle1 = alpha * Math.PI;
  const angle2 = beta  * Math.PI * 2;
  const px = Math.sin(angle1) * Math.cos(angle2);
  const py = Math.sin(angle1) * Math.sin(angle2);
  const pz = Math.cos(angle1);
  // Project to 2D
  const screenX = 30 + (px * 0.6 + py * 0.35) * 22;
  const screenY = 30 - (pz * 0.8)               * 22;

  return (
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <circle cx="30" cy="30" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
      <ellipse cx="30" cy="30" rx="22" ry="7" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
      <line x1="30" y1="8" x2="30" y2="52" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      <line x1="8" y1="30" x2="52" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
      {/* State vector */}
      <line x1="30" y1="30" x2={screenX} y2={screenY} stroke={color} strokeWidth="1.5" />
      <circle cx={screenX} cy={screenY} r="2.5" fill={color} opacity="0.9" />
      <text x="30" y="7"  fill="rgba(255,255,255,0.4)" fontSize="4" textAnchor="middle">|0⟩</text>
      <text x="30" y="57" fill="rgba(255,255,255,0.4)" fontSize="4" textAnchor="middle">|1⟩</text>
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function NeuroQuantumEntangler() {
  const [nodes]   = useState<QNode[]>(() => generateNodes());
  const [edges]   = useState<EntanglementEdge[]>(() => generateEdges(generateNodes()));
  const [pulseT,  setPulseT]   = useState(0);
  const [metrics, setMetrics]  = useState<NeuralQuantumMetric[]>([
    { label:"Entanglement Fidelity",      value:"99.97", unit:"%",   color:"#10b981", trend:"up"   },
    { label:"Qubit Coherence Time",       value:"247",   unit:"μs",  color:"#22d3ee", trend:"up"   },
    { label:"Gate Error Rate",            value:"0.003", unit:"%",   color:"#f59e0b", trend:"down" },
    { label:"Neural-Quantum Bandwidth",   value:"847",   unit:"Gq/s",color:"#a855f7", trend:"up"   },
    { label:"Entangled Node Pairs",       value:"1,024", unit:"pairs",color:"#60a5fa",trend:"stable"},
    { label:"Quantum Advantage Factor",   value:"×847",  unit:"",    color:"#f97316", trend:"up"   },
    { label:"Decoherence Protected",      value:"99.8",  unit:"%",   color:"#34d399", trend:"stable"},
    { label:"Active Entanglements",       value:"12,847",unit:"",    color:"#fbbf24", trend:"up"   },
  ]);
  const [qubits, setQubits] = useState([
    { id:"Q0", alpha:0.25, beta:0.3,  color:"#a855f7", label:"Core-α" },
    { id:"Q1", alpha:0.7,  beta:0.1,  color:"#22d3ee", label:"Neural-β" },
    { id:"Q2", alpha:0.5,  beta:0.5,  color:"#10b981", label:"Bridge-γ" },
    { id:"Q3", alpha:0.15, beta:0.85, color:"#f97316", label:"Temporal-δ" },
  ]);
  const [quantumGates] = useState<QuantumGate[]>([
    { name:"H",     matrix:"⟦1 1; 1 -1⟧/√2", description:"Hadamard: creates superposition",         qubitTarget:0 },
    { name:"CNOT",  matrix:"⟦1 0 0 0; 0 1 0 0; 0 0 0 1; 0 0 1 0⟧", description:"Entangles 2 qubits",qubitTarget:1 },
    { name:"T",     matrix:"⟦1 0; 0 e^iπ/4⟧", description:"π/4 phase rotation",                     qubitTarget:2 },
    { name:"SWAP",  matrix:"⟦1 0 0 0; 0 0 1 0; 0 1 0 0; 0 0 0 1⟧", description:"Swap qubit states", qubitTarget:3 },
    { name:"√X",    matrix:"⟦1+i 1-i; 1-i 1+i⟧/2", description:"Square-root NOT gate",              qubitTarget:0 },
    { name:"CZ",    matrix:"diag(1,1,1,-1)", description:"Controlled-Z phase flip",                   qubitTarget:1 },
  ]);

  // Animate
  useEffect(() => {
    let raf: number;
    const animate = () => { setPulseT(t => t + 0.02); raf = requestAnimationFrame(animate); };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Update qubit states
  useEffect(() => {
    const t = setInterval(() => {
      setQubits(prev => prev.map(q => ({
        ...q,
        alpha: Math.max(0, Math.min(1, q.alpha + (Math.random()-0.5)*0.05)),
        beta:  Math.max(0, Math.min(1, q.beta  + (Math.random()-0.5)*0.05)),
      })));
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: m.trend==="up"
          ? String((parseFloat(m.value.replace(",",""))*1.00001).toFixed(m.unit==="μs"?0:3))
          : m.value
      })));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }}
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background:"linear-gradient(135deg,rgba(34,211,238,0.1),rgba(168,85,247,0.08))" }}
      >
        <div className="absolute inset-0 border border-cyan-500/25 rounded-2xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <motion.div animate={{ rotate:360 }} transition={{ duration:8, repeat:Infinity, ease:"linear" }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-600/40 to-purple-600/40 border border-cyan-500/30 flex items-center justify-center text-2xl">⚛️</motion.div>
            <div>
              <h2 className="text-xl font-bold text-white">NeuroQuantum Entangler</h2>
              <p className="text-sm text-slate-400">AetherNova Forge · Quantum-Neural hybrid bridge · 127 qubits × neural mesh · Phase 13</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {metrics.slice(0,4).map(m => (
              <div key={m.label} className="glass rounded-xl p-2.5">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[9px] text-slate-500">{m.label}</span>
                  <span className="text-[9px]">{m.trend==="up"?"↑":m.trend==="down"?"↓":"→"}</span>
                </div>
                <p className="text-sm font-bold font-mono" style={{ color:m.color }}>{m.value}<span className="text-[10px] text-slate-500 ml-0.5">{m.unit}</span></p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quantum network */}
        <div className="glass rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white mb-2">🕸️ Entanglement Network (Live)</h3>
          <p className="text-[10px] text-slate-600 mb-3">Purple=Quantum · Cyan=Neural · Green=Bridge · Lines=entanglement</p>
          <div className="aspect-square w-full max-w-sm mx-auto">
            <QuantumNetworkSVG nodes={nodes} edges={edges} pulseT={pulseT} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {metrics.slice(4).map(m => (
              <div key={m.label} className="glass rounded-xl p-2">
                <p className="text-[9px] text-slate-500">{m.label}</p>
                <p className="text-xs font-mono font-bold" style={{ color:m.color }}>{m.value} <span className="text-[9px] text-slate-600">{m.unit}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Qubit states + gates */}
        <div className="space-y-4">
          {/* Bloch spheres */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">🌐 Live Qubit States (Bloch Spheres)</h3>
            <div className="grid grid-cols-2 gap-3">
              {qubits.map(q => (
                <div key={q.id} className="glass rounded-xl p-2">
                  <p className="text-[10px] text-slate-500 text-center mb-1">{q.label}</p>
                  <div className="w-16 h-16 mx-auto">
                    <BlochSphere alpha={q.alpha} beta={q.beta} color={q.color} />
                  </div>
                  <div className="flex justify-between mt-1 text-[9px] font-mono">
                    <span className="text-slate-500">α:{q.alpha.toFixed(3)}</span>
                    <span className="text-slate-500">β:{q.beta.toFixed(3)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quantum gates */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-bold text-white mb-3">⚙️ Active Quantum Gates</h3>
            <div className="space-y-2">
              {quantumGates.map((gate,i) => (
                <motion.div key={gate.name}
                  initial={{ opacity:0, x:8 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
                  className="flex items-start gap-3 glass rounded-xl p-2.5"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-600/30 to-purple-600/30 border border-cyan-500/25 flex items-center justify-center font-mono font-bold text-sm text-cyan-300 flex-shrink-0">
                    {gate.name}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-slate-300 leading-tight">{gate.description}</p>
                    <p className="text-[9px] text-slate-600 font-mono mt-0.5 truncate">{gate.matrix}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse mt-1.5 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
