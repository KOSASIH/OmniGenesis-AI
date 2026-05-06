"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────────────────
type GateType = "H" | "X" | "Y" | "Z" | "S" | "T" | "CNOT" | "√X" | "Rx" | "Ry";
interface Gate { id: string; type: GateType; qubit: number; col: number; control?: number; }
interface QubitState { alpha: [number, number]; beta: [number, number]; } // [re, im]

const GATE_COLORS: Record<GateType, string> = {
  H: "#a855f7", X: "#ef4444", Y: "#f59e0b", Z: "#06b6d4",
  S: "#10b981", T: "#8b5cf6", CNOT: "#ec4899", "√X": "#f97316",
  Rx: "#06b6d4", Ry: "#a855f7",
};

const GATE_DESC: Record<GateType, string> = {
  H: "Hadamard: Creates superposition", X: "Pauli-X: Quantum NOT gate",
  Y: "Pauli-Y: Phase flip + bit flip", Z: "Pauli-Z: Phase flip gate",
  S: "S-Gate: π/2 phase shift", T: "T-Gate: π/4 phase shift",
  CNOT: "CNOT: Entangles two qubits", "√X": "Square root of X",
  Rx: "Rx: X-axis rotation", Ry: "Ry: Y-axis rotation",
};

const GATES: GateType[] = ["H","X","Y","Z","S","T","CNOT","√X","Rx","Ry"];
const NUM_QUBITS = 4;
const NUM_COLS = 8;

function initialState(): QubitState { return { alpha: [1,0], beta: [0,0] }; }

// Bloch sphere SVG component
function BlochSphere({ state, color = "#a855f7" }: { state: QubitState; color?: string }) {
  const [theta, setTheta] = useState(0);
  const [phi, setPhi] = useState(0);

  useEffect(() => {
    // Convert qubit state to Bloch sphere angles
    const [aR, aI] = state.alpha;
    const [bR, bI] = state.beta;
    const normA = Math.sqrt(aR**2 + aI**2);
    const normB = Math.sqrt(bR**2 + bI**2);
    const newTheta = 2 * Math.acos(Math.min(1, normA));
    const newPhi = Math.atan2(bI, bR) - Math.atan2(aI, aR);
    setTheta(newTheta);
    setPhi(newPhi);
  }, [state]);

  // Project Bloch vector to 2D
  const bx = Math.sin(theta) * Math.cos(phi + Date.now() * 0.0005);
  const by = Math.cos(theta);
  const bz = Math.sin(theta) * Math.sin(phi + Date.now() * 0.0005);

  // Simple isometric projection
  const px = 50 + (bx * 0.7 - bz * 0.7) * 35;
  const py = 50 - (by * 0.9 + (bx + bz) * 0.2) * 35;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Sphere outline */}
      <ellipse cx="50" cy="50" rx="40" ry="40" fill="none" stroke={color + "20"} strokeWidth="1" />
      {/* Equator */}
      <ellipse cx="50" cy="50" rx="40" ry="12" fill="none" stroke={color + "25"} strokeWidth="0.6" />
      {/* Meridian */}
      <ellipse cx="50" cy="50" rx="12" ry="40" fill="none" stroke={color + "25"} strokeWidth="0.6" />
      {/* Axes */}
      <line x1="50" y1="10" x2="50" y2="90" stroke={color + "20"} strokeWidth="0.5" />
      <line x1="10" y1="50" x2="90" y2="50" stroke={color + "20"} strokeWidth="0.5" />
      {/* Axis labels */}
      <text x="50" y="8" fill={color + "80"} fontSize="5" textAnchor="middle">|0⟩</text>
      <text x="50" y="97" fill={color + "80"} fontSize="5" textAnchor="middle">|1⟩</text>
      <text x="92" y="52" fill={color + "80"} fontSize="4">|+⟩</text>
      <text x="2" y="52" fill={color + "80"} fontSize="4">|-⟩</text>
      {/* State vector */}
      <line x1="50" y1="50" x2={px} y2={py} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Vector tip glow */}
      <circle cx={px} cy={py} r="3" fill={color} opacity="0.9" />
      <circle cx={px} cy={py} r="6" fill={color} opacity="0.2" />
      {/* Center dot */}
      <circle cx="50" cy="50" r="1.5" fill={color} opacity="0.5" />
    </svg>
  );
}

function AnimatedBlochSphere({ color = "#a855f7" }: { color?: string }) {
  const [phi, setPhi] = useState(0);
  const [theta] = useState(Math.PI / 3);

  useEffect(() => {
    const t = setInterval(() => setPhi(p => p + 0.04), 50);
    return () => clearInterval(t);
  }, []);

  const bx = Math.sin(theta) * Math.cos(phi);
  const by = Math.cos(theta);
  const bz = Math.sin(theta) * Math.sin(phi);
  const px = 50 + (bx * 0.7 - bz * 0.7) * 35;
  const py = 50 - (by * 0.9 + (bx + bz) * 0.2) * 35;

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <defs>
        <radialGradient id={`sphereGrad_${color.replace('#','')}`} cx="40%" cy="35%">
          <stop offset="0%" stopColor={color + "30"} />
          <stop offset="100%" stopColor={color + "05"} />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="50" rx="40" ry="40" fill={`url(#sphereGrad_${color.replace('#','')})`} stroke={color + "30"} strokeWidth="0.8" />
      <ellipse cx="50" cy="52" rx="40" ry="10" fill="none" stroke={color + "20"} strokeWidth="0.5" />
      <ellipse cx="50" cy="50" rx="10" ry="40" fill="none" stroke={color + "15"} strokeWidth="0.5" />
      <line x1="50" y1="10" x2="50" y2="90" stroke={color + "25"} strokeWidth="0.5" strokeDasharray="2,2" />
      <line x1="12" y1="50" x2="88" y2="50" stroke={color + "25"} strokeWidth="0.5" strokeDasharray="2,2" />
      <text x="50" y="8" fill={color + "90"} fontSize="5" textAnchor="middle">|0⟩</text>
      <text x="50" y="97" fill={color + "90"} fontSize="5" textAnchor="middle">|1⟩</text>
      <text x="91" y="53" fill={color + "90"} fontSize="4">|+⟩</text>
      <line x1="50" y1="50" x2={px} y2={py} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={px} cy={py} r="4" fill={color} />
      <circle cx={px} cy={py} r="8" fill={color} opacity="0.25" />
      <circle cx={px} cy={py} r="12" fill={color} opacity="0.08" />
      <circle cx="50" cy="50" r="2" fill={color} opacity="0.6" />
    </svg>
  );
}

// Quantum Circuit
function QuantumCircuit({ gates, onAddGate, onRemoveGate, selectedGate }: {
  gates: Gate[];
  onAddGate: (qubit: number, col: number) => void;
  onRemoveGate: (id: string) => void;
  selectedGate: GateType;
}) {
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${60 + NUM_COLS * 60} ${30 + NUM_QUBITS * 60}`} className="w-full min-h-[280px]">
        {/* Qubit wires */}
        {Array.from({ length: NUM_QUBITS }).map((_, q) => (
          <g key={q}>
            <line x1="0" y1={30 + q * 60} x2={60 + NUM_COLS * 60} y2={30 + q * 60}
              stroke="rgba(168,85,247,0.25)" strokeWidth="1.5" />
            <text x="6" y={34 + q * 60} fill="rgba(168,85,247,0.8)" fontSize="11" fontFamily="monospace">
              q{q}
            </text>
          </g>
        ))}
        {/* Column markers */}
        {Array.from({ length: NUM_COLS }).map((_, col) => (
          <g key={col}>
            <rect
              x={55 + col * 60} y="0"
              width="50" height={20 + NUM_QUBITS * 60}
              fill="transparent"
              className="cursor-pointer"
              onClick={() => onAddGate(0, col)}
            />
            {Array.from({ length: NUM_QUBITS }).map((_, q) => (
              <rect
                key={q}
                x={60 + col * 60} y={14 + q * 60}
                width="38" height="32"
                rx="6"
                fill="rgba(168,85,247,0.04)"
                stroke="rgba(168,85,247,0.12)"
                strokeWidth="0.5"
                className="cursor-pointer hover:fill-purple-500/10 transition-colors"
                onClick={() => onAddGate(q, col)}
              />
            ))}
          </g>
        ))}
        {/* CNOT connector lines */}
        {gates.filter(g => g.type === "CNOT" && g.control !== undefined).map(g => (
          <line key={g.id + "_ctrl"}
            x1={79 + g.col * 60} y1={30 + (g.control ?? 0) * 60}
            x2={79 + g.col * 60} y2={30 + g.qubit * 60}
            stroke="#ec4899" strokeWidth="1.5" />
        ))}
        {/* Gates */}
        {gates.map(g => {
          const color = GATE_COLORS[g.type] ?? "#a855f7";
          const cx = 79 + g.col * 60;
          const cy = 30 + g.qubit * 60;
          return (
            <g key={g.id} className="cursor-pointer" onClick={() => onRemoveGate(g.id)}>
              <rect x={cx - 16} y={cy - 14} width="32" height="28" rx="6"
                fill={color + "30"} stroke={color} strokeWidth="1.5" />
              <text x={cx} y={cy + 5} fill={color} fontSize="10" fontWeight="bold" textAnchor="middle"
                fontFamily="monospace">{g.type}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Quantum Metrics
function QuantumMetrics({ circuitDepth, gateCount, errorRate, fidelity }: {
  circuitDepth: number; gateCount: number; errorRate: number; fidelity: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: "Circuit Depth", value: circuitDepth, suffix: " layers", color: "#a855f7" },
        { label: "Gate Count", value: gateCount, suffix: " gates", color: "#06b6d4" },
        { label: "Error Rate", value: (errorRate * 100).toFixed(3), suffix: "%", color: "#f59e0b" },
        { label: "Gate Fidelity", value: (fidelity * 100).toFixed(2), suffix: "%", color: "#10b981" },
      ].map(m => (
        <div key={m.label} className="glass rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">{m.label}</p>
          <p className="text-xl font-bold tabular-nums font-mono" style={{ color: m.color }}>
            {m.value}<span className="text-xs font-normal text-slate-500">{m.suffix}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

export default function QuantumLab() {
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<GateType>("H");
  const [isRunning, setIsRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [measurements, setMeasurements] = useState<Record<string, number>>({});
  const [qubitStates, setQubitStates] = useState<QubitState[]>(
    Array.from({ length: NUM_QUBITS }, initialState)
  );
  const [errorRate, setErrorRate] = useState(0.00147);
  const [fidelity, setFidelity] = useState(0.9985);
  const [qubitsConnected, setQubitsConnected] = useState(127);
  const [quantumVolume, setQuantumVolume] = useState(512);
  const [selectedQubit, setSelectedQubit] = useState(0);

  // Live hardware metrics
  useEffect(() => {
    const t = setInterval(() => {
      setErrorRate(r => Math.max(0.001, Math.min(0.005, r + (Math.random() - 0.5) * 0.0003)));
      setFidelity(f => Math.max(0.995, Math.min(0.9999, f + (Math.random() - 0.5) * 0.0002)));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const addGate = useCallback((qubit: number, col: number) => {
    setGates(prev => {
      // Remove existing gate at position
      const filtered = prev.filter(g => !(g.qubit === qubit && g.col === col));
      const control = selectedGate === "CNOT" ? (qubit + 1) % NUM_QUBITS : undefined;
      return [...filtered, {
        id: `g${Date.now()}`, type: selectedGate, qubit, col, control,
      }];
    });
  }, [selectedGate]);

  const removeGate = useCallback((id: string) => {
    setGates(prev => prev.filter(g => g.id !== id));
  }, []);

  const runCircuit = async () => {
    setIsRunning(true);
    setRunProgress(0);
    setMeasurements({});
    // Simulate circuit execution
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 40));
      setRunProgress(i);
    }
    // Generate measurement results
    const shots = 1024;
    const states = ["00","01","10","11","000","001","010","011","100","101","110","111"];
    const results: Record<string, number> = {};
    const numStates = gates.length > 0 ? Math.min(gates.length + 1, 4) : 2;
    const validStates = states.slice(0, numStates);
    let remaining = shots;
    validStates.forEach((s, i) => {
      const count = i === validStates.length - 1 ? remaining : Math.floor(Math.random() * (remaining / (validStates.length - i)));
      results[s] = count;
      remaining -= count;
    });
    setMeasurements(results);
    setIsRunning(false);
  };

  const clearCircuit = () => { setGates([]); setMeasurements({}); };

  const circuitDepth = gates.length > 0 ? Math.max(...gates.map(g => g.col)) + 1 : 0;
  const maxMeas = Math.max(...Object.values(measurements), 1);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-purple rounded-2xl p-5 relative overflow-hidden"
      >
        <div className="scan-line opacity-20" />
        <div className="quantum-grid absolute inset-0 rounded-2xl opacity-50" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">⚛️</span>
              <h2 className="text-xl font-bold gradient-text-cyan">OmniGenesis Quantum Computing Lab</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300">
                {qubitsConnected} Qubits Online
              </span>
            </div>
            <p className="text-sm text-slate-400">Quantum circuit design · Bloch sphere visualization · Quantum supremacy benchmarks</p>
          </div>
          <div className="hidden md:grid grid-cols-2 gap-2 text-xs">
            <div className="glass rounded-lg px-3 py-2 text-center">
              <p className="text-slate-500">Quantum Volume</p>
              <p className="text-purple-300 font-bold text-lg">{quantumVolume}</p>
            </div>
            <div className="glass rounded-lg px-3 py-2 text-center">
              <p className="text-slate-500">T2 Coherence</p>
              <p className="text-cyan-300 font-bold text-lg">247μs</p>
            </div>
          </div>
        </div>
      </motion.div>

      <QuantumMetrics
        circuitDepth={circuitDepth}
        gateCount={gates.length}
        errorRate={errorRate}
        fidelity={fidelity}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Bloch Spheres */}
        <div className="glass rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Qubit States</h3>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: NUM_QUBITS }).map((_, q) => (
              <div
                key={q}
                onClick={() => setSelectedQubit(q)}
                className={`rounded-xl p-2 cursor-pointer transition-all ${selectedQubit === q ? "glass-purple ring-1 ring-purple-500/50" : "glass"}`}
              >
                <p className="text-xs text-center text-slate-400 mb-1 font-mono">q{q}</p>
                <div className="w-full aspect-square">
                  <AnimatedBlochSphere color={["#a855f7","#06b6d4","#10b981","#ec4899"][q]} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Circuit editor */}
        <div className="lg:col-span-3 space-y-4">
          {/* Gate palette */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <h3 className="text-sm font-semibold text-white">Gate Palette</h3>
              <div className="flex gap-1.5 flex-wrap flex-1">
                {GATES.map(gate => (
                  <motion.button
                    key={gate}
                    onClick={() => setSelectedGate(gate)}
                    whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                    title={GATE_DESC[gate]}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono transition-all border ${
                      selectedGate === gate
                        ? "text-white border-opacity-80"
                        : "text-slate-400 border-transparent glass hover:text-white"
                    }`}
                    style={selectedGate === gate ? {
                      backgroundColor: GATE_COLORS[gate] + "25",
                      borderColor: GATE_COLORS[gate],
                      color: GATE_COLORS[gate],
                    } : {}}
                  >
                    {gate}
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={runCircuit}
                  disabled={isRunning || gates.length === 0}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-purple-600/30 border border-purple-500/40 hover:bg-purple-600/50 disabled:opacity-40 transition-all glow-purple"
                >
                  {isRunning ? `⚡ ${runProgress}%` : "▶ Run (1024 shots)"}
                </motion.button>
                <button onClick={clearCircuit} className="px-3 py-2 rounded-xl text-sm text-slate-400 glass hover:text-white">
                  ✕ Clear
                </button>
              </div>
            </div>
            {selectedGate && (
              <p className="text-xs text-slate-500 mb-3">
                Selected: <span style={{ color: GATE_COLORS[selectedGate] }} className="font-semibold">{selectedGate}</span> — {GATE_DESC[selectedGate]}. Click grid to place.
              </p>
            )}
            {isRunning && (
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full"
                  style={{ width: `${runProgress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            )}
          </div>

          {/* Circuit grid */}
          <div className="glass-purple rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Quantum Circuit</h3>
              <span className="text-xs text-slate-500">Click cell to place {selectedGate} gate · Click gate to remove</span>
            </div>
            <QuantumCircuit
              gates={gates}
              onAddGate={addGate}
              onRemoveGate={removeGate}
              selectedGate={selectedGate}
            />
          </div>

          {/* Measurement results */}
          {Object.keys(measurements).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="glass-emerald rounded-2xl p-4"
            >
              <h3 className="text-sm font-semibold text-white mb-3">
                Measurement Results — 1024 shots
              </h3>
              <div className="space-y-2">
                {Object.entries(measurements).sort((a,b) => b[1]-a[1]).map(([state, count]) => (
                  <div key={state} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-emerald-300 w-8">|{state}⟩</span>
                    <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / 1024) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs font-mono text-white w-12 text-right">{count}</span>
                    <span className="text-xs text-slate-500 w-12">{((count/1024)*100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
