// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title PiNexusOmniBridge
 * @notice Cross-chain bridge for PiNexus <-> OmniGenesis tokens
 * @dev Lock-and-mint with multi-validator signatures, daily caps, rate limiting
 */
contract PiNexusOmniBridge is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant VALIDATOR_ROLE = keccak256("VALIDATOR_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    struct BridgeConfig {
        address sourceToken;
        address destToken;
        uint256 dailyCap;
        uint256 minAmount;
        uint256 maxAmount;
        uint256 fee;
        bool active;
    }

    struct BridgeRequest {
        address sender;
        address sourceToken;
        uint256 amount;
        uint256 destChainId;
        uint256 nonce;
        uint256 timestamp;
        bool processed;
    }

    mapping(bytes32 => BridgeConfig) public bridgeConfigs;
    mapping(uint256 => BridgeRequest) public bridgeRequests;
    mapping(bytes32 => bool) public processedHashes;
    mapping(address => mapping(uint256 => uint256)) public dailyVolume;
    uint256 public requestCount;
    uint256 public validatorThreshold;

    event BridgeInitiated(uint256 indexed requestId, address indexed sender, address sourceToken, uint256 amount, uint256 destChainId);
    event BridgeCompleted(bytes32 indexed txHash, address indexed recipient, address destToken, uint256 amount);

    constructor(address admin, uint256 _validatorThreshold) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
        validatorThreshold = _validatorThreshold;
    }

    function configureBridge(bytes32 pairId, address sourceToken, address destToken, uint256 dailyCap, uint256 minAmount, uint256 maxAmount, uint256 fee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        bridgeConfigs[pairId] = BridgeConfig(sourceToken, destToken, dailyCap, minAmount, maxAmount, fee, true);
    }

    function initiateBridge(bytes32 pairId, uint256 amount, uint256 destChainId) external nonReentrant whenNotPaused returns (uint256 requestId) {
        BridgeConfig storage config = bridgeConfigs[pairId];
        require(config.active && amount >= config.minAmount && amount <= config.maxAmount);
        uint256 today = block.timestamp / 1 days;
        require(dailyVolume[config.sourceToken][today] + amount <= config.dailyCap);

        uint256 feeAmount = (amount * config.fee) / 10000;
        IERC20(config.sourceToken).safeTransferFrom(msg.sender, address(this), amount);
        dailyVolume[config.sourceToken][today] += amount;

        requestId = requestCount++;
        bridgeRequests[requestId] = BridgeRequest(msg.sender, config.sourceToken, amount - feeAmount, destChainId, requestId, block.timestamp, false);
        emit BridgeInitiated(requestId, msg.sender, config.sourceToken, amount - feeAmount, destChainId);
    }

    function completeBridge(bytes32 txHash, address recipient, address destToken, uint256 amount, bytes[] calldata signatures) external onlyRole(OPERATOR_ROLE) nonReentrant whenNotPaused {
        require(!processedHashes[txHash] && signatures.length >= validatorThreshold);
        bytes32 ethSignedHash = keccak256(abi.encodePacked(txHash, recipient, destToken, amount)).toEthSignedMessageHash();

        address[] memory signers = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ethSignedHash.recover(signatures[i]);
            require(hasRole(VALIDATOR_ROLE, signer));
            for (uint256 j = 0; j < i; j++) require(signers[j] != signer);
            signers[i] = signer;
        }

        processedHashes[txHash] = true;
        IERC20(destToken).safeTransfer(recipient, amount);
        emit BridgeCompleted(txHash, recipient, destToken, amount);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
