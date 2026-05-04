// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PioneerAirdrop
 * @notice Merkle-tree based airdrop for PiNexus Pioneer holders
 * @dev Supports multi-token airdrop ($OGEN + $PiNEX), time-locked claiming, anti-sybil
 */
contract PioneerAirdrop is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    bytes32 public constant AIRDROP_MANAGER_ROLE = keccak256("AIRDROP_MANAGER_ROLE");

    struct AirdropRound {
        bytes32 merkleRoot;
        address omniToken;
        address ogenToken;
        uint256 totalOmni;
        uint256 totalOgen;
        uint256 startTime;
        uint256 endTime;
        uint256 claimCount;
        uint256 totalClaimed;
        bool active;
        string description;
    }

    mapping(uint256 => AirdropRound) public rounds;
    mapping(uint256 => mapping(address => bool)) public claimed;
    uint256 public roundCount;

    event RoundCreated(uint256 indexed roundId, bytes32 merkleRoot, uint256 totalOmni, uint256 totalOgen);
    event AirdropClaimed(uint256 indexed roundId, address indexed claimer, uint256 omniAmount, uint256 ogenAmount);
    event RoundClosed(uint256 indexed roundId, uint256 unclaimed);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(AIRDROP_MANAGER_ROLE, admin);
    }

    function createRound(
        bytes32 merkleRoot,
        address omniToken,
        address ogenToken,
        uint256 totalOmni,
        uint256 totalOgen,
        uint256 startTime,
        uint256 endTime,
        string calldata description
    ) external onlyRole(AIRDROP_MANAGER_ROLE) returns (uint256 roundId) {
        roundId = roundCount++;
        if (totalOmni > 0) IERC20(omniToken).safeTransferFrom(msg.sender, address(this), totalOmni);
        if (totalOgen > 0) IERC20(ogenToken).safeTransferFrom(msg.sender, address(this), totalOgen);
        rounds[roundId] = AirdropRound({
            merkleRoot: merkleRoot, omniToken: omniToken, ogenToken: ogenToken,
            totalOmni: totalOmni, totalOgen: totalOgen,
            startTime: startTime == 0 ? block.timestamp : startTime,
            endTime: endTime, claimCount: 0, totalClaimed: 0,
            active: true, description: description
        });
        emit RoundCreated(roundId, merkleRoot, totalOmni, totalOgen);
    }

    function claim(
        uint256 roundId,
        uint256 omniAmount,
        uint256 ogenAmount,
        bytes32[] calldata merkleProof
    ) external nonReentrant whenNotPaused {
        AirdropRound storage round = rounds[roundId];
        require(round.active, "Airdrop: round inactive");
        require(block.timestamp >= round.startTime, "Airdrop: not started");
        require(round.endTime == 0 || block.timestamp <= round.endTime, "Airdrop: ended");
        require(!claimed[roundId][msg.sender], "Airdrop: already claimed");

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, omniAmount, ogenAmount));
        require(MerkleProof.verify(merkleProof, round.merkleRoot, leaf), "Airdrop: invalid proof");

        claimed[roundId][msg.sender] = true;
        round.claimCount++;
        round.totalClaimed += omniAmount + ogenAmount;

        if (omniAmount > 0) IERC20(round.omniToken).safeTransfer(msg.sender, omniAmount);
        if (ogenAmount > 0) IERC20(round.ogenToken).safeTransfer(msg.sender, ogenAmount);
        emit AirdropClaimed(roundId, msg.sender, omniAmount, ogenAmount);
    }

    function closeRound(uint256 roundId, address treasury) external onlyRole(AIRDROP_MANAGER_ROLE) {
        AirdropRound storage round = rounds[roundId];
        require(round.active);
        round.active = false;
        uint256 leftOmni = IERC20(round.omniToken).balanceOf(address(this));
        uint256 leftOgen = IERC20(round.ogenToken).balanceOf(address(this));
        if (leftOmni > 0) IERC20(round.omniToken).safeTransfer(treasury, leftOmni);
        if (leftOgen > 0) IERC20(round.ogenToken).safeTransfer(treasury, leftOgen);
        emit RoundClosed(roundId, leftOmni + leftOgen);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
