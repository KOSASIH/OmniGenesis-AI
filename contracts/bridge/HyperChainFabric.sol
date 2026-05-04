// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title HyperChainFabric
 * @notice Layer-0 cross-chain messaging fabric for OmniGenesis
 * @dev Routes arbitrary messages between chains with agent-signed validation
 *      Supports arbitrary payload execution, cross-chain contract calls, and state sync
 */
contract HyperChainFabric is AccessControl, Pausable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    bytes32 public constant CHAIN_MANAGER_ROLE = keccak256("CHAIN_MANAGER_ROLE");

    enum MessageStatus { PENDING, DELIVERED, FAILED, EXPIRED }
    enum MessageType { TOKEN_TRANSFER, CONTRACT_CALL, STATE_SYNC, AGENT_COMMAND, GOVERNANCE }

    struct CrossChainMessage {
        bytes32 msgId;
        uint256 sourceChain;
        uint256 destChain;
        address sender;
        address recipient;
        MessageType msgType;
        bytes payload;
        uint256 fee;
        uint256 gasLimit;
        uint256 timestamp;
        uint256 expiresAt;
        MessageStatus status;
        uint256 nonce;
    }

    struct ChainConfig {
        uint256 chainId;
        string name;
        address fabricContract;
        uint256 confirmations;
        uint256 baseFee;
        bool active;
    }

    mapping(bytes32 => CrossChainMessage) public messages;
    mapping(bytes32 => bool) public processedMessages;
    mapping(uint256 => ChainConfig) public chainConfigs;
    mapping(address => uint256) public senderNonces;
    mapping(uint256 => uint256) public chainMessageCount;

    uint256 public validatorThreshold;
    uint256 public totalMessages;
    uint256 public totalDelivered;
    address public feeCollector;

    uint256[] public supportedChains;

    event MessageSent(bytes32 indexed msgId, uint256 sourceChain, uint256 destChain, address sender, MessageType msgType);
    event MessageDelivered(bytes32 indexed msgId, uint256 destChain, address recipient);
    event MessageFailed(bytes32 indexed msgId, string reason);
    event ChainRegistered(uint256 indexed chainId, string name);
    event FeeCollected(bytes32 indexed msgId, uint256 amount);

    constructor(address admin, address _feeCollector, uint256 _validatorThreshold) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RELAYER_ROLE, admin);
        _grantRole(CHAIN_MANAGER_ROLE, admin);
        feeCollector = _feeCollector;
        validatorThreshold = _validatorThreshold;
    }

    function registerChain(uint256 chainId, string calldata name, address fabricContract, uint256 confirmations, uint256 baseFee) external onlyRole(CHAIN_MANAGER_ROLE) {
        if (!chainConfigs[chainId].active) supportedChains.push(chainId);
        chainConfigs[chainId] = ChainConfig(chainId, name, fabricContract, confirmations, baseFee, true);
        emit ChainRegistered(chainId, name);
    }

    function sendMessage(
        uint256 destChainId,
        address recipient,
        MessageType msgType,
        bytes calldata payload,
        uint256 gasLimit,
        uint256 ttl
    ) external payable nonReentrant whenNotPaused returns (bytes32 msgId) {
        ChainConfig storage destChain = chainConfigs[destChainId];
        require(destChain.active, "HCF: chain not registered");
        require(msg.value >= destChain.baseFee, "HCF: insufficient fee");

        uint256 nonce = senderNonces[msg.sender]++;
        msgId = keccak256(abi.encodePacked(block.chainid, destChainId, msg.sender, nonce, block.timestamp));

        messages[msgId] = CrossChainMessage({
            msgId: msgId, sourceChain: block.chainid, destChain: destChainId,
            sender: msg.sender, recipient: recipient, msgType: msgType, payload: payload,
            fee: msg.value, gasLimit: gasLimit, timestamp: block.timestamp,
            expiresAt: ttl > 0 ? block.timestamp + ttl : type(uint256).max,
            status: MessageStatus.PENDING, nonce: nonce
        });

        chainMessageCount[destChainId]++;
        totalMessages++;

        if (msg.value > 0) {
            payable(feeCollector).transfer(msg.value);
            emit FeeCollected(msgId, msg.value);
        }
        emit MessageSent(msgId, block.chainid, destChainId, msg.sender, msgType);
    }

    function deliverMessage(bytes32 msgId, bytes calldata encodedMsg, bytes[] calldata signatures) external onlyRole(RELAYER_ROLE) nonReentrant whenNotPaused {
        require(!processedMessages[msgId], "HCF: already processed");
        require(signatures.length >= validatorThreshold, "HCF: insufficient signatures");

        bytes32 ethHash = keccak256(abi.encodePacked(msgId, encodedMsg)).toEthSignedMessageHash();
        address[] memory seen = new address[](signatures.length);
        for (uint256 i = 0; i < signatures.length; i++) {
            address signer = ethHash.recover(signatures[i]);
            require(hasRole(RELAYER_ROLE, signer), "HCF: invalid signer");
            for (uint256 j = 0; j < i; j++) require(seen[j] != signer, "HCF: dup signer");
            seen[i] = signer;
        }

        processedMessages[msgId] = true;
        totalDelivered++;

        (uint256 sourceChain, address recipient, bytes memory payload) = abi.decode(encodedMsg, (uint256, address, bytes));
        if (payload.length > 0 && recipient.code.length > 0) {
            (bool success, ) = recipient.call{gas: gasleft() - 10000}(payload);
            if (!success) { emit MessageFailed(msgId, "call failed"); return; }
        }
        emit MessageDelivered(msgId, block.chainid, recipient);
    }

    function getSupportedChains() external view returns (uint256[] memory) { return supportedChains; }
    function getStats() external view returns (uint256, uint256) { return (totalMessages, totalDelivered); }
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }

    receive() external payable {}
}
