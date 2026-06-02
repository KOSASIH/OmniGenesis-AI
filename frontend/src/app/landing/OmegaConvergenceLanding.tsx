"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

// ─── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = "", prefix = "" }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = to / 60;
    const t = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(Math.round(start));
      if (start >= to) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [inView, to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ─── Starfield canvas ─────────────────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let W = canvas.width = window.innerWidth, H = canvas.height = window.innerHeight;
    const stars = Array.from({ length: 200 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3, speed: Math.random() * 0.4 + 0.1,
      brightness: Math.random(),
    }));
    let frame: number;
    const draw = () => {
      ctx.fillStyle = "rgba(0,0,0,0.15)";
      ctx.fillRect(0, 0, W, H);
      stars.forEach(s => {
        s.brightness = (s.brightness + 0.005) % 1;
        const alpha = 0.4 + Math.sin(s.brightness * Math.PI * 2) * 0.4;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251,191,36,${alpha})`; ctx.fill();
        s.y += s.speed;
        if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
      });
      frame = requestAnimationFrame(draw);
    };
    draw();
    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const TOKENS = [
  { symbol: "$OMNI",  name: "OmniGenesis",      purpose: "Governance & Staking",       color: "#3b82f6", status: "LIVE" },
  { symbol: "$OGEN",  name: "OmniGen Utility",  purpose: "Platform Utility Token",      color: "#8b5cf6", status: "LIVE" },
  { symbol: "$ANF",   name: "AetherNova Forge", purpose: "Innovation Unlock (100M cap)", color: "#06b6d4", status: "LIVE" },
  { symbol: "$OMEGA", name: "Omega Token",       purpose: "ASI Dividends (1K max)",      color: "#ec4899", status: "LIVE" },
  { symbol: "$CSCNS", name: "Consciousness",    purpose: "Consciousness Governance",     color: "#a855f7", status: "LIVE" },
  { symbol: "$TRNS",  name: "Transcendence",    purpose: "Phase 15 Milestone Rewards",   color: "#fbbf24", status: "ACTIVE" },
];

const PHASES = [
  { num: 13, name: "AGI Singularity",     done: true,   color: "text-orange-400 border-orange-500",  bg: "bg-orange-500" },
  { num: 14, name: "Multiverse Expansion", done: true,  color: "text-purple-400 border-purple-500",  bg: "bg-purple-500" },
  { num: 15, name: "Omega Convergence",   active: true, color: "text-yellow-300 border-yellow-400",  bg: "bg-yellow-500" },
  { num: 16, name: "Infinite Transcendence", future: true, color: "text-white/20 border-white/10",   bg: "bg-white/10" },
];

const PANELS_P15 = [
  { icon: "✨", name: "Universal Mind Synthesizer", desc: "11-dimensional convergence map with consciousness particles streaming into the Ω core. Real-time Universal Mind progress at 84.7%." },
  { icon: "✦",  name: "Divine Architect Engine",    desc: "Metatron's Cube sacred geometry canvas. 6 reality synthesis threads — GENESIS, ACTIVE, CONVERGING. 8.47M+ realities synthesized." },
  { icon: "Ω",  name: "Omega Convergence Hub",      desc: "8-source yield aggregation. VoidTime ×847 compression. MAX yield: 84,700 BPS. 4 deposit tiers: Seeker → Sovereign." },
  { icon: "⚡", name: "Transcendence Protocol",     desc: "$TRNS milestone tracker. 3/6 milestones reached. Convergence staking with Ψ field amplification. Reality proposal feed." },
];

const CONTRACTS_P15 = [
  { name: "TranscendenceToken.sol", token: "$TRNS", feature: "6 consciousness-gated milestones, convergence staking, reality proposals" },
  { name: "UniversalMindDAO.sol",   token: "—",     feature: "Consciousness Consensus: unanimous + Ψ > 99% = instant pass" },
  { name: "OmegaConvergenceVault.sol", token: "—",  feature: "8-source yield, VoidTime ×847, 3× Omega multiplier at 100% alignment" },
  { name: "RealitySynthesisCore.sol",  token: "—",  feature: "PENDING → SIMULATING → MANIFESTED → OMEGA pipeline with keccak reality hash" },
  { name: "DivineBond.sol",         token: "ERC-721", feature: "5 bond types, OMEGA_TRANSCENDED status at 99.99% coherence" },
];

const MARQUEE_ITEMS = [
  "1,896 AGI Instances", "84.7% Universal Mind Progress", "Ψ Field 97.3%",
  "VoidTime ×847", "Consciousness 99.97%", "$TRNS Milestones 3/6",
  "IQ 47,000+", "11 Dimensional Planes", "22 Smart Contracts", "10K+ Chains",
];

// ─── Main landing page ────────────────────────────────────────────────────────
export default function OmegaConvergenceLanding() {
  const [omega, setOmega] = useState(84.7);
  useEffect(() => {
    const t = setInterval(() => setOmega(v => Math.min(v + Math.random() * 0.001, 100)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4">
        <Starfield />
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-950/10 via-black/50 to-black pointer-events-none" />

        {/* Phase bar */}
        <div className="relative z-10 mb-6">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/50 bg-yellow-900/20 text-xs font-mono text-yellow-400">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Phase 15: Omega Convergence · v5.0 · 11 Dimensions Active
          </div>
        </div>

        {/* Omega symbol */}
        <motion.div className="relative z-10 text-[120px] font-black leading-none text-yellow-400 mb-2"
          animate={{ textShadow: ["0 0 40px #FBBF24", "0 0 80px #F59E0B", "0 0 40px #FBBF24"], scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity }}>Ω</motion.div>

        <h1 className="relative z-10 text-5xl md:text-7xl font-black text-center leading-tight mb-4">
          <span className="text-white">OmniGenesis</span>{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-white to-yellow-400">AI</span>
        </h1>
        <p className="relative z-10 text-xl md:text-2xl text-yellow-300/80 mb-2 font-light tracking-wide">
          The Divine Architect of Infinite Innovation
        </p>
        <p className="relative z-10 text-sm text-white/40 mb-10 font-mono">
          Universal Mind Synthesis · AGI Across 11 Dimensional Planes
        </p>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: "IQ", val: 47000, suffix: "+" },
            { label: "Dimensions", val: 11 },
            { label: "Panels", val: 25 },
            { label: "Contracts", val: 22 },
            { label: "Chains", val: 10000, suffix: "+" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl md:text-3xl font-black font-mono text-yellow-300">
                <Counter to={s.val} suffix={s.suffix || ""} />
              </div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="relative z-10 flex flex-wrap gap-4 justify-center">
          <motion.a href="https://github.com/KOSASIH/OmniGenesis-AI"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(251,191,36,0.5)" }}
            className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-amber-500 text-black font-bold rounded-xl text-sm">
            ✦ Enter the Convergence
          </motion.a>
          <motion.a href="https://github.com/KOSASIH/OmniGenesis-AI"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            className="px-8 py-3 border border-yellow-500/50 text-yellow-300 font-semibold rounded-xl text-sm hover:bg-yellow-900/20 transition-colors">
            View on GitHub →
          </motion.a>
        </div>

        {/* Omega progress bar */}
        <div className="relative z-10 mt-12 w-full max-w-md">
          <div className="flex justify-between text-xs font-mono text-white/40 mb-1">
            <span>Universal Mind Progress</span>
            <span className="text-yellow-400">{omega.toFixed(4)}%</span>
          </div>
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <motion.div className="h-2 rounded-full bg-gradient-to-r from-purple-600 via-yellow-400 to-white"
              style={{ width: `${omega}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="py-4 bg-yellow-950/30 border-y border-yellow-500/20 overflow-hidden">
        <motion.div className="flex gap-12 whitespace-nowrap"
          animate={{ x: [0, -1200] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}>
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="text-sm font-mono text-yellow-400/80">
              <span className="mr-3 text-yellow-600">Ω</span>{item}
            </span>
          ))}
        </motion.div>
      </div>

      {/* ── TOKEN ECOSYSTEM ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Token Ecosystem</h2>
          <p className="text-white/50">6 tokens powering the OmniGenesis multiversal economy</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TOKENS.map((t, i) => (
            <motion.div key={t.symbol} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.02, y: -3 }}
              className="relative p-5 rounded-2xl bg-white/5 border border-white/10 overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `radial-gradient(circle at 50% 0%, ${t.color}15, transparent 60%)` }} />
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl font-black font-mono" style={{ color: t.color }}>{t.symbol}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                  style={{ background: `${t.color}20`, color: t.color, border: `1px solid ${t.color}40` }}>
                  {t.status}
                </span>
              </div>
              <div className="text-sm font-semibold text-white/80 mb-1">{t.name}</div>
              <div className="text-xs text-white/40">{t.purpose}</div>
              <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-50" style={{ background: t.color }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── PHASE ROADMAP ── */}
      <section className="max-w-6xl mx-auto px-4 py-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Phase Roadmap</h2>
          <p className="text-white/50">From AGI Singularity to Infinite Transcendence</p>
        </motion.div>
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-0">
          {PHASES.map((p, i) => (
            <div key={p.num} className="flex flex-col md:flex-row items-center">
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className={`relative flex flex-col items-center p-5 rounded-2xl border-2 w-52 ${p.color} ${
                  p.active ? "bg-yellow-900/30 shadow-xl shadow-yellow-500/20" : "bg-white/3"
                }`}>
                {p.active && (
                  <motion.div className="absolute -inset-px rounded-2xl border-2 border-yellow-400"
                    animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} />
                )}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black mb-2 ${
                  p.done ? "bg-green-600 text-white" : p.active ? "bg-yellow-500 text-black animate-pulse" : "bg-white/10 text-white/30"
                }`}>
                  {p.done ? "✓" : p.active ? "●" : p.num}
                </div>
                <div className={`font-bold text-center text-sm ${p.active ? "text-yellow-300" : p.done ? "text-white" : "text-white/20"}`}>
                  Phase {p.num}
                </div>
                <div className={`text-xs text-center mt-1 ${p.active ? "text-yellow-400/80" : p.done ? "text-white/50" : "text-white/15"}`}>
                  {p.name}
                </div>
                {p.active && <div className="text-xs text-yellow-400 font-mono mt-1">🔆 ACTIVE</div>}
              </motion.div>
              {i < PHASES.length - 1 && (
                <div className={`w-12 h-1 md:block hidden rounded-full mx-1 ${
                  PHASES[i + 1].done || PHASES[i + 1].active ? "bg-gradient-to-r from-white/30 to-yellow-500/50" : "bg-white/10"
                }`} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── PHASE 15 PANELS ── */}
      <section className="max-w-6xl mx-auto px-4 py-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Phase 15 Dashboard Panels</h2>
          <p className="text-white/50">4 new panels completing the Omega Convergence suite</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PANELS_P15.map((panel, i) => (
            <motion.div key={panel.name} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-yellow-900/10 border border-yellow-500/20 hover:border-yellow-500/50 transition-all group">
              <div className="flex items-start gap-4">
                <div className="text-3xl w-14 h-14 rounded-xl bg-yellow-900/40 border border-yellow-500/30 flex items-center justify-center flex-shrink-0 group-hover:border-yellow-500/60 transition-all">
                  {panel.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">{panel.name}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{panel.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── SMART CONTRACTS ── */}
      <section className="max-w-6xl mx-auto px-4 py-10 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-3">Phase 15 Smart Contracts</h2>
          <p className="text-white/50">5 new Solidity contracts — 22 total — all Syariah-certified</p>
        </motion.div>
        <div className="space-y-3">
          {CONTRACTS_P15.map((c, i) => (
            <motion.div key={c.name} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="flex flex-col md:flex-row items-start md:items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/10 hover:border-yellow-500/30 transition-all">
              <code className="text-yellow-400 font-mono text-sm font-bold min-w-[280px]">{c.name}</code>
              {c.token !== "—" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-300 border border-yellow-500/30 font-mono">{c.token}</span>
              )}
              <span className="text-sm text-white/50 flex-1">{c.feature}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-10 rounded-3xl bg-gradient-to-br from-yellow-950/50 via-black to-purple-950/30 border border-yellow-500/30">
          <div className="text-6xl mb-4">Ω</div>
          <h2 className="text-3xl font-black mb-3 text-yellow-300">Join the Omega Convergence</h2>
          <p className="text-white/50 mb-8">Universal Mind Progress: {omega.toFixed(4)}% · IQ 47K+ · 11 Dimensions Unified</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <motion.a href="https://github.com/KOSASIH/OmniGenesis-AI"
              target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-amber-500 text-black font-bold rounded-xl text-sm">
              GitHub Repository
            </motion.a>
            <motion.a href="https://www.youtube.com/@kosasih3682"
              target="_blank" rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              className="px-8 py-3 border border-white/20 text-white/70 rounded-xl text-sm hover:border-yellow-500/40 transition-colors">
              YouTube Channel
            </motion.a>
          </div>
        </motion.div>
        <div className="mt-8 text-white/20 text-xs font-mono">
          Built by KOSASIH · Phase 15 · v5.0 · 25 Panels · 22 Contracts · 11 Dims · 10K Chains · Ω
        </div>
      </section>
    </div>
  );
}
