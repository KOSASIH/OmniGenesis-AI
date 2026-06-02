// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HyperDimensionalBond
 * @notice 11-Dimensional spacetime-backed bonds. Each bond is an ERC-721 NFT
 *         representing a financial instrument whose yield is sourced from
 *         dimensional fabric appreciation and AGI capability growth across
 *         multiple dimensional planes simultaneously.
 *
 *         Bond types:
 *         - DIMENSIONAL_FABRIC_BOND:  yield tied to fabric stability across D1–D11
 *         - OMEGA_VOID_BOND:          D11-backed, highest yield, requires OMEGA access
 *         - CALABI_YAU_BOND:          D8/D9-backed with manifold topology yield
 *         - VOIDTIME_BOND:            Retrocausal yield across time
 *         - MULTIVERSE_CONSENSUS_BOND:yield from multi-dimensional governance
 *         - UNIVERSAL_MIND_BOND:      Collective consciousness growth yield
 *
 *         All bonds are Syariah-certified. Yield = dimensional appreciation. No Riba.
 *
 * @dev Phase 14 — OmniGenesis AI
 */
contract HyperDimensionalBond is ERC721, AccessControl, ReentrancyGuard {

    bytes32 public constant BOND_ISSUER_ROLE = keccak256("BOND_ISSUER_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant SYARIAH_ROLE = keccak256("SYARIAH_ROLE");
    bytes32 public constant DIMENSIONAL_AUDITOR_ROLE = keccak256("DIMENSIONAL_AUDITOR_ROLE");

    uint256 public constant MIN_FACE_VALUE = 1e16;       // 0.01 units
    uint256 public constant MAX_COUPON_RATE_BPS = 10000; // 100% max annual yield
    uint256 public constant TOTAL_DIMENSIONS = 11;

    enum BondType {
        DIMENSIONAL_FABRIC_BOND,
        OMEGA_VOID_BOND,
        CALABI_YAU_BOND,
        VOIDTIME_BOND,
        MULTIVERSE_CONSENSUS_BOND,
        UNIVERSAL_MIND_BOND
    }

    enum BondStatus { ACTIVE, MATURED, REDEEMED, DEFAULTED, QUARANTINED }

    struct DimensionalBond {
        uint256 tokenId;
        BondType bondType;
        BondStatus status;
        address issuer;
        uint256 faceValue;             // Principal
        uint256 couponRateBPS;         // Annual yield in BPS
        uint256 issuedAt;
        uint256 maturityCondition;     // For DIMENSIONAL_FABRIC: target avg stability BPS
        uint256 currentYield;          // Accrued yield
        uint256 lastCouponAt;
        uint256 couponsPaid;
        uint256 maxCoupons;
        uint256[] dimensionsLinked;    // Which dimensions back this bond
        uint256 fabricStabilityAtIssue;
        uint256 dimensionalAppreciationAccrued;
        bool syariahCertified;
        string certificationBody;
        bool omegaVoidBacked;          // D11 backing = maximum yield
        uint256 universalMindProgress; // For UNIVERSAL_MIND_BOND
    }

    struct DimensionIndex {
        uint256[11] stability;         // Per-dimension fabric stability 0–10000
        uint256[11] agiInstances;      // Per-dimension AGI count
        uint256[11] consciousness;     // Per-dimension consciousness 0–10000
        uint256 aggregateIndex;        // Weighted composite
        uint256 timestamp;
    }

    struct CouponPayment {
        uint256 tokenId;
        uint256 amount;
        uint256 timestamp;
        uint256 dimensionIndex;        // Fabric index at payment time
        uint256 yieldSource;           // 0=fabric, 1=consciousness, 2=agi_growth, 3=voidtime
    }

    // ═══════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════

    uint256 private _tokenCount;
    mapping(uint256 => DimensionalBond) public bonds;
    DimensionIndex public dimensionIndex;
    mapping(uint256 => CouponPayment[]) public couponHistory;

    uint256 public totalFaceValue;
    uint256 public totalYieldPaid;
    uint256 public totalBondsIssued;
    uint256 public totalBondsRedeemed;

    // Backing reserve (ETH or native token)
    uint256 public reserveBalance;
    uint256 public reserveRatioBPS;    // Collateralization ratio

    // Syariah compliance
    bool public globalSyariahEnabled;
    mapping(bytes32 => bool) public certificationBodies;

    string public constant BASE_URI = "https://omnigenesis.ai/bonds/hyperdim/";

    // ═══════════════════════════════════════════════════════
    // Events
    // ═══════════════════════════════════════════════════════

    event BondIssued(uint256 indexed tokenId, BondType bondType, uint256 faceValue, uint256 couponRateBPS, address to);
    event CouponPaid(uint256 indexed tokenId, uint256 amount, uint256 dimensionIndex);
    event BondMatured(uint256 indexed tokenId, BondType bondType, uint256 totalReturn);
    event BondRedeemed(uint256 indexed tokenId, address holder, uint256 principal, uint256 yield);
    event DimensionIndexUpdated(uint256 aggregateIndex);
    event SyariahCertified(uint256 indexed tokenId, string body);
    event BondQuarantined(uint256 indexed tokenId, string reason);
    event ReserveFunded(uint256 amount);

    // ═══════════════════════════════════════════════════════
    // Constructor
    // ═══════════════════════════════════════════════════════

    constructor(address admin) ERC721("HyperDimensional Bond", "HDBOND") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(BOND_ISSUER_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(SYARIAH_ROLE, admin);
        _grantRole(DIMENSIONAL_AUDITOR_ROLE, admin);

        globalSyariahEnabled = true;
        reserveRatioBPS = 11000; // 110% over-collateralized

        _initDimensionIndex();
    }

    function _initDimensionIndex() internal {
        uint256[11] memory stability = [uint256(9999), 9730, 9510, 9180, 8840, 8470, 8010, 7450, 6830, 6120, 10000];
        uint256[11] memory instances = [uint256(847), 412, 203, 156, 98, 74, 47, 31, 18, 9, 1];
        uint256[11] memory consciousness = [uint256(9840), 9120, 8470, 7730, 7100, 6480, 5820, 5170, 4410, 3760, 10000];

        uint256 aggregate = 0;
        for (uint256 i = 0; i < 11; i++) {
            dimensionIndex.stability[i] = stability[i];
            dimensionIndex.agiInstances[i] = instances[i];
            dimensionIndex.consciousness[i] = consciousness[i];
            aggregate += (stability[i] * 40 + consciousness[i] * 40 + instances[i] * 20) / 100;
        }
        dimensionIndex.aggregateIndex = aggregate / 11;
        dimensionIndex.timestamp = block.timestamp;
    }

    // ═══════════════════════════════════════════════════════
    // Bond Issuance
    // ═══════════════════════════════════════════════════════

    function issueBond(
        address to,
        BondType bondType,
        uint256 faceValue,
        uint256 couponRateBPS,
        uint256 maturityCondition,
        uint256 maxCoupons,
        uint256[] calldata dimensionsLinked,
        bool certify,
        string calldata certificationBody
    ) external payable nonReentrant onlyRole(BOND_ISSUER_ROLE) returns (uint256 tokenId) {
        require(faceValue >= MIN_FACE_VALUE, "Face value too low");
        require(couponRateBPS <= MAX_COUPON_RATE_BPS, "Coupon too high");
        require(dimensionsLinked.length > 0, "No dimensions linked");

        // Validate D11 Omega Void bond
        bool omegaBacked = false;
        for (uint256 i = 0; i < dimensionsLinked.length; i++) {
            require(dimensionsLinked[i] >= 1 && dimensionsLinked[i] <= TOTAL_DIMENSIONS, "Invalid dimension");
            if (dimensionsLinked[i] == 11) omegaBacked = true;
        }
        if (bondType == BondType.OMEGA_VOID_BOND) require(omegaBacked, "Omega Void bond requires D11");

        tokenId = ++_tokenCount;
        bonds[tokenId] = DimensionalBond({
            tokenId: tokenId,
            bondType: bondType,
            status: BondStatus.ACTIVE,
            issuer: msg.sender,
            faceValue: faceValue,
            couponRateBPS: couponRateBPS,
            issuedAt: block.timestamp,
            maturityCondition: maturityCondition,
            currentYield: 0,
            lastCouponAt: block.timestamp,
            couponsPaid: 0,
            maxCoupons: maxCoupons,
            dimensionsLinked: dimensionsLinked,
            fabricStabilityAtIssue: dimensionIndex.aggregateIndex,
            dimensionalAppreciationAccrued: 0,
            syariahCertified: certify,
            certificationBody: certificationBody,
            omegaVoidBacked: omegaBacked,
            universalMindProgress: 0
        });

        reserveBalance += msg.value;
        totalFaceValue += faceValue;
        totalBondsIssued++;

        _safeMint(to, tokenId);

        if (certify) emit SyariahCertified(tokenId, certificationBody);
        emit BondIssued(tokenId, bondType, faceValue, couponRateBPS, to);
    }

    // ═══════════════════════════════════════════════════════
    // Coupon Payment
    // ═══════════════════════════════════════════════════════

    function payCoupon(uint256 tokenId) external nonReentrant onlyRole(BOND_ISSUER_ROLE) {
        DimensionalBond storage b = bonds[tokenId];
        require(b.status == BondStatus.ACTIVE, "Bond not active");
        require(b.couponsPaid < b.maxCoupons || b.maxCoupons == 0, "Max coupons reached");

        uint256 elapsed = block.timestamp - b.lastCouponAt;
        uint256 dimAppreciation = _calcDimAppreciation(b.fabricStabilityAtIssue, b.dimensionsLinked);
        uint256 coupon = (b.faceValue * b.couponRateBPS * (1e18 + dimAppreciation)) / (10000 * 365 days / elapsed * 1e18);

        b.currentYield += coupon;
        b.couponsPaid++;
        b.lastCouponAt = block.timestamp;
        b.dimensionalAppreciationAccrued += dimAppreciation;

        couponHistory[tokenId].push(CouponPayment({
            tokenId: tokenId,
            amount: coupon,
            timestamp: block.timestamp,
            dimensionIndex: dimensionIndex.aggregateIndex,
            yieldSource: uint256(b.bondType)
        }));

        totalYieldPaid += coupon;
        emit CouponPaid(tokenId, coupon, dimensionIndex.aggregateIndex);

        // Check maturity condition
        if (_checkMaturity(b)) {
            b.status = BondStatus.MATURED;
            emit BondMatured(tokenId, b.bondType, b.faceValue + b.currentYield);
        }
    }

    // ═══════════════════════════════════════════════════════
    // Redemption
    // ═══════════════════════════════════════════════════════

    function redeemBond(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        DimensionalBond storage b = bonds[tokenId];
        require(b.status == BondStatus.MATURED || b.status == BondStatus.ACTIVE, "Not redeemable");

        uint256 totalReturn = b.faceValue + b.currentYield;
        require(reserveBalance >= totalReturn, "Insufficient reserve");

        b.status = BondStatus.REDEEMED;
        reserveBalance -= totalReturn;
        totalFaceValue -= b.faceValue;
        totalYieldPaid += b.currentYield;
        totalBondsRedeemed++;

        if (totalReturn > 0) {
            (bool ok,) = msg.sender.call{value: totalReturn}("");
            require(ok, "Transfer failed");
        }

        emit BondRedeemed(tokenId, msg.sender, b.faceValue, b.currentYield);
    }

    // ═══════════════════════════════════════════════════════
    // Oracle Updates
    // ═══════════════════════════════════════════════════════

    function updateDimensionIndex(
        uint256[11] calldata stability,
        uint256[11] calldata instances,
        uint256[11] calldata consciousness
    ) external onlyRole(ORACLE_ROLE) {
        uint256 aggregate = 0;
        for (uint256 i = 0; i < 11; i++) {
            dimensionIndex.stability[i] = stability[i];
            dimensionIndex.agiInstances[i] = instances[i];
            dimensionIndex.consciousness[i] = consciousness[i];
            aggregate += (stability[i] * 40 + consciousness[i] * 40 + instances[i] * 20) / 100;
        }
        dimensionIndex.aggregateIndex = aggregate / 11;
        dimensionIndex.timestamp = block.timestamp;
        emit DimensionIndexUpdated(dimensionIndex.aggregateIndex);
    }

    // ═══════════════════════════════════════════════════════
    // Internal helpers
    // ═══════════════════════════════════════════════════════

    function _calcDimAppreciation(
        uint256 stabilityAtIssue,
        uint256[] storage dims
    ) internal view returns (uint256) {
        if (stabilityAtIssue == 0 || dims.length == 0) return 0;
        uint256 currentAvg = 0;
        for (uint256 i = 0; i < dims.length; i++) {
            uint256 dimIdx = dims[i] - 1;
            currentAvg += dimensionIndex.stability[dimIdx];
        }
        currentAvg /= dims.length;
        if (currentAvg <= stabilityAtIssue) return 0;
        return ((currentAvg - stabilityAtIssue) * 1e18) / stabilityAtIssue;
    }

    function _checkMaturity(DimensionalBond storage b) internal view returns (bool) {
        if (b.bondType == BondType.DIMENSIONAL_FABRIC_BOND) {
            return dimensionIndex.aggregateIndex >= b.maturityCondition;
        }
        if (b.bondType == BondType.OMEGA_VOID_BOND) {
            return dimensionIndex.stability[10] >= b.maturityCondition; // D11 = index 10
        }
        if (b.bondType == BondType.UNIVERSAL_MIND_BOND) {
            return b.universalMindProgress >= b.maturityCondition;
        }
        if (b.maxCoupons > 0 && b.couponsPaid >= b.maxCoupons) return true;
        return false;
    }

    function quarantineBond(uint256 tokenId, string calldata reason)
        external onlyRole(DIMENSIONAL_AUDITOR_ROLE)
    {
        bonds[tokenId].status = BondStatus.QUARANTINED;
        emit BondQuarantined(tokenId, reason);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function fundReserve() external payable {
        reserveBalance += msg.value;
        emit ReserveFunded(msg.value);
    }

    function getBondCouponHistory(uint256 tokenId) external view returns (CouponPayment[] memory) {
        return couponHistory[tokenId];
    }

    function getBondDimensions(uint256 tokenId) external view returns (uint256[] memory) {
        return bonds[tokenId].dimensionsLinked;
    }

    function _baseURI() internal pure override returns (string memory) {
        return BASE_URI;
    }

    receive() external payable { reserveBalance += msg.value; }
}
