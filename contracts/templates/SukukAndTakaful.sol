// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SukukBridge
 * @notice Tokenized Islamic bonds (Sukuk) with cross-chain bridge capabilities
 * @dev Sukuk types: Ijarah, Murabaha, Musharakah, Mudarabah, Istisna, Salam
 *      Key difference from bonds: Sukuk represents OWNERSHIP in tangible assets, not debt.
 * @title TakafulInsurancePool
 * @notice Islamic mutual insurance — members contribute to pool, claims paid mutually
 *         No conventional insurance premiums (Gharar-free, Riba-free)
 */

// ─── SukukBridge ─────────────────────────────────────────────────────────────
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract SukukBridge is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant ISSUER_ROLE   = keccak256("ISSUER_ROLE");
    bytes32 public constant AUDITOR_ROLE  = keccak256("AUDITOR_ROLE");

    enum SukukType { IJARAH, MURABAHA, MUSHARAKAH, MUDARABAH, ISTISNA, SALAM, WAKALAH }

    struct SukukIssuance {
        uint256    issuanceId;
        address    issuer;
        SukukType  sukukType;
        string     assetDescription;  // Underlying tangible asset
        uint256    faceValue;          // USD face value
        uint256    profitRate;         // Expected return (NOT interest — ownership income)
        uint256    maturityDate;
        uint256    totalSupplyTokens;  // Token units representing ownership
        uint256    soldTokens;
        bool       assetBackingVerified;
        string     syariahCertificate;
        address    underlyingAssetToken;
        uint256    totalProfitDistributed;
    }

    mapping(uint256 => SukukIssuance) public issuances;
    mapping(uint256 => mapping(address => uint256)) public sukukHoldings;
    uint256 public issuanceCount;
    uint256 public totalIssuedUSD;
    uint256 public totalProfitPaidUSD;

    event SukukIssued(uint256 indexed id, address indexed issuer, SukukType sukukType, uint256 faceValue);
    event SukukPurchased(uint256 indexed id, address indexed buyer, uint256 amount);
    event ProfitDistributed(uint256 indexed id, address indexed holder, uint256 amount);
    event SukukMatured(uint256 indexed id, uint256 totalReturned);
    event AssetBackingVerified(uint256 indexed id, string auditorNote);

    constructor(string memory name, string memory symbol, address admin)
        ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(AUDITOR_ROLE, admin);
    }

    function issueSukuk(
        SukukType sukukType, string calldata assetDescription, uint256 faceValue,
        uint256 profitRate, uint256 maturityDays, uint256 totalTokens, string calldata certificate
    ) external onlyRole(ISSUER_ROLE) returns (uint256 id) {
        id = ++issuanceCount;
        issuances[id] = SukukIssuance({
            issuanceId: id, issuer: msg.sender, sukukType: sukukType,
            assetDescription: assetDescription, faceValue: faceValue, profitRate: profitRate,
            maturityDate: block.timestamp + maturityDays * 1 days, totalSupplyTokens: totalTokens,
            soldTokens: 0, assetBackingVerified: false, syariahCertificate: certificate,
            underlyingAssetToken: address(0), totalProfitDistributed: 0
        });
        _mint(address(this), totalTokens);
        totalIssuedUSD += faceValue;
        emit SukukIssued(id, msg.sender, sukukType, faceValue);
    }

    function purchaseSukuk(uint256 id, uint256 amount) external nonReentrant {
        SukukIssuance storage s = issuances[id];
        require(s.soldTokens + amount <= s.totalSupplyTokens, "SukukBridge: Sold out");
        _transfer(address(this), msg.sender, amount);
        sukukHoldings[id][msg.sender] += amount;
        s.soldTokens += amount;
        emit SukukPurchased(id, msg.sender, amount);
    }

    function distributeProfits(uint256 id, address[] calldata holders, uint256[] calldata amounts)
        external onlyRole(ISSUER_ROLE) nonReentrant
    {
        require(holders.length == amounts.length, "SukukBridge: Length mismatch");
        SukukIssuance storage s = issuances[id];
        for (uint i = 0; i < holders.length; i++) {
            // Would transfer profit token here
            s.totalProfitDistributed += amounts[i];
            totalProfitPaidUSD += amounts[i];
            emit ProfitDistributed(id, holders[i], amounts[i]);
        }
    }

    function verifyAssetBacking(uint256 id, string calldata auditorNote) external onlyRole(AUDITOR_ROLE) {
        issuances[id].assetBackingVerified = true;
        emit AssetBackingVerified(id, auditorNote);
    }
}


// ─── TakafulInsurancePool ─────────────────────────────────────────────────────
contract TakafulInsurancePool is AccessControl, ReentrancyGuard {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    enum TakafulModel { MUDHARABAH_MODEL, WAKALAH_MODEL, HYBRID_MODEL }
    enum ClaimStatus  { SUBMITTED, UNDER_REVIEW, APPROVED, PAID, REJECTED }

    struct TakafulFund {
        uint256  fundId;
        string   coverageType;     // e.g., "Medical", "Property", "Business"
        TakafulModel model;
        uint256  totalContributions;
        uint256  claimsReserve;
        uint256  operatorFeePool;  // Wakala/Mudarabah operator share
        uint256  surplusToReturn;  // Surplus returned to members (Qard Hasan)
        uint256  memberCount;
        bool     active;
    }

    struct TakafulClaim {
        uint256     claimId;
        uint256     fundId;
        address     claimant;
        uint256     amountClaimed;
        uint256     amountApproved;
        ClaimStatus status;
        string      description;
        uint256     submittedAt;
        uint256     resolvedAt;
        address     approvedBy;
    }

    mapping(uint256 => TakafulFund)  public funds;
    mapping(uint256 => TakafulClaim) public claims;
    mapping(uint256 => mapping(address => uint256)) public memberContributions;
    uint256 public fundCount;
    uint256 public claimCount;
    uint256 public totalClaimsPaid;
    uint256 public totalContributionsAllFunds;

    event FundCreated(uint256 indexed fundId, string coverageType, TakafulModel model);
    event ContributionMade(uint256 indexed fundId, address indexed member, uint256 amount);
    event ClaimSubmitted(uint256 indexed claimId, uint256 fundId, address indexed claimant, uint256 amount);
    event ClaimResolved(uint256 indexed claimId, ClaimStatus status, uint256 amountPaid);
    event SurplusReturned(uint256 indexed fundId, uint256 totalSurplus, uint256 memberCount);

    constructor(address _operator) {
        _grantRole(DEFAULT_ADMIN_ROLE, _operator);
        _grantRole(OPERATOR_ROLE, _operator);
    }

    function createFund(string calldata coverageType, TakafulModel model) external onlyRole(OPERATOR_ROLE) returns (uint256) {
        uint256 fId = ++fundCount;
        funds[fId] = TakafulFund({ fundId: fId, coverageType: coverageType, model: model,
            totalContributions: 0, claimsReserve: 0, operatorFeePool: 0, surplusToReturn: 0,
            memberCount: 0, active: true });
        emit FundCreated(fId, coverageType, model);
        return fId;
    }

    function contribute(uint256 fundId, uint256 amount) external nonReentrant {
        TakafulFund storage f = funds[fundId];
        require(f.active, "Takaful: Fund not active");
        if (memberContributions[fundId][msg.sender] == 0) f.memberCount++;
        memberContributions[fundId][msg.sender] += amount;
        f.totalContributions += amount;
        uint256 operatorFee = (amount * 1500) / 10000;  // 15% Wakala fee
        f.operatorFeePool += operatorFee;
        f.claimsReserve += amount - operatorFee;
        totalContributionsAllFunds += amount;
        emit ContributionMade(fundId, msg.sender, amount);
    }

    function submitClaim(uint256 fundId, uint256 amount, string calldata description) external returns (uint256) {
        uint256 cId = ++claimCount;
        claims[cId] = TakafulClaim({
            claimId: cId, fundId: fundId, claimant: msg.sender, amountClaimed: amount,
            amountApproved: 0, status: ClaimStatus.SUBMITTED, description: description,
            submittedAt: block.timestamp, resolvedAt: 0, approvedBy: address(0)
        });
        emit ClaimSubmitted(cId, fundId, msg.sender, amount);
        return cId;
    }

    function approveClaim(uint256 claimId, uint256 approvedAmount) external onlyRole(OPERATOR_ROLE) nonReentrant {
        TakafulClaim storage c = claims[claimId];
        TakafulFund storage f  = funds[c.fundId];
        require(c.status == ClaimStatus.SUBMITTED || c.status == ClaimStatus.UNDER_REVIEW, "Takaful: Invalid status");
        require(approvedAmount <= f.claimsReserve, "Takaful: Insufficient reserve");
        c.amountApproved = approvedAmount;
        c.status = ClaimStatus.PAID;
        c.resolvedAt = block.timestamp;
        c.approvedBy = msg.sender;
        f.claimsReserve -= approvedAmount;
        totalClaimsPaid += approvedAmount;
        emit ClaimResolved(claimId, ClaimStatus.PAID, approvedAmount);
    }

    function rejectClaim(uint256 claimId, string calldata reason) external onlyRole(OPERATOR_ROLE) {
        TakafulClaim storage c = claims[claimId];
        c.status = ClaimStatus.REJECTED;
        c.resolvedAt = block.timestamp;
        emit ClaimResolved(claimId, ClaimStatus.REJECTED, 0);
    }

    function distributeSurplus(uint256 fundId) external onlyRole(OPERATOR_ROLE) nonReentrant {
        TakafulFund storage f = funds[fundId];
        uint256 surplus = f.claimsReserve / 2;  // 50% of reserve returned as Qard Hasan surplus
        f.surplusToReturn = surplus;
        f.claimsReserve -= surplus;
        emit SurplusReturned(fundId, surplus, f.memberCount);
    }
}
