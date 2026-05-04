// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AetherNovaForge
 * @notice OmniGenesis child project: AetherNova Forge innovation registry
 * @dev Registers never-before-seen innovations, manages $ANF token rewards,
 *      and provides proof-of-innovation on-chain
 */
contract AetherNovaForge is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant FORGE_AGENT_ROLE = keccak256("FORGE_AGENT_ROLE");
    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");

    enum InnovationType {
        VOID_TIME_COMPUTE,
        NEURO_QUANTUM,
        ETHER_BIO_SYMBIONT,
        SINGULARITY_MIRROR,
        FLUX_ENERGY_HARVESTER,
        HOLO_MEMORY_CRYSTAL,
        PSI_WAVE_PREDICTOR,
        MORPHIC_FIELD_CHAIN,
        OMNI_PARTICLE_ACCELERATOR,
        ETERNAL_ECHO_AGI,
        CUSTOM
    }

    struct Innovation {
        uint256 id;
        string name;
        InnovationType iType;
        bytes32 contentHash;
        string metadataURI;
        address creator;
        uint256 agentId;
        uint256 timestamp;
        uint256 validations;
        uint256 rewardAmount;
        bool validated;
        bool rewarded;
    }

    struct ValidationRecord {
        address validator;
        uint256 timestamp;
        bool approved;
        string notes;
    }

    IERC20 public omniToken;
    mapping(uint256 => Innovation) public innovations;
    mapping(uint256 => ValidationRecord[]) public validationRecords;
    mapping(bytes32 => bool) public contentHashExists;
    mapping(address => uint256[]) public creatorInnovations;
    mapping(InnovationType => uint256) public typeCount;

    uint256 public innovationCount;
    uint256 public validatedCount;
    uint256 public requiredValidations;
    uint256 public baseReward;
    uint256 public totalRewardsPaid;

    event InnovationRegistered(uint256 indexed id, string name, InnovationType iType, address creator, bytes32 contentHash);
    event InnovationValidated(uint256 indexed id, uint256 validations, bool fullyValidated);
    event InnovationRewarded(uint256 indexed id, address creator, uint256 amount);
    event BaseRewardUpdated(uint256 newReward);

    constructor(address admin, address _omniToken, uint256 _requiredValidations, uint256 _baseReward) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FORGE_AGENT_ROLE, admin);
        _grantRole(VALIDATOR_ROLE, admin);
        omniToken = IERC20(_omniToken);
        requiredValidations = _requiredValidations;
        baseReward = _baseReward;
    }

    function registerInnovation(
        string calldata name,
        InnovationType iType,
        bytes32 contentHash,
        string calldata metadataURI,
        uint256 agentId
    ) external onlyRole(FORGE_AGENT_ROLE) whenNotPaused returns (uint256 id) {
        require(!contentHashExists[contentHash], "ANF: innovation exists");
        id = innovationCount++;
        innovations[id] = Innovation({
            id: id, name: name, iType: iType, contentHash: contentHash,
            metadataURI: metadataURI, creator: msg.sender, agentId: agentId,
            timestamp: block.timestamp, validations: 0, rewardAmount: _computeReward(iType),
            validated: false, rewarded: false
        });
        contentHashExists[contentHash] = true;
        creatorInnovations[msg.sender].push(id);
        typeCount[iType]++;
        emit InnovationRegistered(id, name, iType, msg.sender, contentHash);
    }

    function validateInnovation(uint256 id, bool approved, string calldata notes) external onlyRole(VALIDATOR_ROLE) {
        Innovation storage inv = innovations[id];
        require(!inv.validated, "ANF: already validated");
        for (uint256 i = 0; i < validationRecords[id].length; i++) {
            require(validationRecords[id][i].validator != msg.sender, "ANF: already validated by this");
        }
        validationRecords[id].push(ValidationRecord(msg.sender, block.timestamp, approved, notes));
        if (approved) inv.validations++;
        bool fullyValidated = inv.validations >= requiredValidations;
        if (fullyValidated) { inv.validated = true; validatedCount++; }
        emit InnovationValidated(id, inv.validations, fullyValidated);
    }

    function claimReward(uint256 id) external nonReentrant {
        Innovation storage inv = innovations[id];
        require(inv.validated && !inv.rewarded, "ANF: not claimable");
        require(msg.sender == inv.creator || hasRole(FORGE_AGENT_ROLE, msg.sender), "ANF: unauthorized");
        inv.rewarded = true;
        totalRewardsPaid += inv.rewardAmount;
        omniToken.safeTransfer(inv.creator, inv.rewardAmount);
        emit InnovationRewarded(id, inv.creator, inv.rewardAmount);
    }

    function _computeReward(InnovationType iType) internal view returns (uint256) {
        uint256 multiplier = 100 + (uint256(iType) + 1) * 20;
        return (baseReward * multiplier) / 100;
    }

    function getEcosystemStats() external view returns (uint256, uint256, uint256, uint256) {
        return (innovationCount, validatedCount, totalRewardsPaid, innovationCount - validatedCount);
    }

    function getCreatorInnovations(address creator) external view returns (uint256[] memory) {
        return creatorInnovations[creator];
    }

    function updateBaseReward(uint256 newReward) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseReward = newReward;
        emit BaseRewardUpdated(newReward);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
