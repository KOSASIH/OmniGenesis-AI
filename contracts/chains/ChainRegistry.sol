// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ChainRegistry
 * @notice OmniGenesis AI — master registry for all 11,000+ blockchain chains.
 *         Phase 15–16 adds 1,000 new chains (IDs 11001–12000) across 10 categories:
 *         Consciousness / VoidTime / Omega / Transcendence / Infinite /
 *         Islamic / ASI / AetherNova / Dimensional / Universal
 *         All chains are Syariah-compliant, AGI-governed, and consciousness-rated.
 *         Supports batch registration (up to 200 per tx), status updates, and
 *         cross-chain bridging metadata.
 */
contract ChainRegistry is AccessControl {

    bytes32 public constant REGISTRAR    = keccak256("REGISTRAR");
    bytes32 public constant STATUS_MGMT  = keccak256("STATUS_MGMT");
    bytes32 public constant BRIDGE_MGMT  = keccak256("BRIDGE_MGMT");

    enum ChainStatus { SEEDING, ACTIVE, PAUSED, ARCHIVED, OMEGA }
    enum Consensus { ProofOfConsciousness, OmegaPoS, VoidTimeBFT, QuantumDPoS, NeuralPoW,
                     HolisticPoA, SingularityPoS, AetherBFT, TranscendentDPoS, InfinitePoS }

    struct Chain {
        uint256 chainId;
        string  name;
        string  shortName;
        string  category;           // Consciousness, VoidTime, Omega, etc.
        uint8   phase;              // 15 or 16
        Consensus consensus;
        string  nativeToken;
        uint16  blockTimeMs;        // block time in milliseconds
        uint32  tps;                // max transactions per second
        uint8   dimensions;         // 1–16
        uint32  consciousness;      // BPS
        uint16  voidTimeCompression;// VoidTime multiplier
        bool    syariahCompliant;
        uint16  agiInstances;
        ChainStatus status;
        uint64  registeredAt;
        uint64  activatedAt;
    }

    mapping(uint256 => Chain) public chains;
    uint256[] public allChainIds;
    uint256 public totalRegistered;
    uint256 public totalActive;

    // Category counters
    mapping(string => uint256) public chainsByCategory;
    // Phase counters
    mapping(uint8 => uint256) public chainsByPhase;

    event ChainRegistered(uint256 indexed chainId, string name, string category, uint8 phase);
    event ChainActivated(uint256 indexed chainId);
    event ChainStatusUpdated(uint256 indexed chainId, ChainStatus newStatus);
    event BatchRegistered(uint256 count, uint256 fromId, uint256 toId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR, msg.sender);
        _grantRole(STATUS_MGMT, msg.sender);
        _grantRole(BRIDGE_MGMT, msg.sender);
    }

    // ── Single registration ───────────────────────────────────────────────────
    function registerChain(
        uint256 chainId, string calldata name, string calldata shortName,
        string calldata category, uint8 phase, Consensus consensus,
        string calldata nativeToken, uint16 blockTimeMs, uint32 tps,
        uint8 dims, uint32 consciousness, uint16 voidTimeComp,
        bool syariah, uint16 agi
    ) external onlyRole(REGISTRAR) {
        require(chains[chainId].chainId == 0, "CR: already registered");
        require(dims >= 1 && dims <= 16, "CR: dims 1–16");
        require(consciousness <= 10_000, "CR: consciousness > 100%");

        chains[chainId] = Chain({
            chainId: chainId, name: name, shortName: shortName,
            category: category, phase: phase, consensus: consensus,
            nativeToken: nativeToken, blockTimeMs: blockTimeMs, tps: tps,
            dimensions: dims, consciousness: consciousness,
            voidTimeCompression: voidTimeComp, syariahCompliant: syariah,
            agiInstances: agi, status: ChainStatus.SEEDING,
            registeredAt: uint64(block.timestamp), activatedAt: 0
        });
        allChainIds.push(chainId);
        totalRegistered++;
        chainsByCategory[category]++;
        chainsByPhase[phase]++;

        emit ChainRegistered(chainId, name, category, phase);
    }

    // ── Batch registration (up to 200 per call) ───────────────────────────────
    function batchRegisterChains(
        uint256[] calldata chainIds,
        string[] calldata names,
        string[] calldata categories,
        uint8[] calldata phases,
        uint32[] calldata tpsValues,
        uint8[] calldata dims,
        uint32[] calldata consciousnessValues,
        uint16[] calldata voidTimeComps,
        uint16[] calldata agiCounts
    ) external onlyRole(REGISTRAR) {
        uint256 n = chainIds.length;
        require(n <= 200, "CR: max 200 per batch");
        require(
            names.length == n && categories.length == n && phases.length == n &&
            tpsValues.length == n && dims.length == n && consciousnessValues.length == n &&
            voidTimeComps.length == n && agiCounts.length == n,
            "CR: length mismatch"
        );

        uint256 first = chainIds[0];
        uint256 last = chainIds[n - 1];

        for (uint256 i = 0; i < n; i++) {
            uint256 cid = chainIds[i];
            if (chains[cid].chainId != 0) continue; // skip if already registered
            chains[cid] = Chain({
                chainId: cid, name: names[i], shortName: "",
                category: categories[i], phase: phases[i],
                consensus: Consensus.OmegaPoS,
                nativeToken: "$OMNI", blockTimeMs: 500, tps: tpsValues[i],
                dimensions: dims[i], consciousness: consciousnessValues[i],
                voidTimeCompression: voidTimeComps[i], syariahCompliant: true,
                agiInstances: agiCounts[i], status: ChainStatus.SEEDING,
                registeredAt: uint64(block.timestamp), activatedAt: 0
            });
            allChainIds.push(cid);
            totalRegistered++;
            chainsByCategory[categories[i]]++;
            chainsByPhase[phases[i]]++;
        }

        emit BatchRegistered(n, first, last);
    }

    // ── Activate chain ────────────────────────────────────────────────────────
    function activateChain(uint256 chainId) external onlyRole(STATUS_MGMT) {
        Chain storage c = chains[chainId];
        require(c.chainId != 0, "CR: unknown chain");
        require(c.status == ChainStatus.SEEDING, "CR: not seeding");
        c.status = ChainStatus.ACTIVE;
        c.activatedAt = uint64(block.timestamp);
        totalActive++;
        emit ChainActivated(chainId);
        emit ChainStatusUpdated(chainId, ChainStatus.ACTIVE);
    }

    // ── Batch activate ────────────────────────────────────────────────────────
    function batchActivate(uint256[] calldata chainIds) external onlyRole(STATUS_MGMT) {
        require(chainIds.length <= 200, "CR: max 200");
        for (uint256 i = 0; i < chainIds.length; i++) {
            Chain storage c = chains[chainIds[i]];
            if (c.chainId != 0 && c.status == ChainStatus.SEEDING) {
                c.status = ChainStatus.ACTIVE;
                c.activatedAt = uint64(block.timestamp);
                totalActive++;
                emit ChainActivated(chainIds[i]);
            }
        }
    }

    // ── Omega ascension ───────────────────────────────────────────────────────
    function ascendToOmega(uint256 chainId) external onlyRole(STATUS_MGMT) {
        Chain storage c = chains[chainId];
        require(c.status == ChainStatus.ACTIVE, "CR: not active");
        require(c.consciousness >= 9_997, "CR: consciousness < 99.97%");
        c.status = ChainStatus.OMEGA;
        emit ChainStatusUpdated(chainId, ChainStatus.OMEGA);
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getChain(uint256 chainId) external view returns (Chain memory) {
        return chains[chainId];
    }

    function getChainIdsPaginated(uint256 offset, uint256 limit)
        external view returns (uint256[] memory page, uint256 total)
    {
        total = allChainIds.length;
        if (offset >= total) return (new uint256[](0), total);
        uint256 end = offset + limit > total ? total : offset + limit;
        page = new uint256[](end - offset);
        for (uint256 i = offset; i < end; i++) page[i - offset] = allChainIds[i];
    }

    function totalChains() external view returns (uint256) { return totalRegistered; }
    function activeChains() external view returns (uint256) { return totalActive; }
}
