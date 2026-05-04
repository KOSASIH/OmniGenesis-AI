// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IStrategy {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function harvest() external returns (uint256 rewards);
    function balanceOf() external view returns (uint256);
    function APY() external view returns (uint256);
}

/**
 * @title OmniYieldOptimizer
 * @notice AI-powered yield optimizer routing funds to highest-APY strategies
 * @dev Supports multiple strategies per vault with AI-managed rebalancing
 */
contract OmniYieldOptimizer is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    bytes32 public constant STRATEGY_MANAGER_ROLE = keccak256("STRATEGY_MANAGER_ROLE");
    bytes32 public constant AI_REBALANCER_ROLE = keccak256("AI_REBALANCER_ROLE");

    struct Vault {
        address token;
        address[] strategies;
        uint256[] allocations;
        uint256 totalDeposited;
        uint256 totalShares;
        uint256 performanceFee;
        uint256 managementFee;
        address feeRecipient;
        bool active;
        string name;
    }

    struct UserPosition {
        uint256 shares;
        uint256 depositTime;
        uint256 depositAmount;
    }

    mapping(uint256 => Vault) public vaults;
    mapping(uint256 => mapping(address => UserPosition)) public userPositions;
    mapping(address => uint256[]) public userVaults;
    uint256 public vaultCount;
    uint256 public totalValueLocked;

    event VaultCreated(uint256 indexed vaultId, address token, string name);
    event Deposited(uint256 indexed vaultId, address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(uint256 indexed vaultId, address indexed user, uint256 amount, uint256 shares);
    event Rebalanced(uint256 indexed vaultId, address indexed strategy, uint256 newAllocation);
    event HarvestExecuted(uint256 indexed vaultId, uint256 totalRewards, uint256 fee);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(STRATEGY_MANAGER_ROLE, admin);
        _grantRole(AI_REBALANCER_ROLE, admin);
    }

    function createVault(address token, string calldata name, uint256 performanceFee, uint256 managementFee, address feeRecipient) external onlyRole(STRATEGY_MANAGER_ROLE) returns (uint256 vaultId) {
        vaultId = vaultCount++;
        vaults[vaultId].token = token;
        vaults[vaultId].name = name;
        vaults[vaultId].performanceFee = performanceFee;
        vaults[vaultId].managementFee = managementFee;
        vaults[vaultId].feeRecipient = feeRecipient;
        vaults[vaultId].active = true;
        emit VaultCreated(vaultId, token, name);
    }

    function addStrategy(uint256 vaultId, address strategy, uint256 allocation) external onlyRole(STRATEGY_MANAGER_ROLE) {
        Vault storage v = vaults[vaultId];
        v.strategies.push(strategy);
        v.allocations.push(allocation);
    }

    function deposit(uint256 vaultId, uint256 amount) external nonReentrant whenNotPaused {
        Vault storage v = vaults[vaultId];
        require(v.active && amount > 0);
        IERC20(v.token).safeTransferFrom(msg.sender, address(this), amount);

        uint256 shares = v.totalShares == 0 ? amount : (amount * v.totalShares) / v.totalDeposited;
        v.totalDeposited += amount;
        v.totalShares += shares;
        totalValueLocked += amount;

        UserPosition storage pos = userPositions[vaultId][msg.sender];
        if (pos.shares == 0) userVaults[msg.sender].push(vaultId);
        pos.shares += shares;
        pos.depositTime = block.timestamp;
        pos.depositAmount += amount;

        _deployToStrategies(vaultId, amount);
        emit Deposited(vaultId, msg.sender, amount, shares);
    }

    function withdraw(uint256 vaultId, uint256 shares) external nonReentrant {
        Vault storage v = vaults[vaultId];
        UserPosition storage pos = userPositions[vaultId][msg.sender];
        require(pos.shares >= shares && shares > 0);

        uint256 amount = (shares * v.totalDeposited) / v.totalShares;
        pos.shares -= shares;
        v.totalShares -= shares;
        v.totalDeposited -= amount;
        totalValueLocked -= amount;

        _withdrawFromStrategies(vaultId, amount);
        IERC20(v.token).safeTransfer(msg.sender, amount);
        emit Withdrawn(vaultId, msg.sender, amount, shares);
    }

    function rebalance(uint256 vaultId, uint256[] calldata newAllocations) external onlyRole(AI_REBALANCER_ROLE) {
        Vault storage v = vaults[vaultId];
        require(newAllocations.length == v.strategies.length);
        uint256 total = 0;
        for (uint256 i = 0; i < newAllocations.length; i++) total += newAllocations[i];
        require(total == 10000);
        v.allocations = newAllocations;
        for (uint256 i = 0; i < v.strategies.length; i++) {
            emit Rebalanced(vaultId, v.strategies[i], newAllocations[i]);
        }
    }

    function harvestAll(uint256 vaultId) external onlyRole(AI_REBALANCER_ROLE) {
        Vault storage v = vaults[vaultId];
        uint256 totalRewards = 0;
        for (uint256 i = 0; i < v.strategies.length; i++) {
            try IStrategy(v.strategies[i]).harvest() returns (uint256 r) { totalRewards += r; } catch {}
        }
        uint256 fee = (totalRewards * v.performanceFee) / 10000;
        if (fee > 0) IERC20(v.token).safeTransfer(v.feeRecipient, fee);
        v.totalDeposited += totalRewards - fee;
        totalValueLocked += totalRewards - fee;
        emit HarvestExecuted(vaultId, totalRewards, fee);
    }

    function _deployToStrategies(uint256 vaultId, uint256 amount) internal {
        Vault storage v = vaults[vaultId];
        for (uint256 i = 0; i < v.strategies.length; i++) {
            if (v.allocations[i] == 0) continue;
            uint256 allocated = (amount * v.allocations[i]) / 10000;
            if (allocated > 0) {
                IERC20(v.token).approve(v.strategies[i], allocated);
                try IStrategy(v.strategies[i]).deposit(allocated) {} catch {}
            }
        }
    }

    function _withdrawFromStrategies(uint256 vaultId, uint256 amount) internal {
        Vault storage v = vaults[vaultId];
        uint256 remaining = amount;
        for (uint256 i = 0; i < v.strategies.length && remaining > 0; i++) {
            uint256 bal = IStrategy(v.strategies[i]).balanceOf();
            uint256 toWithdraw = remaining > bal ? bal : remaining;
            if (toWithdraw > 0) {
                try IStrategy(v.strategies[i]).withdraw(toWithdraw) { remaining -= toWithdraw; } catch {}
            }
        }
    }

    function getVaultAPY(uint256 vaultId) external view returns (uint256 weightedAPY) {
        Vault storage v = vaults[vaultId];
        for (uint256 i = 0; i < v.strategies.length; i++) {
            try IStrategy(v.strategies[i]).APY() returns (uint256 apy) {
                weightedAPY += (apy * v.allocations[i]) / 10000;
            } catch {}
        }
    }

    function getUserPosition(uint256 vaultId, address user) external view returns (uint256 shares, uint256 value) {
        Vault storage v = vaults[vaultId];
        shares = userPositions[vaultId][user].shares;
        value = v.totalShares > 0 ? (shares * v.totalDeposited) / v.totalShares : 0;
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
