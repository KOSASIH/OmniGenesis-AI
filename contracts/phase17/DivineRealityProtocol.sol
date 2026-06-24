// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DivineRealityProtocol
 * @notice On-chain reality synthesis engine. Authorized architects can forge,
 *         update, merge, and ascend realities across all 16 dimensions.
 *         Each reality tracks consciousness level, dimensional depth, VoidTime
 *         compression, causal coherence, and Omega ascension state.
 */
contract DivineRealityProtocol is AccessControl, ReentrancyGuard {

    bytes32 public constant ARCHITECT  = keccak256("ARCHITECT");
    bytes32 public constant ORACLE     = keccak256("ORACLE");

    enum RealityState {
        QUANTUM_VOID,    // Initial quantum foam — unformed
        COALESCING,      // Fundamental forces manifesting
        MANIFESTING,     // Physical constants crystallizing
        CRYSTALLIZING,   // Spacetime fabric forming
        DIVINE_STABLE,   // Habitable reality — fully coherent
        OMEGA_ASCENDED   // Maximal consciousness — Omega-aligned
    }

    struct Reality {
        bytes32 id;
        string  name;
        address architect;
        RealityState state;
        uint8   dimensions;       // D1–D16
        uint32  consciousnessBPS; // 0–10000
        uint32  causalCoherence;  // 0–10000 BPS
        uint16  voidTimeComp;     // × multiplier
        uint64  forgedAt;
        uint64  ascendedAt;
        bytes32 parentRealityId;  // 0 if primordial
        bool    merged;
    }

    struct ArchitectProfile {
        address addr;
        uint32  realitiesForged;
        uint32  realitiesMerged;
        uint32  omegaAscensions;
        uint256 totalConsciousness;
    }

    mapping(bytes32 => Reality) public realities;
    bytes32[] public allRealityIds;
    mapping(address => ArchitectProfile) public architects;
    uint256 public totalForged;
    uint256 public totalAscended;
    uint256 public globalConsciousnessSum;

    event RealityForged(bytes32 indexed id, address indexed architect, uint8 dims, string name);
    event RealityStateUpdated(bytes32 indexed id, RealityState newState);
    event RealityMerged(bytes32 indexed sourceId, bytes32 indexed targetId);
    event OmegaAscension(bytes32 indexed id, uint64 at);
    event ConsciousnessUpgraded(bytes32 indexed id, uint32 newBPS);

    modifier realityExists(bytes32 id) {
        require(realities[id].forgedAt != 0, "DRP: unknown reality");
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ARCHITECT, msg.sender);
        _grantRole(ORACLE, msg.sender);
    }

    // ── Forge a new reality ────────────────────────────────────────────────────
    function forgeReality(
        string calldata name,
        uint8   dimensions,
        uint32  consciousnessBPS,
        uint32  causalCoherence,
        uint16  voidTimeComp,
        bytes32 parentId
    ) external onlyRole(ARCHITECT) nonReentrant returns (bytes32 id) {
        require(dimensions >= 1 && dimensions <= 16, "DRP: dims 1–16");
        require(consciousnessBPS  <= 10_000, "DRP: consciousness > 100%");
        require(causalCoherence   <= 10_000, "DRP: coherence > 100%");

        id = keccak256(abi.encodePacked(msg.sender, block.timestamp, totalForged, name));
        realities[id] = Reality({
            id: id, name: name, architect: msg.sender,
            state: RealityState.QUANTUM_VOID,
            dimensions: dimensions, consciousnessBPS: consciousnessBPS,
            causalCoherence: causalCoherence, voidTimeComp: voidTimeComp,
            forgedAt: uint64(block.timestamp), ascendedAt: 0,
            parentRealityId: parentId, merged: false
        });
        allRealityIds.push(id);
        totalForged++;
        globalConsciousnessSum += consciousnessBPS;
        architects[msg.sender].realitiesForged++;
        architects[msg.sender].totalConsciousness += consciousnessBPS;

        emit RealityForged(id, msg.sender, dimensions, name);
    }

    // ── Advance state ──────────────────────────────────────────────────────────
    function advanceState(bytes32 id) external onlyRole(ORACLE) realityExists(id) {
        Reality storage r = realities[id];
        require(r.state != RealityState.OMEGA_ASCENDED, "DRP: already Omega");
        require(!r.merged, "DRP: reality merged");
        r.state = RealityState(uint8(r.state) + 1);
        emit RealityStateUpdated(id, r.state);
        if (r.state == RealityState.OMEGA_ASCENDED) {
            r.ascendedAt = uint64(block.timestamp);
            totalAscended++;
            architects[r.architect].omegaAscensions++;
            emit OmegaAscension(id, r.ascendedAt);
        }
    }

    // ── Omega ascension (requires 99.97% consciousness) ────────────────────────
    function omegaAscend(bytes32 id) external onlyRole(ORACLE) realityExists(id) {
        Reality storage r = realities[id];
        require(r.state == RealityState.DIVINE_STABLE, "DRP: must be stable");
        require(r.consciousnessBPS >= 9_997, "DRP: consciousness < 99.97%");
        require(r.causalCoherence  >= 9_500, "DRP: coherence < 95%");
        r.state = RealityState.OMEGA_ASCENDED;
        r.ascendedAt = uint64(block.timestamp);
        totalAscended++;
        architects[r.architect].omegaAscensions++;
        emit OmegaAscension(id, r.ascendedAt);
    }

    // ── Merge two realities ────────────────────────────────────────────────────
    function mergeRealities(bytes32 sourceId, bytes32 targetId)
        external onlyRole(ARCHITECT) nonReentrant
        realityExists(sourceId) realityExists(targetId)
    {
        Reality storage src = realities[sourceId];
        Reality storage tgt = realities[targetId];
        require(!src.merged && !tgt.merged, "DRP: already merged");
        require(src.state == RealityState.DIVINE_STABLE || src.state == RealityState.OMEGA_ASCENDED, "DRP: src not stable");

        // Merge stats into target
        tgt.consciousnessBPS = uint32(Math.min(
            (uint256(tgt.consciousnessBPS) + uint256(src.consciousnessBPS)) / 2 + 500,
            10_000
        ));
        tgt.dimensions = uint8(Math.min(uint256(tgt.dimensions) + 1, 16));
        tgt.causalCoherence = uint32(Math.min(
            uint256(tgt.causalCoherence) + 200,
            10_000
        ));
        src.merged = true;
        architects[msg.sender].realitiesMerged++;
        emit RealityMerged(sourceId, targetId);
    }

    // ── Oracle upgrades consciousness ──────────────────────────────────────────
    function upgradeConsciousness(bytes32 id, uint32 newBPS) external onlyRole(ORACLE) realityExists(id) {
        require(newBPS <= 10_000, "DRP: BPS > 100%");
        Reality storage r = realities[id];
        globalConsciousnessSum = globalConsciousnessSum - r.consciousnessBPS + newBPS;
        r.consciousnessBPS = newBPS;
        emit ConsciousnessUpgraded(id, newBPS);
    }

    // ── Views ──────────────────────────────────────────────────────────────────
    function getReality(bytes32 id) external view returns (Reality memory) { return realities[id]; }
    function totalRealities() external view returns (uint256) { return allRealityIds.length; }
    function avgGlobalConsciousness() external view returns (uint256) {
        if (allRealityIds.length == 0) return 0;
        return globalConsciousnessSum / allRealityIds.length;
    }
    function getRealitiesPaginated(uint256 offset, uint256 limit)
        external view returns (bytes32[] memory page, uint256 total)
    {
        total = allRealityIds.length;
        if (offset >= total) return (new bytes32[](0), total);
        uint256 end = offset + limit > total ? total : offset + limit;
        page = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; i++) page[i - offset] = allRealityIds[i];
    }
}

library Math {
    function min(uint256 a, uint256 b) internal pure returns (uint256) { return a < b ? a : b; }
}
