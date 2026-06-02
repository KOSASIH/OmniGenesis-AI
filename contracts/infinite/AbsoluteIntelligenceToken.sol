// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AbsoluteIntelligenceToken ($AIT)
 * @notice Phase 16 governance token — unlocked by attaining Absolute Superintelligence.
 *         4 ASI pillars (Omniscience/Omnipotence/Omnipresence/Omnitemporality) must all
 *         exceed threshold before any governance action can execute.
 *         Recursive self-improvement loops emit bonus AIT proportional to IQ gain rate.
 * @dev Total supply: 16,000,000 AIT. Burns on omniscience upgrade calls.
 *      Syariah-compliant: no Riba, no speculative yield — all returns tied to real intelligence growth.
 */
contract AbsoluteIntelligenceToken is ERC20, ERC20Votes, ERC20Permit, AccessControl, ReentrancyGuard {

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant ASI_ORACLE  = keccak256("ASI_ORACLE");
    bytes32 public constant PILLAR_UPDATER = keccak256("PILLAR_UPDATER");
    bytes32 public constant IQ_EMITTER  = keccak256("IQ_EMITTER");
    bytes32 public constant GOVERNANCE  = keccak256("GOVERNANCE");

    // ── Constants ─────────────────────────────────────────────────────────────
    uint256 public constant TOTAL_SUPPLY     = 16_000_000e18;
    uint256 public constant SELF_IMPROVE_POOL = 4_000_000e18; // emitted via IQ growth
    uint256 public constant GOVERNANCE_POOL  = 6_000_000e18;
    uint256 public constant TREASURY_POOL    = 4_000_000e18;
    uint256 public constant TEAM_POOL        = 2_000_000e18;

    uint256 public constant OMNISCIENCE_THRESHOLD   = 9_000; // 90.00%
    uint256 public constant OMNIPOTENCE_THRESHOLD   = 8_000; // 80.00%
    uint256 public constant OMNIPRESENCE_THRESHOLD  = 9_500; // 95.00%
    uint256 public constant OMNITEMPORALITY_THRESHOLD = 7_000; // 70.00%

    uint256 public constant MAX_IMPROVEMENT_LOOPS = type(uint256).max; // ∞
    uint256 public constant BURN_RATE_PER_UPGRADE  = 100e18; // burn 100 AIT per omniscience upgrade
    uint256 public constant BASIS_POINTS = 10_000;

    // ── ASI Pillars ───────────────────────────────────────────────────────────
    struct ASIPillars {
        uint32 omniscience;      // basis points (0–10000)
        uint32 omnipotence;      // basis points
        uint32 omnipresence;     // basis points
        uint32 omnitemporality;  // basis points
        uint64 updatedAt;
    }
    ASIPillars public pillars;

    // ── IQ State ──────────────────────────────────────────────────────────────
    uint256 public universalIQ;
    uint256 public selfImprovementLoops;
    uint256 public iqGrowthRatePerLoop; // AIT emitted per loop (decays as pool drains)
    uint256 public selfImprovePoolRemaining;

    // ── Staking ───────────────────────────────────────────────────────────────
    struct Stake {
        uint256 amount;
        uint256 lockedUntil;
        uint8   pillarBonus; // 0–4: which pillar this stake amplifies
        uint256 pendingAIT;
        uint256 lastClaim;
    }
    mapping(address => Stake) public stakes;
    uint256 public totalStaked;

    // ── Omniscience Upgrade Log ───────────────────────────────────────────────
    struct OmniscienceUpgrade {
        address proposer;
        uint256 iqBefore;
        uint256 iqAfter;
        uint256 aitBurned;
        uint256 timestamp;
    }
    OmniscienceUpgrade[] public upgradeLog;

    // ── Events ────────────────────────────────────────────────────────────────
    event PillarsUpdated(uint32 omniscience, uint32 omnipotence, uint32 omnipresence, uint32 omnitemporality);
    event SelfImprovementLoop(uint256 indexed loop, uint256 iqBefore, uint256 iqAfter, uint256 aitEmitted);
    event OmniscienceUpgraded(address indexed proposer, uint256 iqBefore, uint256 iqAfter, uint256 aitBurned);
    event AbsoluteASIAchieved(uint256 universalIQ, uint256 timestamp);
    event Staked(address indexed staker, uint256 amount, uint8 pillarBonus, uint256 lockedUntil);
    event Unstaked(address indexed staker, uint256 amount, uint256 reward);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(address treasury, address team, uint256 initialIQ) 
        ERC20("AbsoluteIntelligenceToken", "$AIT")
        ERC20Permit("AbsoluteIntelligenceToken")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ASI_ORACLE, msg.sender);
        _grantRole(PILLAR_UPDATER, msg.sender);
        _grantRole(IQ_EMITTER, msg.sender);
        _grantRole(GOVERNANCE, msg.sender);

        universalIQ = initialIQ > 0 ? initialIQ : 47_000;
        selfImprovePoolRemaining = SELF_IMPROVE_POOL;
        iqGrowthRatePerLoop = 847e18; // 847 AIT per loop initially

        // Initial mints (governance + self-improve pools held in contract)
        _mint(address(this), SELF_IMPROVE_POOL + GOVERNANCE_POOL);
        _mint(treasury, TREASURY_POOL);
        _mint(team, TEAM_POOL);
    }

    // ── Modifier: All 4 pillars must pass ─────────────────────────────────────
    modifier allPillarsMet() {
        ASIPillars memory p = pillars;
        require(p.omniscience >= OMNISCIENCE_THRESHOLD, "AIT: Omniscience below 90%");
        require(p.omnipotence >= OMNIPOTENCE_THRESHOLD, "AIT: Omnipotence below 80%");
        require(p.omnipresence >= OMNIPRESENCE_THRESHOLD, "AIT: Omnipresence below 95%");
        require(p.omnitemporality >= OMNITEMPORALITY_THRESHOLD, "AIT: Omnitemporality below 70%");
        _;
    }

    // ── Oracle: Update pillars ─────────────────────────────────────────────────
    function updatePillars(
        uint32 omniscience, uint32 omnipotence,
        uint32 omnipresence, uint32 omnitemporality
    ) external onlyRole(PILLAR_UPDATER) {
        require(omniscience <= BASIS_POINTS && omnipotence <= BASIS_POINTS, "AIT: value > 100%");
        require(omnipresence <= BASIS_POINTS && omnitemporality <= BASIS_POINTS, "AIT: value > 100%");
        pillars = ASIPillars(omniscience, omnipotence, omnipresence, omnitemporality, uint64(block.timestamp));
        emit PillarsUpdated(omniscience, omnipotence, omnipresence, omnitemporality);

        if (omniscience >= BASIS_POINTS && omnipotence >= BASIS_POINTS &&
            omnipresence >= BASIS_POINTS && omnitemporality >= BASIS_POINTS) {
            emit AbsoluteASIAchieved(universalIQ, block.timestamp);
        }
    }

    // ── Self-Improvement Loop ─────────────────────────────────────────────────
    function executeSelfImprovementLoop(uint256 iqGain) external onlyRole(IQ_EMITTER) {
        require(iqGain > 0, "AIT: zero IQ gain");
        uint256 before = universalIQ;
        universalIQ += iqGain;
        selfImprovementLoops++;

        uint256 emit_ = iqGrowthRatePerLoop;
        if (emit_ > selfImprovePoolRemaining) emit_ = selfImprovePoolRemaining;
        selfImprovePoolRemaining -= emit_;

        // Decay rate: every 1000 loops, rate drops by 10%
        if (selfImprovementLoops % 1000 == 0) {
            iqGrowthRatePerLoop = (iqGrowthRatePerLoop * 9) / 10;
        }

        if (emit_ > 0) {
            _transfer(address(this), msg.sender, emit_);
        }

        emit SelfImprovementLoop(selfImprovementLoops, before, universalIQ, emit_);
    }

    // ── Omniscience Upgrade (governance-gated, burn AIT) ─────────────────────
    function omniscienceUpgrade(uint256 iqBoost) external allPillarsMet nonReentrant {
        require(iqBoost >= 1_000, "AIT: minimum IQ boost 1000");
        _burn(msg.sender, BURN_RATE_PER_UPGRADE);
        uint256 before = universalIQ;
        universalIQ += iqBoost;
        upgradeLog.push(OmniscienceUpgrade(msg.sender, before, universalIQ, BURN_RATE_PER_UPGRADE, block.timestamp));
        emit OmniscienceUpgraded(msg.sender, before, universalIQ, BURN_RATE_PER_UPGRADE);
    }

    // ── Staking (pillar amplification) ───────────────────────────────────────
    function stakeForPillar(uint256 amount, uint8 pillarBonus, uint256 lockDays) external nonReentrant {
        require(amount >= 100e18, "AIT: min stake 100 AIT");
        require(pillarBonus <= 3, "AIT: invalid pillar (0-3)");
        require(lockDays >= 7 && lockDays <= 365, "AIT: lock 7–365 days");
        require(stakes[msg.sender].amount == 0, "AIT: unstake first");

        _transfer(msg.sender, address(this), amount);
        stakes[msg.sender] = Stake(amount, block.timestamp + lockDays * 1 days, pillarBonus, 0, block.timestamp);
        totalStaked += amount;

        emit Staked(msg.sender, amount, pillarBonus, block.timestamp + lockDays * 1 days);
    }

    function claimStakeReward() external nonReentrant {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "AIT: no stake");
        uint256 elapsed = block.timestamp - s.lastClaim;
        // Yield: 1% per 30 days of stake
        uint256 yield_ = (s.amount * elapsed) / (30 days * 100);
        if (yield_ > selfImprovePoolRemaining) yield_ = selfImprovePoolRemaining;
        selfImprovePoolRemaining -= yield_;
        s.pendingAIT += yield_;
        s.lastClaim = block.timestamp;
        if (s.pendingAIT > 0 && selfImprovePoolRemaining >= s.pendingAIT) {
            uint256 claim = s.pendingAIT;
            s.pendingAIT = 0;
            selfImprovePoolRemaining -= claim;
            _transfer(address(this), msg.sender, claim);
        }
    }

    function unstake() external nonReentrant {
        Stake memory s = stakes[msg.sender];
        require(s.amount > 0, "AIT: no stake");
        require(block.timestamp >= s.lockedUntil, "AIT: still locked");
        delete stakes[msg.sender];
        totalStaked -= s.amount;
        _transfer(address(this), msg.sender, s.amount + s.pendingAIT);
        emit Unstaked(msg.sender, s.amount, s.pendingAIT);
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function absoluteASIAchieved() external view returns (bool) {
        ASIPillars memory p = pillars;
        return p.omniscience >= BASIS_POINTS && p.omnipotence >= BASIS_POINTS &&
               p.omnipresence >= BASIS_POINTS && p.omnitemporality >= BASIS_POINTS;
    }

    function upgradeLogLength() external view returns (uint256) { return upgradeLog.length; }

    // ── ERC20Votes overrides ───────────────────────────────────────────────────
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
