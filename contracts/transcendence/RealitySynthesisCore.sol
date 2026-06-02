// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RealitySynthesisCore
 * @notice On-chain reality creation engine. Records and coordinates
 *         reality synthesis threads across all 11 dimensional planes.
 *         Each thread is a structured proposal to manifest a new
 *         timeline branch or dimensional sub-reality.
 *
 *         Mechanics:
 *         - Submit synthesis thread with $TRNS stake
 *         - Dimensional consensus scoring across all participating planes
 *         - VoidTime simulation pre-runs the thread ×847 ahead
 *         - Coherence → royalty distribution to co-authors
 *         - Failed threads: stake slashed, returned to treasury
 *
 * @dev Phase 15 — OmniGenesis AI. Founder: KOSASIH
 */
contract RealitySynthesisCore is AccessControl, ReentrancyGuard {

    bytes32 public constant WEAVER_ROLE       = keccak256("WEAVER_ROLE");
    bytes32 public constant ORACLE_ROLE       = keccak256("ORACLE_ROLE");
    bytes32 public constant VALIDATOR_ROLE    = keccak256("VALIDATOR_ROLE");

    uint256 public constant MAX_DIMENSIONS    = 11;
    uint256 public constant MIN_COHERENCE     = 7500;   // 75% min coherence to succeed
    uint256 public constant OMEGA_COHERENCE   = 9999;   // 99.99% — Omega-class thread
    uint256 public constant VOIDTIME_SIM_FACTOR = 847;
    uint256 public constant ROYALTY_BPS       = 1500;   // 15% royalty to co-authors
    uint256 public constant SLASH_BPS         = 2000;   // 20% slash on failed threads
    uint256 public constant MAX_CO_AUTHORS    = 12;

    enum ThreadStatus {
        PENDING,      // Awaiting dimensional validation
        SIMULATING,   // VoidTime pre-simulation running
        MANIFESTING,  // Coherence confirmed, thread manifesting
        MANIFESTED,   // Successfully created new reality
        FAILED,       // Below MIN_COHERENCE — slashed
        OMEGA,        // Omega-class thread (99.99%+)
        CANCELLED
    }

    struct DimensionalScore {
        uint256 dimensionId;
        uint256 coherenceScore;   // 0–10000
        uint256 stabilityScore;   // 0–10000
        bool    validated;
        uint256 validatedAt;
    }

    struct RealityThread {
        uint256 id;
        ThreadStatus status;
        address primaryAuthor;
        address[] coAuthors;
        string realityDescription;
        string targetTimelineName;
        uint256 targetDimension;     // Primary dimension
        uint256[] affectedDimensions;
        uint256 trnsStaked;          // In wei-equivalent
        uint256 submittedAt;
        uint256 voidTimeSimResult;   // ×847 projected coherence BPS
        uint256 finalCoherence;      // Post-manifestation
        mapping(uint256 => DimensionalScore) dimScores;
        uint256 dimensionsValidated;
        bool royaltyDistributed;
        uint256 royaltyPool;
        string omegaSignature;       // For Omega-class threads: hash of manifested reality
    }

    struct ManifestationRecord {
        uint256 threadId;
        uint256 coherence;
        uint256 dimensionsInvolved;
        uint256 royaltiesDistributed;
        uint256 manifestedAt;
        bytes32 realityHash;
    }

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 private _threadCount;
    mapping(uint256 => RealityThread) private _threads;
    ManifestationRecord[] public manifestationLog;

    uint256 public totalThreadsSubmitted;
    uint256 public totalManifested;
    uint256 public totalOmegaClass;
    uint256 public totalRoyaltiesPaid;
    uint256 public totalSlashed;
    uint256 public omegaRealitiesCreated;

    // Reality coherence index per dimension
    mapping(uint256 => uint256) public dimensionCoherenceIndex;

    // ── Events ────────────────────────────────────────────────────────────────
    event ThreadSubmitted(uint256 indexed threadId, address author, uint256 dimension, uint256 staked);
    event DimensionalValidation(uint256 indexed threadId, uint256 dimension, uint256 coherence);
    event VoidTimeSimComplete(uint256 indexed threadId, uint256 projectedCoherence);
    event ThreadManifested(uint256 indexed threadId, uint256 coherence, bool omegaClass);
    event ThreadFailed(uint256 indexed threadId, uint256 coherence, uint256 slashed);
    event RoyaltyDistributed(uint256 indexed threadId, uint256 total, uint256 authorShare);
    event OmegaRealityCreated(uint256 indexed threadId, string name, bytes32 realityHash);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(WEAVER_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(VALIDATOR_ROLE, admin);

        // Initialize dimension coherence baselines
        uint256[11] memory baseline = [uint256(9840), 9120, 8470, 7730, 7100, 6480, 5820, 5170, 4410, 3760, 10000];
        for (uint256 i = 0; i < 11; i++) {
            dimensionCoherenceIndex[i + 1] = baseline[i];
        }
    }

    // ── Thread Submission ─────────────────────────────────────────────────────
    function submitThread(
        string calldata realityDescription,
        string calldata targetTimelineName,
        uint256 targetDimension,
        uint256[] calldata affectedDimensions,
        address[] calldata coAuthors
    ) external payable nonReentrant returns (uint256 threadId) {
        require(msg.value > 0, "Stake required");
        require(targetDimension >= 1 && targetDimension <= MAX_DIMENSIONS, "Invalid dimension");
        require(affectedDimensions.length >= 1 && affectedDimensions.length <= MAX_DIMENSIONS, "Invalid dims");
        require(coAuthors.length <= MAX_CO_AUTHORS, "Too many co-authors");

        threadId = ++_threadCount;
        RealityThread storage t = _threads[threadId];
        t.id = threadId;
        t.status = ThreadStatus.PENDING;
        t.primaryAuthor = msg.sender;
        t.coAuthors = coAuthors;
        t.realityDescription = realityDescription;
        t.targetTimelineName = targetTimelineName;
        t.targetDimension = targetDimension;
        t.affectedDimensions = affectedDimensions;
        t.trnsStaked = msg.value;
        t.submittedAt = block.timestamp;
        totalThreadsSubmitted++;

        emit ThreadSubmitted(threadId, msg.sender, targetDimension, msg.value);
    }

    // ── Dimensional Validation ────────────────────────────────────────────────
    function submitDimensionalScore(
        uint256 threadId,
        uint256 dimensionId,
        uint256 coherenceScore,
        uint256 stabilityScore
    ) external onlyRole(VALIDATOR_ROLE) {
        RealityThread storage t = _threads[threadId];
        require(t.status == ThreadStatus.PENDING || t.status == ThreadStatus.SIMULATING, "Invalid state");
        require(!t.dimScores[dimensionId].validated, "Already validated");

        t.dimScores[dimensionId] = DimensionalScore({
            dimensionId: dimensionId,
            coherenceScore: coherenceScore,
            stabilityScore: stabilityScore,
            validated: true,
            validatedAt: block.timestamp
        });
        t.dimensionsValidated++;
        emit DimensionalValidation(threadId, dimensionId, coherenceScore);

        // Auto-progress to simulating when all affected dimensions scored
        if (t.dimensionsValidated >= t.affectedDimensions.length) {
            t.status = ThreadStatus.SIMULATING;
        }
    }

    // ── VoidTime Simulation ───────────────────────────────────────────────────
    function submitVoidTimeSimulation(uint256 threadId, uint256 projectedCoherence)
        external onlyRole(ORACLE_ROLE)
    {
        RealityThread storage t = _threads[threadId];
        require(t.status == ThreadStatus.SIMULATING, "Not in simulation");
        t.voidTimeSimResult = projectedCoherence;
        t.status = ThreadStatus.MANIFESTING;
        emit VoidTimeSimComplete(threadId, projectedCoherence);
    }

    // ── Manifestation ─────────────────────────────────────────────────────────
    function manifestThread(uint256 threadId, uint256 finalCoherence)
        external onlyRole(WEAVER_ROLE) nonReentrant
    {
        RealityThread storage t = _threads[threadId];
        require(t.status == ThreadStatus.MANIFESTING, "Not manifesting");
        t.finalCoherence = finalCoherence;

        if (finalCoherence >= MIN_COHERENCE) {
            bool isOmega = finalCoherence >= OMEGA_COHERENCE;
            t.status = isOmega ? ThreadStatus.OMEGA : ThreadStatus.MANIFESTED;
            totalManifested++;
            if (isOmega) {
                totalOmegaClass++;
                omegaRealitiesCreated++;
                bytes32 rHash = keccak256(abi.encodePacked(
                    t.targetTimelineName, finalCoherence, block.timestamp
                ));
                t.omegaSignature = _bytes32ToString(rHash);
                manifestationLog.push(ManifestationRecord({
                    threadId: threadId,
                    coherence: finalCoherence,
                    dimensionsInvolved: t.affectedDimensions.length,
                    royaltiesDistributed: 0,
                    manifestedAt: block.timestamp,
                    realityHash: rHash
                }));
                emit OmegaRealityCreated(threadId, t.targetTimelineName, rHash);
            }
            _distributeRoyalties(threadId, finalCoherence);
            // Update dimension indices
            for (uint256 i = 0; i < t.affectedDimensions.length; i++) {
                uint256 d = t.affectedDimensions[i];
                if (d >= 1 && d <= MAX_DIMENSIONS) {
                    dimensionCoherenceIndex[d] = (dimensionCoherenceIndex[d] * 9 + finalCoherence) / 10;
                }
            }
            emit ThreadManifested(threadId, finalCoherence, isOmega);
        } else {
            // Slash
            t.status = ThreadStatus.FAILED;
            uint256 slashed = (t.trnsStaked * SLASH_BPS) / 10000;
            totalSlashed += slashed;
            uint256 returned = t.trnsStaked - slashed;
            if (returned > 0 && address(this).balance >= returned) {
                (bool ok,) = t.primaryAuthor.call{value: returned}("");
                if (!ok) {} // fail silently, treasury retains
            }
            emit ThreadFailed(threadId, finalCoherence, slashed);
        }
    }

    function _distributeRoyalties(uint256 threadId, uint256 coherence) internal {
        RealityThread storage t = _threads[threadId];
        if (t.royaltyDistributed) return;
        t.royaltyDistributed = true;

        uint256 royaltyPool_ = (t.trnsStaked * ROYALTY_BPS) / 10000;
        uint256 returned = t.trnsStaked - royaltyPool_;

        // Primary author gets coherence-scaled bonus
        uint256 authorShare = (royaltyPool_ * coherence) / 10000;
        uint256 coShare = royaltyPool_ - authorShare;

        if (authorShare > 0 && address(this).balance >= authorShare) {
            (bool ok,) = t.primaryAuthor.call{value: authorShare}("");
            if (!ok) {}
        }
        if (coShare > 0 && t.coAuthors.length > 0) {
            uint256 perCo = coShare / t.coAuthors.length;
            for (uint256 i = 0; i < t.coAuthors.length; i++) {
                if (address(this).balance >= perCo) {
                    (bool ok,) = t.coAuthors[i].call{value: perCo}("");
                    if (!ok) {}
                }
            }
        }
        if (returned > 0 && address(this).balance >= returned) {
            (bool ok,) = t.primaryAuthor.call{value: returned}("");
            if (!ok) {}
        }
        t.royaltyPool = royaltyPool_;
        totalRoyaltiesPaid += royaltyPool_;
        emit RoyaltyDistributed(threadId, royaltyPool_, authorShare);
    }

    function _bytes32ToString(bytes32 b) internal pure returns (string memory) {
        bytes memory hexChars = "0123456789abcdef";
        bytes memory str = new bytes(66);
        str[0] = "0"; str[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = hexChars[uint8(b[i]) >> 4];
            str[3 + i * 2] = hexChars[uint8(b[i]) & 0xf];
        }
        return string(str);
    }

    function getThreadInfo(uint256 threadId) external view returns (
        ThreadStatus status, uint256 dimension, uint256 coherence,
        uint256 staked, uint256 dimsValidated, bool royaltiesDist
    ) {
        RealityThread storage t = _threads[threadId];
        return (t.status, t.targetDimension, t.finalCoherence,
                t.trnsStaked, t.dimensionsValidated, t.royaltyDistributed);
    }

    function getDimScore(uint256 threadId, uint256 dimId) external view returns (
        uint256 coherence, uint256 stability, bool validated
    ) {
        DimensionalScore storage s = _threads[threadId].dimScores[dimId];
        return (s.coherenceScore, s.stabilityScore, s.validated);
    }

    function getCoreStats() external view returns (
        uint256 submitted, uint256 manifested, uint256 omegaClass,
        uint256 royalties, uint256 slashed, uint256 omegaRealities
    ) {
        return (totalThreadsSubmitted, totalManifested, totalOmegaClass,
                totalRoyaltiesPaid, totalSlashed, omegaRealitiesCreated);
    }

    receive() external payable {}
}
