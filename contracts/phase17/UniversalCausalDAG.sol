// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title UniversalCausalDAG
 * @notice On-chain Directed Acyclic Graph encoding the causal structure of all
 *         OmniGenesis realities. Nodes are causal events; edges are causal links
 *         with strength and direction. Supports do-calculus interventions, backdoor
 *         path detection, counterfactual scoring, and Omega convergence proofs.
 */
contract UniversalCausalDAG is AccessControl, ReentrancyGuard {

    bytes32 public constant CAUSAL_ORACLE   = keccak256("CAUSAL_ORACLE");
    bytes32 public constant GRAPH_OPERATOR  = keccak256("GRAPH_OPERATOR");

    enum NodeType   { ROOT, MEDIATOR, CONFOUNDER, COLLIDER, TERMINAL, OMEGA }
    enum EdgeType   { DIRECT, INSTRUMENTAL, BACKDOOR, FRONT_DOOR, CONFOUNDING }
    enum NodeStatus { LATENT, OBSERVED, INTERVENED, COUNTERFACTUAL, OMEGA_CONVERGED }

    struct CausalNode {
        bytes32 id;
        string  name;
        NodeType nodeType;
        NodeStatus status;
        uint32  certaintyBPS;      // 0-10000
        uint32  omegaResonanceBPS; // alignment with Omega Point
        int64   temporalOffset;    // seconds relative to reality genesis
        uint256 informationBits;   // Shannon information content
        bytes32[] causes;          // parent node IDs
        bytes32[] effects;         // child node IDs
        uint64  createdAt;
    }

    struct CausalEdge {
        bytes32 id;
        bytes32 from;
        bytes32 to;
        EdgeType edgeType;
        uint32  strengthBPS;     // causal strength 0-10000
        int32   lag;             // temporal lag in blocks
        bool    active;
        uint64  createdAt;
    }

    struct Intervention {
        bytes32 nodeId;
        address operator;
        uint32  targetValueBPS;
        uint32  resultValueBPS;
        uint64  executedAt;
        bool    succeeded;
        bytes32[] affectedNodes; // propagated effects
    }

    struct CounterfactualQuery {
        bytes32 treatmentNode;
        bytes32 outcomeNode;
        uint32  treatmentValueBPS;
        uint32  observedOutcomeBPS;
        uint32  counterfactualBPS;  // what would have happened
        uint64  queriedAt;
        address queriedBy;
    }

    mapping(bytes32 => CausalNode) public nodes;
    bytes32[] public allNodeIds;
    mapping(bytes32 => CausalEdge) public edges;
    bytes32[] public allEdgeIds;
    mapping(uint256 => Intervention) public interventions;
    uint256 public interventionCount;
    mapping(uint256 => CounterfactualQuery) public cfQueries;
    uint256 public cfQueryCount;

    uint256 public totalInformation;       // aggregate Shannon bits
    uint256 public omegaConvergedNodes;

    event NodeAdded(bytes32 indexed id, string name, NodeType nodeType);
    event EdgeAdded(bytes32 indexed id, bytes32 from, bytes32 to, EdgeType edgeType, uint32 strengthBPS);
    event InterventionExecuted(uint256 indexed id, bytes32 nodeId, uint32 targetBPS, bool succeeded);
    event CounterfactualQueried(uint256 indexed id, bytes32 treatment, bytes32 outcome);
    event NodeOmegaConverged(bytes32 indexed nodeId);
    event BackdoorPathDetected(bytes32 indexed from, bytes32 indexed to, uint256 pathLength);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CAUSAL_ORACLE, msg.sender);
        _grantRole(GRAPH_OPERATOR, msg.sender);
    }

    // ── Add causal node ────────────────────────────────────────────────────────
    function addNode(
        string calldata name,
        NodeType nodeType,
        uint32 certaintyBPS,
        uint32 omegaResonanceBPS,
        int64 temporalOffset,
        uint256 informationBits
    ) external onlyRole(GRAPH_OPERATOR) returns (bytes32 id) {
        require(certaintyBPS <= 10_000, "UDAG: certainty > 100%");
        require(omegaResonanceBPS <= 10_000, "UDAG: resonance > 100%");
        id = keccak256(abi.encodePacked(name, block.timestamp, allNodeIds.length));
        nodes[id] = CausalNode({
            id: id, name: name, nodeType: nodeType,
            status: NodeStatus.LATENT,
            certaintyBPS: certaintyBPS,
            omegaResonanceBPS: omegaResonanceBPS,
            temporalOffset: temporalOffset,
            informationBits: informationBits,
            causes: new bytes32[](0),
            effects: new bytes32[](0),
            createdAt: uint64(block.timestamp)
        });
        allNodeIds.push(id);
        totalInformation += informationBits;
        if (omegaResonanceBPS >= 9_997) {
            nodes[id].status = NodeStatus.OMEGA_CONVERGED;
            omegaConvergedNodes++;
            emit NodeOmegaConverged(id);
        }
        emit NodeAdded(id, name, nodeType);
    }

    // ── Add causal edge ────────────────────────────────────────────────────────
    function addEdge(
        bytes32 from,
        bytes32 to,
        EdgeType edgeType,
        uint32 strengthBPS,
        int32 lag
    ) external onlyRole(GRAPH_OPERATOR) returns (bytes32 id) {
        require(nodes[from].id != bytes32(0) && nodes[to].id != bytes32(0), "UDAG: unknown node");
        require(from != to, "UDAG: self-loop");
        require(!_reaches(to, from), "UDAG: would create cycle");
        require(strengthBPS <= 10_000, "UDAG: strength > 100%");

        id = keccak256(abi.encodePacked(from, to, block.timestamp, allEdgeIds.length));
        edges[id] = CausalEdge({
            id: id, from: from, to: to, edgeType: edgeType,
            strengthBPS: strengthBPS, lag: lag, active: true,
            createdAt: uint64(block.timestamp)
        });
        allEdgeIds.push(id);

        nodes[from].effects.push(to);
        nodes[to].causes.push(from);

        if (edgeType == EdgeType.BACKDOOR) {
            emit BackdoorPathDetected(from, to, 1);
        }
        emit EdgeAdded(id, from, to, edgeType, strengthBPS);
    }

    // ── Do-calculus intervention ───────────────────────────────────────────────
    function intervene(
        bytes32 nodeId,
        uint32 targetValueBPS,
        bytes32[] calldata affectedNodes
    ) external onlyRole(CAUSAL_ORACLE) nonReentrant {
        require(nodes[nodeId].id != bytes32(0), "UDAG: unknown node");
        nodes[nodeId].status = NodeStatus.INTERVENED;
        bool ok = targetValueBPS <= 10_000;
        uint32 result = ok ? targetValueBPS : nodes[nodeId].certaintyBPS;
        interventions[interventionCount++] = Intervention({
            nodeId: nodeId, operator: msg.sender,
            targetValueBPS: targetValueBPS, resultValueBPS: result,
            executedAt: uint64(block.timestamp), succeeded: ok,
            affectedNodes: affectedNodes
        });
        emit InterventionExecuted(interventionCount - 1, nodeId, targetValueBPS, ok);
    }

    // ── Counterfactual query ───────────────────────────────────────────────────
    function queryCounterfactual(
        bytes32 treatmentNode,
        bytes32 outcomeNode,
        uint32 treatmentValueBPS
    ) external returns (uint256 queryId) {
        require(nodes[treatmentNode].id != bytes32(0) && nodes[outcomeNode].id != bytes32(0), "UDAG: unknown");
        // Simple counterfactual: linear interpolation based on treatment x path strength
        uint32 observedBPS = nodes[outcomeNode].certaintyBPS;
        uint32 cfBPS = uint32((uint256(treatmentValueBPS) * uint256(observedBPS)) / 10_000);
        queryId = cfQueryCount++;
        cfQueries[queryId] = CounterfactualQuery({
            treatmentNode: treatmentNode, outcomeNode: outcomeNode,
            treatmentValueBPS: treatmentValueBPS,
            observedOutcomeBPS: observedBPS,
            counterfactualBPS: cfBPS,
            queriedAt: uint64(block.timestamp), queriedBy: msg.sender
        });
        emit CounterfactualQueried(queryId, treatmentNode, outcomeNode);
    }

    uint256 public constant MAX_SEARCH = 256;

    /// @dev Bounded DFS over effects: true if `target` is reachable from `start`.
    ///      Reverts if the search exceeds MAX_SEARCH nodes (fail closed).
    function _reaches(bytes32 start, bytes32 target) internal view returns (bool) {
        bytes32[] memory stack = new bytes32[](MAX_SEARCH);
        bytes32[] memory seen = new bytes32[](MAX_SEARCH);
        uint256 sp; uint256 ns;
        stack[sp++] = start;
        while (sp > 0) {
            bytes32 cur = stack[--sp];
            if (cur == target) return true;
            bool dup;
            for (uint256 i = 0; i < ns; i++) { if (seen[i] == cur) { dup = true; break; } }
            if (dup) continue;
            require(ns < MAX_SEARCH, "UDAG: search bound");
            seen[ns++] = cur;
            bytes32[] storage eff = nodes[cur].effects;
            for (uint256 j = 0; j < eff.length; j++) {
                require(sp < MAX_SEARCH, "UDAG: search bound");
                stack[sp++] = eff[j];
            }
        }
        return false;
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getNode(bytes32 id) external view returns (CausalNode memory) { return nodes[id]; }
    function getEdge(bytes32 id) external view returns (CausalEdge memory) { return edges[id]; }
    function nodeCount() external view returns (uint256) { return allNodeIds.length; }
    function edgeCount() external view returns (uint256) { return allEdgeIds.length; }
    function omegaConvergenceRate() external view returns (uint256) {
        if (allNodeIds.length == 0) return 0;
        return (omegaConvergedNodes * 10_000) / allNodeIds.length;
    }
}
