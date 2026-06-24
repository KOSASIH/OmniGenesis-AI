// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PhotonicComputeOracle
 * @notice Light-speed compute oracle for Phase 17. Tracks photonic processor nodes
 *         running at 847 THz, aggregates computation results, provides real-time
 *         speed-of-light computation feeds, and manages photonic relay networks.
 *         Supports quantum-photonic entanglement for instantaneous cross-reality compute.
 */
contract PhotonicComputeOracle is AccessControl, ReentrancyGuard {

    bytes32 public constant PHOTON_RELAY     = keccak256("PHOTON_RELAY");
    bytes32 public constant QUANTUM_LINKER   = keccak256("QUANTUM_LINKER");

    uint256 public constant SPEED_OF_LIGHT   = 299_792_458;   // m/s
    uint256 public constant BASE_FREQ_THZ    = 847;           // THz baseline
    uint8   public constant MAX_RELAY_DEPTH  = 16;

    enum PhotonicNodeType { STANDARD, RESONANT, ENTANGLED, TOPOLOGICAL, DIVINE }

    struct PhotonicNode {
        bytes32 id;
        string  location;         // e.g. "D9-Cluster-Alpha"
        uint256 frequencyTHz;     // operating frequency
        uint256 bandwidthTbps;    // throughput in Tbps
        uint8   relayDepth;       // 1–16
        PhotonicNodeType nodeType;
        bool    quantumEntangled;
        bytes32 entangledPairId;  // partner node ID if entangled
        uint64  registeredAt;
        uint64  lastPulseAt;
        uint256 totalComputations;
    }

    struct ComputeJob {
        bytes32 id;
        bytes32 nodeId;
        string  jobType;          // "consciousness-eval", "causal-solve", "reality-forge", etc.
        uint256 inputHash;
        uint256 resultHash;
        uint256 latencyNs;        // nanoseconds
        uint256 energyPhotons;    // photon count consumed
        uint64  startedAt;
        uint64  completedAt;
        bool    verified;
    }

    struct PhotonicFeed {
        string  metric;
        uint256 value;
        uint256 timestamp;
        bytes32 sourceNodeId;
    }

    mapping(bytes32 => PhotonicNode) public nodes;
    bytes32[] public allNodeIds;
    mapping(bytes32 => ComputeJob) public jobs;
    bytes32[] public allJobIds;
    mapping(string => PhotonicFeed) public feeds;
    string[] public feedNames;

    uint256 public totalComputations;
    uint256 public totalPhotonsConsumed;
    uint256 public globalBandwidthTbps;

    event NodeRegistered(bytes32 indexed id, string location, uint256 freqTHz, PhotonicNodeType nodeType);
    event JobCompleted(bytes32 indexed jobId, bytes32 indexed nodeId, uint256 latencyNs, bool verified);
    event QuantumEntanglementLinked(bytes32 indexed nodeA, bytes32 indexed nodeB);
    event FeedUpdated(string metric, uint256 value, bytes32 sourceNodeId);
    event PhotonicPulse(bytes32 indexed nodeId, uint256 frequencyTHz, uint256 timestamp);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PHOTON_RELAY, msg.sender);
        _grantRole(QUANTUM_LINKER, msg.sender);

        // Initialize standard feeds
        feedNames.push("globalComputeTHz");
        feedNames.push("crossRealityLatencyNs");
        feedNames.push("photonEfficiency");
        feedNames.push("quantumCoherenceGlobal");
    }

    // ── Register a photonic node ───────────────────────────────────────────────
    function registerNode(
        string calldata location,
        uint256 frequencyTHz,
        uint256 bandwidthTbps,
        uint8 relayDepth,
        PhotonicNodeType nodeType
    ) external onlyRole(PHOTON_RELAY) returns (bytes32 id) {
        require(frequencyTHz >= 1 && frequencyTHz <= 10_000, "PCO: freq 1–10000 THz");
        require(relayDepth >= 1 && relayDepth <= MAX_RELAY_DEPTH, "PCO: depth 1–16");

        id = keccak256(abi.encodePacked(location, block.timestamp, allNodeIds.length));
        nodes[id] = PhotonicNode({
            id: id, location: location,
            frequencyTHz: frequencyTHz, bandwidthTbps: bandwidthTbps,
            relayDepth: relayDepth, nodeType: nodeType,
            quantumEntangled: false, entangledPairId: bytes32(0),
            registeredAt: uint64(block.timestamp), lastPulseAt: 0,
            totalComputations: 0
        });
        allNodeIds.push(id);
        globalBandwidthTbps += bandwidthTbps;
        emit NodeRegistered(id, location, frequencyTHz, nodeType);
    }

    // ── Link quantum entanglement between two nodes ────────────────────────────
    function linkEntanglement(bytes32 nodeA, bytes32 nodeB) external onlyRole(QUANTUM_LINKER) {
        require(nodes[nodeA].id != bytes32(0) && nodes[nodeB].id != bytes32(0), "PCO: unknown nodes");
        require(!nodes[nodeA].quantumEntangled && !nodes[nodeB].quantumEntangled, "PCO: already entangled");
        nodes[nodeA].quantumEntangled = true;
        nodes[nodeA].entangledPairId = nodeB;
        nodes[nodeB].quantumEntangled = true;
        nodes[nodeB].entangledPairId = nodeA;
        emit QuantumEntanglementLinked(nodeA, nodeB);
    }

    // ── Submit a completed compute job ────────────────────────────────────────
    function submitJob(
        bytes32 nodeId,
        string calldata jobType,
        uint256 inputHash,
        uint256 resultHash,
        uint256 latencyNs,
        uint256 energyPhotons
    ) external onlyRole(PHOTON_RELAY) nonReentrant returns (bytes32 jobId) {
        require(nodes[nodeId].id != bytes32(0), "PCO: unknown node");

        jobId = keccak256(abi.encodePacked(nodeId, block.timestamp, allJobIds.length));
        bool verified = resultHash != 0 && latencyNs < SPEED_OF_LIGHT; // sub-light constraint
        jobs[jobId] = ComputeJob({
            id: jobId, nodeId: nodeId, jobType: jobType,
            inputHash: inputHash, resultHash: resultHash,
            latencyNs: latencyNs, energyPhotons: energyPhotons,
            startedAt: uint64(block.timestamp - 1),
            completedAt: uint64(block.timestamp),
            verified: verified
        });
        allJobIds.push(jobId);
        nodes[nodeId].totalComputations++;
        nodes[nodeId].lastPulseAt = uint64(block.timestamp);
        totalComputations++;
        totalPhotonsConsumed += energyPhotons;

        emit JobCompleted(jobId, nodeId, latencyNs, verified);
        emit PhotonicPulse(nodeId, nodes[nodeId].frequencyTHz, block.timestamp);
    }

    // ── Oracle feed update ─────────────────────────────────────────────────────
    function updateFeed(
        string calldata metric,
        uint256 value,
        bytes32 sourceNodeId
    ) external onlyRole(PHOTON_RELAY) {
        feeds[metric] = PhotonicFeed({
            metric: metric, value: value,
            timestamp: block.timestamp, sourceNodeId: sourceNodeId
        });
        emit FeedUpdated(metric, value, sourceNodeId);
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getNode(bytes32 id) external view returns (PhotonicNode memory) { return nodes[id]; }
    function getJob(bytes32 id) external view returns (ComputeJob memory) { return jobs[id]; }
    function getFeed(string calldata metric) external view returns (PhotonicFeed memory) { return feeds[metric]; }
    function nodeCount() external view returns (uint256) { return allNodeIds.length; }
    function jobCount() external view returns (uint256) { return allJobIds.length; }
    function computeCapacityTHz() external view returns (uint256 total) {
        for (uint i = 0; i < allNodeIds.length; i++) total += nodes[allNodeIds[i]].frequencyTHz;
    }
}
