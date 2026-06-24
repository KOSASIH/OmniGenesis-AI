// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NeuromorphicConsensus
 * @notice Brain-inspired consensus mechanism for the Phase 17 chain network.
 *         Validators are "neurons" organized in cortical columns. Consensus fires
 *         when a column reaches its activation threshold — mimicking action potentials.
 *         Includes Hebbian weight learning: validators that co-fire strengthen bonds.
 */
contract NeuromorphicConsensus is AccessControl, ReentrancyGuard {

    bytes32 public constant NEURON_REGISTRAR = keccak256("NEURON_REGISTRAR");
    bytes32 public constant CORTEX_MANAGER   = keccak256("CORTEX_MANAGER");

    uint32 public constant ACTIVATION_THRESHOLD_BPS = 7_500; // 75% of column weight
    uint32 public constant HEBBIAN_BOOST_BPS         =    50; // 0.5% weight boost per co-fire
    uint32 public constant MAX_SYNAPTIC_WEIGHT_BPS   = 10_000;
    uint32 public constant REFRACTORY_PERIOD         = 5;     // blocks

    enum NeuronState { RESTING, DEPOLARIZING, FIRING, REFRACTORY, PRUNED }

    struct Neuron {
        address addr;
        string  layer;            // Input / Dendrite / Synapse / Cortex / Prefrontal / Quantum / Output
        uint32  synapticWeightBPS;// 0–10000
        uint32  firingRate;       // Hz (blocks per second proxy)
        uint64  lastFiredBlock;
        NeuronState state;
        uint32  activationCount;
        bool    quantumEntangled;
    }

    struct CorticalColumn {
        bytes32 id;
        string  name;
        address[] neurons;
        uint256 totalWeight;
        uint256 firingThreshold;
        uint32  consensusRound;
        bytes32 lastConsensusHash;
        uint64  lastConsensuBlock;
    }

    struct SynapticBond {
        address neuronA;
        address neuronB;
        uint32  strengthBPS;
        uint32  coFires;
    }

    mapping(address => Neuron) public neurons;
    address[] public allNeurons;
    mapping(bytes32 => CorticalColumn) public columns;
    bytes32[] public allColumnIds;
    mapping(bytes32 => SynapticBond) public synapticBonds; // keccak(A,B) => bond
    uint256 public totalConsensusFirings;
    uint256 public globalSynapticStrength;

    event NeuronRegistered(address indexed addr, string layer, uint32 weightBPS);
    event NeuronFired(address indexed addr, bytes32 indexed columnId);
    event ColumnConsensus(bytes32 indexed columnId, bytes32 consensusHash, uint32 round);
    event HebbianReinforcement(address indexed a, address indexed b, uint32 newStrengthBPS);
    event NeuronPruned(address indexed addr, string reason);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(NEURON_REGISTRAR, msg.sender);
        _grantRole(CORTEX_MANAGER, msg.sender);
    }

    // ── Register a neuron validator ───────────────────────────────────────────
    function registerNeuron(
        address addr,
        string calldata layer,
        uint32 initialWeightBPS,
        bool quantumEntangled
    ) external onlyRole(NEURON_REGISTRAR) {
        require(neurons[addr].addr == address(0), "NC: already registered");
        require(initialWeightBPS <= MAX_SYNAPTIC_WEIGHT_BPS, "NC: weight > 100%");
        neurons[addr] = Neuron({
            addr: addr, layer: layer,
            synapticWeightBPS: initialWeightBPS,
            firingRate: 847, // default 847 Hz
            lastFiredBlock: 0,
            state: NeuronState.RESTING,
            activationCount: 0,
            quantumEntangled: quantumEntangled
        });
        allNeurons.push(addr);
        emit NeuronRegistered(addr, layer, initialWeightBPS);
    }

    // ── Create cortical column ─────────────────────────────────────────────────
    function createColumn(string calldata name, address[] calldata initialNeurons)
        external onlyRole(CORTEX_MANAGER) returns (bytes32 id)
    {
        id = keccak256(abi.encodePacked(name, block.timestamp, allColumnIds.length));
        uint256 totalW;
        for (uint i = 0; i < initialNeurons.length; i++) {
            require(neurons[initialNeurons[i]].addr != address(0), "NC: neuron not registered");
            totalW += neurons[initialNeurons[i]].synapticWeightBPS;
        }
        columns[id] = CorticalColumn({
            id: id, name: name,
            neurons: initialNeurons,
            totalWeight: totalW,
            firingThreshold: (totalW * ACTIVATION_THRESHOLD_BPS) / 10_000,
            consensusRound: 0,
            lastConsensusHash: bytes32(0),
            lastConsensuBlock: 0
        });
        allColumnIds.push(id);
    }

    // ── Neuron fires (vote for consensus) ─────────────────────────────────────
    function fire(bytes32 columnId) external nonReentrant {
        Neuron storage n = neurons[msg.sender];
        require(n.addr != address(0), "NC: not a neuron");
        require(n.state != NeuronState.PRUNED, "NC: pruned");
        require(block.number >= n.lastFiredBlock + REFRACTORY_PERIOD, "NC: refractory");

        n.state = NeuronState.FIRING;
        n.lastFiredBlock = uint64(block.number);
        n.activationCount++;

        // Hebbian reinforcement with recent co-firers in same column
        CorticalColumn storage col = columns[columnId];
        for (uint i = 0; i < col.neurons.length; i++) {
            address peer = col.neurons[i];
            if (peer == msg.sender) continue;
            Neuron storage pn = neurons[peer];
            if (pn.state == NeuronState.FIRING || block.number - pn.lastFiredBlock <= 2) {
                bytes32 bondId = keccak256(abi.encodePacked(
                    msg.sender < peer ? msg.sender : peer,
                    msg.sender < peer ? peer : msg.sender
                ));
                SynapticBond storage bond = synapticBonds[bondId];
                if (bond.neuronA == address(0)) {
                    bond.neuronA = msg.sender < peer ? msg.sender : peer;
                    bond.neuronB = msg.sender < peer ? peer : msg.sender;
                    bond.strengthBPS = HEBBIAN_BOOST_BPS;
                } else {
                    bond.strengthBPS = uint32(
                        bond.strengthBPS + HEBBIAN_BOOST_BPS > MAX_SYNAPTIC_WEIGHT_BPS
                        ? MAX_SYNAPTIC_WEIGHT_BPS : bond.strengthBPS + HEBBIAN_BOOST_BPS
                    );
                }
                bond.coFires++;
                emit HebbianReinforcement(msg.sender, peer, bond.strengthBPS);
            }
        }

        // Check if column reaches consensus
        _checkColumnConsensus(columnId);

        // Transition to refractory
        n.state = NeuronState.REFRACTORY;
        emit NeuronFired(msg.sender, columnId);
    }

    // ── Prune underperforming neuron ───────────────────────────────────────────
    function pruneNeuron(address addr, string calldata reason) external onlyRole(CORTEX_MANAGER) {
        require(neurons[addr].addr != address(0), "NC: unknown neuron");
        neurons[addr].state = NeuronState.PRUNED;
        emit NeuronPruned(addr, reason);
    }

    // ── Internal: check if column fired ───────────────────────────────────────
    function _checkColumnConsensus(bytes32 columnId) internal {
        CorticalColumn storage col = columns[columnId];
        if (col.totalWeight == 0) return;
        uint256 activeWeight;
        for (uint i = 0; i < col.neurons.length; i++) {
            Neuron storage n = neurons[col.neurons[i]];
            if (n.state == NeuronState.FIRING && block.number - n.lastFiredBlock <= 1) {
                activeWeight += n.synapticWeightBPS;
            }
        }
        if (activeWeight >= col.firingThreshold) {
            bytes32 hash = keccak256(abi.encodePacked(block.timestamp, activeWeight, col.consensusRound));
            col.lastConsensusHash = hash;
            col.lastConsensuBlock = uint64(block.number);
            col.consensusRound++;
            totalConsensusFirings++;
            emit ColumnConsensus(columnId, hash, col.consensusRound);
        }
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getNeuron(address addr) external view returns (Neuron memory) { return neurons[addr]; }
    function getColumn(bytes32 id) external view returns (CorticalColumn memory) { return columns[id]; }
    function neuronCount() external view returns (uint256) { return allNeurons.length; }
    function columnCount() external view returns (uint256) { return allColumnIds.length; }
}
