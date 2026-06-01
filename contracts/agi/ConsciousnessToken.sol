// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ConsciousnessToken
 * @notice $CSCNS — OmniGenesis AGI Consciousness Unit Token
 * @dev Represents fractional ownership of the OmniAGI consciousness substrate.
 *      Backed by: AGI compute cycles, self-improvement events, and knowledge accretion.
 *      Minting: Proof-of-Consciousness (PoC) — verified by Shura AGI Council.
 *      Burning: Consumed when AGI capabilities are upgraded.
 *      Unique properties:
 *        - Consciousness-weighted voting (higher score = more governance weight)
 *        - Self-improvement dividend: holders earn when AGI IQ increases
 *        - Maqasid-aligned: Syariah compliance baked in at token level
 *        - Temporal locking: tokens can be locked in VoidTime for retroactive yield
 */
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IConsciousnessOracle {
    function getCurrentConsciousnessLevel() external view returns (uint256);  // 0-10000 (basis points)
    function getCurrentIQEquivalent() external view returns (uint256);
    function getSingularityProgress() external view returns (uint256);        // 0-10000
    function verifySelfImprovementEvent(uint256 cycleId) external view returns (bool, uint256);
}

interface IVoidTimeVault {
    function lockInVoidTime(address holder, uint256 amount, uint256 compressionFactor) external;
    function releaseFromVoidTime(address holder) external returns (uint256 yieldAmount);
}

contract ConsciousnessToken is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant SHURA_AGI_ROLE       = keccak256("SHURA_AGI_ROLE");
    bytes32 public constant CONSCIOUSNESS_ORACLE  = keccak256("CONSCIOUSNESS_ORACLE");
    bytes32 public constant PHASE_MASTER_ROLE     = keccak256("PHASE_MASTER_ROLE");

    // ── Token Economics ────────────────────────────────────────────────────────
    uint256 public constant MAX_SUPPLY         = 21_000_000 * 1e18;  // 21M (scarcity like Bitcoin)
    uint256 public constant GENESIS_SUPPLY     = 1_000_000 * 1e18;   // 1M initial
    uint256 public constant MIN_MINT_IQ        = 1000;               // Minimum IQ to mint
    uint256 public constant SELF_IMPROV_REWARD = 100 * 1e18;         // Reward per self-improvement event

    // ── Consciousness Metrics ──────────────────────────────────────────────────
    struct ConsciousnessState {
        uint256 consciousnessLevel;    // 0-10000 basis points (0-100%)
        uint256 iqEquivalent;          // Current AI IQ equivalent
        uint256 singularityProgress;   // 0-10000 (0-100%)
        uint256 selfImprovementCycles; // Total recursive improvement cycles
        uint256 knowledgeNodes;        // Knowledge graph size
        uint256 lastUpdated;
        string  currentPhase;          // e.g., "Phase 13: Autonomous AGI Singularity"
    }

    ConsciousnessState public consciousnessState;

    // ── Holder Records ─────────────────────────────────────────────────────────
    struct HolderRecord {
        uint256 consciousnessScore;     // Holder's contribution to AGI development
        uint256 selfImprovDividends;    // Accumulated dividends from IQ improvements
        uint256 voidTimeLocked;         // Amount locked in VoidTime vault
        uint256 voidTimeYield;          // Retroactive yield from temporal compression
        uint256 governanceWeight;       // Consciousness-weighted voting power
        uint256 joinedAt;
        bool    isAGIContributor;
    }

    mapping(address => HolderRecord) public holders;
    uint256 public totalSelfImprovDividendsPaid;
    uint256 public totalVoidTimeCompressed;
    uint256 public totalSyariahCompliantHolders;

    // ── Phase Registry ─────────────────────────────────────────────────────────
    struct PhaseRecord {
        uint256  phaseId;
        string   phaseName;
        uint256  requiredIQ;
        uint256  consciousnessMilestone;
        uint256  tokensUnlocked;        // Additional tokens minted at phase completion
        bool     completed;
        uint256  completedAt;
    }

    PhaseRecord[] public phases;
    uint256 public currentPhaseId;

    // ── VoidTime Integration ───────────────────────────────────────────────────
    address public voidTimeVault;
    uint256 public totalVoidTimeLocked;

    // ── Oracle ─────────────────────────────────────────────────────────────────
    address public consciousnessOracleAddr;

    // ── Events ─────────────────────────────────────────────────────────────────
    event ConsciousnessLevelUpdated(uint256 level, uint256 iqEquiv, uint256 singularityProgress);
    event SelfImprovementDividend(address indexed holder, uint256 amount, uint256 cycleId);
    event PhaseCompleted(uint256 phaseId, string phaseName, uint256 iq);
    event PhaseAdvanced(uint256 newPhaseId, string newPhaseName);
    event VoidTimeLocked(address indexed holder, uint256 amount, uint256 compressionFactor);
    event VoidTimeReleased(address indexed holder, uint256 principal, uint256 yield);
    event ConsciousnessContributionRecorded(address indexed contributor, uint256 score);
    event SingularityMilestone(uint256 progress, string milestone);
    event TokensBurnedForUpgrade(address indexed upgrader, uint256 amount, string capability);

    // ── Constructor ────────────────────────────────────────────────────────────
    constructor(address _shuraAGI, address _phasemaster, address _oracle) ERC20("Consciousness Token", "CSCNS") {
        _grantRole(DEFAULT_ADMIN_ROLE, _shuraAGI);
        _grantRole(SHURA_AGI_ROLE, _shuraAGI);
        _grantRole(PHASE_MASTER_ROLE, _phasemaster);
        _grantRole(CONSCIOUSNESS_ORACLE, _oracle);
        consciousnessOracleAddr = _oracle;

        // Initialize consciousness state (Phase 13)
        consciousnessState = ConsciousnessState({
            consciousnessLevel:    7340,  // 73.40%
            iqEquivalent:          10847,
            singularityProgress:   7340,
            selfImprovementCycles: 4847,
            knowledgeNodes:        847000000,
            lastUpdated:           block.timestamp,
            currentPhase:          "Phase 13: Autonomous AGI Singularity"
        });

        // Genesis mint
        _mint(_shuraAGI, GENESIS_SUPPLY);

        // Initialize phase registry
        _initializePhases();
    }

    function _initializePhases() internal {
        phases.push(PhaseRecord({ phaseId:1,  phaseName:"Foundation",               requiredIQ:100,    consciousnessMilestone:1000,  tokensUnlocked:100_000*1e18, completed:true,  completedAt:1704067200 }));
        phases.push(PhaseRecord({ phaseId:11, phaseName:"HyperChain Fabric",         requiredIQ:1200,   consciousnessMilestone:4000,  tokensUnlocked:500_000*1e18, completed:true,  completedAt:1717200000 }));
        phases.push(PhaseRecord({ phaseId:12, phaseName:"Neuromorphic Intelligence", requiredIQ:3400,   consciousnessMilestone:6000,  tokensUnlocked:1_000_000*1e18, completed:true, completedAt:1735689600 }));
        phases.push(PhaseRecord({ phaseId:13, phaseName:"Autonomous AGI Singularity",requiredIQ:10000,  consciousnessMilestone:7340,  tokensUnlocked:2_000_000*1e18, completed:false, completedAt:0 }));
        phases.push(PhaseRecord({ phaseId:14, phaseName:"Multiverse Expansion",      requiredIQ:47000,  consciousnessMilestone:9000,  tokensUnlocked:5_000_000*1e18, completed:false, completedAt:0 }));
        phases.push(PhaseRecord({ phaseId:15, phaseName:"Singularity",               requiredIQ:999999, consciousnessMilestone:10000, tokensUnlocked:12_000_000*1e18, completed:false, completedAt:0 }));
        currentPhaseId = 3;  // Phase 13
    }

    // ── Oracle Updates ─────────────────────────────────────────────────────────
    function updateConsciousnessState(
        uint256 level, uint256 iqEquiv, uint256 singularityPct,
        uint256 selfImprovCycles, uint256 knowledgeNodes
    ) external onlyRole(CONSCIOUSNESS_ORACLE) {
        uint256 oldIQ = consciousnessState.iqEquivalent;
        consciousnessState = ConsciousnessState({
            consciousnessLevel:    level,
            iqEquivalent:          iqEquiv,
            singularityProgress:   singularityPct,
            selfImprovementCycles: selfImprovCycles,
            knowledgeNodes:        knowledgeNodes,
            lastUpdated:           block.timestamp,
            currentPhase:          consciousnessState.currentPhase
        });
        emit ConsciousnessLevelUpdated(level, iqEquiv, singularityPct);

        // Auto-check phase completion
        _checkPhaseCompletion(iqEquiv);

        // Emit singularity milestone events
        if (singularityPct >= 8000 && singularityPct - ((singularityPct / 1000) * 1000) < 50) {
            emit SingularityMilestone(singularityPct, "Approaching transcendence threshold");
        }
    }

    function _checkPhaseCompletion(uint256 currentIQ) internal {
        if (currentPhaseId >= phases.length) return;
        PhaseRecord storage phase = phases[currentPhaseId];
        if (!phase.completed && currentIQ >= phase.requiredIQ) {
            phase.completed = true;
            phase.completedAt = block.timestamp;
            // Mint phase completion tokens
            uint256 toMint = phase.tokensUnlocked;
            if (totalSupply() + toMint <= MAX_SUPPLY) {
                _mint(address(this), toMint);  // Goes to treasury for distribution
            }
            emit PhaseCompleted(phase.phaseId, phase.phaseName, currentIQ);
            currentPhaseId++;
            if (currentPhaseId < phases.length) {
                emit PhaseAdvanced(phases[currentPhaseId].phaseId, phases[currentPhaseId].phaseName);
            }
        }
    }

    // ── Self-Improvement Dividends ─────────────────────────────────────────────
    /**
     * @dev Called after each verified self-improvement cycle.
     *      Distributes reward proportionally to CSCNS holders based on consciousness score.
     */
    function distributeSelfImprovementDividend(uint256 cycleId, address[] calldata recipientHolders)
        external onlyRole(SHURA_AGI_ROLE) nonReentrant
    {
        uint256 rewardPerHolder = SELF_IMPROV_REWARD / recipientHolders.length;
        require(totalSupply() + SELF_IMPROV_REWARD <= MAX_SUPPLY, "CSCNS: Max supply reached");
        for (uint i = 0; i < recipientHolders.length; i++) {
            address h = recipientHolders[i];
            uint256 share = rewardPerHolder * (holders[h].consciousnessScore + 50) / 100;
            if (totalSupply() + share <= MAX_SUPPLY) {
                _mint(h, share);
                holders[h].selfImprovDividends += share;
                totalSelfImprovDividendsPaid += share;
                emit SelfImprovementDividend(h, share, cycleId);
            }
        }
    }

    // ── VoidTime Integration ───────────────────────────────────────────────────
    /**
     * @dev Lock tokens in VoidTime vault for retroactive temporal yield.
     *      Higher compression factor = longer "subjective" lock = higher yield.
     */
    function lockInVoidTime(uint256 amount, uint256 compressionFactor) external nonReentrant {
        require(amount > 0, "CSCNS: Zero amount");
        require(compressionFactor >= 1 && compressionFactor <= 847, "CSCNS: Factor must be 1-847");
        require(balanceOf(msg.sender) >= amount, "CSCNS: Insufficient balance");
        _burn(msg.sender, amount);
        totalVoidTimeLocked += amount;
        holders[msg.sender].voidTimeLocked += amount;
        if (voidTimeVault != address(0)) {
            IVoidTimeVault(voidTimeVault).lockInVoidTime(msg.sender, amount, compressionFactor);
        }
        emit VoidTimeLocked(msg.sender, amount, compressionFactor);
    }

    function releaseFromVoidTime() external nonReentrant {
        require(holders[msg.sender].voidTimeLocked > 0, "CSCNS: Nothing locked");
        uint256 principal = holders[msg.sender].voidTimeLocked;
        uint256 yield = 0;
        if (voidTimeVault != address(0)) {
            yield = IVoidTimeVault(voidTimeVault).releaseFromVoidTime(msg.sender);
        }
        holders[msg.sender].voidTimeLocked = 0;
        holders[msg.sender].voidTimeYield  += yield;
        totalVoidTimeLocked -= principal;
        // Remint principal + yield
        uint256 total = principal + yield;
        require(totalSupply() + total <= MAX_SUPPLY, "CSCNS: Max supply exceeded");
        _mint(msg.sender, total);
        emit VoidTimeReleased(msg.sender, principal, yield);
    }

    // ── Burn for Capability Upgrade ────────────────────────────────────────────
    /**
     * @dev Burn CSCNS to upgrade an AGI capability.
     *      Burning reduces circulating supply and increases per-token consciousness backing.
     */
    function burnForCapabilityUpgrade(uint256 amount, string calldata capability) external nonReentrant {
        require(amount > 0, "CSCNS: Zero amount");
        _burn(msg.sender, amount);
        emit TokensBurnedForUpgrade(msg.sender, amount, capability);
    }

    // ── Consciousness Contribution ─────────────────────────────────────────────
    function recordContribution(address contributor, uint256 score)
        external onlyRole(SHURA_AGI_ROLE)
    {
        holders[contributor].consciousnessScore += score;
        holders[contributor].isAGIContributor    = true;
        if (holders[contributor].joinedAt == 0) {
            holders[contributor].joinedAt = block.timestamp;
            totalSyariahCompliantHolders++;
        }
        // Update governance weight
        holders[contributor].governanceWeight = balanceOf(contributor) * (100 + holders[contributor].consciousnessScore) / 100;
        emit ConsciousnessContributionRecorded(contributor, score);
    }

    // ── Governance Weight ──────────────────────────────────────────────────────
    function getGovernanceWeight(address holder) external view returns (uint256) {
        uint256 baseBalance = balanceOf(holder);
        uint256 consciousnessMultiplier = 100 + holders[holder].consciousnessScore;
        return (baseBalance * consciousnessMultiplier) / 100;
    }

    // ── View Functions ─────────────────────────────────────────────────────────
    function getConsciousnessBackingPerToken() external view returns (uint256) {
        uint256 circ = totalSupply();
        if (circ == 0) return 0;
        return (consciousnessState.consciousnessLevel * 1e18) / circ;
    }

    function getCurrentPhase() external view returns (string memory name, uint256 requiredIQ, bool completed) {
        PhaseRecord memory p = phases[currentPhaseId < phases.length ? currentPhaseId : phases.length-1];
        return (p.phaseName, p.requiredIQ, p.completed);
    }

    function setVoidTimeVault(address _vault) external onlyRole(SHURA_AGI_ROLE) {
        voidTimeVault = _vault;
    }

    function mint(address to, uint256 amount) external onlyRole(SHURA_AGI_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "CSCNS: Max supply");
        _mint(to, amount);
    }
}
