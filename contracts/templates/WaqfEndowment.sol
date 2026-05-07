// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title WaqfEndowment
 * @notice Perpetual Islamic endowment (Waqf) smart contract
 * @dev Supports: Waqf Khairi (public welfare), Waqf Ahli (family),
 *      Waqf Mushtarak (mixed), Waqf Istithmar (investment waqf for income generation)
 *      Principle: the endowment corpus is NEVER depleted — only income is distributed
 */
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract WaqfEndowment is AccessControl, ReentrancyGuard {
    bytes32 public constant MUTAWALLI_ROLE  = keccak256("MUTAWALLI_ROLE");  // Trustee
    bytes32 public constant NAZIR_ROLE      = keccak256("NAZIR_ROLE");      // Supervisor

    enum WaqfType { KHAIRI, AHLI, MUSHTARAK, ISTITHMAR }

    struct WaqfAsset {
        uint256    assetId;
        address    donor;
        address    token;
        uint256    principalAmount;    // NEVER to be touched
        uint256    incomeGenerated;
        WaqfType   waqfType;
        string     purpose;           // e.g., "Education fund for orphans"
        string     conditions;        // Donor conditions on usage
        uint256    createdAt;
        bool       perpetual;
        address[]  beneficiaryCategories;
        uint256    managementFeeBPs;  // Mutawalli fee (max 10%)
    }

    struct WaqfBeneficiary {
        address wallet;
        uint256 shareWeight;
        string  category;
        bool    active;
        uint256 lifetimeReceived;
    }

    mapping(uint256 => WaqfAsset)         public waqfAssets;
    mapping(uint256 => WaqfBeneficiary[]) public waqfBeneficiaries;
    uint256 public assetCount;
    uint256 public totalPrincipalUSD;
    uint256 public totalIncomeDistributed;

    event WaqfCreated(uint256 indexed assetId, address indexed donor, uint256 principal, WaqfType waqfType);
    event IncomeReceived(uint256 indexed assetId, uint256 amount);
    event IncomeDistributed(uint256 indexed assetId, address indexed beneficiary, uint256 amount);
    event WaqfAssetInvested(uint256 indexed assetId, address indexed pool, uint256 amount);

    constructor(address _mutawalli) {
        _grantRole(DEFAULT_ADMIN_ROLE, _mutawalli);
        _grantRole(MUTAWALLI_ROLE, _mutawalli);
        _grantRole(NAZIR_ROLE, _mutawalli);
    }

    function receiveWaqf(address token, uint256 amount) external nonReentrant {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        assetCount++;
        WaqfAsset storage w = waqfAssets[assetCount];
        w.assetId = assetCount;
        w.donor = msg.sender;
        w.token = token;
        w.principalAmount = amount;
        w.waqfType = WaqfType.KHAIRI;
        w.purpose = "General Waqf — OmniGenesis Islamic Network";
        w.createdAt = block.timestamp;
        w.perpetual = true;
        w.managementFeeBPs = 500;  // 5% management fee
        totalPrincipalUSD += amount;
        emit WaqfCreated(assetCount, msg.sender, amount, WaqfType.KHAIRI);
    }

    function distributeWaqfIncome(uint256 assetId, uint256 incomeAmount) external onlyRole(MUTAWALLI_ROLE) nonReentrant {
        WaqfAsset storage w = waqfAssets[assetId];
        require(incomeAmount <= IERC20(w.token).balanceOf(address(this)) - w.principalAmount,
            "Waqf: Cannot distribute from principal");
        uint256 managementFee = (incomeAmount * w.managementFeeBPs) / 10000;
        uint256 distributable = incomeAmount - managementFee;
        w.incomeGenerated += incomeAmount;
        totalIncomeDistributed += distributable;
        WaqfBeneficiary[] storage bens = waqfBeneficiaries[assetId];
        if (bens.length == 0) return;
        for (uint i = 0; i < bens.length; i++) {
            if (!bens[i].active) continue;
            uint256 share = (distributable * bens[i].shareWeight) / 10000;
            if (share > 0) {
                IERC20(w.token).transfer(bens[i].wallet, share);
                bens[i].lifetimeReceived += share;
                emit IncomeDistributed(assetId, bens[i].wallet, share);
            }
        }
    }

    function addBeneficiary(uint256 assetId, address wallet, uint256 shareWeight, string calldata category)
        external onlyRole(MUTAWALLI_ROLE)
    {
        waqfBeneficiaries[assetId].push(WaqfBeneficiary({
            wallet: wallet, shareWeight: shareWeight, category: category,
            active: true, lifetimeReceived: 0
        }));
    }

    function getWaqfStats() external view returns (uint256 assets, uint256 principal, uint256 distributed) {
        return (assetCount, totalPrincipalUSD, totalIncomeDistributed);
    }
}
