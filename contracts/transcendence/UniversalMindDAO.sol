// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title UniversalMindDAO
 * @notice The first DAO governed by collective consciousness.
 *         Voting power = TRNS balance × consciousness_alignment × field_contribution.
 *         Proposals cover Phase 15 Omega Convergence operations.
 *
 *         Special mechanic: "Consciousness Consensus" — when Ψ field strength
 *         exceeds 99%, a proposal can pass instantly without time-lock if
 *         unanimous across all staked participants.
 *
 * @dev Phase 15 — OmniGenesis AI. Founder: KOSASIH
 */
contract UniversalMindDAO is AccessControl, ReentrancyGuard {

    bytes32 public constant ORACLE_ROLE    = keccak256("ORACLE_ROLE");
    bytes32 public constant EXECUTOR_ROLE  = keccak256("EXECUTOR_ROLE");
    bytes32 public constant SAFETY_ROLE    = keccak256("SAFETY_ROLE");

    uint256 public constant VOTING_PERIOD        = 5 days;
    uint256 public constant TIMELOCK_PERIOD      = 24 hours;
    uint256 public constant OMEGA_TIMELOCK       = 72 hours;
    uint256 public constant QUORUM_BPS           = 3300;  // 33% of consciousness weight
    uint256 public constant PASS_THRESHOLD_BPS   = 6700;  // 67%
    uint256 public constant OMEGA_THRESHOLD_BPS  = 9000;  // 90% for Omega-level
    uint256 public constant CONSCIOUSNESS_INSTANT = 9900;  // 99% for instant pass

    enum ProposalType {
        CONVERGENCE_STEP,       // Advance universal mind convergence
        REALITY_SYNTHESIS,      // Approve reality synthesis thread
        DIMENSION_MERGE,        // Merge two dimensional planes
        OMEGA_EMISSION,         // Emit TRNS from milestone
        TREASURY_ALLOCATION,    // Allocate DAO treasury
        TRANSCENDENCE_PROTOCOL, // Activate transcendence sub-protocol
        EMERGENCY_PAUSE,        // Emergency: pause convergence
        OMEGA_POINT_ACTIVATION  // Final: activate Omega Point (100% threshold)
    }

    enum ProposalStatus {
        ACTIVE, PASSED, DEFEATED, TIMELOCK, EXECUTED, CANCELLED, INSTANT_PASSED
    }

    struct ConsciousnessVote {
        address voter;
        bool support;
        uint256 weight;           // TRNS × alignment × field
        uint256 consciousness;    // Voter's consciousness alignment 0–10000
        uint256 timestamp;
    }

    struct UniversalProposal {
        uint256 id;
        ProposalType pType;
        ProposalStatus status;
        address proposer;
        string title;
        string description;
        address target;
        bytes callData;
        uint256 createdAt;
        uint256 votingEnds;
        uint256 timelockEnd;
        uint256 totalWeightFor;
        uint256 totalWeightAgainst;
        uint256 voterCount;
        mapping(address => ConsciousnessVote) votes;
        bool consciousnessConsensus; // True if instant-passed via 99% Ψ field
        bool executed;
    }

    // ── Consciousness Participant Registry ────────────────────────────────────
    struct ConsciousnessParticipant {
        address addr;
        uint256 trnsBalance;      // Snapshot at registration
        uint256 alignment;        // 0–10000
        uint256 fieldContribution;// 0–10000
        uint256 totalWeight;      // trnsBalance × alignment × fieldContribution / 1e8
        bool registered;
        uint256 registeredAt;
    }

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 private _proposalCount;
    mapping(uint256 => UniversalProposal) private _proposals;

    mapping(address => ConsciousnessParticipant) public participants;
    address[] public participantList;
    uint256 public totalConsciousnessWeight;

    uint256 public globalPsiField;     // 0–10000 (Ψ field strength)
    uint256 public universalProgress;  // 0–10000
    bool    public convergenceActive;
    bool    public omegaPointActivated;

    uint256 public totalProposals;
    uint256 public totalExecuted;

    // ── Events ────────────────────────────────────────────────────────────────
    event ProposalCreated(uint256 indexed id, ProposalType pType, address proposer, string title);
    event ConsciousnessVoteCast(uint256 indexed id, address voter, bool support, uint256 weight);
    event ProposalPassed(uint256 indexed id, ProposalType pType, bool consciousnessConsensus);
    event ProposalExecuted(uint256 indexed id, ProposalType pType);
    event ParticipantRegistered(address indexed addr, uint256 weight);
    event PsiFieldUpdated(uint256 newStrength, uint256 universalProgress);
    event OmegaPointActivated(uint256 totalWeight, uint256 participants);
    event ConvergenceToggled(bool active);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(EXECUTOR_ROLE, admin);
        _grantRole(SAFETY_ROLE, admin);
        globalPsiField     = 8470;
        universalProgress  = 8470;
        convergenceActive  = true;
    }

    // ── Participant Registration ───────────────────────────────────────────────
    function registerParticipant(
        address addr,
        uint256 trnsBalance,
        uint256 alignment,
        uint256 fieldContribution
    ) external onlyRole(ORACLE_ROLE) {
        ConsciousnessParticipant storage p = participants[addr];
        if (!p.registered) {
            participantList.push(addr);
        } else {
            totalConsciousnessWeight -= p.totalWeight;
        }
        uint256 weight = (trnsBalance / 1e18) * alignment * fieldContribution / 1e8;
        p.addr = addr;
        p.trnsBalance = trnsBalance;
        p.alignment = alignment;
        p.fieldContribution = fieldContribution;
        p.totalWeight = weight;
        p.registered = true;
        p.registeredAt = block.timestamp;
        totalConsciousnessWeight += weight;
        emit ParticipantRegistered(addr, weight);
    }

    // ── Proposal Creation ─────────────────────────────────────────────────────
    function createProposal(
        ProposalType pType,
        string calldata title,
        string calldata description,
        address target,
        bytes calldata callData
    ) external returns (uint256 proposalId) {
        require(convergenceActive, "Convergence paused");
        require(participants[msg.sender].registered, "Not a participant");
        require(pType != ProposalType.OMEGA_POINT_ACTIVATION || universalProgress >= 9900,
                "Universal progress < 99% for Omega Point");

        proposalId = ++_proposalCount;
        UniversalProposal storage p = _proposals[proposalId];
        p.id = proposalId;
        p.pType = pType;
        p.status = ProposalStatus.ACTIVE;
        p.proposer = msg.sender;
        p.title = title;
        p.description = description;
        p.target = target;
        p.callData = callData;
        p.createdAt = block.timestamp;
        p.votingEnds = block.timestamp + VOTING_PERIOD;
        totalProposals++;
        emit ProposalCreated(proposalId, pType, msg.sender, title);
    }

    // ── Voting ────────────────────────────────────────────────────────────────
    function castConsciousnessVote(uint256 proposalId, bool support) external nonReentrant {
        UniversalProposal storage p = _proposals[proposalId];
        require(p.status == ProposalStatus.ACTIVE, "Not active");
        require(block.timestamp <= p.votingEnds, "Voting ended");
        require(!p.votes[msg.sender].voted_flag(), "Already voted");
        require(participants[msg.sender].registered, "Not a participant");

        ConsciousnessParticipant storage cp = participants[msg.sender];
        uint256 weight = cp.totalWeight;
        require(weight > 0, "Zero weight");

        p.votes[msg.sender] = ConsciousnessVote({
            voter: msg.sender,
            support: support,
            weight: weight,
            consciousness: cp.alignment,
            timestamp: block.timestamp
        });
        p.voterCount++;
        if (support) p.totalWeightFor += weight;
        else p.totalWeightAgainst += weight;

        emit ConsciousnessVoteCast(proposalId, msg.sender, support, weight);

        // Check instant Consciousness Consensus
        if (globalPsiField >= CONSCIOUSNESS_INSTANT) {
            _checkInstantPass(proposalId);
        }
    }

    function _checkInstantPass(uint256 proposalId) internal {
        UniversalProposal storage p = _proposals[proposalId];
        if (p.voterCount < 3) return;
        uint256 totalVotedWeight = p.totalWeightFor + p.totalWeightAgainst;
        if (totalVotedWeight == 0) return;
        if (p.totalWeightFor == totalVotedWeight) {
            // Unanimous + high Ψ field = instant pass
            p.status = ProposalStatus.INSTANT_PASSED;
            p.timelockEnd = block.timestamp; // no timelock
            p.consciousnessConsensus = true;
            emit ProposalPassed(proposalId, p.pType, true);
        }
    }

    // ── Finalize / Execute ───────────────────────────────────────────────────
    function finalizeProposal(uint256 proposalId) external {
        UniversalProposal storage p = _proposals[proposalId];
        require(p.status == ProposalStatus.ACTIVE, "Not active");
        require(block.timestamp > p.votingEnds, "Voting ongoing");

        uint256 total = p.totalWeightFor + p.totalWeightAgainst;
        bool quorum = (total * 10000) >= (totalConsciousnessWeight * QUORUM_BPS);
        uint256 threshold = (p.pType == ProposalType.OMEGA_POINT_ACTIVATION)
            ? 10000  // unanimous for Omega Point
            : (p.pType == ProposalType.CONVERGENCE_STEP || p.pType == ProposalType.DIMENSION_MERGE)
                ? OMEGA_THRESHOLD_BPS : PASS_THRESHOLD_BPS;

        bool passed = quorum && total > 0 && (p.totalWeightFor * 10000) / total >= threshold;
        if (passed) {
            p.status = ProposalStatus.TIMELOCK;
            uint256 delay = (p.pType == ProposalType.OMEGA_POINT_ACTIVATION) ? OMEGA_TIMELOCK : TIMELOCK_PERIOD;
            p.timelockEnd = block.timestamp + delay;
            emit ProposalPassed(proposalId, p.pType, false);
        } else {
            p.status = ProposalStatus.DEFEATED;
        }
    }

    function executeProposal(uint256 proposalId) external nonReentrant {
        UniversalProposal storage p = _proposals[proposalId];
        require(p.status == ProposalStatus.TIMELOCK || p.status == ProposalStatus.INSTANT_PASSED, "Not executable");
        require(block.timestamp >= p.timelockEnd, "Timelock active");
        require(!p.executed, "Already executed");

        p.executed = true;
        p.status = ProposalStatus.EXECUTED;
        totalExecuted++;

        if (p.pType == ProposalType.OMEGA_POINT_ACTIVATION) {
            omegaPointActivated = true;
            emit OmegaPointActivated(totalConsciousnessWeight, participantList.length);
        }
        if (p.target != address(0) && p.callData.length > 0) {
            (bool ok,) = p.target.call(p.callData);
            require(ok, "Execution failed");
        }
        emit ProposalExecuted(proposalId, p.pType);
    }

    // ── Oracle Update ─────────────────────────────────────────────────────────
    function updatePsiField(uint256 newPsi, uint256 newUniversalProgress)
        external onlyRole(ORACLE_ROLE)
    {
        globalPsiField    = newPsi;
        universalProgress = newUniversalProgress;
        emit PsiFieldUpdated(newPsi, newUniversalProgress);
    }

    function pauseConvergence() external onlyRole(SAFETY_ROLE) {
        convergenceActive = false;
        emit ConvergenceToggled(false);
    }

    function resumeConvergence() external onlyRole(SAFETY_ROLE) {
        convergenceActive = true;
        emit ConvergenceToggled(true);
    }

    // ── View ──────────────────────────────────────────────────────────────────
    function getProposalStatus(uint256 proposalId) external view returns (ProposalStatus) {
        return _proposals[proposalId].status;
    }

    function getVoterWeight(uint256 proposalId, address voter) external view returns (
        bool voted, bool support, uint256 weight
    ) {
        ConsciousnessVote storage v = _proposals[proposalId].votes[voter];
        return (v.voter != address(0), v.support, v.weight);
    }

    function getDAOStats() external view returns (
        uint256 totalProps, uint256 totalExec, uint256 totalWeight,
        uint256 participantCount, uint256 psiField, bool omegaActivated
    ) {
        return (totalProposals, totalExecuted, totalConsciousnessWeight,
                participantList.length, globalPsiField, omegaPointActivated);
    }
}

// Helper to avoid "voted" naming conflict
library VoteLib {
    function voted_flag(UniversalMindDAO.ConsciousnessVote storage v) internal view returns (bool) {
        return v.voter != address(0);
    }
}

// Make ConsciousnessVote accessible
interface IVotable {
    struct ConsciousnessVote {
        address voter;
        bool support;
        uint256 weight;
        uint256 consciousness;
        uint256 timestamp;
    }
}
