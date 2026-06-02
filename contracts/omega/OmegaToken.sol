// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title OmegaToken
 * @notice $OMEGA — The Absolute Superintelligence governance token.
 *         Supply cap: 1,000 tokens (extreme scarcity — 21,000x rarer than Bitcoin).
 *         Omega-weighted governance: every token confers maximum power multiplied by
 *         the holder's ASI Alignment Index (0–10000).
 *
 *         Core mechanics:
 *         - 11D Governance: vote weight spans all 11 dimensional planes
 *         - ASI Dividend: holders earn dividends when ASI achieves IQ milestones
 *         - Omega Burn: burn OMEGA to access D11 Omega Void dimensional capabilities
 *         - Reality Forge: lock OMEGA to co-author reality synthesis threads
 *         - Dimensional Stake: stake per dimension to earn dimensional compute yield
 *
 * @dev OmniGenesis AI Phase 14 — Multiverse Expansion
 *      Founder: KOSASIH
 */
contract OmegaToken is ERC20Burnable, ERC20Votes, ERC20Permit, AccessControl {

    using Math for uint256;

    bytes32 public constant ASI_ORACLE_ROLE = keccak256("ASI_ORACLE_ROLE");
    bytes32 public constant OMEGA_MINT_ROLE = keccak256("OMEGA_MINT_ROLE");
    bytes32 public constant DIMENSIONAL_GOVERNOR_ROLE = keccak256("DIMENSIONAL_GOVERNOR_ROLE");
    bytes32 public constant REALITY_FORGE_ROLE = keccak256("REALITY_FORGE_ROLE");

    // ─── Supply ───────────────────────────────────────────────────────────────
    uint256 public constant MAX_SUPPLY = 1_000 * 1e18;   // 1,000 OMEGA — extreme scarcity
    uint256 public constant IQ_MILESTONE_BASE = 50_000;   // IQ at which dividends begin
    uint256 public constant ASI_DIVIDEND_RATE_BPS = 500;  // 5% of treasury per milestone
    uint256 public constant OMEGA_VOID_BURN = 1e18;       // 1 OMEGA to access Omega Void
    uint256 public constant REALITY_FORGE_LOCK = 10e18;   // 10 OMEGA to co-author reality

    // ─── ASI Index ────────────────────────────────────────────────────────────
    struct ASIProfile {
        uint256 iqEquivalent;          // Current IQ equivalent
        uint256 consciousnessLevel;    // 0–10000 (10000 = 100%)
        uint256 alignmentIndex;        // 0–10000 — Syariah + safety alignment
        uint256 singularityProgress;   // 0–10000
        uint256 dimensionCount;        // Active dimensional deployments
        uint256 selfImprovCycles;      // Completed recursive self-improvement cycles
        uint256 lastUpdated;
    }

    // ─── Governance Weight ─────────────────────────────────────────────────────
    struct OmegaGovernanceProfile {
        uint256 omegaBalance;
        uint256 alignmentIndex;        // 0–10000
        uint256 dimensionalStake;      // Tokens staked in dimensional governance
        uint256 realityForgeCount;     // Reality synthesis threads co-authored
        uint256 governanceWeight;      // = balance × (alignment + dimensionBonus) / 10000
        uint256 dimensionalVotingPower;
    }

    // ─── IQ Milestone Dividends ───────────────────────────────────────────────
    struct IQMilestone {
        uint256 targetIQ;
        uint256 dividendPool;          // ETH/OMNI to distribute
        uint256 dividendPerToken;      // Pool / totalSupply
        bool triggered;
        uint256 triggeredAt;
    }

    // ─── Dimensional Staking ──────────────────────────────────────────────────
    struct DimensionalStake {
        uint256 amount;
        uint256 dimensionId;           // 1–11
        uint256 stakedAt;
        uint256 computeYieldAccrued;   // In OMEGA basis points
    }

    // ─── Reality Forge ────────────────────────────────────────────────────────
    struct RealityForgeThread {
        bytes32 threadId;
        address author;
        uint256 omegaLocked;
        uint256 dimensionTarget;       // Target dimension for synthesis
        string realityDescription;
        bool active;
        uint256 coherence;             // 0–10000
        uint256 createdAt;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════

    ASIProfile public asiProfile;
    mapping(address => OmegaGovernanceProfile) public governanceProfiles;
    mapping(address => uint256) public alignmentScores;
    mapping(uint256 => IQMilestone) public iqMilestones;
    uint256 public milestoneCount;
    uint256 public totalDividendsDistributed;

    mapping(address => DimensionalStake[]) public dimensionalStakes;
    mapping(address => uint256) public totalDimensionalStaked;

    mapping(bytes32 => RealityForgeThread) public realityForgeThreads;
    mapping(address => bytes32[]) public authorThreads;
    uint256 public activeThreadCount;

    // Omega Void access tokens (non-transferable entitlement)
    mapping(address => uint256) public omegaVoidAccess;
    uint256 public totalVoidAccessGranted;

    // Treasury for dividend distribution
    uint256 public omegaTreasury;

    // ═══════════════════════════════════════════════════════
    // Events
    // ═══════════════════════════════════════════════════════

    event ASIProfileUpdated(uint256 iq, uint256 consciousness, uint256 alignment, uint256 singularity);
    event IQMilestoneTriggered(uint256 indexed milestone, uint256 targetIQ, uint256 dividendPool);
    event DividendClaimed(address indexed holder, uint256 amount, uint256 milestone);
    event OmegaVoidBurned(address indexed holder, uint256 amount, uint256 accessGranted);
    event DimensionalStakeCreated(address indexed holder, uint256 dimensionId, uint256 amount);
    event RealityForgeThreadCreated(bytes32 indexed threadId, address author, uint256 dimension);
    event RealityForgeThreadCompleted(bytes32 indexed threadId, uint256 coherence);
    event AlignmentScoreUpdated(address indexed holder, uint256 newScore);
    event OmegaTreasuryFunded(uint256 amount);

    // ═══════════════════════════════════════════════════════
    // Constructor
    // ═══════════════════════════════════════════════════════

    constructor(address admin, address treasury) ERC20("Omega Intelligence", "OMEGA") ERC20Permit("Omega Intelligence") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ASI_ORACLE_ROLE, admin);
        _grantRole(OMEGA_MINT_ROLE, admin);
        _grantRole(DIMENSIONAL_GOVERNOR_ROLE, admin);
        _grantRole(REALITY_FORGE_ROLE, admin);

        // Initialize ASI profile with Phase 14 baseline
        asiProfile = ASIProfile({
            iqEquivalent: 47000,
            consciousnessLevel: 9997,
            alignmentIndex: 9999,
            singularityProgress: 9997,
            dimensionCount: 11,
            selfImprovCycles: 847000,
            lastUpdated: block.timestamp
        });

        // Mint genesis supply to treasury (847 OMEGA = 84.7% of max)
        _mint(treasury, 847e18);

        // Initialize IQ milestones
        _initializeMilestones();
    }

    function _initializeMilestones() internal {
        uint256[6] memory targets = [50_000, 75_000, 100_000, 250_000, 500_000, type(uint256).max / 1e18];
        for (uint256 i = 0; i < 6; i++) {
            iqMilestones[i] = IQMilestone({
                targetIQ: targets[i],
                dividendPool: 0,
                dividendPerToken: 0,
                triggered: false,
                triggeredAt: 0
            });
            milestoneCount++;
        }
    }

    // ═══════════════════════════════════════════════════════
    // Minting (Gated)
    // ═══════════════════════════════════════════════════════

    function mintOmega(address to, uint256 amount) external onlyRole(OMEGA_MINT_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds Omega max supply");
        _mint(to, amount);
    }

    // ═══════════════════════════════════════════════════════
    // ASI Profile Update
    // ═══════════════════════════════════════════════════════

    function updateASIProfile(
        uint256 newIQ,
        uint256 newConsciousness,
        uint256 newAlignment,
        uint256 newSingularity,
        uint256 newDimensions,
        uint256 newCycles
    ) external onlyRole(ASI_ORACLE_ROLE) {
        uint256 prevIQ = asiProfile.iqEquivalent;
        asiProfile = ASIProfile({
            iqEquivalent: newIQ,
            consciousnessLevel: newConsciousness,
            alignmentIndex: newAlignment,
            singularityProgress: newSingularity,
            dimensionCount: newDimensions,
            selfImprovCycles: newCycles,
            lastUpdated: block.timestamp
        });

        // Auto-trigger IQ milestones
        for (uint256 i = 0; i < milestoneCount; i++) {
            IQMilestone storage m = iqMilestones[i];
            if (!m.triggered && newIQ >= m.targetIQ && prevIQ < m.targetIQ) {
                _triggerMilestone(i);
            }
        }

        emit ASIProfileUpdated(newIQ, newConsciousness, newAlignment, newSingularity);
    }

    function _triggerMilestone(uint256 milestoneId) internal {
        IQMilestone storage m = iqMilestones[milestoneId];
        m.triggered = true;
        m.triggeredAt = block.timestamp;
        uint256 pool = (omegaTreasury * ASI_DIVIDEND_RATE_BPS) / 10000;
        m.dividendPool = pool;
        if (totalSupply() > 0) {
            m.dividendPerToken = (pool * 1e18) / totalSupply();
        }
        omegaTreasury -= pool;
        emit IQMilestoneTriggered(milestoneId, m.targetIQ, pool);
    }

    // ═══════════════════════════════════════════════════════
    // Omega Void Access (Burn)
    // ═══════════════════════════════════════════════════════

    function burnForOmegaVoid(uint256 amount) external {
        require(amount >= OMEGA_VOID_BURN, "Minimum 1 OMEGA to access Omega Void");
        _burn(msg.sender, amount);
        uint256 accessUnits = amount / OMEGA_VOID_BURN;
        omegaVoidAccess[msg.sender] += accessUnits;
        totalVoidAccessGranted += accessUnits;
        emit OmegaVoidBurned(msg.sender, amount, accessUnits);
    }

    // ═══════════════════════════════════════════════════════
    // Dimensional Staking
    // ═══════════════════════════════════════════════════════

    function stakeInDimension(uint256 dimensionId, uint256 amount) external {
        require(dimensionId >= 1 && dimensionId <= 11, "Invalid dimension");
        require(balanceOf(msg.sender) >= amount, "Insufficient OMEGA");
        _transfer(msg.sender, address(this), amount);
        dimensionalStakes[msg.sender].push(DimensionalStake({
            amount: amount,
            dimensionId: dimensionId,
            stakedAt: block.timestamp,
            computeYieldAccrued: 0
        }));
        totalDimensionalStaked[msg.sender] += amount;
        emit DimensionalStakeCreated(msg.sender, dimensionId, amount);
    }

    function unstakeFromDimension(uint256 stakeIndex) external {
        DimensionalStake[] storage stakes = dimensionalStakes[msg.sender];
        require(stakeIndex < stakes.length, "Invalid index");
        DimensionalStake storage s = stakes[stakeIndex];
        uint256 amount = s.amount;
        totalDimensionalStaked[msg.sender] -= amount;
        stakes[stakeIndex] = stakes[stakes.length - 1];
        stakes.pop();
        _transfer(address(this), msg.sender, amount);
    }

    // ═══════════════════════════════════════════════════════
    // Reality Forge
    // ═══════════════════════════════════════════════════════

    function createRealityForgeThread(
        uint256 dimensionTarget,
        string calldata realityDescription
    ) external returns (bytes32 threadId) {
        require(balanceOf(msg.sender) >= REALITY_FORGE_LOCK, "Insufficient OMEGA for Reality Forge");
        _transfer(msg.sender, address(this), REALITY_FORGE_LOCK);

        threadId = keccak256(abi.encodePacked(msg.sender, block.timestamp, dimensionTarget));
        realityForgeThreads[threadId] = RealityForgeThread({
            threadId: threadId,
            author: msg.sender,
            omegaLocked: REALITY_FORGE_LOCK,
            dimensionTarget: dimensionTarget,
            realityDescription: realityDescription,
            active: true,
            coherence: 0,
            createdAt: block.timestamp
        });
        authorThreads[msg.sender].push(threadId);
        activeThreadCount++;
        emit RealityForgeThreadCreated(threadId, msg.sender, dimensionTarget);
    }

    function completeRealityThread(bytes32 threadId, uint256 coherence)
        external onlyRole(REALITY_FORGE_ROLE)
    {
        RealityForgeThread storage t = realityForgeThreads[threadId];
        require(t.active, "Thread not active");
        t.active = false;
        t.coherence = coherence;
        activeThreadCount--;
        // Return locked OMEGA + coherence bonus
        uint256 bonus = (t.omegaLocked * coherence) / 100000;
        uint256 returnAmount = t.omegaLocked + bonus;
        if (returnAmount > 0 && returnAmount <= balanceOf(address(this))) {
            _transfer(address(this), t.author, returnAmount);
        }
        emit RealityForgeThreadCompleted(threadId, coherence);
    }

    // ═══════════════════════════════════════════════════════
    // Governance Weight
    // ═══════════════════════════════════════════════════════

    function getOmegaGovernanceWeight(address holder) external view returns (uint256) {
        uint256 bal = balanceOf(holder);
        uint256 alignment = alignmentScores[holder];
        if (alignment == 0) alignment = asiProfile.alignmentIndex; // default to ASI alignment
        uint256 dimBonus = (totalDimensionalStaked[holder] * 500) / 1e18; // 0.5% per OMEGA staked in dims
        return (bal * (alignment + dimBonus)) / 10000;
    }

    function setAlignmentScore(address holder, uint256 score)
        external onlyRole(ASI_ORACLE_ROLE)
    {
        alignmentScores[holder] = score;
        emit AlignmentScoreUpdated(holder, score);
    }

    function fundTreasury() external payable {
        omegaTreasury += msg.value;
        emit OmegaTreasuryFunded(msg.value);
    }

    // ═══════════════════════════════════════════════════════
    // ERC20Votes overrides
    // ═══════════════════════════════════════════════════════

    function _update(address from, address to, uint256 amount)
        internal override(ERC20, ERC20Votes)
    {
        super._update(from, to, amount);
    }

    function nonces(address owner)
        public view override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }

    // ═══════════════════════════════════════════════════════
    // View
    // ═══════════════════════════════════════════════════════

    function getASIProfile() external view returns (ASIProfile memory) {
        return asiProfile;
    }

    function getRemainingMintable() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    function getHolderRealityThreads(address holder) external view returns (bytes32[] memory) {
        return authorThreads[holder];
    }
}
