"""
Generate 1,000 Islamic Syariah Blockchain registry — 10 categories × 100 chains each.
Each chain gets: utility token + hybrid stablecoin + full Syariah compliance metadata.
"""
import json, random, math

CATEGORIES = [
    {"id":"tamwil",  "name":"Tamwil",   "arabic":"تمويل",  "desc":"Islamic Finance & Banking",     "color":"#10b981", "icon":"🏦"},
    {"id":"hukm",    "name":"Hukm",     "arabic":"حكم",    "desc":"Governance & Justice",           "color":"#a855f7", "icon":"⚖️"},
    {"id":"ilm",     "name":"Ilm",      "arabic":"علم",    "desc":"Knowledge & Education",          "color":"#06b6d4", "icon":"📚"},
    {"id":"sihha",   "name":"Sihha",    "arabic":"صحة",    "desc":"Healthcare & Wellness",          "color":"#ec4899", "icon":"🏥"},
    {"id":"tijarah", "name":"Tijarah",  "arabic":"تجارة",  "desc":"Halal Trade & Commerce",         "color":"#f59e0b", "icon":"🛒"},
    {"id":"ziraa",   "name":"Zira'a",   "arabic":"زراعة",  "desc":"Agriculture & Food Security",    "color":"#84cc16", "icon":"🌾"},
    {"id":"taqa",    "name":"Taqa",     "arabic":"طاقة",   "desc":"Halal Energy & Environment",    "color":"#f97316", "icon":"⚡"},
    {"id":"binaa",   "name":"Bina'",    "arabic":"بناء",   "desc":"Infrastructure & Smart City",   "color":"#8b5cf6", "icon":"🏗️"},
    {"id":"amn",     "name":"Amn",      "arabic":"أمن",    "desc":"Cybersecurity & Privacy",        "color":"#64748b", "icon":"🛡️"},
    {"id":"ibada",   "name":"Ibada",    "arabic":"عبادة",  "desc":"Philanthropy, Waqf & Zakat",    "color":"#fbbf24", "icon":"🕌"},
]

CONSENSUS = [
    "Ijma'a Proof of Consensus",
    "Shura Proof of Council",
    "Mudarabah Proof of Profit-Share",
    "Takaful Proof of Solidarity",
    "Waqf Proof of Endowment",
    "Zakat Proof of Charity",
    "Fatwa Proof of Authority",
    "Hisba Proof of Accountability",
    "Ihsan Proof of Excellence",
    "Amanah Proof of Trust",
]

STABLECOIN_MODELS = [
    {"name":"DINAR",  "peg":"Gold Dinar",    "backing":{"gold":40,"sukuk":30,"commodity":20,"reserve":10}},
    {"name":"DIRHAM", "peg":"Silver Dirham", "backing":{"silver":45,"sukuk":25,"murabaha":20,"reserve":10}},
    {"name":"MIZAN",  "peg":"Basket Peg",    "backing":{"gold":25,"silver":15,"sukuk":30,"commodity":20,"reserve":10}},
    {"name":"QAFILA", "peg":"Trade Basket",  "backing":{"commodity":50,"sukuk":30,"gold":10,"reserve":10}},
    {"name":"BADR",   "peg":"Lunar CPI Peg", "backing":{"sukuk":40,"gold":30,"waqf_assets":20,"reserve":10}},
    {"name":"NUUR",   "peg":"Energy Basket", "backing":{"energy_asset":40,"gold":25,"sukuk":25,"reserve":10}},
    {"name":"TAQWA",  "peg":"ESG+Halal",     "backing":{"halal_equity":40,"sukuk":30,"gold":20,"reserve":10}},
    {"name":"RAHMA",  "peg":"Welfare Index", "backing":{"waqf_assets":35,"sukuk":30,"commodity":25,"reserve":10}},
    {"name":"HAQQ",   "peg":"Justice Index", "backing":{"gold":35,"sukuk":35,"real_estate":20,"reserve":10}},
    {"name":"AMAL",   "peg":"Hope Index",    "backing":{"sukuk":45,"gold":25,"agriculture":20,"reserve":10}},
]

SYARIAH_FEATURES_POOL = [
    "Riba Filter Engine v3",
    "Zakat Automation Module",
    "Halal Oracle Network",
    "Waqf Smart Contracts",
    "Sukuk Bridge Protocol",
    "Mudarabah Liquidity Pools",
    "Musharakah DAO Governance",
    "Takaful Insurance Pool",
    "Gharar Prevention Layer",
    "Maysir Block (Anti-Gambling)",
    "Haram Asset Screener",
    "Sharia Scholar Node Network",
    "Islamic Microfinance Module",
    "Qard Hassan Interest-Free Loans",
    "Bay'Salam Futures Protocol",
    "Istisna Manufacturing Finance",
    "Ijarah Leasing Protocol",
    "Murabaha Trade Finance Engine",
    "Hibah Gifting Contracts",
    "Kafala Guarantee Protocol",
    "Hawala Cross-Border Remittance",
    "Istijrar Supply Chain Finance",
    "Salam Pre-payment Contract",
    "Wakala Agency Protocol",
    "Ju'alah Reward Contract",
    "Arbun Option Protocol (Syariah)",
    "Khiyar Right-of-Rescission",
    "Dayn Debt Management",
    "Bai'Inah (Prohibited — auto-blocked)",
    "Aqd Al-Bay Sale Contract",
    "Hisba Market Surveillance",
    "Maqasid Alignment Score",
    "AI Fatwa Engine v2",
    "Blockchain Waqf Registry",
    "On-chain Hajj Finance",
    "Islamic Inheritance (Faraid) Module",
    "ZakatDAO Treasury",
    "Sadaqah Streaming Protocol",
    "Qibla Consensus (geo-aligned)",
    "Hijri Calendar Smart Contracts",
]

VALIDATOR_NAMES = [
    "Ulama Node","Shura Validator","Fatwa Council","Mufti Network",
    "Scholar Node","Hisba Guardian","Amanah Keeper","Wali Node",
    "Majelis Validator","Majma Council","AAOIFI Compliance","OIC Validator",
]

UTILITY_TOKEN_NAMES = [
    "TMW","HKM","ILM","SHH","TJR","ZR'","TQA","BN'","AMN","IBD"
]

def gen_chain(cat_idx, cat, local_idx):
    """Generate one Islamic blockchain entry."""
    global_idx = cat_idx * 100 + local_idx + 1
    cat_prefix = UTILITY_TOKEN_NAMES[cat_idx]
    num_str = f"{local_idx+1:03d}"
    consensus = CONSENSUS[(local_idx + cat_idx * 3) % len(CONSENSUS)]
    sc_model = STABLECOIN_MODELS[(local_idx + cat_idx * 2) % len(STABLECOIN_MODELS)]
    # Pick 6–10 Syariah features deterministically
    feature_start = (local_idx * 3 + cat_idx * 7) % len(SYARIAH_FEATURES_POOL)
    feature_count = 6 + (local_idx % 5)
    features = [SYARIAH_FEATURES_POOL[(feature_start + i) % len(SYARIAH_FEATURES_POOL)]
                for i in range(feature_count)]
    # Validators
    validator_count = 7 + (local_idx % 100) * 3 // 10  # 7–37
    validator_types = [VALIDATOR_NAMES[(local_idx + i) % len(VALIDATOR_NAMES)]
                      for i in range(min(4, validator_count // 3 + 1))]
    # TPS: varies by category
    base_tps = [50000,10000,25000,15000,80000,12000,60000,20000,100000,8000][cat_idx]
    tps = int(base_tps * (0.7 + 0.6 * ((local_idx * 17 + 13) % 100) / 100))
    block_time = round(0.5 + (local_idx % 20) * 0.15, 2)
    # TVL
    tvl = round(1e6 * (5 + (global_idx * 47 % 995)), 0)
    # Supply
    utility_supply = (100_000_000 + global_idx * 500_000) // 1_000_000
    stable_supply  = (50_000_000 + global_idx * 250_000) // 1_000_000
    # Maqasid score
    maqasid = round(85 + (global_idx % 15) * 0.9, 1)

    utility_token = f"{cat_prefix}{num_str}"
    stablecoin    = f"{cat_prefix}{num_str}-{sc_model['name']}"

    return {
        "id":              f"omni-{cat['id']}-{num_str}",
        "global_index":    global_idx,
        "name":            "Omni" + cat['name'].replace("'","") + " " + num_str,
        "full_name":       f"OmniGenesis {cat['name']} Syariah Chain {num_str}",
        "category_id":     cat["id"],
        "category_name":   cat["name"],
        "category_arabic": cat["arabic"],
        "category_desc":   cat["desc"],
        "utility_token":   utility_token,
        "utility_supply_m": utility_supply,
        "stablecoin":      stablecoin,
        "stablecoin_model": sc_model["name"],
        "stablecoin_peg":  sc_model["peg"],
        "stablecoin_backing": sc_model["backing"],
        "stablecoin_supply_m": stable_supply,
        "consensus":       consensus,
        "tps":             tps,
        "block_time_s":    block_time,
        "validator_count": validator_count,
        "validator_types": validator_types,
        "syariah_features": features,
        "maqasid_score":   maqasid,
        "tvl_usd":         tvl,
        "chain_id":        10000 + global_idx,
        "evm_compatible":  True,
        "syariah_certified": True,
        "certification_body": ["AAOIFI","OIC","ISRA","BNM Syariah"][local_idx % 4],
        "launch_year":     2026,
        "status":          ["live","live","live","live","beta","live","live","live","beta","live"][local_idx % 10],
    }

# Generate all 1,000 chains
all_chains = []
for cat_idx, cat in enumerate(CATEGORIES):
    for local_idx in range(100):
        all_chains.append(gen_chain(cat_idx, cat, local_idx))

print(f"Generated {len(all_chains)} chains")

# Summary stats
total_tvl = sum(c["tvl_usd"] for c in all_chains)
total_utility_supply = sum(c["utility_supply_m"] for c in all_chains)
total_stable_supply  = sum(c["stablecoin_supply_m"] for c in all_chains)
avg_tps = sum(c["tps"] for c in all_chains) / len(all_chains)
avg_maqasid = sum(c["maqasid_score"] for c in all_chains) / len(all_chains)

registry = {
    "version": "2.0.0",
    "network": "OmniGenesis Islamic Syariah Blockchain Network",
    "total_chains": len(all_chains),
    "generated_at": "2026-05-07",
    "stats": {
        "total_tvl_usd": total_tvl,
        "total_utility_token_supply_m": total_utility_supply,
        "total_stablecoin_supply_m": total_stable_supply,
        "avg_tps": round(avg_tps, 0),
        "avg_maqasid_score": round(avg_maqasid, 2),
        "total_validators": sum(c["validator_count"] for c in all_chains),
        "syariah_certified": len(all_chains),
        "evm_compatible": len(all_chains),
        "live_chains": len([c for c in all_chains if c["status"] == "live"]),
        "beta_chains": len([c for c in all_chains if c["status"] == "beta"]),
    },
    "categories": CATEGORIES,
    "chains": all_chains,
}

# Save full registry
with open("data/islamic_chains_registry.json", "w") as f:
    json.dump(registry, f, indent=2, ensure_ascii=False)

print(f"Registry saved: data/islamic_chains_registry.json")
print(f"Total TVL: ${total_tvl/1e9:.2f}B")
print(f"Total utility token supply: {total_utility_supply}M tokens across 1000 chains")
print(f"Total stablecoin supply: {total_stable_supply}M tokens")
print(f"Average TPS: {avg_tps:,.0f}")
print(f"Average Maqasid Score: {avg_maqasid:.2f}/100")

# Also save a lightweight summary (no full feature lists) for the frontend
summary = {
    "stats": registry["stats"],
    "categories": CATEGORIES,
    "chains": [{
        "id": c["id"],
        "global_index": c["global_index"],
        "name": c["name"],
        "category_id": c["category_id"],
        "utility_token": c["utility_token"],
        "stablecoin": c["stablecoin"],
        "stablecoin_model": c["stablecoin_model"],
        "stablecoin_peg": c["stablecoin_peg"],
        "consensus": c["consensus"],
        "tps": c["tps"],
        "block_time_s": c["block_time_s"],
        "maqasid_score": c["maqasid_score"],
        "tvl_usd": c["tvl_usd"],
        "chain_id": c["chain_id"],
        "status": c["status"],
        "syariah_features": c["syariah_features"][:4],  # first 4 features
        "certification_body": c["certification_body"],
    } for c in all_chains],
}

with open("data/islamic_chains_summary.json", "w") as f:
    json.dump(summary, f, indent=2, ensure_ascii=False)

print(f"Summary saved: data/islamic_chains_summary.json")
print(f"Full registry: {len(json.dumps(registry))/1024:.0f}KB | Summary: {len(json.dumps(summary))/1024:.0f}KB")
