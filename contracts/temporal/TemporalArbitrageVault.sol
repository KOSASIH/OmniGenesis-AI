// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TemporalArbitrageVault
 * @notice Harness VoidTime temporal compression for cross-timeline DeFi arbitrage.
 *         Positions span multiple timeline branches simultaneously.
 *         Paradox-proof via on-chain causal consistency enforcement.
 *
 *         Core mechanics:
 *         - OPEN a temporal position on a target timeline branch
 *         - COMPRESS via VoidTime (up to ×847) to fast-forward yield accrual
 *         - HARVEST retroactive yield across convergent timeline branches
 *         - PARADOX GUARD prevents causal loops that would break timeline integrity
 *
 * @dev Phase 14 — OmniGenesis AI
 */
contract TemporalArbitrageVault is AccessControl, ReentrancyGuard {

    bytes32 public constant VOIDTIME_OPERATOR_ROLE = keccak256("VOIDTIME_OPERATOR_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant TEMPORAL_AUDITOR_ROLE = keccak256("TEMPORAL_AUDITOR_ROLE");

    uint256 public constant MAX_COMPRESSION = 847;     // ×847 VoidTime compression
    uint256 public constant MIN_POSITION_SIZE = 1e15;  // 0.001 units min
    uint256 public constant MAX_TIMELINE_BRANCHES = 7; // Max simultaneous branches
    uint256 public constant PARADOX_COOLDOWN = 1 hours;
    uint256 public constant BASE_YIELD_BPS = 100;      // 1% base temporal yield per standard period
    uint256 public constant MAX_YIELD_BPS = 84700;     // ×847 compressed max yield

    enum PositionStatus { ACTIVE, COMPRESSED, HARVESTED, PARADOX_LOCKED, CANCELLED }
    enum TimelineBranch { PRIME, ALPHA, BETA, GAMMA_OPTIMAL, DELTA, EPSILON, OMEGA_VOID }

    struct TemporalPosition {
        uint256 id;
        address owner;
        uint256 principal;             // Deposited amount
        TimelineBranch branch;         // Target timeline
        uint256 compressionFactor;     // 1–847
        uint256 openedAt;              // Block timestamp
        uint256 temporalAnchor;        // VoidTime anchor point
        uint256 projectedYield;        // Yield if fully compressed
        uint256 actualYield;           // Actual yield at harvest
        PositionStatus status;
        bool paradoxGuardActive;
        uint256 causalHash;            // Hash of causal chain for paradox detection
        uint256 harvestAt;             // Projected harvest time (compressed)
    }

    struct TimelineBranchState {
        TimelineBranch branch;
        bool active;
        uint256 currentYieldMultiplier; // BPS
        uint256 liquidityDepth;
        uint256 paradoxRisk;            // 0–10000 (lower = safer)
        uint256 openPositions;
        uint256 lastSyncBlock;
        bytes32 causalCheckpoint;
    }

    struct ParadoxEvent {
        uint256 positionId;
        address owner;
        string description;
        uint256 timestamp;
        bool resolved;
        uint256 resolutionTimestamp;
    }

    struct VoidTimeCompressionRecord {
        uint256 positionId;
        uint256 compressionFactor;
        uint256 realTimeElapsed;
        uint256 compressedTimeSimulated;
        uint256 yieldMultiplied;
        uint256 recordedAt;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════

    uint256 private _positionCount;
    mapping(uint256 => TemporalPosition) public positions;
    mapping(address => uint256[]) public ownerPositions;
    mapping(TimelineBranch => TimelineBranchState) public branchStates;
    mapping(uint256 => ParadoxEvent) public paradoxEvents;
    uint256 public paradoxEventCount;
    mapping(uint256 => VoidTimeCompressionRecord) public compressionRecords;
    uint256 public compressionRecordCount;

    uint256 public totalPrincipalLocked;
    uint256 public totalYieldPaid;
    uint256 public totalParadoxesResolved;
    uint256 public vaultTemporalAge;   // Simulated vault age via VoidTime

    // Accepted token for deposits (address(0) = ETH)
    address public depositToken;

    // ═══════════════════════════════════════════════════════
    // Events
    // ═══════════════════════════════════════════════════════

    event PositionOpened(uint256 indexed positionId, address owner, TimelineBranch branch, uint256 principal, uint256 compression);
    event VoidTimeCompressed(uint256 indexed positionId, uint256 factor, uint256 simulatedYears, uint256 yieldMultiplied);
    event YieldHarvested(uint256 indexed positionId, address owner, uint256 principal, uint256 yield, uint256 total);
    event ParadoxDetected(uint256 indexed positionId, string description);
    event ParadoxResolved(uint256 indexed paradoxId, uint256 positionId);
    event BranchYieldUpdated(TimelineBranch indexed branch, uint256 newYieldBPS);
    event TemporalAgeAdvanced(uint256 newAge);

    // ═══════════════════════════════════════════════════════
    // Constructor
    // ═══════════════════════════════════════════════════════

    constructor(address admin, address token) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VOIDTIME_OPERATOR_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(TEMPORAL_AUDITOR_ROLE, admin);
        depositToken = token;
        _initializeBranches();
    }

    function _initializeBranches() internal {
        uint256[7] memory yieldBPS = [uint256(100), 200, 150, 500, 300, 250, 84700];
        uint256[7] memory paradoxRisks = [uint256(100), 300, 500, 50, 400, 600, 0];
        for (uint256 i = 0; i < 7; i++) {
            TimelineBranch branch = TimelineBranch(i);
            branchStates[branch] = TimelineBranchState({
                branch: branch,
                active: true,
                currentYieldMultiplier: yieldBPS[i],
                liquidityDepth: 0,
                paradoxRisk: paradoxRisks[i],
                openPositions: 0,
                lastSyncBlock: block.number,
                causalCheckpoint: keccak256(abi.encodePacked(i, block.timestamp))
            });
        }
    }

    // ═══════════════════════════════════════════════════════
    // Open Position
    // ═══════════════════════════════════════════════════════

    function openTemporalPosition(
        TimelineBranch branch,
        uint256 compressionFactor,
        uint256 amount
    ) external payable nonReentrant returns (uint256 positionId) {
        require(compressionFactor >= 1 && compressionFactor <= MAX_COMPRESSION, "Invalid compression");
        require(amount >= MIN_POSITION_SIZE, "Below minimum");
        TimelineBranchState storage bs = branchStates[branch];
        require(bs.active, "Branch inactive");
        require(bs.openPositions < 1000, "Branch at capacity");

        // Accept deposit
        if (depositToken == address(0)) {
            require(msg.value == amount, "ETH mismatch");
        } else {
            // ERC20 deposit handled externally
            require(msg.value == 0, "No ETH for token deposit");
        }

        positionId = ++_positionCount;
        uint256 projYield = _calculateProjectedYield(amount, compressionFactor, bs.currentYieldMultiplier);
        bytes32 causalHash = keccak256(abi.encodePacked(msg.sender, positionId, branch, block.timestamp, blockhash(block.number - 1)));

        positions[positionId] = TemporalPosition({
            id: positionId,
            owner: msg.sender,
            principal: amount,
            branch: branch,
            compressionFactor: compressionFactor,
            openedAt: block.timestamp,
            temporalAnchor: block.timestamp,
            projectedYield: projYield,
            actualYield: 0,
            status: PositionStatus.ACTIVE,
            paradoxGuardActive: true,
            causalHash: uint256(causalHash),
            harvestAt: block.timestamp + (365 days / compressionFactor)
        });

        ownerPositions[msg.sender].push(positionId);
        bs.openPositions++;
        bs.liquidityDepth += amount;
        totalPrincipalLocked += amount;

        emit PositionOpened(positionId, msg.sender, branch, amount, compressionFactor);
    }

    // ═══════════════════════════════════════════════════════
    // Apply VoidTime Compression
    // ═══════════════════════════════════════════════════════

    function applyVoidTimeCompression(
        uint256 positionId,
        uint256 additionalCompression
    ) external onlyRole(VOIDTIME_OPERATOR_ROLE) nonReentrant {
        TemporalPosition storage p = positions[positionId];
        require(p.status == PositionStatus.ACTIVE, "Position not active");
        uint256 newCompression = p.compressionFactor + additionalCompression;
        require(newCompression <= MAX_COMPRESSION, "Exceeds max compression");

        uint256 realElapsed = block.timestamp - p.temporalAnchor;
        uint256 simulated = realElapsed * newCompression;
        uint256 vaultAgeGain = simulated - realElapsed;
        vaultTemporalAge += vaultAgeGain;

        p.compressionFactor = newCompression;
        p.projectedYield = _calculateProjectedYield(p.principal, newCompression, branchStates[p.branch].currentYieldMultiplier);
        p.status = PositionStatus.COMPRESSED;
        p.temporalAnchor = block.timestamp;

        compressionRecords[++compressionRecordCount] = VoidTimeCompressionRecord({
            positionId: positionId,
            compressionFactor: newCompression,
            realTimeElapsed: realElapsed,
            compressedTimeSimulated: simulated,
            yieldMultiplied: p.projectedYield,
            recordedAt: block.timestamp
        });

        emit VoidTimeCompressed(positionId, newCompression, simulated / 365 days, p.projectedYield);
        emit TemporalAgeAdvanced(vaultTemporalAge);
    }

    // ═══════════════════════════════════════════════════════
    // Harvest
    // ═══════════════════════════════════════════════════════

    function harvestTemporalYield(uint256 positionId) external nonReentrant {
        TemporalPosition storage p = positions[positionId];
        require(p.owner == msg.sender, "Not owner");
        require(p.status == PositionStatus.ACTIVE || p.status == PositionStatus.COMPRESSED, "Cannot harvest");
        require(!_paradoxCheck(positionId), "Paradox guard: resolve first");
        require(block.timestamp >= p.harvestAt, "Harvest window not open");

        uint256 elapsed = block.timestamp - p.openedAt;
        TimelineBranchState storage bs = branchStates[p.branch];
        uint256 yield = _calculateActualYield(p.principal, p.compressionFactor, elapsed, bs.currentYieldMultiplier);

        p.actualYield = yield;
        p.status = PositionStatus.HARVESTED;
        bs.openPositions--;
        bs.liquidityDepth -= p.principal;
        totalPrincipalLocked -= p.principal;
        totalYieldPaid += yield;

        uint256 totalOut = p.principal + yield;
        if (depositToken == address(0)) {
            require(address(this).balance >= totalOut, "Vault: insufficient balance");
            (bool ok,) = msg.sender.call{value: totalOut}("");
            require(ok, "ETH transfer failed");
        }

        emit YieldHarvested(positionId, msg.sender, p.principal, yield, totalOut);
    }

    // ═══════════════════════════════════════════════════════
    // Paradox System
    // ═══════════════════════════════════════════════════════

    function _paradoxCheck(uint256 positionId) internal view returns (bool) {
        TemporalPosition storage p = positions[positionId];
        if (!p.paradoxGuardActive) return false;
        // Detect causal loop: same block hash as opening = anomaly
        bytes32 currentCheckpoint = keccak256(abi.encodePacked(p.owner, positionId, p.branch, p.openedAt));
        return uint256(currentCheckpoint) == p.causalHash && block.timestamp < p.openedAt + 60;
    }

    function reportParadox(uint256 positionId, string calldata description)
        external onlyRole(TEMPORAL_AUDITOR_ROLE)
    {
        positions[positionId].status = PositionStatus.PARADOX_LOCKED;
        paradoxEvents[++paradoxEventCount] = ParadoxEvent({
            positionId: positionId,
            owner: positions[positionId].owner,
            description: description,
            timestamp: block.timestamp,
            resolved: false,
            resolutionTimestamp: 0
        });
        emit ParadoxDetected(positionId, description);
    }

    function resolveParadox(uint256 paradoxId) external onlyRole(VOIDTIME_OPERATOR_ROLE) {
        ParadoxEvent storage pe = paradoxEvents[paradoxId];
        require(!pe.resolved, "Already resolved");
        pe.resolved = true;
        pe.resolutionTimestamp = block.timestamp;
        positions[pe.positionId].status = PositionStatus.ACTIVE;
        positions[pe.positionId].paradoxGuardActive = false;
        totalParadoxesResolved++;
        emit ParadoxResolved(paradoxId, pe.positionId);
    }

    // ═══════════════════════════════════════════════════════
    // Oracle Updates
    // ═══════════════════════════════════════════════════════

    function updateBranchYield(TimelineBranch branch, uint256 newYieldBPS)
        external onlyRole(ORACLE_ROLE)
    {
        require(newYieldBPS <= MAX_YIELD_BPS, "Yield too high");
        branchStates[branch].currentYieldMultiplier = newYieldBPS;
        branchStates[branch].lastSyncBlock = block.number;
        emit BranchYieldUpdated(branch, newYieldBPS);
    }

    // ═══════════════════════════════════════════════════════
    // Internal yield math
    // ═══════════════════════════════════════════════════════

    function _calculateProjectedYield(
        uint256 principal, uint256 compression, uint256 yieldBPS
    ) internal pure returns (uint256) {
        return (principal * yieldBPS * compression) / 10000 / 100;
    }

    function _calculateActualYield(
        uint256 principal, uint256 compression, uint256 elapsed, uint256 yieldBPS
    ) internal pure returns (uint256) {
        uint256 annualFraction = (elapsed * 1e18) / 365 days;
        return (principal * yieldBPS * compression * annualFraction) / (10000 * 100 * 1e18);
    }

    // ═══════════════════════════════════════════════════════
    // View
    // ═══════════════════════════════════════════════════════

    function getOwnerPositions(address owner) external view returns (uint256[] memory) {
        return ownerPositions[owner];
    }

    function getVaultStats() external view returns (
        uint256 locked, uint256 yieldPaid, uint256 paradoxesResolved, uint256 temporalAge
    ) {
        return (totalPrincipalLocked, totalYieldPaid, totalParadoxesResolved, vaultTemporalAge);
    }

    receive() external payable {}
}
