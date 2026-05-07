"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Chain {
  id: string;
  global_index: number;
  name: string;
  category_id: string;
  utility_token: string;
  stablecoin: string;
  stablecoin_model: string;
  stablecoin_peg: string;
  consensus: string;
  tps: number;
  block_time_s: number;
  maqasid_score: number;
  tvl_usd: number;
  chain_id: number;
  status: string;
  syariah_features: string[];
  certification_body: string;
}

interface Category {
  id: string;
  name: string;
  arabic: string;
  desc: string;
  color: string;
  icon: string;
}

interface NetworkStats {
  total_chains: number;
  total_tvl_usd: number;
  total_utility_token_supply_m: number;
  total_stablecoin_supply_m: number;
  avg_tps: number;
  avg_maqasid_score: number;
  total_validators: number;
  syariah_certified: number;
  live_chains: number;
  beta_chains: number;
}

// ─── Generated data (inline summary — subset for fast initial load) ───────────
const CATEGORIES: Category[] = [
  { id:"tamwil",  name:"Tamwil",   arabic:"تمويل",  desc:"Islamic Finance & Banking",     color:"#10b981", icon:"🏦" },
  { id:"hukm",    name:"Hukm",     arabic:"حكم",    desc:"Governance & Justice",           color:"#a855f7", icon:"⚖️" },
  { id:"ilm",     name:"Ilm",      arabic:"علم",    desc:"Knowledge & Education",          color:"#06b6d4", icon:"📚" },
  { id:"sihha",   name:"Sihha",    arabic:"صحة",    desc:"Healthcare & Wellness",          color:"#ec4899", icon:"🏥" },
  { id:"tijarah", name:"Tijarah",  arabic:"تجارة",  desc:"Halal Trade & Commerce",         color:"#f59e0b", icon:"🛒" },
  { id:"ziraa",   name:"Zira'a",   arabic:"زراعة",  desc:"Agriculture & Food Security",    color:"#84cc16", icon:"🌾" },
  { id:"taqa",    name:"Taqa",     arabic:"طاقة",   desc:"Halal Energy & Environment",    color:"#f97316", icon:"⚡" },
  { id:"binaa",   name:"Bina'",    arabic:"بناء",   desc:"Infrastructure & Smart City",   color:"#8b5cf6", icon:"🏗️" },
  { id:"amn",     name:"Amn",      arabic:"أمن",    desc:"Cybersecurity & Privacy",        color:"#64748b", icon:"🛡️" },
  { id:"ibada",   name:"Ibada",    arabic:"عبادة",  desc:"Philanthropy, Waqf & Zakat",    color:"#fbbf24", icon:"🕌" },
];

const CONSENSUS_LIST = [
  "Ijma'a Proof of Consensus","Shura Proof of Council","Mudarabah Proof of Profit-Share",
  "Takaful Proof of Solidarity","Waqf Proof of Endowment","Zakat Proof of Charity",
  "Fatwa Proof of Authority","Hisba Proof of Accountability","Ihsan Proof of Excellence","Amanah Proof of Trust",
];

const STABLECOIN_MODELS = [
  { name:"DINAR",  peg:"Gold Dinar",    backing:{"gold":40,"sukuk":30,"commodity":20,"reserve":10} },
  { name:"DIRHAM", peg:"Silver Dirham", backing:{"silver":45,"sukuk":25,"murabaha":20,"reserve":10} },
  { name:"MIZAN",  peg:"Basket Peg",    backing:{"gold":25,"silver":15,"sukuk":30,"commodity":20,"reserve":10} },
  { name:"QAFILA", peg:"Trade Basket",  backing:{"commodity":50,"sukuk":30,"gold":10,"reserve":10} },
  { name:"BADR",   peg:"Lunar CPI",     backing:{"sukuk":40,"gold":30,"waqf_assets":20,"reserve":10} },
  { name:"NUUR",   peg:"Energy Basket", backing:{"energy_asset":40,"gold":25,"sukuk":25,"reserve":10} },
  { name:"TAQWA",  peg:"ESG+Halal",     backing:{"halal_equity":40,"sukuk":30,"gold":20,"reserve":10} },
  { name:"RAHMA",  peg:"Welfare Index", backing:{"waqf_assets":35,"sukuk":30,"commodity":25,"reserve":10} },
  { name:"HAQQ",   peg:"Justice Index", backing:{"gold":35,"sukuk":35,"real_estate":20,"reserve":10} },
  { name:"AMAL",   peg:"Hope Index",    backing:{"sukuk":45,"gold":25,"agriculture":20,"reserve":10} },
];

const SYARIAH_FEATURES = [
  "Riba Filter Engine v3","Zakat Automation Module","Halal Oracle Network","Waqf Smart Contracts",
  "Sukuk Bridge Protocol","Mudarabah Liquidity Pools","Musharakah DAO Governance","Takaful Insurance Pool",
  "Gharar Prevention Layer","Maysir Block (Anti-Gambling)","Haram Asset Screener","Sharia Scholar Node Network",
  "Islamic Microfinance Module","Qard Hassan Interest-Free Loans","Bay'Salam Futures Protocol",
  "Istisna Manufacturing Finance","Ijarah Leasing Protocol","Murabaha Trade Finance Engine",
  "AI Fatwa Engine v2","Blockchain Waqf Registry","Hijri Calendar Smart Contracts","ZakatDAO Treasury",
];

const CERT_BODIES = ["AAOIFI","OIC","ISRA","BNM Syariah"];

// Generate all 1000 chains client-side (same algorithm as Python generator)
function generateChains(): Chain[] {
  const chains: Chain[] = [];
  const tokenPrefixes = ["TMW","HKM","ILM","SHH","TJR","ZR","TQA","BN","AMN","IBD"];
  for (let ci = 0; ci < 10; ci++) {
    const cat = CATEGORIES[ci];
    const prefix = tokenPrefixes[ci];
    for (let li = 0; li < 100; li++) {
      const gi = ci * 100 + li + 1;
      const num = String(li+1).padStart(3,"0");
      const scModel = STABLECOIN_MODELS[(li + ci*2) % STABLECOIN_MODELS.length];
      const tpsBase = [50000,10000,25000,15000,80000,12000,60000,20000,100000,8000][ci];
      const tps = Math.floor(tpsBase * (0.7 + 0.6 * ((li*17+13)%100)/100));
      const featureStart = (li*3+ci*7) % SYARIAH_FEATURES.length;
      const featureCount = 4 + (li%3);
      const features = Array.from({length:featureCount},(_,i)=>SYARIAH_FEATURES[(featureStart+i)%SYARIAH_FEATURES.length]);
      chains.push({
        id: `omni-${cat.id}-${num}`,
        global_index: gi,
        name: `Omni${cat.name.replace("'","")} ${num}`,
        category_id: cat.id,
        utility_token: `${prefix}${num}`,
        stablecoin: `${prefix}${num}-${scModel.name}`,
        stablecoin_model: scModel.name,
        stablecoin_peg: scModel.peg,
        consensus: CONSENSUS_LIST[(li + ci*3) % CONSENSUS_LIST.length],
        tps,
        block_time_s: Math.round((0.5 + (li%20)*0.15)*100)/100,
        maqasid_score: Math.round((85 + (gi%15)*0.9)*10)/10,
        tvl_usd: 1e6 * (5 + (gi*47%995)),
        chain_id: 10000 + gi,
        status: li%10 < 8 ? "live" : "beta",
        syariah_features: features,
        certification_body: CERT_BODIES[li%4],
      });
    }
  }
  return chains;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function MaqasidRing({ score, size=48 }: { score:number; size?:number }) {
  const r = size/2 - 5;
  const circ = 2*Math.PI*r;
  const dash = (score/100)*circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={score>=90?"#10b981":score>=75?"#f59e0b":"#ef4444"}
        strokeWidth="4" strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transform:`rotate(-90deg)`, transformOrigin:`${size/2}px ${size/2}px` }} />
      <text x={size/2} y={size/2+4} fill="white" fontSize={size*0.22} fontWeight="bold" textAnchor="middle" fontFamily="monospace">
        {score}
      </text>
    </svg>
  );
}

function ChainCard({ chain, cat, onSelect }: { chain:Chain; cat:Category; onSelect:(c:Chain)=>void }) {
  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      whileHover={{ scale:1.015, y:-2 }}
      onClick={() => onSelect(chain)}
      className="glass rounded-2xl p-3.5 cursor-pointer border border-transparent hover:border-opacity-30 transition-all"
      style={{ borderColor: cat.color + "40" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{cat.icon}</span>
          <div>
            <p className="text-xs font-bold text-white leading-tight">{chain.name}</p>
            <p className="text-[10px]" style={{ color: cat.color }}>Chain #{chain.chain_id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${chain.status==="live"?"bg-emerald-400 animate-pulse":"bg-amber-400"}`} />
          <MaqasidRing score={chain.maqasid_score} size={40} />
        </div>
      </div>

      {/* Dual coin */}
      <div className="grid grid-cols-2 gap-1.5 mb-2.5">
        <div className="rounded-lg px-2 py-1.5" style={{ background: cat.color+"15", border:`1px solid ${cat.color}30` }}>
          <p className="text-[9px] text-slate-500 leading-none mb-0.5">Utility Token</p>
          <p className="text-xs font-bold font-mono" style={{ color: cat.color }}>
            ${chain.utility_token}
          </p>
        </div>
        <div className="rounded-lg px-2 py-1.5 bg-amber-500/10 border border-amber-500/25">
          <p className="text-[9px] text-slate-500 leading-none mb-0.5">Stablecoin</p>
          <p className="text-[10px] font-bold font-mono text-amber-300 truncate">
            {chain.stablecoin_model}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-1 text-center mb-2">
        <div>
          <p className="text-[9px] text-slate-600">TPS</p>
          <p className="text-[10px] font-bold font-mono text-white">{(chain.tps/1000).toFixed(0)}k</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600">Block</p>
          <p className="text-[10px] font-bold font-mono text-white">{chain.block_time_s}s</p>
        </div>
        <div>
          <p className="text-[9px] text-slate-600">TVL</p>
          <p className="text-[10px] font-bold font-mono text-emerald-300">${(chain.tvl_usd/1e6).toFixed(0)}M</p>
        </div>
      </div>

      {/* Top feature */}
      <p className="text-[9px] text-slate-500 truncate">
        ✓ {chain.syariah_features[0]}
      </p>
    </motion.div>
  );
}

function ChainDetailModal({ chain, cat, onClose }: { chain:Chain; cat:Category; onClose:()=>void }) {
  const scModel = STABLECOIN_MODELS.find(m => m.name === chain.stablecoin_model) ?? STABLECOIN_MODELS[0];
  const backingEntries = Object.entries(scModel.backing);

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} exit={{ scale:0.9 }}
        className="glass-dark rounded-3xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-white/10"
        style={{ boxShadow:`0 0 60px ${cat.color}30` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl">{cat.icon}</span>
              <div>
                <h2 className="text-xl font-bold text-white">{chain.name}</h2>
                <p className="text-sm" style={{ color: cat.color }}>{cat.desc} · Chain #{chain.chain_id}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-12">
              <span className={`text-xs px-2 py-0.5 rounded-full ${chain.status==="live"?"bg-emerald-500/20 text-emerald-300":"bg-amber-500/20 text-amber-300"}`}>
                {chain.status==="live"?"🟢 Live":"🟡 Beta"}
              </span>
              <span className="text-xs text-slate-500">{chain.certification_body} Certified</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center glass rounded-lg">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Utility Token */}
          <div className="rounded-2xl p-4" style={{ background:cat.color+"15", border:`1px solid ${cat.color}30` }}>
            <p className="text-xs text-slate-500 mb-1">Utility Token</p>
            <p className="text-2xl font-bold font-mono" style={{ color:cat.color }}>${chain.utility_token}</p>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">Total Supply</span><span className="text-white">350M</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Burn-on-use</span><span className="text-emerald-400">Yes</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Zakat Auto</span><span className="text-emerald-400">2.5%/yr</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Waqf Alloc</span><span className="text-amber-300">1.0%</span></div>
            </div>
          </div>

          {/* Stablecoin */}
          <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/25">
            <p className="text-xs text-slate-500 mb-1">Hybrid Stablecoin</p>
            <p className="text-xl font-bold font-mono text-amber-300">{chain.stablecoin_model}</p>
            <p className="text-xs text-slate-400 mb-2">{chain.stablecoin_peg} peg</p>
            <div className="space-y-1.5">
              {backingEntries.map(([k,v]) => (
                <div key={k} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-500" style={{ width:`${v}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 w-20 text-right capitalize">{k.replace("_"," ")} {v}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chain metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label:"TPS",          value:`${chain.tps.toLocaleString()}`,  color:cat.color },
            { label:"Block Time",   value:`${chain.block_time_s}s`,          color:"#06b6d4" },
            { label:"TVL",          value:`$${(chain.tvl_usd/1e6).toFixed(0)}M`, color:"#10b981" },
            { label:"Maqasid",      value:`${chain.maqasid_score}/100`,       color:"#f59e0b" },
          ].map(m => (
            <div key={m.label} className="glass rounded-xl p-2.5 text-center">
              <p className="text-[10px] text-slate-500">{m.label}</p>
              <p className="text-sm font-bold font-mono" style={{ color:m.color }}>{m.value}</p>
            </div>
          ))}
        </div>

        {/* Consensus */}
        <div className="glass rounded-xl p-3 mb-4">
          <p className="text-xs text-slate-500 mb-1">Consensus Mechanism</p>
          <p className="text-sm font-semibold text-white">⚙️ {chain.consensus}</p>
        </div>

        {/* Syariah features */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Syariah Compliance Modules</p>
          <div className="flex flex-wrap gap-1.5">
            {chain.syariah_features.map(f => (
              <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                ✓ {f}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;

export default function IslamicBlockchainNetwork() {
  const [allChains] = useState<Chain[]>(() => generateChains());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"index"|"tps"|"tvl"|"maqasid">("index");
  const [selectedChain, setSelectedChain] = useState<Chain|null>(null);
  const [page, setPage] = useState(0);
  const [liveStats, setLiveStats] = useState({
    tvl: 500_220_000_000,
    validators: 47847,
    txPerSec: 37886,
    activeChains: 800,
  });

  // Simulate live stats
  useEffect(() => {
    const t = setInterval(() => {
      setLiveStats(s => ({
        tvl: s.tvl + Math.random() * 100000,
        validators: s.validators + (Math.random()>0.9?1:0),
        txPerSec: Math.max(30000, Math.min(50000, s.txPerSec + (Math.random()-0.5)*500)),
        activeChains: Math.min(1000, s.activeChains + (Math.random()>0.95?1:0)),
      }));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    let c = allChains;
    if (selectedCategory !== "all") c = c.filter(ch => ch.category_id === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      c = c.filter(ch =>
        ch.name.toLowerCase().includes(q) ||
        ch.utility_token.toLowerCase().includes(q) ||
        ch.stablecoin.toLowerCase().includes(q) ||
        ch.consensus.toLowerCase().includes(q) ||
        ch.syariah_features.some(f => f.toLowerCase().includes(q))
      );
    }
    return [...c].sort((a,b) => {
      if (sortBy==="tps")    return b.tps - a.tps;
      if (sortBy==="tvl")    return b.tvl_usd - a.tvl_usd;
      if (sortBy==="maqasid") return b.maqasid_score - a.maqasid_score;
      return a.global_index - b.global_index;
    });
  }, [allChains, selectedCategory, search, sortBy]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page+1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const selectedCat = selectedChain ? CATEGORIES.find(c=>c.id===selectedChain.category_id)??CATEGORIES[0] : CATEGORIES[0];

  const catStats = useMemo(() => CATEGORIES.map(cat => {
    const chs = allChains.filter(c => c.category_id === cat.id);
    return { ...cat, count: chs.length, tvl: chs.reduce((s,c)=>s+c.tvl_usd,0), avgMaqasid: chs.reduce((s,c)=>s+c.maqasid_score,0)/chs.length };
  }), [allChains]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }}
        className="relative rounded-2xl p-5 overflow-hidden"
        style={{ background:"linear-gradient(135deg, rgba(251,191,36,0.12), rgba(168,85,247,0.08), rgba(16,185,129,0.08))" }}
      >
        <div className="absolute inset-0 border border-amber-500/20 rounded-2xl" />
        <div className="scan-line opacity-10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🕌</span>
              <div>
                <h2 className="text-2xl font-bold" style={{ background:"linear-gradient(135deg,#fbbf24,#a855f7,#10b981)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  OmniGenesis Islamic Syariah Blockchain Network
                </h2>
                <p className="text-sm text-slate-400">1,000 Syariah-compliant chains · Dual coin system · Riba-free DeFi · AAOIFI certified</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 text-xs px-3 py-2 rounded-xl glass border border-amber-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-300 font-semibold">بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ</span>
            </div>
          </div>

          {/* Live KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label:"Total Chains",          value:"1,000",                              color:"#fbbf24", icon:"🔗" },
              { label:"Total Network TVL",     value:`$${(liveStats.tvl/1e9).toFixed(2)}B`, color:"#10b981", icon:"💰" },
              { label:"Live Transactions/s",   value:liveStats.txPerSec.toLocaleString(),   color:"#06b6d4", icon:"⚡" },
              { label:"Active Validators",     value:liveStats.validators.toLocaleString(),  color:"#a855f7", icon:"🛡️" },
              { label:"Syariah Certified",     value:"1,000 / 1,000",                      color:"#10b981", icon:"✅" },
            ].map((m,i) => (
              <motion.div key={m.label} initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} transition={{ delay:i*0.06 }} className="glass rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span>{m.icon}</span><span className="text-[10px] text-slate-500">{m.label}</span>
                </div>
                <p className="text-sm font-bold tabular-nums font-mono" style={{ color:m.color }}>{m.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth:"none" }}>
        <button
          onClick={() => { setSelectedCategory("all"); setPage(0); }}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            selectedCategory==="all" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "glass text-slate-400 hover:text-white"
          }`}
        >
          🌍 All Chains <span className="text-[10px] opacity-70">(1000)</span>
        </button>
        {catStats.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); setPage(0); }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
              selectedCategory===cat.id ? "border-opacity-50" : "border-transparent glass text-slate-400 hover:text-white"
            }`}
            style={selectedCategory===cat.id ? { backgroundColor:cat.color+"20", color:cat.color, borderColor:cat.color } : {}}
          >
            {cat.icon} {cat.name} <span className="text-[10px] opacity-60 font-arabic">{cat.arabic}</span>
          </button>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by chain name, token, consensus, or Syariah feature..."
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-amber-500/30 transition-colors"
          />
          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">✕</button>}
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="glass rounded-xl px-3 py-2.5 text-sm text-white outline-none cursor-pointer border border-white/8"
        >
          <option value="index">Sort: Index</option>
          <option value="tps">Sort: TPS ↓</option>
          <option value="tvl">Sort: TVL ↓</option>
          <option value="maqasid">Sort: Maqasid Score ↓</option>
        </select>
        <span className="text-xs text-slate-500 whitespace-nowrap">{filtered.length} chains</span>
      </div>

      {/* Category overview bar */}
      {selectedCategory === "all" && (
        <div className="glass rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Category Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {catStats.map(cat => (
              <div
                key={cat.id}
                onClick={() => { setSelectedCategory(cat.id); setPage(0); }}
                className="glass rounded-xl p-2.5 cursor-pointer hover:scale-102 transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span>{cat.icon}</span>
                  <span className="text-xs font-semibold text-white">{cat.name}</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-1">{cat.arabic}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold" style={{ color:cat.color }}>${(cat.tvl/1e9).toFixed(1)}B</span>
                  <span className="text-[10px] text-slate-500">Mq: {cat.avgMaqasid.toFixed(0)}</span>
                </div>
                <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width:`${cat.avgMaqasid}%`, backgroundColor:cat.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chain grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {paginated.map((chain, i) => {
            const cat = CATEGORIES.find(c => c.id === chain.category_id) ?? CATEGORIES[0];
            return (
              <ChainCard
                key={chain.id}
                chain={chain}
                cat={cat}
                onSelect={setSelectedChain}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0,p-1))}
            disabled={page===0}
            className="glass rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all"
          >← Prev</button>
          <div className="flex gap-1">
            {Array.from({length:Math.min(totalPages,10)}).map((_,i) => {
              const p = totalPages > 10 ? Math.floor(page/10)*10+i : i;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-mono transition-all ${page===p?"bg-amber-500/30 text-amber-300":"glass text-slate-500 hover:text-white"}`}>
                  {p+1}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages-1,p+1))}
            disabled={page===totalPages-1}
            className="glass rounded-xl px-4 py-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all"
          >Next →</button>
        </div>
      )}

      {/* Chain detail modal */}
      <AnimatePresence>
        {selectedChain && (
          <ChainDetailModal chain={selectedChain} cat={selectedCat} onClose={() => setSelectedChain(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
