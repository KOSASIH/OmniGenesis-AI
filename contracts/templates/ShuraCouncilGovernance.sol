// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ShuraCouncilGovernance
 * @notice Decentralized Shura Council governance for Islamic blockchain networks
 * @dev Implements Islamic consultation (Shura) with:
 *      - Weighted voting by scholar credentials
 *      - Ijma'a (consensus) requirements
 *      - Fatwa-based veto power for Mufti nodes
 *      - Majelis Syura timelock for major decisions
 *      - Maqasid alignment scoring for proposals
 */
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ShuraCouncilGovernance is AccessControl, ReentrancyGuard {
    bytes32 public constant MEMBER_ROLE    = keccak256("MEMBER_ROLE");
    bytes32 public constant MUFTI_ROLE     = keccak256("MUFTI_ROLE");
    bytes32 public constant OBSERVER_ROLE  = keccak256("OBSERVER_ROLE");

    enum ProposalStatus  { PENDING, SHURA_REVIEW, VOTING, TIMELOCKED, EXECUTED, REJECTED, FATWA_VETOED }
    enum ProposalCategory{ PROTOCOL_UPGRADE, TREASURY, SYARIAH_POLICY, EMERGENCY, WAQF_ALLOCATION, CERTIFICATION }

    struct Proposal {
        uint256         proposalId;
        address         proposer;
        string          title;
        string          arabicTitle;
        string          description;
        ProposalCategory category;
        ProposalStatus  status;
        uint256         createdAt;
        uint256         votingStart;
        uint256         votingEnd;
        uint256         timelockEnd;
        uint256         votesFor;
        uint256         votesAgainst;
        uint256         votesAbstain;
        uint256         quorumRequired;        // Basis points of total voting power
        uint256         ijmaRequirement;       // % required for Ijma'a (default 67%)
        bool            fatwaVetoed;
        string          fatwaVetoReason;
        bytes           executionData;
        address         targetContract;
        uint256         maqasidAlignmentScore; // 0-100
    }

    struct CouncilMember {
        address wallet;
        string  name;
        string  credentials;          // e.g., "PhD Islamic Finance, AAOIFI Certified"
        uint256 credentialScore;      // 1-10: weight multiplier
        bool    isMufti;
        uint256 votingPower;
        uint256 proposalsVoted;
        uint256 proposalsCreated;
        bool    active;
    }

    uint256 public constant VOTING_PERIOD    = 7 days;
    uint256 public constant TIMELOCK_PERIOD  = 2 days;
    uint256 public constant SHURA_PERIOD     = 3 days;

    mapping(uint256 => Proposal)      public proposals;
    mapping(address => CouncilMember) public members;
    mapping(uint256 => mapping(address => bool))    public hasVoted;
    mapping(uint256 => mapping(address => uint256)) public voteWeight;
    address[] public memberList;
    uint256 public proposalCount;
    uint256 public totalExecuted;
    uint256 public totalRejected;
    uint256 public totalFatwaVetoed;
    uint256 public totalVotingPower;

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string title, ProposalCategory category);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 weight, bool support, string reason);
    event IjmaReached(uint256 indexed proposalId, uint256 consensusPercent);
    event ProposalExecuted(uint256 indexed proposalId);
    event FatwaVeto(uint256 indexed proposalId, address indexed mufti, string reason);
    event MemberAdded(address indexed member, string name, uint256 votingPower);
    event TimelockStarted(uint256 indexed proposalId, uint256 executionTime);

    constructor(address _firstMember) {
        _grantRole(DEFAULT_ADMIN_ROLE, _firstMember);
        _grantRole(MEMBER_ROLE, _firstMember);
        _grantRole(MUFTI_ROLE, _firstMember);
        members[_firstMember] = CouncilMember({
            wallet: _firstMember, name: "Genesis Shura Member", credentials: "Founder",
            credentialScore: 10, isMufti: true, votingPower: 100, proposalsVoted: 0,
            proposalsCreated: 0, active: true
        });
        memberList.push(_firstMember);
        totalVotingPower = 100;
    }

    function createProposal(
        string calldata title, string calldata arabicTitle, string calldata description,
        ProposalCategory category, bytes calldata executionData, address targetContract,
        uint256 quorumBPs, uint256 ijmaPercent, uint256 maqasidScore
    ) external onlyRole(MEMBER_ROLE) returns (uint256) {
        require(ijmaPercent >= 51 && ijmaPercent <= 100, "Shura: Invalid Ijma requirement");
        require(maqasidScore <= 100, "Shura: Invalid Maqasid score");
        uint256 pId = ++proposalCount;
        proposals[pId] = Proposal({
            proposalId: pId, proposer: msg.sender, title: title, arabicTitle: arabicTitle,
            description: description, category: category, status: ProposalStatus.SHURA_REVIEW,
            createdAt: block.timestamp, votingStart: block.timestamp + SHURA_PERIOD,
            votingEnd: block.timestamp + SHURA_PERIOD + VOTING_PERIOD,
            timelockEnd: block.timestamp + SHURA_PERIOD + VOTING_PERIOD + TIMELOCK_PERIOD,
            votesFor: 0, votesAgainst: 0, votesAbstain: 0,
            quorumRequired: quorumBPs, ijmaRequirement: ijmaPercent,
            fatwaVetoed: false, fatwaVetoReason: "",
            executionData: executionData, targetContract: targetContract,
            maqasidAlignmentScore: maqasidScore
        });
        members[msg.sender].proposalsCreated++;
        emit ProposalCreated(pId, msg.sender, title, category);
        return pId;
    }

    function castVote(uint256 proposalId, bool support, bool abstain, string calldata reason)
        external onlyRole(MEMBER_ROLE) nonReentrant
    {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp >= p.votingStart && block.timestamp <= p.votingEnd, "Shura: Not in voting period");
        require(!hasVoted[proposalId][msg.sender], "Shura: Already voted");
        require(!p.fatwaVetoed, "Shura: Proposal vetoed by Fatwa");
        CouncilMember memory m = members[msg.sender];
        uint256 weight = m.votingPower * m.credentialScore;
        if (abstain) {
            p.votesAbstain += weight;
        } else if (support) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }
        hasVoted[proposalId][msg.sender] = true;
        voteWeight[proposalId][msg.sender] = weight;
        members[msg.sender].proposalsVoted++;
        if (p.status == ProposalStatus.SHURA_REVIEW) p.status = ProposalStatus.VOTING;
        // Check Ijma'a
        uint256 totalVotes = p.votesFor + p.votesAgainst + p.votesAbstain;
        if (totalVotes > 0) {
            uint256 forPercent = (p.votesFor * 100) / totalVotes;
            if (forPercent >= p.ijmaRequirement) {
                emit IjmaReached(proposalId, forPercent);
            }
        }
        emit VoteCast(proposalId, msg.sender, weight, support, reason);
    }

    function issueFatwaVeto(uint256 proposalId, string calldata reason) external onlyRole(MUFTI_ROLE) {
        Proposal storage p = proposals[proposalId];
        require(!p.fatwaVetoed, "Shura: Already vetoed");
        p.fatwaVetoed = true;
        p.fatwaVetoReason = reason;
        p.status = ProposalStatus.FATWA_VETOED;
        totalFatwaVetoed++;
        emit FatwaVeto(proposalId, msg.sender, reason);
    }

    function queueExecution(uint256 proposalId) external onlyRole(MEMBER_ROLE) {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp > p.votingEnd, "Shura: Voting not ended");
        require(!p.fatwaVetoed, "Shura: Fatwa veto active");
        uint256 totalVotes = p.votesFor + p.votesAgainst;
        if (totalVotes == 0) { p.status = ProposalStatus.REJECTED; totalRejected++; return; }
        uint256 forPercent = (p.votesFor * 100) / totalVotes;
        uint256 quorum = (totalVotingPower * p.quorumRequired) / 10000;
        if (p.votesFor + p.votesAgainst < quorum || forPercent < p.ijmaRequirement) {
            p.status = ProposalStatus.REJECTED;
            totalRejected++;
        } else {
            p.status = ProposalStatus.TIMELOCKED;
            emit TimelockStarted(proposalId, p.timelockEnd);
        }
    }

    function execute(uint256 proposalId) external onlyRole(MEMBER_ROLE) nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.status == ProposalStatus.TIMELOCKED, "Shura: Not timelocked");
        require(block.timestamp >= p.timelockEnd, "Shura: Timelock active");
        p.status = ProposalStatus.EXECUTED;
        totalExecuted++;
        if (p.targetContract != address(0) && p.executionData.length > 0) {
            (bool success,) = p.targetContract.call(p.executionData);
            require(success, "Shura: Execution failed");
        }
        emit ProposalExecuted(proposalId);
    }

    function addMember(address wallet, string calldata name, string calldata credentials,
        uint256 credScore, bool isMufti, uint256 votingPower) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!members[wallet].active, "Shura: Already member");
        _grantRole(MEMBER_ROLE, wallet);
        if (isMufti) _grantRole(MUFTI_ROLE, wallet);
        members[wallet] = CouncilMember({
            wallet: wallet, name: name, credentials: credentials, credentialScore: credScore,
            isMufti: isMufti, votingPower: votingPower, proposalsVoted: 0, proposalsCreated: 0, active: true
        });
        memberList.push(wallet);
        totalVotingPower += votingPower;
        emit MemberAdded(wallet, name, votingPower);
    }

    function getProposalResult(uint256 proposalId) external view returns (
        bool passed, uint256 forPercent, uint256 quorumReached
    ) {
        Proposal memory p = proposals[proposalId];
        uint256 total = p.votesFor + p.votesAgainst;
        if (total == 0) return (false, 0, 0);
        forPercent = (p.votesFor * 100) / total;
        quorumReached = (total * 100) / totalVotingPower;
        passed = forPercent >= p.ijmaRequirement && quorumReached >= (p.quorumRequired / 100);
    }

    function getMemberCount()   external view returns (uint256) { return memberList.length; }
    function getProposalCount() external view returns (uint256) { return proposalCount; }
}
