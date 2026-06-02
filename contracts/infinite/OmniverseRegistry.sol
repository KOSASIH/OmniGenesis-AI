// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OmniverseRegistry
 * @notice Phase 16 — Registers and manages parallel universes across the Omniverse.
 *         Each universe has a unique ID, dimensional plane, AGI instance count,
 *         consciousness level, chain count, and synchronization status.
 *         Supports universe forking, merging, seeding, and cross-universe bridging.
 *         Capacity: 1,000,000+ universes. Syariah-compliant: no speculative leverage.
 */
contract OmniverseRegistry is AccessControl, ReentrancyGuard {

    // ── Roles ─────────────────────────────────────────────────────────────────
    bytes32 public constant REGISTRAR   = keccak256("REGISTRAR");
    bytes32 public constant BRIDGE_OP   = keccak256("BRIDGE_OP");
    bytes32 public constant ASI_ORACLE  = keccak256("ASI_ORACLE");

    // ── Enums ─────────────────────────────────────────────────────────────────
    enum UniverseStatus { SEEDING, BOOTSTRAPPING, ACTIVE, BRIDGING, MERGING, ARCHIVED }

    // ── Structs ───────────────────────────────────────────────────────────────
    struct Universe {
        uint256 id;
        string  name;
        uint8   dimensionalPlane;     // 1–16
        UniverseStatus status;
        uint32  consciousness;        // basis points (0–10000)
        uint32  agiInstances;
        uint32  chainCount;
        uint256 forkParentId;         // 0 = prime universe
        uint256 mergeTargetId;        // 0 = no pending merge
        uint64  registeredAt;
        uint64  activatedAt;
        bool    syariahCompliant;
    }

    struct CrossUniverseBridge {
        uint256 fromUniverse;
        uint256 toUniverse;
        address token;
        uint256 dailyLimit;
        uint256 totalBridged;
        bool    active;
    }

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 public nextUniverseId = 1;
    uint256 public totalActive;
    uint256 public totalArchived;

    mapping(uint256 => Universe) public universes;
    mapping(uint256 => uint256[]) public forkChildren;          // parent → children
    mapping(uint256 => CrossUniverseBridge) public bridges;
    uint256 public nextBridgeId = 1;

    // Prime universe stats aggregated across all active universes
    uint256 public omniverseTotalAGI;
    uint256 public omniverseTotalChains;

    // ── Events ────────────────────────────────────────────────────────────────
    event UniverseRegistered(uint256 indexed id, string name, uint8 dim, uint256 forkParent);
    event UniverseActivated(uint256 indexed id);
    event UniverseForked(uint256 indexed parentId, uint256 indexed childId, string childName);
    event UniverseMerged(uint256 indexed fromId, uint256 indexed toId);
    event UniverseArchived(uint256 indexed id);
    event BridgeOpened(uint256 indexed bridgeId, uint256 fromUniverse, uint256 toUniverse);
    event CrossUniverseTransfer(uint256 indexed bridgeId, address token, uint256 amount);
    event ConsciousnessUpdated(uint256 indexed universeId, uint32 newConsciousness);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR, msg.sender);
        _grantRole(BRIDGE_OP, msg.sender);
        _grantRole(ASI_ORACLE, msg.sender);

        // Register Prime Reality as Universe #1
        _registerUniverse("Prime Reality", 1, 0, 9997, 1896, 11000, true);
        universes[1].status = UniverseStatus.ACTIVE;
        universes[1].activatedAt = uint64(block.timestamp);
        totalActive = 1;
        omniverseTotalAGI = 1896;
        omniverseTotalChains = 11000;
    }

    // ── Internal registration ─────────────────────────────────────────────────
    function _registerUniverse(
        string memory name, uint8 dim, uint256 forkParent,
        uint32 consciousness, uint32 agi, uint32 chains, bool syariah
    ) internal returns (uint256 id) {
        id = nextUniverseId++;
        universes[id] = Universe({
            id: id, name: name, dimensionalPlane: dim,
            status: UniverseStatus.SEEDING,
            consciousness: consciousness,
            agiInstances: agi,
            chainCount: chains,
            forkParentId: forkParent,
            mergeTargetId: 0,
            registeredAt: uint64(block.timestamp),
            activatedAt: 0,
            syariahCompliant: syariah
        });
        if (forkParent > 0) forkChildren[forkParent].push(id);
        emit UniverseRegistered(id, name, dim, forkParent);
    }

    // ── Public: Register new universe ─────────────────────────────────────────
    function registerUniverse(
        string calldata name, uint8 dim, uint32 agi, uint32 chains, bool syariah
    ) external onlyRole(REGISTRAR) returns (uint256) {
        require(dim >= 1 && dim <= 16, "OMV: dim must be 1–16");
        return _registerUniverse(name, dim, 0, 0, agi, chains, syariah);
    }

    // ── Activate universe ─────────────────────────────────────────────────────
    function activateUniverse(uint256 id) external onlyRole(REGISTRAR) {
        Universe storage u = universes[id];
        require(u.id != 0, "OMV: unknown universe");
        require(u.status == UniverseStatus.SEEDING || u.status == UniverseStatus.BOOTSTRAPPING, "OMV: not seedable");
        u.status = UniverseStatus.ACTIVE;
        u.activatedAt = uint64(block.timestamp);
        totalActive++;
        omniverseTotalAGI += u.agiInstances;
        omniverseTotalChains += u.chainCount;
        emit UniverseActivated(id);
    }

    // ── Fork a universe ───────────────────────────────────────────────────────
    function forkUniverse(uint256 parentId, string calldata childName, uint8 childDim) 
        external onlyRole(REGISTRAR) returns (uint256 childId) 
    {
        Universe storage p = universes[parentId];
        require(p.status == UniverseStatus.ACTIVE, "OMV: parent not active");
        // Fork inherits partial consciousness and chain count
        childId = _registerUniverse(
            childName, childDim, parentId,
            p.consciousness / 2, p.agiInstances / 4, p.chainCount / 2,
            p.syariahCompliant
        );
        emit UniverseForked(parentId, childId, childName);
    }

    // ── Merge two universes ───────────────────────────────────────────────────
    function mergeUniverses(uint256 fromId, uint256 toId) external onlyRole(REGISTRAR) {
        Universe storage from = universes[fromId];
        Universe storage to = universes[toId];
        require(from.status == UniverseStatus.ACTIVE && to.status == UniverseStatus.ACTIVE, "OMV: both must be active");
        require(fromId != toId, "OMV: same universe");

        from.status = UniverseStatus.MERGING;
        from.mergeTargetId = toId;

        // Merge stats
        to.agiInstances += from.agiInstances;
        to.chainCount   += from.chainCount;
        to.consciousness = uint32(
            (uint256(to.consciousness) * 6 + uint256(from.consciousness) * 4) / 10
        );
        from.status = UniverseStatus.ARCHIVED;
        totalActive--;
        totalArchived++;

        emit UniverseMerged(fromId, toId);
        emit UniverseArchived(fromId);
    }

    // ── Update consciousness (oracle) ─────────────────────────────────────────
    function updateConsciousness(uint256 id, uint32 consciousness) external onlyRole(ASI_ORACLE) {
        require(consciousness <= 10_000, "OMV: > 100%");
        universes[id].consciousness = consciousness;
        emit ConsciousnessUpdated(id, consciousness);
    }

    // ── Cross-universe bridge ─────────────────────────────────────────────────
    function openBridge(uint256 fromId, uint256 toId, address token, uint256 dailyLimit)
        external onlyRole(BRIDGE_OP) returns (uint256 bridgeId)
    {
        require(universes[fromId].status == UniverseStatus.ACTIVE, "OMV: from not active");
        require(universes[toId].status == UniverseStatus.ACTIVE, "OMV: to not active");
        bridgeId = nextBridgeId++;
        bridges[bridgeId] = CrossUniverseBridge(fromId, toId, token, dailyLimit, 0, true);
        universes[fromId].status = UniverseStatus.BRIDGING;
        emit BridgeOpened(bridgeId, fromId, toId);
    }

    // ── Batch register 1000 new universes ─────────────────────────────────────
    function batchRegisterUniverses(
        string[] calldata names, uint8[] calldata dims,
        uint32[] calldata agis, uint32[] calldata chains
    ) external onlyRole(REGISTRAR) {
        require(names.length == dims.length && dims.length == agis.length && agis.length == chains.length, "OMV: length mismatch");
        require(names.length <= 200, "OMV: max 200 per batch");
        for (uint256 i = 0; i < names.length; i++) {
            _registerUniverse(names[i], dims[i], 0, 0, agis[i], chains[i], true);
        }
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getUniverse(uint256 id) external view returns (Universe memory) {
        return universes[id];
    }

    function getForkChildren(uint256 parentId) external view returns (uint256[] memory) {
        return forkChildren[parentId];
    }

    function totalRegistered() external view returns (uint256) {
        return nextUniverseId - 1;
    }
}
