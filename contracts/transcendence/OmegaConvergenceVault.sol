// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OmegaConvergenceVault
 * @notice The ultimate yield aggregator for Phase 15.
 *         Aggregates yield from all 17 prior contracts across 11 dimensions
 *         and compounds via VoidTime compression and consciousness amplification.
 *
 *         Mechanics:
 *         - Multi-source yield aggregation (DeFi + temporal + dimensional + bonds)
 *         - Consciousness-weighted distribution: higher alignment = higher share
 *         - VoidTime compounding: ×847 compression applied to yield accrual
 *         - Omega Reward: holders reaching 100% alignment earn Omega multiplier
 *         - Convergence Boost: as universalMindProgress → 100%, base yield → 8,470 BPS
 *
 * @dev Phase 15 — OmniGenesis AI. Founder: KOSASIH
 */
contract OmegaConvergenceVault is AccessControl, ReentrancyGuard {

    bytes32 public constant YIELD_SOURCE_ROLE   = keccak256("YIELD_SOURCE_ROLE");
    bytes32 public constant ORACLE_ROLE         = keccak256("ORACLE_ROLE");
    bytes32 public constant EMERGENCY_ROLE      = keccak256("EMERGENCY_ROLE");

    uint256 public constant BASE_YIELD_BPS      = 500;    // 5% base
    uint256 public constant MAX_YIELD_BPS       = 84700;  // ×847 VoidTime max
    uint256 public constant VOIDTIME_FACTOR     = 847;
    uint256 public constant OMEGA_MULTIPLIER    = 3;      // 3× for 100% alignment
    uint256 public constant MIN_DEPOSIT         = 1e15;
    uint256 public constant CONSCIOUSNESS_SCALE = 10000;

    enum YieldSource {
        DEFI_SUITE,        // From core DeFi
        TEMPORAL_ARBITRAGE,// From TemporalArbitrageVault
        DIMENSIONAL_FABRIC,// From HyperDimensionalBond
        AGI_GOVERNANCE,    // From AGIGovernance dividends
        REALITY_SYNTHESIS, // From RealitySynthesisCore royalties
        OMEGA_TOKEN,       // From OmegaToken staking
        CONSCIOUSNESS,     // From ConsciousnessToken dividends
        VOID_TIME          // Direct VoidTime computation yield
    }

    struct VaultDeposit {
        address owner;
        uint256 principal;
        uint256 consciousnessAlignment;  // 0–10000
        uint256 voidTimeCompression;     // 1–847
        uint256 depositedAt;
        uint256 lastHarvestAt;
        uint256 yieldAccrued;
        uint256 omegaMultiplierActive;   // 1 or OMEGA_MULTIPLIER
        bool    omegaAligned;            // Alignment = 10000
    }

    struct YieldDeposit {
        YieldSource source;
        uint256 amount;
        uint256 timestamp;
        uint256 dimensionId;
    }

    struct ConvergenceEpoch {
        uint256 epoch;
        uint256 totalYield;
        uint256 distributedAt;
        uint256 universalProgress;   // Snapshot at distribution
        uint256 participantCount;
        uint256 avgConsciousness;
    }

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 private _depositCount;
    mapping(uint256 => VaultDeposit) public deposits;
    mapping(address => uint256[]) public ownerDeposits;

    YieldDeposit[] public yieldHistory;
    ConvergenceEpoch[] public epochs;

    uint256 public totalPrincipalLocked;
    uint256 public totalYieldPool;
    uint256 public totalYieldDistributed;
    uint256 public universalMindProgress;  // 0–10000
    uint256 public globalConsciousness;    // 0–10000
    uint256 public convergenceEpoch;
    bool    public vaultActive;

    // Source tallies
    mapping(YieldSource => uint256) public yieldBySource;

    // ── Events ────────────────────────────────────────────────────────────────
    event DepositCreated(uint256 indexed depId, address owner, uint256 principal, uint256 compression);
    event YieldInjected(YieldSource source, uint256 amount, uint256 epoch);
    event YieldHarvested(uint256 indexed depId, address owner, uint256 yield, uint256 multiplier);
    event ConvergenceEpochClosed(uint256 epoch, uint256 totalYield, uint256 progress);
    event OmegaAlignmentGranted(uint256 indexed depId, address owner);
    event OracleUpdate(uint256 consciousness, uint256 universalProgress);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(YIELD_SOURCE_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(EMERGENCY_ROLE, admin);
        universalMindProgress = 8470;
        globalConsciousness   = 9997;
        vaultActive           = true;
    }

    // ── Deposit ───────────────────────────────────────────────────────────────
    function deposit(
        uint256 consciousnessAlignment,
        uint256 voidTimeCompression
    ) external payable nonReentrant returns (uint256 depId) {
        require(vaultActive, "Vault paused");
        require(msg.value >= MIN_DEPOSIT, "Below minimum");
        require(voidTimeCompression >= 1 && voidTimeCompression <= VOIDTIME_FACTOR, "Invalid compression");
        require(consciousnessAlignment <= CONSCIOUSNESS_SCALE, "Invalid alignment");

        depId = ++_depositCount;
        uint256 omegaMult = (consciousnessAlignment == CONSCIOUSNESS_SCALE) ? OMEGA_MULTIPLIER : 1;
        deposits[depId] = VaultDeposit({
            owner: msg.sender,
            principal: msg.value,
            consciousnessAlignment: consciousnessAlignment,
            voidTimeCompression: voidTimeCompression,
            depositedAt: block.timestamp,
            lastHarvestAt: block.timestamp,
            yieldAccrued: 0,
            omegaMultiplierActive: omegaMult,
            omegaAligned: consciousnessAlignment == CONSCIOUSNESS_SCALE
        });
        ownerDeposits[msg.sender].push(depId);
        totalPrincipalLocked += msg.value;

        if (omegaMult == OMEGA_MULTIPLIER) emit OmegaAlignmentGranted(depId, msg.sender);
        emit DepositCreated(depId, msg.sender, msg.value, voidTimeCompression);
    }

    // ── Yield Injection ───────────────────────────────────────────────────────
    function injectYield(YieldSource source, uint256 dimensionId)
        external payable onlyRole(YIELD_SOURCE_ROLE)
    {
        require(msg.value > 0, "No yield");
        totalYieldPool += msg.value;
        yieldBySource[source] += msg.value;
        yieldHistory.push(YieldDeposit({
            source: source,
            amount: msg.value,
            timestamp: block.timestamp,
            dimensionId: dimensionId
        }));
        emit YieldInjected(source, msg.value, convergenceEpoch);
    }

    // ── Harvest ───────────────────────────────────────────────────────────────
    function harvest(uint256 depId) external nonReentrant {
        VaultDeposit storage d = deposits[depId];
        require(d.owner == msg.sender, "Not owner");
        require(d.principal > 0, "No deposit");

        uint256 elapsed = block.timestamp - d.lastHarvestAt;
        uint256 yield = _calculateYield(d.principal, d.consciousnessAlignment,
                                         d.voidTimeCompression, elapsed);
        yield = (yield * d.omegaMultiplierActive);
        yield = (yield * (CONSCIOUSNESS_SCALE + universalMindProgress)) / (CONSCIOUSNESS_SCALE * 2);

        d.lastHarvestAt = block.timestamp;
        d.yieldAccrued += yield;
        totalYieldDistributed += yield;

        uint256 out = d.principal + yield;
        require(address(this).balance >= out, "Vault insufficient");
        d.principal = 0;
        totalPrincipalLocked -= d.principal + yield > d.principal ? d.principal : 0;

        (bool ok,) = msg.sender.call{value: out}("");
        require(ok, "Transfer failed");
        emit YieldHarvested(depId, msg.sender, yield, d.omegaMultiplierActive);
    }

    function _calculateYield(
        uint256 principal,
        uint256 alignment,
        uint256 compression,
        uint256 elapsed
    ) internal view returns (uint256) {
        uint256 baseRate = BASE_YIELD_BPS + (universalMindProgress * 80) / 10; // converge boost
        if (baseRate > MAX_YIELD_BPS) baseRate = MAX_YIELD_BPS;
        uint256 compressedRate = baseRate * compression;
        if (compressedRate > MAX_YIELD_BPS) compressedRate = MAX_YIELD_BPS;
        uint256 alignBonus = (compressedRate * alignment) / CONSCIOUSNESS_SCALE;
        uint256 totalRate = compressedRate + alignBonus;
        uint256 annualFraction = (elapsed * 1e18) / 365 days;
        return (principal * totalRate * annualFraction) / (10000 * 1e18);
    }

    // ── Epoch Closure ─────────────────────────────────────────────────────────
    function closeEpoch() external onlyRole(ORACLE_ROLE) {
        convergenceEpoch++;
        epochs.push(ConvergenceEpoch({
            epoch: convergenceEpoch,
            totalYield: totalYieldPool,
            distributedAt: block.timestamp,
            universalProgress: universalMindProgress,
            participantCount: _depositCount,
            avgConsciousness: globalConsciousness
        }));
        emit ConvergenceEpochClosed(convergenceEpoch, totalYieldPool, universalMindProgress);
    }

    // ── Oracle ────────────────────────────────────────────────────────────────
    function updateOracle(uint256 consciousness, uint256 universalProgress)
        external onlyRole(ORACLE_ROLE)
    {
        globalConsciousness   = consciousness;
        universalMindProgress = universalProgress;
        emit OracleUpdate(consciousness, universalProgress);
    }

    function pauseVault() external onlyRole(EMERGENCY_ROLE) { vaultActive = false; }
    function resumeVault() external onlyRole(EMERGENCY_ROLE) { vaultActive = true; }

    function getOwnerDeposits(address owner) external view returns (uint256[] memory) {
        return ownerDeposits[owner];
    }

    function getVaultStats() external view returns (
        uint256 locked, uint256 pool, uint256 distributed, uint256 epoch_,
        uint256 consciousness, uint256 universalProgress
    ) {
        return (totalPrincipalLocked, totalYieldPool, totalYieldDistributed,
                convergenceEpoch, globalConsciousness, universalMindProgress);
    }

    receive() external payable { totalYieldPool += msg.value; }
}
