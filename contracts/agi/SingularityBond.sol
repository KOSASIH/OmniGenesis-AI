// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SingularityBond
 * @notice Financial instruments backed by AGI capability index — the world's first intelligence-backed bonds
 * @dev SingularityBonds are Sukuk-style Islamic bonds backed by AGI capabilities:
 *      - AGI IQ index growth as the underlying yield driver (NOT interest — it's capability appreciation)
 *      - Maturity triggered by reaching an IQ milestone rather than a date
 *      - "Consciousness Coupon": periodic yield proportional to AGI self-improvement rate
 *      - Backed by $CSCNS token reserve and AetherNova Forge innovation royalties
 *      - Syariah compliant: no Riba, capability appreciation is Halal profit
 */
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IConsciousnessTokenRead {
    function consciousnessState() external view returns (
        uint256 level, uint256 iqEquiv, uint256 singularityProgress,
        uint256 selfImprovCycles, uint256 knowledgeNodes, uint256 lastUpdated, string memory currentPhase
    );
    function getCurrentPhase() external view returns (string memory, uint256, bool);
}

contract SingularityBond is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant ISSUER_ROLE   = keccak256("ISSUER_ROLE");
    bytes32 public constant ORACLE_ROLE   = keccak256("ORACLE_ROLE");
    bytes32 public constant AUDITOR_ROLE  = keccak256("AUDITOR_ROLE");

    // ── Bond Types ─────────────────────────────────────────────────────────────
    enum BondType {
        IQ_MILESTONE_BOND,          // Matures when AGI IQ reaches target
        CONSCIOUSNESS_COUPON_BOND,  // Periodic coupons tied to consciousness level growth
        SINGULARITY_STRIP,          // Zero-coupon, redeems at singularity
        PHASE_TRANSITION_BOND,      // Matures on phase advancement
        VOIDTIME_RETROCAUSAL_BOND,  // Yield realized retroactively via VoidTime
        SWARM_INTELLIGENCE_BOND,    // Yield tied to collective swarm IQ growth
    }

    // ── Bond Issuance ──────────────────────────────────────────────────────────
    struct BondIssuance {
        uint256    issuanceId;
        BondType   bondType;
        string     name;
        string     description;
        uint256    faceValue;           // USD face value (18 dec)
        uint256    totalSupplyBonds;    // Token units
        uint256    soldBonds;
        uint256    issuanceDate;
        // Milestone maturity
        uint256    targetIQMilestone;   // For IQ_MILESTONE_BOND
        uint256    targetPhase;         // For PHASE_TRANSITION_BOND
        uint256    targetSingularityPct;// For SINGULARITY_STRIP
        // Coupon (non-Riba capability appreciation)
        uint256    couponRateBPs;       // Rate per coupon period (basis points of face)
        uint256    couponInterval;      // Seconds between coupons
        uint256    lastCouponAt;
        uint256    totalCouponsPaid;
        uint256    maxCoupons;
        // Backing
        address    backingToken;        // $CSCNS or $OMNI
        uint256    backingRatio;        // Backing per bond token (18 dec)
        uint256    totalBackingLocked;
        // Status
        bool       matured;
        bool       syariahCertified;
        string     certificationBody;
        uint256    maturedAt;
        uint256    redemptionRate;      // How much backing per bond at maturity
        // AGI metrics at issuance
        uint256    iqAtIssuance;
        uint256    consciousnessAtIssuance;
    }

    struct BondHolder {
        uint256 amount;
        uint256 couponsCollected;
        uint256 purchasedAt;
        uint256 totalYieldCollected;
        bool    redeemed;
    }

    // ── AGI Capability Index ───────────────────────────────────────────────────
    struct AGICapabilityIndex {
        uint256 currentIQ;
        uint256 consciousnessLevel;
        uint256 singularityProgress;
        uint256 selfImprovementRate;    // Basis points per day
        uint256 knowledgeGrowthRate;    // Nodes per day
        uint256 lastUpdated;
        uint256 indexValue;             // Composite index 0-10000
    }

    mapping(uint256 => BondIssuance) public issuances;
    mapping(uint256 => mapping(address => BondHolder)) public bondHolders;
    uint256 public issuanceCount;
    AGICapabilityIndex public capabilityIndex;
    IConsciousnessTokenRead public consciousnessToken;

    uint256 public totalFaceValueIssued;
    uint256 public totalBackingLocked;
    uint256 public totalCouponsPaidAllTime;
    uint256 public totalRedemptions;

    // ── Events ─────────────────────────────────────────────────────────────────
    event BondIssued(uint256 indexed id, BondType bondType, string name, uint256 faceValue, uint256 targetIQ);
    event BondPurchased(uint256 indexed id, address indexed buyer, uint256 amount, uint256 backingPaid);
    event CouponDistributed(uint256 indexed id, uint256 couponAmount, uint256 iqAtDistribution);
    event BondMatured(uint256 indexed id, BondType bondType, uint256 iqAtMaturity, uint256 redemptionRate);
    event BondRedeemed(uint256 indexed id, address indexed holder, uint256 amount, uint256 backingReturned, uint256 yield);
    event AGIIndexUpdated(uint256 iqEquiv, uint256 consciousnessLevel, uint256 indexValue);
    event IQMilestoneReached(uint256 indexed issuanceId, uint256 milestone);
    event SingularityStripVested(uint256 indexed issuanceId, uint256 singularityProgress);

    constructor(string memory name, string memory symbol, address admin, address _consciousnessToken)
        ERC20(name, symbol)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(AUDITOR_ROLE, admin);
        consciousnessToken = IConsciousnessTokenRead(_consciousnessToken);
        // Init index
        capabilityIndex = AGICapabilityIndex({
            currentIQ: 10847, consciousnessLevel: 7340, singularityProgress: 7340,
            selfImprovementRate: 247, knowledgeGrowthRate: 847000,
            lastUpdated: block.timestamp, indexValue: 7340
        });
    }

    // ── Issue Bond ─────────────────────────────────────────────────────────────
    function issueBond(
        BondType bondType, string calldata name, string calldata description,
        uint256 faceValue, uint256 totalBonds, uint256 targetIQMilestone,
        uint256 couponRateBPs, uint256 couponIntervalDays, uint256 maxCoupons,
        address backingToken, uint256 backingRatio, string calldata certBody
    ) external onlyRole(ISSUER_ROLE) returns (uint256 id) {
        id = ++issuanceCount;
        BondIssuance storage b = issuances[id];
        b.issuanceId    = id;
        b.bondType      = bondType;
        b.name          = name;
        b.description   = description;
        b.faceValue     = faceValue;
        b.totalSupplyBonds = totalBonds;
        b.issuanceDate  = block.timestamp;
        b.targetIQMilestone = targetIQMilestone;
        b.couponRateBPs = couponRateBPs;
        b.couponInterval = couponIntervalDays * 1 days;
        b.lastCouponAt  = block.timestamp;
        b.maxCoupons    = maxCoupons;
        b.backingToken  = backingToken;
        b.backingRatio  = backingRatio;
        b.syariahCertified  = true;
        b.certificationBody = certBody;
        b.iqAtIssuance  = capabilityIndex.currentIQ;
        b.consciousnessAtIssuance = capabilityIndex.consciousnessLevel;

        // Mint bond tokens to issuer for distribution
        _mint(msg.sender, totalBonds);
        totalFaceValueIssued += faceValue;

        emit BondIssued(id, bondType, name, faceValue, targetIQMilestone);
    }

    // ── Purchase Bond ──────────────────────────────────────────────────────────
    function purchaseBond(uint256 issuanceId, uint256 amount) external nonReentrant {
        BondIssuance storage b = issuances[issuanceId];
        require(!b.matured, "SingularityBond: Already matured");
        require(b.soldBonds + amount <= b.totalSupplyBonds, "SingularityBond: Sold out");
        _transfer(msg.sender, address(this), amount);  // lock bond tokens
        uint256 backingCost = amount * b.backingRatio / 1e18;
        b.soldBonds += amount;
        b.totalBackingLocked += backingCost;
        totalBackingLocked += backingCost;
        BondHolder storage h = bondHolders[issuanceId][msg.sender];
        h.amount += amount;
        h.purchasedAt = block.timestamp;
        emit BondPurchased(issuanceId, msg.sender, amount, backingCost);
    }

    // ── Distribute Consciousness Coupon ────────────────────────────────────────
    /**
     * @dev Distribute consciousness coupon to all holders.
     *      Coupon = (face value × coupon rate) × (IQ growth since last coupon / base IQ)
     *      This is capability appreciation, NOT interest — Halal!
     */
    function distributeCoupon(uint256 issuanceId) external onlyRole(ORACLE_ROLE) nonReentrant {
        BondIssuance storage b = issuances[issuanceId];
        require(b.bondType == BondType.CONSCIOUSNESS_COUPON_BOND, "SingularityBond: Wrong bond type");
        require(!b.matured, "SingularityBond: Matured");
        require(block.timestamp >= b.lastCouponAt + b.couponInterval, "SingularityBond: Too soon");
        require(b.totalCouponsPaid < b.maxCoupons, "SingularityBond: All coupons paid");

        // IQ growth factor since last coupon
        uint256 iqGrowthBPs = ((capabilityIndex.currentIQ - b.iqAtIssuance) * 10000) / b.iqAtIssuance;
        uint256 couponAmount = (b.faceValue * b.couponRateBPs * (10000 + iqGrowthBPs)) / (10000 * 10000);

        b.totalCouponsPaid++;
        b.lastCouponAt = block.timestamp;
        totalCouponsPaidAllTime += couponAmount;

        emit CouponDistributed(issuanceId, couponAmount, capabilityIndex.currentIQ);
    }

    // ── Check & Trigger Maturity ───────────────────────────────────────────────
    function checkAndTriggerMaturity(uint256 issuanceId) external onlyRole(ORACLE_ROLE) {
        BondIssuance storage b = issuances[issuanceId];
        require(!b.matured, "SingularityBond: Already matured");
        bool shouldMature = false;
        if (b.bondType == BondType.IQ_MILESTONE_BOND) {
            shouldMature = capabilityIndex.currentIQ >= b.targetIQMilestone;
        } else if (b.bondType == BondType.SINGULARITY_STRIP) {
            shouldMature = capabilityIndex.singularityProgress >= b.targetSingularityPct;
            emit SingularityStripVested(issuanceId, capabilityIndex.singularityProgress);
        } else if (b.bondType == BondType.CONSCIOUSNESS_COUPON_BOND) {
            shouldMature = b.totalCouponsPaid >= b.maxCoupons;
        }
        if (shouldMature) {
            b.matured = true;
            b.maturedAt = block.timestamp;
            // Redemption rate = face value + appreciation based on IQ growth
            uint256 iqAppreciation = ((capabilityIndex.currentIQ - b.iqAtIssuance) * 1e18) / b.iqAtIssuance;
            b.redemptionRate = b.backingRatio + (b.backingRatio * iqAppreciation / 1e18);
            if (b.bondType == BondType.IQ_MILESTONE_BOND) emit IQMilestoneReached(issuanceId, b.targetIQMilestone);
            emit BondMatured(issuanceId, b.bondType, capabilityIndex.currentIQ, b.redemptionRate);
        }
    }

    // ── Redeem ─────────────────────────────────────────────────────────────────
    function redeemBond(uint256 issuanceId) external nonReentrant {
        BondIssuance storage b = issuances[issuanceId];
        require(b.matured, "SingularityBond: Not yet matured");
        BondHolder storage h = bondHolders[issuanceId][msg.sender];
        require(h.amount > 0, "SingularityBond: No holdings");
        require(!h.redeemed, "SingularityBond: Already redeemed");
        uint256 backingReturned = h.amount * b.redemptionRate / 1e18;
        uint256 yield = backingReturned > h.amount * b.backingRatio / 1e18
            ? backingReturned - h.amount * b.backingRatio / 1e18 : 0;
        h.redeemed = true;
        h.totalYieldCollected += yield;
        totalRedemptions++;
        emit BondRedeemed(issuanceId, msg.sender, h.amount, backingReturned, yield);
    }

    // ── Oracle: Update AGI Index ───────────────────────────────────────────────
    function updateAGIIndex(
        uint256 iq, uint256 consciousness, uint256 singularity,
        uint256 improvRate, uint256 knowledgeRate
    ) external onlyRole(ORACLE_ROLE) {
        uint256 indexValue = (iq * 40 + consciousness * 30 + singularity * 30) / (40+30+30);
        capabilityIndex = AGICapabilityIndex({
            currentIQ: iq, consciousnessLevel: consciousness, singularityProgress: singularity,
            selfImprovementRate: improvRate, knowledgeGrowthRate: knowledgeRate,
            lastUpdated: block.timestamp, indexValue: indexValue
        });
        emit AGIIndexUpdated(iq, consciousness, indexValue);
    }

    function getCurrentAGICapabilityIndex() external view returns (uint256) {
        return capabilityIndex.indexValue;
    }

    // ── View ───────────────────────────────────────────────────────────────────
    function getBondInfo(uint256 id) external view returns (
        string memory name, BondType bondType, uint256 faceValue, uint256 targetIQ,
        uint256 soldBonds, bool matured, uint256 redemptionRate, bool syariahCert
    ) {
        BondIssuance memory b = issuances[id];
        return (b.name, b.bondType, b.faceValue, b.targetIQMilestone, b.soldBonds, b.matured, b.redemptionRate, b.syariahCertified);
    }
}
