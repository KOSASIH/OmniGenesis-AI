// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title OMNI Token
 * @notice OmniGenesis Governance & Utility Token
 * @dev ERC-20 with voting, permits, halving emissions, and role-based access
 * Total Supply: 1,000,000,000,000 (1 Trillion)
 */
contract OMNI is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint256 public constant MAX_SUPPLY = 1_000_000_000_000 * 10 ** 18;
    uint256 public constant HALVING_PERCENTAGE = 21;
    uint256 public constant EPOCH_DURATION = 365 days;

    uint256 public currentEpoch;
    uint256 public epochStartTime;
    uint256 public currentEpochMintCap;
    uint256 public epochMinted;
    uint256 public totalMintedSupply;

    struct Allocation {
        uint256 total;
        uint256 minted;
        uint256 vestingEnd;
    }

    mapping(string => Allocation) public allocations;

    event EpochAdvanced(uint256 indexed epoch, uint256 newMintCap);
    event AllocationMinted(string category, address to, uint256 amount);

    constructor(address defaultAdmin) ERC20("OmniGenesis Token", "OMNI") ERC20Permit("OmniGenesis Token") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, defaultAdmin);
        _grantRole(PAUSER_ROLE, defaultAdmin);

        epochStartTime = block.timestamp;
        currentEpochMintCap = MAX_SUPPLY / 10;

        allocations["agents"] = Allocation(MAX_SUPPLY * 40 / 100, 0, block.timestamp + 4 * 365 days);
        allocations["pinexus"] = Allocation(MAX_SUPPLY * 20 / 100, 0, block.timestamp + 2 * 365 days);
        allocations["liquidity"] = Allocation(MAX_SUPPLY * 15 / 100, 0, 0);
        allocations["team"] = Allocation(MAX_SUPPLY * 10 / 100, 0, block.timestamp + 4 * 365 days);
        allocations["airdrop"] = Allocation(MAX_SUPPLY * 10 / 100, 0, block.timestamp + 180 days);
        allocations["innovation"] = Allocation(MAX_SUPPLY * 5 / 100, 0, block.timestamp + 365 days);

        uint256 initialMint = MAX_SUPPLY * 5 / 100;
        _mint(defaultAdmin, initialMint);
        totalMintedSupply = initialMint;
        allocations["liquidity"].minted = initialMint;
    }

    function mintAllocation(string calldata category, address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        _checkAndAdvanceEpoch();
        Allocation storage alloc = allocations[category];
        require(alloc.total > 0, "OMNI: invalid category");
        require(alloc.minted + amount <= alloc.total, "OMNI: allocation exceeded");
        require(totalMintedSupply + amount <= MAX_SUPPLY, "OMNI: max supply exceeded");
        require(epochMinted + amount <= currentEpochMintCap, "OMNI: epoch cap exceeded");

        alloc.minted += amount;
        epochMinted += amount;
        totalMintedSupply += amount;
        _mint(to, amount);
        emit AllocationMinted(category, to, amount);
    }

    function _checkAndAdvanceEpoch() internal {
        if (block.timestamp >= epochStartTime + EPOCH_DURATION) {
            currentEpoch++;
            epochStartTime = block.timestamp;
            epochMinted = 0;
            currentEpochMintCap = currentEpochMintCap * (100 - HALVING_PERCENTAGE) / 100;
            emit EpochAdvanced(currentEpoch, currentEpochMintCap);
        }
    }

    function getEpochInfo() external view returns (uint256, uint256, uint256, uint256, uint256) {
        uint256 epochEnd = epochStartTime + EPOCH_DURATION;
        uint256 timeRemaining = block.timestamp < epochEnd ? epochEnd - block.timestamp : 0;
        return (currentEpoch, epochStartTime, currentEpochMintCap, epochMinted, timeRemaining);
    }

    function pause() external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
