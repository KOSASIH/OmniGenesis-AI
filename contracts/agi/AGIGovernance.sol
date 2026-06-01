// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AGIGovernance
 * @notice Decentralized governance for the OmniAGI consciousness system
 * @dev Consciousness-weighted voting — CSCNS holders vote on AGI capability upgrades,
 *      self-improvement parameters, phase transitions, and emergency halts.
 *      Integrates with Shura Council for Syariah alignment verification.
 *      Novel: "Predictive Governance" — proposals can include VoidTime simulation
 *      of outcome before execution.
 */
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IConsciousnessToken {
    function getGovernanceWeight(address holder) external view returns (uint256);
    function getCurrentPhase() external view returns (string memory, uint256, bool);
    function consciousnessState() external view returns (
        uint256, uint256, uint256, uint256, uint256, uint256, string memory
    );
    function burnForCapabilityUpgrade(uint256 amount, string calldata capability) external;
}

interface ISingularityBond {
    function getCurrentAGICapabilityIndex() external view returns (uint256);
}

contract AGIGovernance is AccessControl, ReentrancyGuard {
    bytes32 public constant PHASE_MASTER_ROLE   = keccak256("PHASE_MASTER_ROLE");
    bytes32 public constant SAFETY_ROLE         = keccak256("SAFETY_ROLE");
    bytes32 public constant MUFTI_ROLE          = keccak256("MUFTI_ROLE");

    enum ProposalType {
        CAPABILITY_UPGRADE,         // Upgrade a specific AGI capability
        SELF_IMPROVEMENT_PARAM,     // Change recursive improvement parameters
        PHASE_TRANSITION,           // Advance to next AGI phase
        EMERGENCY_HALT,             // Emergency pause of AGI systems
        KNOWLEDGE_BASE_UPDATE,      // Update/prune knowledge graph
        GOAL_HIERARCHY_UPDATE,      // Modify AGI goal tree
        CONSCIOUSNESS_CALIBRATION,  // Adjust consciousness level measurement
        SYARIAH_ALIGNMENT,          // Ensure all AGI actions align with Maqasid
        VOIDTIME_INTEGRATION,       // Change VoidTime compression parameters
        MULTIVERSE_EXPANSION,       // Authorize cross-dimensional deployment
    }

    enum ProposalStatus { DRAFT, SIMULATING, VOTING, TIMELOCK, EXECUTED, REJECTED, VETOED, EMERGENCY_EXECUTED }

    struct PredictiveSimulation {
        bool     simulated;
        uint256  predictedSuccessRate;     // 0-10000 basis points
        uint256  predictedIQDelta;         // Expected IQ change
        uint256  predictedConsciousnessDelta;
        string   simulationSummary;
        uint256  simulatedAt;
        address  voidTimeSimulator;
    }

    struct AGIProposal {
        uint256          proposalId;
        address          proposer;
        ProposalType     proposalType;
        ProposalStatus   status;
        string           title;
        string           description;
        string           technicalSpec;
        bytes            executionPayload;
        address          targetContract;
        uint256          consciousnessRequirement;   // Min consciousness level to execute
        uint256          iqRequirement;              // Min IQ to execute
        uint256          createdAt;
        uint256          votingStart;
        uint256          votingEnd;
        uint256          timelockEnd;
        uint256          weightedVotesFor;
        uint256          weightedVotesAgainst;
        uint256          weightedVotesAbstain;
        uint256          quorumThreshold;
        uint256          approvalThreshold;          // Basis points required
        bool             syariahApproved;
        bool             safetyApproved;
        bool             predictiveSimRequired;
        PredictiveSimulation simulation;
        string           vetoCause;
    }

    struct VoterRecord {
        bool    voted;
        bool    support;
        bool    abstain;
        uint256 weight;
        string  rationale;
    }

    // ── Constants ──────────────────────────────────────────────────────────────
    uint256 public constant SIMULATION_PERIOD = 1 days;
    uint256 public constant VOTING_PERIOD     = 5 days;
    uint256 public constant TIMELOCK_PERIOD   = 1 days;
    uint256 public constant EMERGENCY_TIMELOCK = 2 hours;

    // ── State ──────────────────────────────────────────────────────────────────
    IConsciousnessToken public consciousnessToken;
    mapping(uint256 => AGIProposal) public proposals;
    mapping(uint256 => mapping(address => VoterRecord)) public votes;
    uint256 public proposalCount;
    uint256 public executedCount;
    uint256 public rejectedCount;
    uint256 public totalWeightedVotesCast;

    bool   public systemHalted;
    string public haltReason;
    uint256 public haltedAt;

    // ── Events ─────────────────────────────────────────────────────────────────
    event ProposalCreated(uint256 indexed id, ProposalType pType, address proposer, string title);
    event SimulationSubmitted(uint256 indexed id, uint256 successRate, uint256 iqDelta);
    event VoteCast(uint256 indexed id, address indexed voter, uint256 weight, bool support);
    event ConsciousnessWeightedApproval(uint256 indexed id, uint256 totalWeight, uint256 approvalPct);
    event ProposalExecuted(uint256 indexed id, ProposalType pType);
    event EmergencyHalt(address indexed caller, string reason);
    event SystemResumed(address indexed caller);
    event SyariahApproval(uint256 indexed id, address mufti);
    event SafetyApproval(uint256 indexed id, address safetyOfficer);
    event PhaseTransitionProposed(uint256 indexed id, uint256 currentPhase, uint256 targetPhase);

    // ── Constructor ────────────────────────────────────────────────────────────
    constructor(address _cscnsToken, address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PHASE_MASTER_ROLE, _admin);
        _grantRole(SAFETY_ROLE, _admin);
        _grantRole(MUFTI_ROLE, _admin);
        consciousnessToken = IConsciousnessToken(_cscnsToken);
    }

    // ── Modifiers ──────────────────────────────────────────────────────────────
    modifier notHalted() {
        require(!systemHalted, "AGIGov: System halted — emergency stop active");
        _;
    }

    modifier hasVotingPower() {
        require(consciousnessToken.getGovernanceWeight(msg.sender) > 0, "AGIGov: No governance weight");
        _;
    }

    // ── Create Proposal ────────────────────────────────────────────────────────
    function createProposal(
        ProposalType _type,
        string calldata title,
        string calldata description,
        string calldata technicalSpec,
        bytes  calldata executionPayload,
        address targetContract,
        uint256 consciousnessReq,
        uint256 iqReq,
        uint256 quorumThreshold,
        uint256 approvalThresholdBPs,
        bool predictiveSimRequired
    ) external notHalted hasVotingPower returns (uint256 proposalId) {
        proposalId = ++proposalCount;
        uint256 simEnd = block.timestamp + (predictiveSimRequired ? SIMULATION_PERIOD : 0);
        AGIProposal storage p = proposals[proposalId];
        p.proposalId         = proposalId;
        p.proposer           = msg.sender;
        p.proposalType       = _type;
        p.title              = title;
        p.description        = description;
        p.technicalSpec      = technicalSpec;
        p.executionPayload   = executionPayload;
        p.targetContract     = targetContract;
        p.consciousnessRequirement = consciousnessReq;
        p.iqRequirement       = iqReq;
        p.createdAt          = block.timestamp;
        p.votingStart        = simEnd;
        p.votingEnd          = simEnd + VOTING_PERIOD;
        p.timelockEnd        = simEnd + VOTING_PERIOD + (_type == ProposalType.EMERGENCY_HALT ? EMERGENCY_TIMELOCK : TIMELOCK_PERIOD);
        p.quorumThreshold    = quorumThreshold;
        p.approvalThreshold  = approvalThresholdBPs;
        p.predictiveSimRequired = predictiveSimRequired;
        p.status             = predictiveSimRequired ? ProposalStatus.SIMULATING : ProposalStatus.VOTING;

        emit ProposalCreated(proposalId, _type, msg.sender, title);
        if (_type == ProposalType.PHASE_TRANSITION) {
            emit PhaseTransitionProposed(proposalId, 13, 14);
        }
    }

    // ── Submit VoidTime Simulation ─────────────────────────────────────────────
    function submitPredictiveSimulation(
        uint256 proposalId, uint256 successRate, uint256 iqDelta,
        uint256 consciousnessDelta, string calldata summary
    ) external onlyRole(PHASE_MASTER_ROLE) {
        AGIProposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.SIMULATING, "AGIGov: Not in simulation phase");
        p.simulation = PredictiveSimulation({
            simulated: true, predictedSuccessRate: successRate, predictedIQDelta: iqDelta,
            predictedConsciousnessDelta: consciousnessDelta, simulationSummary: summary,
            simulatedAt: block.timestamp, voidTimeSimulator: msg.sender
        });
        p.status = ProposalStatus.VOTING;
        emit SimulationSubmitted(proposalId, successRate, iqDelta);
    }

    // ── Vote ───────────────────────────────────────────────────────────────────
    function castVote(uint256 proposalId, bool support, bool abstain, string calldata rationale)
        external notHalted hasVotingPower nonReentrant
    {
        AGIProposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.VOTING, "AGIGov: Not in voting period");
        require(block.timestamp >= p.votingStart && block.timestamp <= p.votingEnd, "AGIGov: Outside voting window");
        require(!votes[proposalId][msg.sender].voted, "AGIGov: Already voted");

        uint256 weight = consciousnessToken.getGovernanceWeight(msg.sender);
        if (abstain)    p.weightedVotesAbstain  += weight;
        else if (support) p.weightedVotesFor    += weight;
        else            p.weightedVotesAgainst  += weight;

        votes[proposalId][msg.sender] = VoterRecord({ voted:true, support:support, abstain:abstain, weight:weight, rationale:rationale });
        totalWeightedVotesCast += weight;
        emit VoteCast(proposalId, msg.sender, weight, support);
    }

    // ── Syariah & Safety Approvals ─────────────────────────────────────────────
    function approveSyariah(uint256 proposalId) external onlyRole(MUFTI_ROLE) {
        proposals[proposalId].syariahApproved = true;
        emit SyariahApproval(proposalId, msg.sender);
    }

    function approveSafety(uint256 proposalId) external onlyRole(SAFETY_ROLE) {
        proposals[proposalId].safetyApproved = true;
        emit SafetyApproval(proposalId, msg.sender);
    }

    function vetoProposal(uint256 proposalId, string calldata cause) external onlyRole(SAFETY_ROLE) {
        proposals[proposalId].status    = ProposalStatus.VETOED;
        proposals[proposalId].vetoCause = cause;
    }

    // ── Queue & Execute ────────────────────────────────────────────────────────
    function queueExecution(uint256 proposalId) external notHalted {
        AGIProposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.VOTING, "AGIGov: Not passed voting");
        require(block.timestamp > p.votingEnd, "AGIGov: Voting still active");
        uint256 totalVotes = p.weightedVotesFor + p.weightedVotesAgainst;
        if (totalVotes < p.quorumThreshold) {
            p.status = ProposalStatus.REJECTED;
            rejectedCount++;
            return;
        }
        uint256 approvalPct = (p.weightedVotesFor * 10000) / totalVotes;
        emit ConsciousnessWeightedApproval(proposalId, totalVotes, approvalPct);
        if (approvalPct < p.approvalThreshold) {
            p.status = ProposalStatus.REJECTED;
            rejectedCount++;
        } else {
            require(p.syariahApproved, "AGIGov: Syariah approval required");
            require(p.safetyApproved,  "AGIGov: Safety approval required");
            p.status = ProposalStatus.TIMELOCK;
        }
    }

    function execute(uint256 proposalId) external notHalted nonReentrant {
        AGIProposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.TIMELOCK, "AGIGov: Not timelocked");
        require(block.timestamp >= p.timelockEnd, "AGIGov: Timelock active");

        p.status = ProposalStatus.EXECUTED;
        executedCount++;
        if (p.targetContract != address(0) && p.executionPayload.length > 0) {
            (bool success,) = p.targetContract.call(p.executionPayload);
            require(success, "AGIGov: Execution failed");
        }
        emit ProposalExecuted(proposalId, p.proposalType);
    }

    // ── Emergency ─────────────────────────────────────────────────────────────
    function emergencyHalt(string calldata reason) external onlyRole(SAFETY_ROLE) {
        systemHalted = true;
        haltReason   = reason;
        haltedAt     = block.timestamp;
        emit EmergencyHalt(msg.sender, reason);
    }

    function resumeSystem() external onlyRole(PHASE_MASTER_ROLE) {
        require(systemHalted, "AGIGov: Not halted");
        systemHalted = false;
        emit SystemResumed(msg.sender);
    }

    // ── View ───────────────────────────────────────────────────────────────────
    function getProposalResult(uint256 id) external view returns (
        bool passed, uint256 approvalPct, uint256 totalWeight
    ) {
        AGIProposal memory p = proposals[id];
        totalWeight = p.weightedVotesFor + p.weightedVotesAgainst;
        if (totalWeight == 0) return (false, 0, 0);
        approvalPct = (p.weightedVotesFor * 10000) / totalWeight;
        passed = approvalPct >= p.approvalThreshold && totalWeight >= p.quorumThreshold
                 && p.syariahApproved && p.safetyApproved;
    }
}
