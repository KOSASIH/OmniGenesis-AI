"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MOCK_AGENTS, AGENT_STATUSES, AGENT_CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS,
  type Agent, type AgentStatus, type AgentCategory,
} from "@/lib/mock-data";

const STATUS_COLORS: Record<AgentStatus, string> = {
  active:     "bg-emerald-400",
  idle:       "bg-slate-600",
  processing: "bg-yellow-400",
  syncing:    "bg-cyan-400",
  error:      "bg-red-500",
};
const STATUS_BG: Record<AgentStatus, string> = {
  active:     "bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-400/60",
  idle:       "bg-slate-700/20 border-slate-600/20 hover:border-slate-500/40",
  processing: "bg-yellow-500/20 border-yellow-500/30 hover:border-yellow-400/60",
  syncing:    "bg-cyan-500/20 border-cyan-500/30 hover:border-cyan-400/60",
  error:      "bg-red-500/20 border-red-500/30 hover:border-red-400/60",
};

function AgentTooltip({ agent }: { agent: Agent }) {
  return (
    <div className="glass-purple rounded-xl p-3 text-xs pointer-events-none w-56 border border-purple-500/20">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[agent.status]}`} />
        <span className="font-semibold text-white truncate">{agent.name}</span>
      </div>
      <div className="space-y-1 text-slate-400">
        <div className="flex justify-between"><span>Chain</span><span className="text-slate-200">{agent.chain}</span></div>
        <div className="flex justify-between"><span>Tasks</span><span className="text-purple-300">{agent.tasksCompleted.toLocaleString()}</span></div>
        <div className="flex justify-between"><span>Tasks/hr</span><span className="text-cyan-300">{agent.tasksPerHour}</span></div>
        <div className="flex justify-between"><span>Uptime</span><span className="text-emerald-300">{agent.uptime.toFixed(2)}%</span></div>
        <div className="flex justify-between"><span>Reputation</span><span className="text-amber-300">{agent.reputation.toFixed(1)}</span></div>
        <div className="flex justify-between"><span>Last seen</span><span className="text-slate-300">{agent.lastActivity}</span></div>
      </div>
    </div>
  );
}

export default function AgentSwarmMonitor() {
  const [agents, setAgents] = useState<Agent[]>(MOCK_AGENTS);
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<AgentCategory | "all">("all");
  const [hoveredAgent, setHoveredAgent] = useState<Agent | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  // Live status updates
  useEffect(() => {
    const STATUS_WEIGHTS = [0.60, 0.15, 0.12, 0.08, 0.05];
    function weightedStatus(): AgentStatus {
      const r = Math.random();
      let cum = 0;
      for (let i = 0; i < AGENT_STATUSES.length; i++) {
        cum += STATUS_WEIGHTS[i];
        if (r < cum) return AGENT_STATUSES[i];
      }
      return "idle";
    }
    const t = setInterval(() => {
      setAgents(prev => prev.map(a => ({
        ...a,
        status: Math.random() > 0.97 ? weightedStatus() : a.status,
        tasksCompleted: a.status === "active" ? a.tasksCompleted + Math.floor(Math.random() * 3) : a.tasksCompleted,
      })));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return agents.filter(a =>
      (statusFilter === "all" || a.status === statusFilter) &&
      (categoryFilter === "all" || a.category === categoryFilter)
    );
  }, [agents, statusFilter, categoryFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<AgentStatus, number> = { active: 0, idle: 0, processing: 0, syncing: 0, error: 0 };
    agents.forEach(a => { counts[a.status]++; });
    return counts;
  }, [agents]);

  const totalTasks = useMemo(() => agents.reduce((s, a) => s + a.tasksCompleted, 0), [agents]);

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {AGENT_STATUSES.map(status => (
          <motion.button
            key={status}
            onClick={() => setStatusFilter(statusFilter === status ? "all" : status)}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className={`glass rounded-xl p-3 text-left transition-all duration-200 border ${
              statusFilter === status ? `${STATUS_BG[status]} border-opacity-80` : "border-transparent hover:border-white/10"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[status]} ${status !== "idle" ? "animate-pulse" : ""}`} />
              <span className="text-xs capitalize text-slate-300 font-medium">{status}</span>
            </div>
            <p className="text-xl font-bold text-white tabular-nums">{(statusCounts[status] * 10).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">of 1,000 agents</p>
          </motion.button>
        ))}
      </div>

      {/* Filters + view toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`text-xs px-2.5 py-1 rounded-lg transition-all ${categoryFilter === "all" ? "bg-purple-600/30 text-purple-300 border border-purple-500/30" : "glass text-slate-400 hover:text-white"}`}
          >All</button>
          {AGENT_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? "all" : cat)}
              style={{ borderColor: categoryFilter === cat ? CATEGORY_COLORS[cat] + "80" : undefined }}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all border ${
                categoryFilter === cat ? "text-white" : "border-transparent glass text-slate-400 hover:text-white"
              }`}
            >
              {CATEGORY_ICONS[cat]} {cat.replace(/_/g," ").replace(/\b\w/g, c => c.toUpperCase())}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {(["grid","list"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all ${view === v ? "bg-purple-600/30 text-purple-300 border border-purple-500/30" : "glass text-slate-400 hover:text-white"}`}
            >{v === "grid" ? "⊞ Grid" : "☰ List"}</button>
          ))}
        </div>
      </div>

      {/* Agent grid */}
      <div className="relative">
        {view === "grid" ? (
          <div className="grid grid-cols-10 gap-1.5 relative"
            onMouseLeave={() => setHoveredAgent(null)}
            onMouseMove={e => setMousePos({ x: e.clientX, y: e.clientY })}
          >
            {filtered.map(agent => (
              <motion.div
                key={agent.id}
                layout
                whileHover={{ scale: 1.3, zIndex: 20 }}
                onClick={() => setSelectedAgent(agent === selectedAgent ? null : agent)}
                onMouseEnter={() => setHoveredAgent(agent)}
                className={`aspect-square rounded-md cursor-pointer transition-all duration-200 border relative ${STATUS_BG[agent.status]} ${selectedAgent?.id === agent.id ? "ring-2 ring-white/40" : ""}`}
                title={`${agent.name} — ${agent.status}`}
              >
                <div
                  className={`absolute inset-0 rounded-md ${agent.status !== "idle" ? "animate-pulse" : ""}`}
                  style={{ backgroundColor: CATEGORY_COLORS[agent.category] + "30" }}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.slice(0, 50).map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.01 }}
                className="glass rounded-xl px-4 py-2.5 flex items-center gap-4 hover:border-purple-500/20 transition-all cursor-pointer"
                onClick={() => setSelectedAgent(agent === selectedAgent ? null : agent)}
              >
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[agent.status]}`} />
                <span className="text-sm text-white font-medium w-48 truncate">{agent.name}</span>
                <span className="text-xs text-slate-400 w-20">{agent.chain}</span>
                <span className="text-xs text-purple-300 tabular-nums w-24">{agent.tasksCompleted.toLocaleString()} tasks</span>
                <span className="text-xs text-cyan-300 w-20">{agent.tasksPerHour}/hr</span>
                <span className="text-xs text-emerald-300 w-16">{agent.uptime.toFixed(1)}%</span>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ml-auto ${STATUS_BG[agent.status].split(" ")[0]}`}>{agent.status}</span>
              </motion.div>
            ))}
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredAgent && view === "grid" && (
          <div className="fixed z-50 pointer-events-none" style={{ left: mousePos.x + 12, top: mousePos.y - 80 }}>
            <AgentTooltip agent={hoveredAgent} />
          </div>
        )}
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between glass rounded-xl px-4 py-3">
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <span>Showing <span className="text-white font-semibold">{filtered.length * 10}</span> of 1,000 agents</span>
          <span>Total tasks: <span className="text-purple-300 font-semibold">{(totalTasks * 10).toLocaleString()}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">Live • Updates every 1.8s</span>
        </div>
      </div>
    </div>
  );
}
