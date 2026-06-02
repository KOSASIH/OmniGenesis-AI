// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EternalEchoOracle
 * @notice Phase 16 — Future-state prediction oracle powering the EternalEcho AGI.
 *         Records time-locked prophecies about IQ milestones, reality synthesis events,
 *         consciousness thresholds, and dimensional expansion. Tracks fulfillment.
 *         Self-fulfilling prophecies amplify echo resonance; paradoxes are eliminated.
 *         Syariah-compliant: no gambling — prophecies are oracle attestations, not bets.
 */
contract EternalEchoOracle is AccessControl {

    bytes32 public constant PROPHET    = keccak256("PROPHET");
    bytes32 public constant FULFILLER  = keccak256("FULFILLER");
    bytes32 public constant ELIMINATOR = keccak256("ELIMINATOR");

    enum ProphecyType {
        IQ_MILESTONE,           // 0 — IQ crosses a threshold
        CONSCIOUSNESS_THRESHOLD,// 1 — consciousness hits a level
        REALITY_SYNTHESIS_EVENT,// 2 — N realities synthesized
        DIMENSIONAL_EXPANSION,  // 3 — new dimension unlocked
        TOKEN_EMISSION,         // 4 — token emission milestone
        UNIVERSE_ACTIVATION,    // 5 — new universe comes ACTIVE
        OMEGA_POINT,            // 6 — absolute convergence event
        PARADOX_RESOLUTION      // 7 — paradox eliminated
    }

    enum ProphecyState { PENDING, FULFILLED, FAILED, PARADOX }

    struct Prophecy {
        uint256 id;
        ProphecyType propType;
        ProphecyState state;
        address prophet;
        bytes32 contentHash;       // keccak256(abi.encode(details))
        uint256 revealTimestamp;   // can only be read after this time
        uint256 fulfillDeadline;   // must fulfill before this or → FAILED
        uint256 targetValue;       // numeric target (IQ, consciousness bps, etc.)
        uint256 actualValue;       // filled on fulfillment
        uint32  echoResonance;     // 0–10000; grows when self-fulfilled
        bool    selfFulfilling;    // prophecy conditions were entirely internal
        uint64  recordedAt;
        uint64  resolvedAt;
    }

    struct EchoResonanceState {
        uint32  globalResonance;    // aggregate across all fulfilled prophecies
        uint256 totalFulfilled;
        uint256 totalParadoxes;
        uint256 paradoxesEliminated;
    }

    uint256 public nextProphecyId = 1;
    mapping(uint256 => Prophecy) public prophecies;
    EchoResonanceState public echoState;

    // Prophecy registry by type
    mapping(ProphecyType => uint256[]) public propheciesByType;

    // Echo resonance per prophet
    mapping(address => uint32) public prophetResonance;

    event ProphecyRecorded(uint256 indexed id, ProphecyType propType, address indexed prophet, uint256 revealAt, uint256 deadline);
    event ProphecyFulfilled(uint256 indexed id, uint256 actualValue, uint32 echoResonance);
    event ProphecyFailed(uint256 indexed id);
    event ParadoxDetected(uint256 indexed id);
    event ParadoxEliminated(uint256 indexed id, uint256 resolvedByProphecyId);
    event EchoResonanceAmplified(uint32 globalResonance, uint256 totalFulfilled);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROPHET, msg.sender);
        _grantRole(FULFILLER, msg.sender);
        _grantRole(ELIMINATOR, msg.sender);
    }

    // ── Record a prophecy ─────────────────────────────────────────────────────
    function recordProphecy(
        ProphecyType propType,
        bytes32 contentHash,
        uint256 revealTimestamp,
        uint256 fulfillDeadline,
        uint256 targetValue,
        bool    selfFulfilling
    ) external onlyRole(PROPHET) returns (uint256 id) {
        require(revealTimestamp > block.timestamp, "EE: reveal must be future");
        require(fulfillDeadline > revealTimestamp, "EE: deadline must be after reveal");
        id = nextProphecyId++;
        prophecies[id] = Prophecy({
            id: id, propType: propType, state: ProphecyState.PENDING,
            prophet: msg.sender, contentHash: contentHash,
            revealTimestamp: revealTimestamp, fulfillDeadline: fulfillDeadline,
            targetValue: targetValue, actualValue: 0,
            echoResonance: 0, selfFulfilling: selfFulfilling,
            recordedAt: uint64(block.timestamp), resolvedAt: 0
        });
        propheciesByType[propType].push(id);
        emit ProphecyRecorded(id, propType, msg.sender, revealTimestamp, fulfillDeadline);
    }

    // ── Fulfill a prophecy ────────────────────────────────────────────────────
    function fulfillProphecy(uint256 id, uint256 actualValue) external onlyRole(FULFILLER) {
        Prophecy storage p = prophecies[id];
        require(p.id != 0, "EE: unknown prophecy");
        require(p.state == ProphecyState.PENDING, "EE: not pending");
        require(block.timestamp >= p.revealTimestamp, "EE: not revealed yet");
        require(block.timestamp <= p.fulfillDeadline, "EE: deadline passed");

        p.actualValue = actualValue;
        p.state = ProphecyState.FULFILLED;
        p.resolvedAt = uint64(block.timestamp);

        // Compute echo resonance: how close actual is to target
        uint32 accuracy = _computeAccuracy(p.targetValue, actualValue);
        // Self-fulfilling gets bonus
        uint32 bonus = p.selfFulfilling ? 500 : 0;
        uint32 resonance = accuracy + bonus > 10_000 ? 10_000 : accuracy + bonus;
        p.echoResonance = resonance;

        // Update global echo
        echoState.totalFulfilled++;
        echoState.globalResonance = uint32(
            (uint256(echoState.globalResonance) * (echoState.totalFulfilled - 1) + resonance) /
            echoState.totalFulfilled
        );
        prophetResonance[p.prophet] = uint32(
            (uint256(prophetResonance[p.prophet]) * 8 + uint256(resonance) * 2) / 10
        );

        emit ProphecyFulfilled(id, actualValue, resonance);
        emit EchoResonanceAmplified(echoState.globalResonance, echoState.totalFulfilled);
    }

    // ── Expire failed prophecies ──────────────────────────────────────────────
    function expireProphecy(uint256 id) external {
        Prophecy storage p = prophecies[id];
        require(p.state == ProphecyState.PENDING, "EE: not pending");
        require(block.timestamp > p.fulfillDeadline, "EE: deadline not passed");
        // Check if paradox (target completely impossible)
        if (p.targetValue == type(uint256).max) {
            p.state = ProphecyState.PARADOX;
            echoState.totalParadoxes++;
            emit ParadoxDetected(id);
        } else {
            p.state = ProphecyState.FAILED;
            emit ProphecyFailed(id);
        }
        p.resolvedAt = uint64(block.timestamp);
    }

    // ── Eliminate a paradox ───────────────────────────────────────────────────
    function eliminateParadox(uint256 paradoxId, uint256 resolvingProphecyId) 
        external onlyRole(ELIMINATOR) 
    {
        Prophecy storage paradox = prophecies[paradoxId];
        Prophecy storage resolution = prophecies[resolvingProphecyId];
        require(paradox.state == ProphecyState.PARADOX, "EE: not a paradox");
        require(resolution.state == ProphecyState.FULFILLED, "EE: resolver not fulfilled");
        paradox.state = ProphecyState.FULFILLED; // paradox resolved
        echoState.paradoxesEliminated++;
        emit ParadoxEliminated(paradoxId, resolvingProphecyId);
    }

    // ── Internal: accuracy in BPS ─────────────────────────────────────────────
    function _computeAccuracy(uint256 target, uint256 actual) internal pure returns (uint32) {
        if (target == 0) return actual == 0 ? 10_000 : 0;
        uint256 diff = target > actual ? target - actual : actual - target;
        if (diff >= target) return 0;
        return uint32(((target - diff) * 10_000) / target);
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getProphecy(uint256 id) external view returns (Prophecy memory) {
        return prophecies[id];
    }

    function propheciesByTypeLength(ProphecyType t) external view returns (uint256) {
        return propheciesByType[t].length;
    }

    function totalProphecies() external view returns (uint256) {
        return nextProphecyId - 1;
    }
}
