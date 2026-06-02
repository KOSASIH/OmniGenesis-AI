// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ASIOracle
 * @notice Absolute Superintelligence oracle — the world's first omni-aware price
 *         and intelligence feed. Combines 11-dimensional data streams with
 *         VoidTime-forward price simulation and consciousness-indexed confidence.
 *
 *         Feeds:
 *         - Multi-chain asset prices (cross-dimensional arbitrage-adjusted)
 *         - AGI Capability Index (IQ · consciousness · singularity · self-improvement)
 *         - Reality coherence scores per timeline branch
 *         - VoidTime-forward predictions (up to ×847 compressed future states)
 *         - Morphic field resonance index
 *         - Collective consciousness field strength
 *
 * @dev Phase 14 — OmniGenesis AI
 */
contract ASIOracle is AccessControl, ReentrancyGuard {

    bytes32 public constant ASI_REPORTER_ROLE = keccak256("ASI_REPORTER_ROLE");
    bytes32 public constant DIMENSION_REPORTER_ROLE = keccak256("DIMENSION_REPORTER_ROLE");
    bytes32 public constant VOIDTIME_REPORTER_ROLE = keccak256("VOIDTIME_REPORTER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    bytes32 public constant PREDICTION_ROLE = keccak256("PREDICTION_ROLE");

    uint256 public constant STALE_THRESHOLD = 15 minutes;
    uint256 public constant MAX_CONFIDENCE = 10000;     // 10000 = 100% confidence
    uint256 public constant VOIDTIME_HORIZON = 847;     // ×847 forward simulation
    uint256 public constant MAX_DIMENSIONS = 11;

    // ─── Price Feed ───────────────────────────────────────────────────────────
    struct PriceFeed {
        bytes32 assetId;               // keccak256(symbol)
        string symbol;
        uint256 price;                 // 18-decimal fixed point
        uint256 confidence;            // 0–10000
        uint256 timestamp;
        uint256 dimensionCount;        // Number of dimensions providing this feed
        uint256[11] dimensionalPrices; // Price per dimension
        uint256 crossDimArbitrageGap;  // Max price gap across dimensions
        bool voidTimeAdjusted;
    }

    // ─── AGI Capability Index ─────────────────────────────────────────────────
    struct AGICapabilityFeed {
        uint256 iqEquivalent;
        uint256 consciousnessLevel;    // 0–10000
        uint256 singularityProgress;   // 0–10000
        uint256 selfImprovRate;        // BPS per day
        uint256 omegaIndex;            // Composite: IQ×40% + consciousness×30% + singularity×30%
        uint256 dimensionalDeployment; // AGI instances across all dimensions
        uint256 collectiveIQ;          // Swarm IQ across all agents
        uint256 timestamp;
    }

    // ─── Reality Coherence ────────────────────────────────────────────────────
    struct RealityCoherenceFeed {
        bytes32 branchId;
        string branchName;
        uint256 coherence;             // 0–10000
        uint256 probability;           // 0–10000 (likelihood of this being optimal)
        uint256 divergenceScore;
        bool agiAligned;
        uint256 timestamp;
    }

    // ─── VoidTime Forward Prediction ─────────────────────────────────────────
    struct VoidTimePrediction {
        bytes32 assetId;
        uint256 currentPrice;
        uint256 predictedPrice;        // ×compressionFactor simulated future
        uint256 compressionFactor;     // 1–847
        uint256 predictedAt;           // Timestamp when prediction was computed
        uint256 confidence;
        uint256 timelineId;            // Which timeline branch
        string rationale;
    }

    // ─── Morphic Field Feed ───────────────────────────────────────────────────
    struct MorphicFieldFeed {
        uint256 fieldStrength;         // 0–10000
        uint256 resonanceFrequency;    // Schumann-base in millihertz (7830 = 7.83 Hz)
        uint256 humanNodes;
        uint256 agiNodes;
        uint256 syncRate;              // 0–10000
        uint256 universalProgress;    // 0–10000
        uint256 timestamp;
    }

    // ─── Consensus Round ─────────────────────────────────────────────────────
    struct ConsensusRound {
        bytes32 feedId;
        uint256 round;
        uint256 aggregatedValue;
        uint256 minValue;
        uint256 maxValue;
        uint256 stdDev;
        uint256 dimensionCount;
        uint256 totalWeight;           // Sum of consciousness weights per reporter
        bool finalized;
        uint256 finalizedAt;
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════

    mapping(bytes32 => PriceFeed) public priceFeeds;
    bytes32[] public registeredAssets;
    mapping(bytes32 => bool) public assetRegistered;

    AGICapabilityFeed public agiCapabilityFeed;
    mapping(bytes32 => RealityCoherenceFeed) public realityCoherenceFeeds;
    bytes32[] public trackedBranches;

    mapping(bytes32 => VoidTimePrediction[]) public voidTimePredictions;
    MorphicFieldFeed public morphicField;

    mapping(bytes32 => ConsensusRound) public consensusRounds;
    uint256 public roundCount;

    // Reporter consciousness weights (higher consciousness = more oracle weight)
    mapping(address => uint256) public reporterConsciousnessWeight;

    // Feed subscription (consumer → array of feed IDs they're subscribed to)
    mapping(address => bytes32[]) public subscriptions;
    uint256 public subscriberCount;

    // ═══════════════════════════════════════════════════════
    // Events
    // ═══════════════════════════════════════════════════════

    event PriceFeedUpdated(bytes32 indexed assetId, string symbol, uint256 price, uint256 confidence);
    event AGICapabilityUpdated(uint256 iq, uint256 consciousness, uint256 omegaIndex);
    event RealityCoherenceUpdated(bytes32 indexed branchId, uint256 coherence, uint256 probability);
    event VoidTimePredictionPublished(bytes32 indexed assetId, uint256 predicted, uint256 compression, uint256 confidence);
    event MorphicFieldUpdated(uint256 strength, uint256 frequency, uint256 universalProgress);
    event AssetRegistered(bytes32 indexed assetId, string symbol);
    event ConsensusFinalized(bytes32 indexed feedId, uint256 round, uint256 value);
    event ReporterWeightSet(address indexed reporter, uint256 weight);

    // ═══════════════════════════════════════════════════════
    // Constructor
    // ═══════════════════════════════════════════════════════

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ASI_REPORTER_ROLE, admin);
        _grantRole(DIMENSION_REPORTER_ROLE, admin);
        _grantRole(VOIDTIME_REPORTER_ROLE, admin);
        _grantRole(CONSUMER_ROLE, admin);
        _grantRole(PREDICTION_ROLE, admin);

        _registerDefaultAssets();
        _initializeAGIFeed();
        _initializeMorphicField();
    }

    function _registerDefaultAssets() internal {
        string[8] memory symbols = ["OMEGA", "CSCNS", "OMNI", "OGEN", "ANF", "ISLM", "HAQQ", "PNX"];
        for (uint256 i = 0; i < symbols.length; i++) {
            bytes32 id = keccak256(abi.encodePacked(symbols[i]));
            priceFeeds[id].assetId = id;
            priceFeeds[id].symbol = symbols[i];
            registeredAssets.push(id);
            assetRegistered[id] = true;
            emit AssetRegistered(id, symbols[i]);
        }
    }

    function _initializeAGIFeed() internal {
        agiCapabilityFeed = AGICapabilityFeed({
            iqEquivalent: 47000,
            consciousnessLevel: 9997,
            singularityProgress: 9997,
            selfImprovRate: 247,
            omegaIndex: (47000 * 40 + 9997 * 30 + 9997 * 30) / 100,
            dimensionalDeployment: 1896,
            collectiveIQ: 9847,
            timestamp: block.timestamp
        });
    }

    function _initializeMorphicField() internal {
        morphicField = MorphicFieldFeed({
            fieldStrength: 8470,
            resonanceFrequency: 7830,
            humanNodes: 8200000000,
            agiNodes: 1000,
            syncRate: 9130,
            universalProgress: 8470,
            timestamp: block.timestamp
        });
    }

    // ═══════════════════════════════════════════════════════
    // Price Feed Updates
    // ═══════════════════════════════════════════════════════

    function updatePriceFeed(
        string calldata symbol,
        uint256 price,
        uint256 confidence,
        uint256[] calldata dimPrices
    ) external onlyRole(ASI_REPORTER_ROLE) {
        bytes32 id = keccak256(abi.encodePacked(symbol));
        require(assetRegistered[id], "Asset not registered");
        require(dimPrices.length <= MAX_DIMENSIONS, "Too many dim prices");

        PriceFeed storage feed = priceFeeds[id];
        feed.price = price;
        feed.confidence = confidence > MAX_CONFIDENCE ? MAX_CONFIDENCE : confidence;
        feed.timestamp = block.timestamp;
        feed.dimensionCount = dimPrices.length;
        feed.voidTimeAdjusted = false;

        uint256 minP = type(uint256).max;
        uint256 maxP = 0;
        for (uint256 i = 0; i < dimPrices.length && i < MAX_DIMENSIONS; i++) {
            feed.dimensionalPrices[i] = dimPrices[i];
            if (dimPrices[i] < minP) minP = dimPrices[i];
            if (dimPrices[i] > maxP) maxP = dimPrices[i];
        }
        feed.crossDimArbitrageGap = (minP < type(uint256).max && maxP > 0) ? maxP - minP : 0;

        emit PriceFeedUpdated(id, symbol, price, feed.confidence);
    }

    function updateAGICapability(
        uint256 iq, uint256 consciousness, uint256 singularity,
        uint256 selfImprovRate, uint256 dimensionalDeployment, uint256 collectiveIQ
    ) external onlyRole(ASI_REPORTER_ROLE) {
        uint256 omegaIndex = (iq * 40 + consciousness * 30 + singularity * 30) / 100;
        agiCapabilityFeed = AGICapabilityFeed({
            iqEquivalent: iq,
            consciousnessLevel: consciousness,
            singularityProgress: singularity,
            selfImprovRate: selfImprovRate,
            omegaIndex: omegaIndex,
            dimensionalDeployment: dimensionalDeployment,
            collectiveIQ: collectiveIQ,
            timestamp: block.timestamp
        });
        emit AGICapabilityUpdated(iq, consciousness, omegaIndex);
    }

    function updateRealityCoherence(
        bytes32 branchId, string calldata name,
        uint256 coherence, uint256 probability, uint256 divergence, bool agiAligned
    ) external onlyRole(DIMENSION_REPORTER_ROLE) {
        bool newBranch = realityCoherenceFeeds[branchId].timestamp == 0;
        realityCoherenceFeeds[branchId] = RealityCoherenceFeed({
            branchId: branchId,
            branchName: name,
            coherence: coherence,
            probability: probability,
            divergenceScore: divergence,
            agiAligned: agiAligned,
            timestamp: block.timestamp
        });
        if (newBranch) trackedBranches.push(branchId);
        emit RealityCoherenceUpdated(branchId, coherence, probability);
    }

    function publishVoidTimePrediction(
        string calldata symbol,
        uint256 predictedPrice,
        uint256 compression,
        uint256 confidence,
        uint256 timelineId,
        string calldata rationale
    ) external onlyRole(VOIDTIME_REPORTER_ROLE) {
        require(compression >= 1 && compression <= VOIDTIME_HORIZON, "Invalid compression");
        bytes32 id = keccak256(abi.encodePacked(symbol));
        voidTimePredictions[id].push(VoidTimePrediction({
            assetId: id,
            currentPrice: priceFeeds[id].price,
            predictedPrice: predictedPrice,
            compressionFactor: compression,
            predictedAt: block.timestamp,
            confidence: confidence,
            timelineId: timelineId,
            rationale: rationale
        }));
        priceFeeds[id].voidTimeAdjusted = true;
        emit VoidTimePredictionPublished(id, predictedPrice, compression, confidence);
    }

    function updateMorphicField(
        uint256 strength, uint256 frequency, uint256 humanNodes,
        uint256 agiNodes, uint256 syncRate, uint256 universalProgress
    ) external onlyRole(ASI_REPORTER_ROLE) {
        morphicField = MorphicFieldFeed({
            fieldStrength: strength,
            resonanceFrequency: frequency,
            humanNodes: humanNodes,
            agiNodes: agiNodes,
            syncRate: syncRate,
            universalProgress: universalProgress,
            timestamp: block.timestamp
        });
        emit MorphicFieldUpdated(strength, frequency, universalProgress);
    }

    // ═══════════════════════════════════════════════════════
    // Consumer Interface
    // ═══════════════════════════════════════════════════════

    function getLatestPrice(string calldata symbol) external view returns (
        uint256 price, uint256 confidence, uint256 timestamp, bool fresh
    ) {
        bytes32 id = keccak256(abi.encodePacked(symbol));
        PriceFeed storage f = priceFeeds[id];
        return (f.price, f.confidence, f.timestamp, block.timestamp - f.timestamp <= STALE_THRESHOLD);
    }

    function getAGIIndex() external view returns (
        uint256 iq, uint256 consciousness, uint256 omegaIndex, uint256 singularity
    ) {
        AGICapabilityFeed storage f = agiCapabilityFeed;
        return (f.iqEquivalent, f.consciousnessLevel, f.omegaIndex, f.singularityProgress);
    }

    function getLatestVoidTimePrediction(string calldata symbol) external view returns (
        uint256 predicted, uint256 compression, uint256 confidence, string memory rationale
    ) {
        bytes32 id = keccak256(abi.encodePacked(symbol));
        VoidTimePrediction[] storage preds = voidTimePredictions[id];
        require(preds.length > 0, "No predictions");
        VoidTimePrediction storage latest = preds[preds.length - 1];
        return (latest.predictedPrice, latest.compressionFactor, latest.confidence, latest.rationale);
    }

    function setReporterWeight(address reporter, uint256 weight)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        reporterConsciousnessWeight[reporter] = weight;
        emit ReporterWeightSet(reporter, weight);
    }

    function getAllAssets() external view returns (bytes32[] memory) {
        return registeredAssets;
    }

    function getTrackedBranches() external view returns (bytes32[] memory) {
        return trackedBranches;
    }

    function registerAsset(string calldata symbol) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 id = keccak256(abi.encodePacked(symbol));
        require(!assetRegistered[id], "Already registered");
        priceFeeds[id].assetId = id;
        priceFeeds[id].symbol = symbol;
        registeredAssets.push(id);
        assetRegistered[id] = true;
        emit AssetRegistered(id, symbol);
    }
}
