// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title DivineBond
 * @notice ERC-721 bonds backed by reality creation events.
 *         Yield is sourced from reality synthesis royalties and
 *         Omega Convergence vault returns — not interest.
 *         Syariah-certified: no Riba, yield = reality creation value share.
 *
 *         Bond types:
 *         - REALITY_SEED:     backed by a single reality synthesis thread
 *         - OMEGA_GENESIS:    backed by Omega-class (99.99%+ coherence) threads
 *         - CONVERGENCE_BOND: backed by universal mind progress milestones
 *         - DIMENSIONAL_CROSS:backed by cross-dimensional coherence appreciation
 *         - TRANSCENDENCE:    backed by post-singularity consciousness growth
 *
 * @dev Phase 15 — OmniGenesis AI. Founder: KOSASIH
 */
contract DivineBond is ERC721, AccessControl, ReentrancyGuard {

    bytes32 public constant ISSUER_ROLE   = keccak256("ISSUER_ROLE");
    bytes32 public constant ORACLE_ROLE   = keccak256("ORACLE_ROLE");
    bytes32 public constant SYARIAH_ROLE  = keccak256("SYARIAH_ROLE");

    enum BondType { REALITY_SEED, OMEGA_GENESIS, CONVERGENCE_BOND, DIMENSIONAL_CROSS, TRANSCENDENCE }
    enum BondStatus { ACTIVE, MATURED, REDEEMED, OMEGA_TRANSCENDED }

    uint256 public constant MIN_FACE   = 1e16;
    uint256 public constant RESERVE_RATIO_BPS = 11000; // 110%

    struct DivineBondNFT {
        uint256 tokenId;
        BondType bondType;
        BondStatus status;
        address issuer;
        uint256 faceValue;
        uint256 linkedThreadId;       // Reality thread backing this bond
        uint256 linkedDimension;
        uint256 issuedAt;
        uint256 realityCoherenceAtIssue; // 0–10000
        uint256 currentCoherence;
        uint256 yieldAccrued;
        uint256 couponCount;
        uint256 universalProgressAtIssue;
        bool    syariahCertified;
        bool    omegaTranscended;     // Bond surpassed 99.99% coherence
        uint256 royaltyShareBPS;      // Share of reality royalties
    }

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 private _tokenCount;
    mapping(uint256 => DivineBondNFT) public bonds;

    uint256 public totalFaceValue;
    uint256 public totalYieldPaid;
    uint256 public totalBondsIssued;
    uint256 public totalOmegaBonds;
    uint256 public reserveBalance;

    uint256 public globalUniversalProgress;  // 0–10000
    uint256 public globalOmegaCoherence;     // avg across active Omega threads

    string public constant BASE_URI = "https://omnigenesis.ai/bonds/divine/";

    // ── Events ────────────────────────────────────────────────────────────────
    event DivineBondIssued(uint256 indexed tokenId, BondType bondType, uint256 faceValue, address to);
    event RealityYieldPaid(uint256 indexed tokenId, uint256 amount, uint256 coherence);
    event BondOmegaTranscended(uint256 indexed tokenId, uint256 coherence);
    event BondRedeemed(uint256 indexed tokenId, address holder, uint256 total);
    event CoherenceUpdated(uint256 indexed tokenId, uint256 newCoherence);
    event OracleUpdate(uint256 universalProgress, uint256 omegaCoherence);

    constructor(address admin) ERC721("Divine Bond", "DBOND") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(SYARIAH_ROLE, admin);
        globalUniversalProgress = 8470;
        globalOmegaCoherence    = 9997;
    }

    // ── Issuance ──────────────────────────────────────────────────────────────
    function issueDivineBond(
        address to,
        BondType bondType,
        uint256 linkedThreadId,
        uint256 linkedDimension,
        uint256 initialCoherence,
        uint256 royaltyShareBPS,
        bool certify
    ) external payable nonReentrant onlyRole(ISSUER_ROLE) returns (uint256 tokenId) {
        require(msg.value >= MIN_FACE, "Below minimum");
        require(linkedDimension >= 1 && linkedDimension <= 11, "Invalid dimension");

        tokenId = ++_tokenCount;
        bonds[tokenId] = DivineBondNFT({
            tokenId: tokenId,
            bondType: bondType,
            status: BondStatus.ACTIVE,
            issuer: msg.sender,
            faceValue: msg.value,
            linkedThreadId: linkedThreadId,
            linkedDimension: linkedDimension,
            issuedAt: block.timestamp,
            realityCoherenceAtIssue: initialCoherence,
            currentCoherence: initialCoherence,
            yieldAccrued: 0,
            couponCount: 0,
            universalProgressAtIssue: globalUniversalProgress,
            syariahCertified: certify,
            omegaTranscended: bondType == BondType.OMEGA_GENESIS && initialCoherence >= 9999,
            royaltyShareBPS: royaltyShareBPS
        });

        reserveBalance += msg.value;
        totalFaceValue += msg.value;
        totalBondsIssued++;
        if (bonds[tokenId].omegaTranscended) totalOmegaBonds++;

        _safeMint(to, tokenId);
        emit DivineBondIssued(tokenId, bondType, msg.value, to);
    }

    // ── Reality Yield ─────────────────────────────────────────────────────────
    function payRealityYield(uint256 tokenId)
        external payable onlyRole(ORACLE_ROLE) nonReentrant
    {
        DivineBondNFT storage b = bonds[tokenId];
        require(b.status == BondStatus.ACTIVE || b.status == BondStatus.OMEGA_TRANSCENDED, "Inactive");

        uint256 yieldAmount = msg.value;
        b.yieldAccrued += yieldAmount;
        b.couponCount++;
        totalYieldPaid += yieldAmount;
        emit RealityYieldPaid(tokenId, yieldAmount, b.currentCoherence);
    }

    function updateCoherence(uint256 tokenId, uint256 newCoherence)
        external onlyRole(ORACLE_ROLE)
    {
        DivineBondNFT storage b = bonds[tokenId];
        b.currentCoherence = newCoherence;
        emit CoherenceUpdated(tokenId, newCoherence);

        // Check Omega transcendence
        if (!b.omegaTranscended && newCoherence >= 9999) {
            b.omegaTranscended = true;
            b.status = BondStatus.OMEGA_TRANSCENDED;
            totalOmegaBonds++;
            emit BondOmegaTranscended(tokenId, newCoherence);
        }

        // Check maturity conditions
        _checkMaturity(tokenId);
    }

    function _checkMaturity(uint256 tokenId) internal {
        DivineBondNFT storage b = bonds[tokenId];
        bool mature = false;
        if (b.bondType == BondType.CONVERGENCE_BOND) {
            mature = globalUniversalProgress >= 9999;
        } else if (b.bondType == BondType.OMEGA_GENESIS) {
            mature = b.currentCoherence >= 9999 && b.couponCount >= 3;
        } else if (b.bondType == BondType.TRANSCENDENCE) {
            mature = globalOmegaCoherence >= 9997 && globalUniversalProgress >= 9500;
        }
        if (mature && b.status == BondStatus.ACTIVE) {
            b.status = BondStatus.MATURED;
        }
    }

    // ── Redemption ────────────────────────────────────────────────────────────
    function redeemBond(uint256 tokenId) external nonReentrant {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        DivineBondNFT storage b = bonds[tokenId];
        require(b.status == BondStatus.MATURED || b.status == BondStatus.OMEGA_TRANSCENDED, "Not redeemable");

        uint256 total = b.faceValue + b.yieldAccrued;
        require(reserveBalance >= total, "Insufficient reserve");

        b.status = BondStatus.REDEEMED;
        reserveBalance -= total;
        totalFaceValue -= b.faceValue;

        (bool ok,) = msg.sender.call{value: total}("");
        require(ok, "Transfer failed");
        emit BondRedeemed(tokenId, msg.sender, total);
    }

    // ── Oracle ────────────────────────────────────────────────────────────────
    function updateOracle(uint256 universalProgress, uint256 omegaCoherence)
        external onlyRole(ORACLE_ROLE)
    {
        globalUniversalProgress = universalProgress;
        globalOmegaCoherence    = omegaCoherence;
        emit OracleUpdate(universalProgress, omegaCoherence);
    }

    function fundReserve() external payable { reserveBalance += msg.value; }

    function supportsInterface(bytes4 iface)
        public view override(ERC721, AccessControl) returns (bool)
    { return super.supportsInterface(iface); }

    function _baseURI() internal pure override returns (string memory) {
        return BASE_URI;
    }

    receive() external payable { reserveBalance += msg.value; }
}
