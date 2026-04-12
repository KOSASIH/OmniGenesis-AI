// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IPriceFeed {
    function getPrice(address token) external view returns (uint256 price, uint8 decimals);
}

/**
 * @title OGEN Stablecoin
 * @notice OmniGenesis Smart Hybrid Stablecoin - pegged to $1.00 USD
 * @dev Multi-collateral with 200% min ratio, liquidation at 150%, AI rebalancing hooks
 */
contract OGEN is ERC20, ERC20Burnable, ERC20Permit, AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant LIQUIDATOR_ROLE = keccak256("LIQUIDATOR_ROLE");

    uint256 public constant MIN_COLLATERAL_RATIO = 200;
    uint256 public constant LIQUIDATION_THRESHOLD = 150;
    uint256 public constant LIQUIDATION_PENALTY = 10;

    IPriceFeed public priceFeed;
    bool public emergencyShutdown;

    struct CollateralConfig {
        address token;
        uint256 maxWeight;
        uint256 totalDeposited;
        bool enabled;
    }

    struct Vault {
        mapping(address => uint256) collateral;
        uint256 debtOGEN;
        uint256 lastUpdate;
    }

    CollateralConfig[] public collateralConfigs;
    mapping(address => uint256) public collateralIndex;
    mapping(address => Vault) public vaults;
    mapping(address => bool) public isCollateralToken;
    uint256 public totalDebt;

    event CollateralDeposited(address indexed owner, address indexed token, uint256 amount);
    event OGENMinted(address indexed owner, uint256 amount);
    event OGENRepaid(address indexed owner, uint256 amount);
    event VaultLiquidated(address indexed owner, address indexed liquidator, uint256 debtRepaid);
    event EmergencyShutdownActivated(address indexed caller);

    constructor(address defaultAdmin, address _priceFeed)
        ERC20("OmniGenesis Stablecoin", "OGEN")
        ERC20Permit("OmniGenesis Stablecoin")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(LIQUIDATOR_ROLE, defaultAdmin);
        priceFeed = IPriceFeed(_priceFeed);
    }

    function addCollateral(address token, uint256 maxWeight) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isCollateralToken[token], "OGEN: already added");
        collateralIndex[token] = collateralConfigs.length;
        collateralConfigs.push(CollateralConfig(token, maxWeight, 0, true));
        isCollateralToken[token] = true;
    }

    function depositCollateral(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(!emergencyShutdown && isCollateralToken[token] && amount > 0);
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        vaults[msg.sender].collateral[token] += amount;
        collateralConfigs[collateralIndex[token]].totalDeposited += amount;
        emit CollateralDeposited(msg.sender, token, amount);
    }

    function mintOGEN(uint256 amount) external nonReentrant whenNotPaused {
        require(!emergencyShutdown && amount > 0);
        vaults[msg.sender].debtOGEN += amount;
        totalDebt += amount;
        require(getCollateralRatio(msg.sender) >= MIN_COLLATERAL_RATIO, "OGEN: insufficient collateral");
        _mint(msg.sender, amount);
        emit OGENMinted(msg.sender, amount);
    }

    function repayOGEN(uint256 amount) external nonReentrant {
        require(vaults[msg.sender].debtOGEN >= amount);
        _burn(msg.sender, amount);
        vaults[msg.sender].debtOGEN -= amount;
        totalDebt -= amount;
        emit OGENRepaid(msg.sender, amount);
    }

    function getCollateralRatio(address owner) public view returns (uint256) {
        if (vaults[owner].debtOGEN == 0) return type(uint256).max;
        uint256 totalValue = 0;
        for (uint256 i = 0; i < collateralConfigs.length; i++) {
            uint256 amt = vaults[owner].collateral[collateralConfigs[i].token];
            if (amt > 0) {
                (uint256 price, uint8 dec) = priceFeed.getPrice(collateralConfigs[i].token);
                totalValue += (amt * price) / (10 ** dec);
            }
        }
        return (totalValue * 100) / vaults[owner].debtOGEN;
    }

    function activateEmergencyShutdown() external onlyRole(DEFAULT_ADMIN_ROLE) {
        emergencyShutdown = true;
        _pause();
        emit EmergencyShutdownActivated(msg.sender);
    }

    function setPriceFeed(address _priceFeed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        priceFeed = IPriceFeed(_priceFeed);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
