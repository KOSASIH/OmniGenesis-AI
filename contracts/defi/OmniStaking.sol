// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title OmniStaking
 * @notice Multi-token staking with dynamic reward rates (AI-managed)
 */
contract OmniStaking is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant RATE_MANAGER_ROLE = keccak256("RATE_MANAGER_ROLE");

    struct Pool {
        IERC20 stakingToken;
        IERC20 rewardToken;
        uint256 rewardRate;
        uint256 totalStaked;
        uint256 accRewardPerShare;
        uint256 lastUpdateTime;
        uint256 minLockDuration;
        bool active;
    }

    struct UserStake {
        uint256 amount;
        uint256 rewardDebt;
        uint256 pendingRewards;
        uint256 stakeTime;
    }

    Pool[] public pools;
    mapping(uint256 => mapping(address => UserStake)) public userStakes;

    event PoolCreated(uint256 indexed poolId, address stakingToken, address rewardToken);
    event Staked(uint256 indexed poolId, address indexed user, uint256 amount);
    event Unstaked(uint256 indexed poolId, address indexed user, uint256 amount);
    event RewardsClaimed(uint256 indexed poolId, address indexed user, uint256 amount);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RATE_MANAGER_ROLE, admin);
    }

    function createPool(address stakingToken, address rewardToken, uint256 rewardRate, uint256 minLockDuration) external onlyRole(DEFAULT_ADMIN_ROLE) returns (uint256) {
        uint256 poolId = pools.length;
        pools.push(Pool(IERC20(stakingToken), IERC20(rewardToken), rewardRate, 0, 0, block.timestamp, minLockDuration, true));
        emit PoolCreated(poolId, stakingToken, rewardToken);
        return poolId;
    }

    function stake(uint256 poolId, uint256 amount) external nonReentrant whenNotPaused {
        Pool storage pool = pools[poolId];
        require(pool.active && amount > 0);
        _updatePool(poolId);
        UserStake storage us = userStakes[poolId][msg.sender];
        if (us.amount > 0) {
            us.pendingRewards += (us.amount * pool.accRewardPerShare / 1e36) - us.rewardDebt;
        }
        pool.stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        us.amount += amount;
        us.stakeTime = block.timestamp;
        us.rewardDebt = us.amount * pool.accRewardPerShare / 1e36;
        pool.totalStaked += amount;
        emit Staked(poolId, msg.sender, amount);
    }

    function unstake(uint256 poolId, uint256 amount) external nonReentrant {
        Pool storage pool = pools[poolId];
        UserStake storage us = userStakes[poolId][msg.sender];
        require(us.amount >= amount && block.timestamp >= us.stakeTime + pool.minLockDuration);
        _updatePool(poolId);
        us.pendingRewards += (us.amount * pool.accRewardPerShare / 1e36) - us.rewardDebt;
        us.amount -= amount;
        us.rewardDebt = us.amount * pool.accRewardPerShare / 1e36;
        pool.totalStaked -= amount;
        pool.stakingToken.safeTransfer(msg.sender, amount);
        emit Unstaked(poolId, msg.sender, amount);
    }

    function claimRewards(uint256 poolId) external nonReentrant {
        _updatePool(poolId);
        Pool storage pool = pools[poolId];
        UserStake storage us = userStakes[poolId][msg.sender];
        uint256 pending = (us.amount * pool.accRewardPerShare / 1e36) - us.rewardDebt + us.pendingRewards;
        require(pending > 0);
        us.pendingRewards = 0;
        us.rewardDebt = us.amount * pool.accRewardPerShare / 1e36;
        pool.rewardToken.safeTransfer(msg.sender, pending);
        emit RewardsClaimed(poolId, msg.sender, pending);
    }

    function updateRewardRate(uint256 poolId, uint256 newRate) external onlyRole(RATE_MANAGER_ROLE) {
        _updatePool(poolId);
        pools[poolId].rewardRate = newRate;
    }

    function _updatePool(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        if (block.timestamp > pool.lastUpdateTime && pool.totalStaked > 0) {
            uint256 reward = (block.timestamp - pool.lastUpdateTime) * pool.rewardRate;
            pool.accRewardPerShare += (reward * 1e36) / pool.totalStaked;
        }
        pool.lastUpdateTime = block.timestamp;
    }

    function poolCount() external view returns (uint256) { return pools.length; }
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
