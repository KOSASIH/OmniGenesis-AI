// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title OmegaPointDAO
 * @notice Ultimate governance DAO for Phase 17 decisions affecting all realities,
 *         timelines, and causal chains. Token-weighted voting with consciousness
 *         amplification. 9 proposal categories: Reality, Temporal, Causal, AGI,
 *         Dimensional, Sovereignty, Photonic, Neuromorphic, OmegaPoint.
 *         Omega Point proposals require 99.97% quorum + dual Syariah/Safety sign-off.
 */
contract OmegaPointDAO is AccessControl, ReentrancyGuard {

    bytes32 public constant PROPOSER       = keccak256("PROPOSER");
    bytes32 public constant EXECUTOR       = keccak256("EXECUTOR");
    bytes32 public constant SYARIAH_BOARD  = keccak256("SYARIAH_BOARD");
    bytes32 public constant SAFETY_COUNCIL = keccak256("SAFETY_COUNCIL");

    enum ProposalCategory {
        REALITY_SYNTHESIS,
        TEMPORAL_MODIFICATION,
        CAUSAL_INTERVENTION,
        AGI_CAPABILITY_UPGRADE,
        DIMENSIONAL_EXPANSION,
        SOVEREIGNTY_REALLOCATION,
        PHOTONIC_COMPUTE_UPGRADE,
        NEUROMORPHIC_REWIRE,
        OMEGA_POINT_CONVERGENCE  // Highest tier — unanimous + dual sign-off
    }

    enum ProposalState { PENDING, ACTIVE, SUCCEEDED, DEFEATED, EXECUTED, VETOED }

    struct Proposal {
        uint256 id;
        address proposer;
        ProposalCategory category;
        string  title;
        string  description;
        uint256 forVotes;           // amplified token-weighted votes
        uint256 againstVotes;
        uint256 totalVoters;
        uint64  createdAt;
        uint64  endsAt;
        uint64  executedAt;
        ProposalState state;
        bool    syariahApproved;
        bool    safetyApproved;
    }

    struct Vote {
        bool    support;
        uint256 weight;            // token balance, amplified
        uint32  consciousnessBPS;  // oracle-assigned amplifier
        uint64  castedAt;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => address[]) public voters;
    uint256 public proposalCount;

    uint64 public constant VOTING_PERIOD     = 7 days;
    uint64 public constant OMEGA_VOTE_PERIOD = 14 days;
    uint32 public constant DEFAULT_QUORUM    = 5_100; // 51%
    uint32 public constant OMEGA_QUORUM      = 9_997; // 99.97%

    event ProposalCreated(uint256 indexed id, address proposer, ProposalCategory category, string title);
    event VoteCast(uint256 indexed id, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed id);
    event ProposalVetoed(uint256 indexed id, string reason);
    event SyariahApproval(uint256 indexed id);
    event SafetyApproval(uint256 indexed id);

    IERC20 public immutable governanceToken;
    bytes32 public constant CONSCIOUSNESS_ORACLE = keccak256("CONSCIOUSNESS_ORACLE");
    uint32 public constant MIN_PARTICIPATION_BPS = 1_000;        // 10% of supply
    uint32 public constant OMEGA_MIN_PARTICIPATION_BPS = 5_000;  // 50% of supply
    mapping(address => uint32) public consciousnessBPS;          // oracle-assigned, max 10000

    constructor(address token) {
        require(token != address(0), "DAO: zero token");
        governanceToken = IERC20(token);
        _grantRole(CONSCIOUSNESS_ORACLE, msg.sender);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PROPOSER, msg.sender);
        _grantRole(EXECUTOR, msg.sender);
        _grantRole(SYARIAH_BOARD, msg.sender);
        _grantRole(SAFETY_COUNCIL, msg.sender);
    }

    // ── Create proposal ────────────────────────────────────────────────────────
    function propose(
        ProposalCategory category,
        string calldata title,
        string calldata description
    ) external onlyRole(PROPOSER) returns (uint256 id) {
        id = proposalCount++;
        bool isOmega = category == ProposalCategory.OMEGA_POINT_CONVERGENCE;
        proposals[id] = Proposal({
            id: id, proposer: msg.sender, category: category,
            title: title, description: description,
            forVotes: 0, againstVotes: 0, totalVoters: 0,
            createdAt: uint64(block.timestamp),
            endsAt: uint64(block.timestamp) + (isOmega ? OMEGA_VOTE_PERIOD : VOTING_PERIOD),
            executedAt: 0, state: ProposalState.ACTIVE,
            syariahApproved: false, safetyApproved: false
        });
        emit ProposalCreated(id, msg.sender, category, title);
    }

    function setConsciousness(address who, uint32 bps) external onlyRole(CONSCIOUSNESS_ORACLE) {
        require(bps <= 10_000, "DAO: invalid consciousness");
        consciousnessBPS[who] = bps;
    }

    // ── Cast vote: weight = current token balance (NOT self-declared) ─────────
    // NOTE: no snapshot -> vulnerable to balance-borrowing; production should use ERC20Votes.
    function castVote(uint256 id, bool support) external nonReentrant {
        Proposal storage p = proposals[id];
        require(p.state == ProposalState.ACTIVE, "DAO: not active");
        require(block.timestamp <= p.endsAt, "DAO: voting ended");
        require(votes[id][msg.sender].castedAt == 0, "DAO: already voted");
        uint256 bal = governanceToken.balanceOf(msg.sender);
        require(bal > 0, "DAO: no voting power");
        uint32 c = consciousnessBPS[msg.sender];
        uint256 weight = bal + (bal * c) / 10_000;

        votes[id][msg.sender] = Vote({
            support: support, weight: weight,
            consciousnessBPS: c, castedAt: uint64(block.timestamp)
        });
        voters[id].push(msg.sender);
        p.totalVoters++;
        if (support) p.forVotes += weight; else p.againstVotes += weight;
        emit VoteCast(id, msg.sender, support, weight);
    }

    // ── Finalize after the voting period ──────────────────────────────────────
    function finalize(uint256 id) external {
        Proposal storage p = proposals[id];
        require(p.state == ProposalState.ACTIVE, "DAO: not active");
        require(block.timestamp > p.endsAt, "DAO: voting open");
        bool isOmega = p.category == ProposalCategory.OMEGA_POINT_CONVERGENCE;
        uint256 total = p.forVotes + p.againstVotes;
        uint256 minPart = (governanceToken.totalSupply() *
            (isOmega ? OMEGA_MIN_PARTICIPATION_BPS : MIN_PARTICIPATION_BPS)) / 10_000;
        if (total == 0 || total < minPart) { p.state = ProposalState.DEFEATED; return; }
        uint256 forShare = (p.forVotes * 10_000) / total;
        uint32 quorum = isOmega ? OMEGA_QUORUM : DEFAULT_QUORUM;
        p.state = forShare >= quorum ? ProposalState.SUCCEEDED : ProposalState.DEFEATED;
    }

    // ── Syariah board sign-off ─────────────────────────────────────────────────
    function syariahApprove(uint256 id) external onlyRole(SYARIAH_BOARD) {
        proposals[id].syariahApproved = true;
        emit SyariahApproval(id);
    }

    // ── Safety council sign-off ────────────────────────────────────────────────
    function safetyApprove(uint256 id) external onlyRole(SAFETY_COUNCIL) {
        proposals[id].safetyApproved = true;
        emit SafetyApproval(id);
    }

    // ── Execute succeeded proposal ─────────────────────────────────────────────
    function execute(uint256 id) external onlyRole(EXECUTOR) nonReentrant {
        Proposal storage p = proposals[id];
        require(p.state == ProposalState.SUCCEEDED, "DAO: not succeeded");
        if (p.category == ProposalCategory.OMEGA_POINT_CONVERGENCE) {
            require(p.syariahApproved, "DAO: Syariah not approved");
            require(p.safetyApproved,  "DAO: Safety not approved");
        }
        p.state = ProposalState.EXECUTED;
        p.executedAt = uint64(block.timestamp);
        emit ProposalExecuted(id);
    }

    // ── Veto ──────────────────────────────────────────────────────────────────
    function veto(uint256 id, string calldata reason)
        external onlyRole(SAFETY_COUNCIL)
    {
        Proposal storage p = proposals[id];
        require(p.state != ProposalState.EXECUTED, "DAO: already executed");
        p.state = ProposalState.VETOED;
        emit ProposalVetoed(id, reason);
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getProposal(uint256 id) external view returns (Proposal memory) {
        return proposals[id];
    }
    function getVoters(uint256 id) external view returns (address[] memory) {
        return voters[id];
    }
}
