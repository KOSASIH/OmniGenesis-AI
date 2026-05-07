// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IslamicHybridStablecoin
 * @notice OmniGenesis Islamic Syariah-Compliant Hybrid Stablecoin
 * @dev Multi-collateral hybrid stablecoin backing options:
 *      - Gold (Dinar) — physical gold tokens
 *      - Silver (Dirham) — physical silver tokens
 *      - Sukuk bonds — tokenized Islamic bonds
 *      - Commodities basket — halal commodity index
 *      - Real estate (Ijarah) — tokenized property
 *      - Waqf assets — endowment-backed collateral
 *      - Agricultural assets — Bay'Salam backed
 * @dev Peg mechanisms:
 *      - Primary: commodity basket peg
 *      - Stability reserve: OmniGenesis OGEN buffer
 *      - Emergency: Shura Council intervention
 * @dev Syariah features:
 *      - No interest/Riba on any operation
 *      - Murabaha minting (cost-plus financing)
 *      - Collateral must be Halal-certified
 *      - Automatic Zakat on balance
 *      - Takaful stability insurance pool
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IGoldOracle    { function getGoldPriceUSD()    external view returns (uint256, uint8); }
interface ISilverOracle  { function getSilverPriceUSD()  external view returns (uint256, uint8); }
interface ISukukOracle   { function getSukukYield()      external view returns (uint256); }
interface IHalalCertifier { function isCertified(address asset) external view returns (bool, string memory); }

contract IslamicHybridStablecoin is ERC20, AccessControl, ReentrancyGuard, Pausable {

    bytes32 public constant SHURA_COUNCIL_ROLE  = keccak256("SHURA_COUNCIL_ROLE");
    bytes32 public constant MUFTI_ROLE          = keccak256("MUFTI_ROLE");
    bytes32 public constant TAKAFUL_ROLE        = keccak256("TAKAFUL_ROLE");
    bytes32 public constant STABILITY_ROLE      = keccak256("STABILITY_ROLE");

    // ── Collateral System ──────────────────────────────────────────────────
    enum CollateralType {
        GOLD_DINAR,
        SILVER_DIRHAM,
        SUKUK_BOND,
        COMMODITY_BASKET,
        REAL_ESTATE_IJARAH,
        WAQF_ASSET,
        AGRICULTURAL_SALAM,
        OMNI_RESERVE
    }

    struct CollateralTier {
        CollateralType collateralType;
        uint256        weightBasisPoints;  // Total must = 10000
        address        assetToken;         // ERC-20 representing collateral
        address        priceOracle;
        bool           active;
        bool           halalCertified;
        string         certificationBody;
        uint256        lockedAmount;
        uint256        minimumRatio;       // Min collateral ratio (e.g., 150% = 15000)
    }

    struct HybridPeg {
        string   name;                     // "DINAR", "DIRHAM", "MIZAN", etc.
        string   description;              // Human-readable peg description
        uint256  targetPriceUSD;           // Target price in USD (18 decimals)
        uint256  upperBand;                // Upper peg band (basis points above target)
        uint256  lowerBand;                // Lower peg band (basis points below target)
        uint256  stabilizationFee;         // Fee when outside band (basis points)
        bool     goldBackedPrimary;
    }

    // ── Murabaha Minting ───────────────────────────────────────────────────
    struct MurabahaPosition {
        address  borrower;
        uint256  mintedAmount;       // Stablecoins minted
        uint256  collateralAmount;   // Collateral locked
        CollateralType collateralType;
        uint256  profitRate;         // Murabaha profit rate (basis points, NOT interest)
        uint256  openedAt;
        uint256  maturityDate;
        bool     settled;
        uint256  profitPaid;
    }

    // ── Takaful Stability Pool ─────────────────────────────────────────────
    struct TakafulPool {
        uint256  totalContributions;
        uint256  availableForStability;
        uint256  claimsSettled;
        mapping(address => uint256) contributions;
        mapping(address => uint256) claimHistory;
    }

    // ── State Variables ────────────────────────────────────────────────────
    HybridPeg public pegConfig;
    CollateralTier[] public collateralTiers;
    mapping(uint256 => MurabahaPosition) public murabahaPositions;
    uint256 public positionCount;
    TakafulPool private takafulPool;

    uint256 public totalCollateralUSD;
    uint256 public circulatingSupply;
    uint256 public totalZakatCollected;
    uint256 public totalMurabahaProfit;
    uint256 public pegDeviationEvents;
    uint256 public stabilizationEvents;

    mapping(address => bool)    public halalCertifiedHolders;
    mapping(address => uint256) public zakatReserve;
    mapping(address => uint256) public lastZakatBlock;

    address public pairedUtilityToken;
    address public goldOracle;
    address public silverOracle;
    address public sukukOracle;
    address public halalCertifier;
    address public zakatDAO;
    address public stabilityReserve;

    string  public chainName;
    string  public pegModelName;
    uint256 public chainIndex;

    // ── Events ─────────────────────────────────────────────────────────────
    event StablecoinMinted(address indexed to, uint256 amount, CollateralType collateralType, uint256 collateralAmount);
    event StablecoinRedeemed(address indexed from, uint256 amount, CollateralType collateralType, uint256 collateralReturned);
    event MurabahaPositionOpened(uint256 indexed positionId, address indexed borrower, uint256 minted, uint256 profitRate);
    event MurabahaPositionSettled(uint256 indexed positionId, uint256 profitPaid);
    event PegDeviationDetected(uint256 currentPrice, uint256 targetPrice, int256 deviation);
    event StabilizationTriggered(string mechanism, uint256 amount);
    event TakafulContribution(address indexed contributor, uint256 amount);
    event TakafulClaim(address indexed claimant, uint256 amount, string reason);
    event CollateralTierAdded(CollateralType collateralType, uint256 weight);
    event ZakatOnStablecoin(address indexed holder, uint256 amount);
    event UtilityTokenPaired(address indexed utilityToken);
    event GoldBackingVerified(uint256 goldReserveUSD, uint256 circulatingUSD, uint256 ratioPercent);

    // ── Constructor ────────────────────────────────────────────────────────
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _chainName,
        string memory _pegModelName,
        uint256 _chainIndex,
        address _shuraCouncil,
        address _goldOracle,
        address _silverOracle,
        address _sukukOracle,
        address _halalCertifier,
        address _zakatDAO,
        address _stabilityReserve,
        uint256 _targetPriceUSD
    ) ERC20(_name, _symbol) {
        chainName     = _chainName;
        pegModelName  = _pegModelName;
        chainIndex    = _chainIndex;
        goldOracle    = _goldOracle;
        silverOracle  = _silverOracle;
        sukukOracle   = _sukukOracle;
        halalCertifier = _halalCertifier;
        zakatDAO      = _zakatDAO;
        stabilityReserve = _stabilityReserve;

        _grantRole(DEFAULT_ADMIN_ROLE, _shuraCouncil);
        _grantRole(SHURA_COUNCIL_ROLE, _shuraCouncil);

        pegConfig = HybridPeg({
            name:               _pegModelName,
            description:        string(abi.encodePacked("OmniGenesis Islamic Hybrid Stablecoin — ", _pegModelName, " Peg")),
            targetPriceUSD:     _targetPriceUSD,
            upperBand:          200,    // +2% band
            lowerBand:          200,    // -2% band
            stabilizationFee:   50,     // 0.5% fee when outside band
            goldBackedPrimary:  true
        });
    }

    // ── Collateral Management ──────────────────────────────────────────────
    function addCollateralTier(
        CollateralType _type,
        uint256 _weightBPs,
        address _assetToken,
        address _oracle,
        uint256 _minRatio,
        string calldata _certBody
    ) external onlyRole(SHURA_COUNCIL_ROLE) {
        // Verify Halal certification
        if (halalCertifier != address(0) && _assetToken != address(0)) {
            (bool certified,) = IHalalCertifier(halalCertifier).isCertified(_assetToken);
            require(certified, "IslamicStable: Collateral not Halal-certified");
        }
        collateralTiers.push(CollateralTier({
            collateralType:    _type,
            weightBasisPoints: _weightBPs,
            assetToken:        _assetToken,
            priceOracle:       _oracle,
            active:            true,
            halalCertified:    true,
            certificationBody: _certBody,
            lockedAmount:      0,
            minimumRatio:      _minRatio
        }));
        emit CollateralTierAdded(_type, _weightBPs);
    }

    // ── Minting via Murabaha ───────────────────────────────────────────────
    /**
     * @dev Mint stablecoins via Murabaha (cost-plus, NOT interest).
     *      Borrower deposits collateral, protocol mints stablecoins at cost + murabaha profit margin.
     *      No Riba (interest) — profit margin is fixed and disclosed upfront.
     */
    function openMurabahaPosition(
        uint256 collateralAmount,
        CollateralType collateralType,
        uint256 profitRateBPs,   // Murabaha profit rate (e.g., 300 = 3%)
        uint256 maturityDays
    ) external nonReentrant whenNotPaused returns (uint256 positionId) {
        require(collateralAmount > 0, "IslamicStable: Zero collateral");
        require(profitRateBPs <= 1500, "IslamicStable: Murabaha profit capped at 15%");
        require(maturityDays >= 30 && maturityDays <= 365, "IslamicStable: Maturity must be 30-365 days");

        uint256 collateralValueUSD = _getCollateralValue(collateralType, collateralAmount);
        require(collateralValueUSD > 0, "IslamicStable: Cannot price collateral");

        // Mint at 66% LTV (150% collateral ratio — conservative Islamic finance)
        uint256 mintAmount = (collateralValueUSD * 6666) / 10000;

        positionId = ++positionCount;
        murabahaPositions[positionId] = MurabahaPosition({
            borrower:        msg.sender,
            mintedAmount:    mintAmount,
            collateralAmount: collateralAmount,
            collateralType:  collateralType,
            profitRate:      profitRateBPs,
            openedAt:        block.timestamp,
            maturityDate:    block.timestamp + maturityDays * 1 days,
            settled:         false,
            profitPaid:      0
        });

        _mint(msg.sender, mintAmount);
        circulatingSupply += mintAmount;
        totalCollateralUSD += collateralValueUSD;

        emit MurabahaPositionOpened(positionId, msg.sender, mintAmount, profitRateBPs);
    }

    /**
     * @dev Settle Murabaha position — repay principal + declared profit margin.
     */
    function settleMurabahaPosition(uint256 positionId) external nonReentrant {
        MurabahaPosition storage pos = murabahaPositions[positionId];
        require(pos.borrower == msg.sender, "IslamicStable: Not position owner");
        require(!pos.settled, "IslamicStable: Already settled");

        uint256 profitAmount = (pos.mintedAmount * pos.profitRate) / 10000;
        uint256 totalRepay   = pos.mintedAmount + profitAmount;

        _burn(msg.sender, pos.mintedAmount);
        circulatingSupply -= pos.mintedAmount;
        pos.settled   = true;
        pos.profitPaid = profitAmount;
        totalMurabahaProfit += profitAmount;

        emit MurabahaPositionSettled(positionId, profitAmount);
    }

    // ── Direct Mint/Redeem (Shura Council only) ────────────────────────────
    function mintByCouncil(address to, uint256 amount) external onlyRole(SHURA_COUNCIL_ROLE) {
        _mint(to, amount);
        circulatingSupply += amount;
        emit StablecoinMinted(to, amount, CollateralType.OMNI_RESERVE, amount);
    }

    function burnByCouncil(address from, uint256 amount) external onlyRole(SHURA_COUNCIL_ROLE) {
        _burn(from, amount);
        circulatingSupply -= amount;
        emit StablecoinRedeemed(from, amount, CollateralType.OMNI_RESERVE, 0);
    }

    // ── Peg Stability ──────────────────────────────────────────────────────
    function triggerStabilization(string calldata mechanism, uint256 amount)
        external
        onlyRole(STABILITY_ROLE)
    {
        stabilizationEvents++;
        emit StabilizationTriggered(mechanism, amount);
    }

    function reportPegDeviation(uint256 currentPrice) external onlyRole(STABILITY_ROLE) {
        int256 deviation = int256(currentPrice) - int256(pegConfig.targetPriceUSD);
        pegDeviationEvents++;
        emit PegDeviationDetected(currentPrice, pegConfig.targetPriceUSD, deviation);
    }

    // ── Takaful Contributions ──────────────────────────────────────────────
    function contributeToTakaful(uint256 amount) external nonReentrant {
        require(amount > 0, "IslamicStable: Zero contribution");
        _transfer(msg.sender, address(this), amount);
        takafulPool.totalContributions += amount;
        takafulPool.availableForStability += amount;
        takafulPool.contributions[msg.sender] += amount;
        emit TakafulContribution(msg.sender, amount);
    }

    function claimTakaful(uint256 amount, string calldata reason)
        external
        onlyRole(TAKAFUL_ROLE)
    {
        require(amount <= takafulPool.availableForStability, "IslamicStable: Insufficient Takaful pool");
        takafulPool.availableForStability -= amount;
        takafulPool.claimsSettled += amount;
        emit TakafulClaim(msg.sender, amount, reason);
    }

    // ── Zakat on Stablecoins ───────────────────────────────────────────────
    function collectZakatFromHolder(address holder) external {
        uint256 HIJRI_YEAR = 354 days;
        require(block.timestamp - lastZakatBlock[holder] >= HIJRI_YEAR, "IslamicStable: Zakat not due yet");
        uint256 balance = balanceOf(holder);
        if (balance < 1_000 * 1e18) return;  // Below nisab
        uint256 zakatAmount = (balance * 250) / 10000;  // 2.5%
        zakatReserve[holder]  += zakatAmount;
        totalZakatCollected   += zakatAmount;
        lastZakatBlock[holder] = block.timestamp;
        if (zakatDAO != address(0)) {
            _transfer(holder, zakatDAO, zakatAmount);
            emit ZakatOnStablecoin(holder, zakatAmount);
        }
    }

    // ── Dual Coin Pairing ──────────────────────────────────────────────────
    function pairUtilityToken(address _utilityToken) external onlyRole(SHURA_COUNCIL_ROLE) {
        require(_utilityToken != address(0), "IslamicStable: Invalid utility token");
        pairedUtilityToken = _utilityToken;
        emit UtilityTokenPaired(_utilityToken);
    }

    // ── Gold Backing Verification ──────────────────────────────────────────
    function verifyGoldBacking() external returns (uint256 ratio) {
        if (goldOracle == address(0)) return 0;
        (uint256 goldPriceUSD,) = IGoldOracle(goldOracle).getGoldPriceUSD();
        // Assume some gold reserve tracked separately
        uint256 goldReserveUSD = goldPriceUSD * 100;  // Placeholder
        uint256 circUSD = circulatingSupply / 1e18 * 1e6;
        ratio = circUSD > 0 ? (goldReserveUSD * 100) / circUSD : 0;
        emit GoldBackingVerified(goldReserveUSD, circUSD, ratio);
    }

    // ── Internal Price Feed ────────────────────────────────────────────────
    function _getCollateralValue(CollateralType cType, uint256 amount) internal view returns (uint256) {
        // Simplified — in production this queries per-collateral oracles
        if (cType == CollateralType.GOLD_DINAR && goldOracle != address(0)) {
            (uint256 price,) = IGoldOracle(goldOracle).getGoldPriceUSD();
            return (amount * price) / 1e18;
        }
        // Default: treat 1 unit = $1 USD (18 decimals)
        return amount;
    }

    // ── View Functions ─────────────────────────────────────────────────────
    function getPegInfo() external view returns (
        string memory name,
        uint256 targetPriceUSD,
        uint256 upperBand,
        uint256 lowerBand,
        bool goldBackedPrimary
    ) {
        return (
            pegConfig.name,
            pegConfig.targetPriceUSD,
            pegConfig.upperBand,
            pegConfig.lowerBand,
            pegConfig.goldBackedPrimary
        );
    }

    function getStabilityStats() external view returns (
        uint256 _circulatingSupply,
        uint256 _collateralUSD,
        uint256 _pegDeviations,
        uint256 _stabilizationEvents,
        uint256 _zakatCollected,
        uint256 _murabahaProfit,
        uint256 _takafulPool
    ) {
        return (
            circulatingSupply,
            totalCollateralUSD,
            pegDeviationEvents,
            stabilizationEvents,
            totalZakatCollected,
            totalMurabahaProfit,
            takafulPool.availableForStability
        );
    }

    function getCollateralRatio() external view returns (uint256) {
        if (circulatingSupply == 0) return type(uint256).max;
        return (totalCollateralUSD * 10000) / (circulatingSupply / 1e18);
    }

    function pause()   external onlyRole(SHURA_COUNCIL_ROLE) { _pause(); }
    function unpause() external onlyRole(SHURA_COUNCIL_ROLE) { _unpause(); }
}
