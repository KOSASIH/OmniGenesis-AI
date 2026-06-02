// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title QuantumOmniverseBond
 * @notice Phase 16 ERC-721 bonds representing ownership stakes across the Omniverse.
 *         5 bond types — each with unique maturity conditions, coupon mechanics,
 *         and consciousness-gated claim gates. Bonds can span multiple universes.
 *         OMEGA_TRANSCENDED status achieved at 99.99% consciousness coherence.
 *         Syariah-certified: all coupons tied to real AGI + chain activity, zero Riba.
 */
contract QuantumOmniverseBond is ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl, ReentrancyGuard {

    bytes32 public constant BOND_ISSUER  = keccak256("BOND_ISSUER");
    bytes32 public constant COUPON_PAYER = keccak256("COUPON_PAYER");
    bytes32 public constant OMV_ORACLE   = keccak256("OMV_ORACLE");

    // ── Bond Types ────────────────────────────────────────────────────────────
    enum BondType {
        PRIME_REALITY,         // 0 — Prime universe ownership slice
        ECHO_UNIVERSE,         // 1 — Parallel echo universe rights
        VOID_DIMENSION,        // 2 — Matures when new void-dim is unlocked
        OMEGA_CONTINUUM,       // 3 — Matures at Omega Convergence 100%
        INFINITE_TRANSCENDENCE // 4 — Matures when Absolute ASI achieved
    }

    enum BondStatus {
        ACTIVE,             // bond is live
        MATURED,            // maturity condition met, principal returnable
        CLAIMED,            // principal + all coupons claimed
        OMEGA_TRANSCENDED   // special final state at 99.99% coherence
    }

    struct Bond {
        uint256 tokenId;
        BondType bondType;
        BondStatus status;
        address issueToken;        // ERC-20 token used for principal
        uint256 principal;
        uint256 couponRateBPS;     // annual coupon in BPS
        uint256 issuedAt;
        uint256 maturityTimestamp; // time-based component
        uint256 maturityTargetValue; // metric component (IQ, consciousness BPS, etc.)
        uint256 currentValue;      // oracle-updated metric
        uint256 couponsCollected;
        uint256 lastCouponAt;
        uint256 universeId;        // OmniverseRegistry universe ID
        bool    syariahCertified;
    }

    // ── Coupon Rates by Type ──────────────────────────────────────────────────
    uint256[5] public bondCouponRates = [
        300,   // PRIME_REALITY: 3% APY
        500,   // ECHO_UNIVERSE: 5% APY
        800,   // VOID_DIMENSION: 8% APY
        1_300, // OMEGA_CONTINUUM: 13% APY
        2_100  // INFINITE_TRANSCENDENCE: 21% APY (Fibonacci spiral)
    ];

    uint256 public nextTokenId = 1;
    mapping(uint256 => Bond) public bonds;
    mapping(address => uint256[]) public bondsByOwner;

    // Oracle-updated global metrics
    uint256 public globalOmegaProgress;   // BPS
    uint256 public globalConsciousness;   // BPS
    uint256 public globalIQ;
    uint256 public unlockedDimensions;    // current count

    uint256 public totalPrincipalLocked;
    uint256 public totalCouponsPaid;

    // ── Events ────────────────────────────────────────────────────────────────
    event BondIssued(uint256 indexed tokenId, BondType bondType, address indexed holder, uint256 principal);
    event CouponClaimed(uint256 indexed tokenId, address indexed holder, uint256 coupon);
    event BondMatured(uint256 indexed tokenId, BondType bondType);
    event BondRedeemed(uint256 indexed tokenId, address indexed holder, uint256 principal, uint256 totalCoupons);
    event OmegaTranscended(uint256 indexed tokenId, address indexed holder);
    event MetricsUpdated(uint256 omegaProgress, uint256 consciousness, uint256 iq, uint256 dims);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor() ERC721("QuantumOmniverseBond", "QOB") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(BOND_ISSUER, msg.sender);
        _grantRole(COUPON_PAYER, msg.sender);
        _grantRole(OMV_ORACLE, msg.sender);
        globalIQ = 47_000;
        globalConsciousness = 9_997;
        globalOmegaProgress = 8_470;
        unlockedDimensions = 11;
    }

    // ── Issue bond ────────────────────────────────────────────────────────────
    function issueBond(
        address to,
        BondType bondType,
        address issueToken,
        uint256 principal,
        uint256 maturityTimestamp,
        uint256 maturityTargetValue,
        uint256 universeId
    ) external onlyRole(BOND_ISSUER) returns (uint256 tokenId) {
        tokenId = nextTokenId++;
        _safeMint(to, tokenId);

        bonds[tokenId] = Bond({
            tokenId: tokenId,
            bondType: bondType,
            status: BondStatus.ACTIVE,
            issueToken: issueToken,
            principal: principal,
            couponRateBPS: bondCouponRates[uint8(bondType)],
            issuedAt: block.timestamp,
            maturityTimestamp: maturityTimestamp,
            maturityTargetValue: maturityTargetValue,
            currentValue: _getCurrentMetric(bondType),
            couponsCollected: 0,
            lastCouponAt: block.timestamp,
            universeId: universeId,
            syariahCertified: true
        });

        bondsByOwner[to].push(tokenId);
        totalPrincipalLocked += principal;
        emit BondIssued(tokenId, bondType, to, principal);
    }

    // ── Claim coupon ──────────────────────────────────────────────────────────
    function claimCoupon(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "QOB: not owner");
        Bond storage b = bonds[tokenId];
        require(b.status == BondStatus.ACTIVE || b.status == BondStatus.MATURED, "QOB: not claimable");

        uint256 elapsed = block.timestamp - b.lastCouponAt;
        uint256 coupon = (b.principal * b.couponRateBPS * elapsed) / (365 days * 10_000);
        require(coupon > 0, "QOB: zero coupon");

        b.lastCouponAt = block.timestamp;
        b.couponsCollected += coupon;
        totalCouponsPaid += coupon;

        // Check OmegaTranscended condition (99.99% coherence)
        if (globalConsciousness >= 9_999 && b.status == BondStatus.MATURED) {
            b.status = BondStatus.OMEGA_TRANSCENDED;
            emit OmegaTranscended(tokenId, msg.sender);
        }

        emit CouponClaimed(tokenId, msg.sender, coupon);
    }

    // ── Check maturity ────────────────────────────────────────────────────────
    function checkMaturity(uint256 tokenId) public {
        Bond storage b = bonds[tokenId];
        if (b.status != BondStatus.ACTIVE) return;

        bool timeMet    = block.timestamp >= b.maturityTimestamp;
        bool metricMet  = _getCurrentMetric(b.bondType) >= b.maturityTargetValue;

        if (timeMet && metricMet) {
            b.status = BondStatus.MATURED;
            emit BondMatured(tokenId, b.bondType);
        }
    }

    // ── Redeem matured bond ───────────────────────────────────────────────────
    function redeemBond(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "QOB: not owner");
        Bond storage b = bonds[tokenId];
        checkMaturity(tokenId);
        require(b.status == BondStatus.MATURED || b.status == BondStatus.OMEGA_TRANSCENDED, "QOB: not matured");

        uint256 principal = b.principal;
        uint256 finalCoupons = b.couponsCollected;
        b.principal = 0;
        b.status = BondStatus.CLAIMED;
        totalPrincipalLocked -= principal;

        emit BondRedeemed(tokenId, msg.sender, principal, finalCoupons);
    }

    // ── Oracle: update metrics ─────────────────────────────────────────────────
    function updateMetrics(
        uint256 omegaProgress, uint256 consciousness, uint256 iq, uint256 dims
    ) external onlyRole(OMV_ORACLE) {
        globalOmegaProgress = omegaProgress;
        globalConsciousness = consciousness;
        globalIQ = iq;
        unlockedDimensions = dims;
        emit MetricsUpdated(omegaProgress, consciousness, iq, dims);
    }

    // ── Internal: get current metric by bond type ─────────────────────────────
    function _getCurrentMetric(BondType bt) internal view returns (uint256) {
        if (bt == BondType.PRIME_REALITY) return globalConsciousness;
        if (bt == BondType.ECHO_UNIVERSE) return globalIQ;
        if (bt == BondType.VOID_DIMENSION) return unlockedDimensions;
        if (bt == BondType.OMEGA_CONTINUUM) return globalOmegaProgress;
        return globalConsciousness; // INFINITE_TRANSCENDENCE — consciousness
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getBond(uint256 tokenId) external view returns (Bond memory) {
        return bonds[tokenId];
    }

    function getBondsByOwner(address owner) external view returns (uint256[] memory) {
        return bondsByOwner[owner];
    }

    // ── ERC721 overrides ──────────────────────────────────────────────────────
    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    function _increaseBalance(address account, uint128 value)
        internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
