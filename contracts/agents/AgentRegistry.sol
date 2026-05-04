// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AgentRegistry
 * @notice On-chain registry for OmniGenesis AI agents
 * @dev Tracks agent metadata, reputation, stakes, and cross-chain identities
 */
contract AgentRegistry is AccessControl, Pausable {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant REPUTATION_UPDATER_ROLE = keccak256("REPUTATION_UPDATER_ROLE");

    enum AgentCategory {
        GENESIS_CREATOR,
        PINEXUS_OVERLORD,
        BLOCKCHAIN_ASSIMILATOR,
        QUANTUM_GUARDIAN,
        ECON_ARCHITECT,
        METAVERSE_DEITY,
        INNOVATION_SCOUT
    }

    enum AgentStatus { INACTIVE, ACTIVE, SUSPENDED, DECOMMISSIONED }

    struct Agent {
        uint256 id;
        string name;
        AgentCategory category;
        AgentStatus status;
        address operator;
        uint256 reputationScore;
        uint256 tasksCompleted;
        uint256 totalRewardsEarned;
        uint256 stakeAmount;
        uint256 registeredAt;
        uint256 lastActiveAt;
        bytes32 modelHash;
        string metadataURI;
    }

    struct AgentTask {
        uint256 agentId;
        string taskType;
        bytes32 taskHash;
        uint256 rewardAmount;
        uint256 completedAt;
        bool success;
    }

    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public operatorAgents;
    mapping(AgentCategory => uint256[]) public categoryAgents;
    mapping(uint256 => AgentTask[]) public agentTaskHistory;

    uint256 public agentCount;
    uint256 public activeCount;
    uint256 public totalTasksCompleted;

    address public omniToken;
    uint256 public minStakePerAgent;

    event AgentRegistered(uint256 indexed agentId, string name, AgentCategory category, address operator);
    event AgentStatusChanged(uint256 indexed agentId, AgentStatus newStatus);
    event ReputationUpdated(uint256 indexed agentId, uint256 oldScore, uint256 newScore);
    event TaskRecorded(uint256 indexed agentId, bytes32 taskHash, bool success, uint256 reward);
    event AgentUpgraded(uint256 indexed agentId, bytes32 newModelHash);

    constructor(address admin, address _omniToken, uint256 _minStake) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
        _grantRole(REPUTATION_UPDATER_ROLE, admin);
        omniToken = _omniToken;
        minStakePerAgent = _minStake;
    }

    function registerAgent(
        string calldata name,
        AgentCategory category,
        address operator,
        bytes32 modelHash,
        string calldata metadataURI
    ) external onlyRole(REGISTRAR_ROLE) whenNotPaused returns (uint256 agentId) {
        agentId = agentCount++;
        agents[agentId] = Agent({
            id: agentId, name: name, category: category,
            status: AgentStatus.ACTIVE, operator: operator,
            reputationScore: 100, tasksCompleted: 0,
            totalRewardsEarned: 0, stakeAmount: 0,
            registeredAt: block.timestamp, lastActiveAt: block.timestamp,
            modelHash: modelHash, metadataURI: metadataURI
        });
        operatorAgents[operator].push(agentId);
        categoryAgents[category].push(agentId);
        activeCount++;
        emit AgentRegistered(agentId, name, category, operator);
    }

    function updateReputation(uint256 agentId, int256 delta) external onlyRole(REPUTATION_UPDATER_ROLE) {
        Agent storage a = agents[agentId];
        uint256 oldScore = a.reputationScore;
        if (delta < 0 && uint256(-delta) >= a.reputationScore) {
            a.reputationScore = 1;
        } else {
            a.reputationScore = uint256(int256(a.reputationScore) + delta);
            if (a.reputationScore > 10000) a.reputationScore = 10000;
        }
        emit ReputationUpdated(agentId, oldScore, a.reputationScore);
    }

    function recordTask(
        uint256 agentId,
        string calldata taskType,
        bytes32 taskHash,
        uint256 rewardAmount,
        bool success
    ) external onlyRole(REPUTATION_UPDATER_ROLE) {
        Agent storage a = agents[agentId];
        a.lastActiveAt = block.timestamp;
        if (success) { a.tasksCompleted++; a.totalRewardsEarned += rewardAmount; totalTasksCompleted++; }
        agentTaskHistory[agentId].push(AgentTask(agentId, taskType, taskHash, rewardAmount, block.timestamp, success));
        emit TaskRecorded(agentId, taskHash, success, rewardAmount);
    }

    function updateAgentStatus(uint256 agentId, AgentStatus newStatus) external onlyRole(REGISTRAR_ROLE) {
        AgentStatus old = agents[agentId].status;
        agents[agentId].status = newStatus;
        if (old == AgentStatus.ACTIVE && newStatus != AgentStatus.ACTIVE) activeCount--;
        else if (old != AgentStatus.ACTIVE && newStatus == AgentStatus.ACTIVE) activeCount++;
        emit AgentStatusChanged(agentId, newStatus);
    }

    function upgradeAgent(uint256 agentId, bytes32 newModelHash, string calldata newMetadataURI) external onlyRole(REGISTRAR_ROLE) {
        agents[agentId].modelHash = newModelHash;
        agents[agentId].metadataURI = newMetadataURI;
        emit AgentUpgraded(agentId, newModelHash);
    }

    function getAgentsByCategory(AgentCategory cat) external view returns (uint256[] memory) {
        return categoryAgents[cat];
    }

    function getOperatorAgents(address operator) external view returns (uint256[] memory) {
        return operatorAgents[operator];
    }

    function getEcosystemStats() external view returns (uint256, uint256, uint256) {
        return (agentCount, activeCount, totalTasksCompleted);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
