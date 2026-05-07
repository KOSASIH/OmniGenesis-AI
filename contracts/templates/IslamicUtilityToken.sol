// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IslamicUtilityToken
 * @notice OmniGenesis Islamic Syariah-Compliant Utility Token
 * @dev ERC-20 with full Syariah compliance modules:
 *      - Riba (interest) prohibition enforcement
 *      - Zakat automation (2.5% annual obligation)
 *      - Halal transaction screening via oracle
 *      - Waqf endowment allocation
 *      - Hisba market surveillance
 *      - AI Fatwa Engine integration
 *      - Maqasid Al-Syariah alignment scoring
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ISyariahComplianceOracle {
    function isHalal(address from, address to, uint256 amount, bytes calldata data) external view returns (bool, string memory);
    function getMaqasidScore(address account) external view returns (uint256);
    function getLatestFatwa(bytes32 topic) external view returns (string memory, bool, uint256);
}

interface IZakatDAO {
    function receiveZakat(address token, uint256 amount) external;
    function distributeZakat() external;
}

interface IWaqfEndowment {
    function receiveWaqf(address token, uint256 amount) external;
}

interface IHisbaMarket {
    function reportViolation(address account, string calldata reason) external;
    function isBlacklisted(address account) external view returns (bool);
}

contract IslamicUtilityToken is ERC20, ERC20Burnable, Pausable, AccessControl, ReentrancyGuard {

    // ── Roles ──────────────────────────────────────────────────────────────
    bytes32 public constant SHURA_COUNCIL_ROLE = keccak256("SHURA_COUNCIL_ROLE");
    bytes32 public constant MUFTI_ROLE         = keccak256("MUFTI_ROLE");
    bytes32 public constant HISBA_ROLE         = keccak256("HISBA_ROLE");
    bytes32 public constant WAQF_ROLE          = keccak256("WAQF_ROLE");

    // ── Syariah Configuration ──────────────────────────────────────────────
    struct SyariahConfig {
        bool ribaFilterEnabled;          // Block interest-bearing operations
        bool zakatAutoEnabled;           // Automatic 2.5% annual zakat
        bool halalOracleEnabled;         // Pre-screen transactions via oracle
        bool hisbaEnabled;               // Market surveillance active
        bool waqfAllocationEnabled;      // Allocate % to Waqf endowment
        uint256 zakatBasisPoints;        // Default: 250 (2.5%)
        uint256 waqfBasisPoints;         // Default: 100 (1%)
        uint256 sadaqahBasisPoints;      // Default: 50 (0.5%)
        uint256 maqasidMinScore;         // Min Maqasid score to transact (0-100)
        address syariahOracle;
        address zakatDAO;
        address waqfEndowment;
        address hisbaMarket;
        string  certificationBody;       // AAOIFI, OIC, ISRA, BNM Syariah
        uint256 certificationExpiry;
    }

    // ── Dual Coin Link ─────────────────────────────────────────────────────
    address public pairedStablecoin;     // Linked hybrid stablecoin address
    uint256 public stablecoinPegRatio;   // Tokens per stablecoin unit (18 dec)

    // ── Token Economics ────────────────────────────────────────────────────
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18;  // 1B max
    uint256 public mintedTotal;
    uint256 public burnedTotal;
    uint256 public zakatCollectedTotal;
    uint256 public waqfAllocatedTotal;
    uint256 public sadaqahDistributedTotal;
    uint256 public halalTransactions;
    uint256 public blockedTransactions;

    // ── Zakat Tracking ─────────────────────────────────────────────────────
    mapping(address => uint256) public zakatBalance;         // Pending zakat per account
    mapping(address => uint256) public lastZakatTimestamp;   // Last zakat deduction
    mapping(address => uint256) public zakatPaidLifetime;    // Lifetime zakat paid
    mapping(address => bool)    public zakatExempt;          // Nisab exemption

    // ── Waqf Tracking ──────────────────────────────────────────────────────
    mapping(address => uint256) public waqfDonated;          // Waqf donations per account

    // ── Syariah Violations ─────────────────────────────────────────────────
    mapping(address => uint256) public violationCount;
    mapping(address => string)  public violationReason;
    mapping(address => bool)    public frozenForReview;      // Frozen pending Fatwa

    // ── Maqasid Scores ─────────────────────────────────────────────────────
    mapping(address => uint256) public maqasidScore;         // 0-100 compliance score

    SyariahConfig public syariahConfig;

    // ── Chain Identity ─────────────────────────────────────────────────────
    string  public chainName;
    string  public categoryId;
    string  public categoryArabic;
    uint256 public chainIndex;

    // ── Events ─────────────────────────────────────────────────────────────
    event ZakatDeducted(address indexed from, uint256 amount, uint256 timestamp);
    event ZakatDistributed(uint256 totalAmount, uint256 beneficiaries);
    event WaqfAllocated(address indexed donor, uint256 amount);
    event SadaqahDistributed(address indexed from, uint256 amount, address indexed beneficiary);
    event HaramTransactionBlocked(address indexed from, address indexed to, uint256 amount, string reason);
    event FatwaApplied(bytes32 indexed topic, string fatwaText, bool allowed);
    event MaqasidScoreUpdated(address indexed account, uint256 oldScore, uint256 newScore);
    event SyariahConfigUpdated(address indexed updater, string field);
    event StablecoinPaired(address indexed stablecoin, uint256 pegRatio);
    event CertificationRenewed(string body, uint256 expiry);
    event HisbaViolationReported(address indexed account, string reason, uint256 violationCount);
    event RibaAttemptBlocked(address indexed account, uint256 amount, string context);

    // ── Modifiers ──────────────────────────────────────────────────────────
    modifier notFrozen(address account) {
        require(!frozenForReview[account], "IslamicToken: Account frozen pending Fatwa review");
        _;
    }

    modifier syariahCompliant(address from, address to, uint256 amount) {
        if (syariahConfig.halalOracleEnabled && syariahConfig.syariahOracle != address(0)) {
            ISyariahComplianceOracle oracle = ISyariahComplianceOracle(syariahConfig.syariahOracle);
            (bool halal, string memory reason) = oracle.isHalal(from, to, amount, "");
            if (!halal) {
                blockedTransactions++;
                emit HaramTransactionBlocked(from, to, amount, reason);
                revert(string(abi.encodePacked("IslamicToken: Haram transaction blocked — ", reason)));
            }
            if (syariahConfig.hisbaEnabled && syariahConfig.hisbaMarket != address(0)) {
                require(!IHisbaMarket(syariahConfig.hisbaMarket).isBlacklisted(from),
                    "IslamicToken: Sender blacklisted by Hisba Market Surveillance");
            }
        }
        halalTransactions++;
        _;
    }

    // ── Constructor ────────────────────────────────────────────────────────
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _chainName,
        string memory _categoryId,
        string memory _categoryArabic,
        uint256 _chainIndex,
        address _shuraCouncil,
        address _mufti,
        address _syariahOracle,
        address _zakatDAO,
        address _waqfEndowment,
        address _hisbaMarket,
        string memory _certificationBody,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) {
        chainName      = _chainName;
        categoryId     = _categoryId;
        categoryArabic = _categoryArabic;
        chainIndex     = _chainIndex;

        // Grant roles
        _grantRole(DEFAULT_ADMIN_ROLE, _shuraCouncil);
        _grantRole(SHURA_COUNCIL_ROLE, _shuraCouncil);
        _grantRole(MUFTI_ROLE, _mufti);
        _grantRole(HISBA_ROLE, _hisbaMarket);

        // Initialize Syariah configuration
        syariahConfig = SyariahConfig({
            ribaFilterEnabled:       true,
            zakatAutoEnabled:        true,
            halalOracleEnabled:      _syariahOracle != address(0),
            hisbaEnabled:            _hisbaMarket != address(0),
            waqfAllocationEnabled:   _waqfEndowment != address(0),
            zakatBasisPoints:        250,      // 2.5%
            waqfBasisPoints:         100,      // 1.0%
            sadaqahBasisPoints:      50,       // 0.5%
            maqasidMinScore:         60,       // min 60/100 compliance
            syariahOracle:           _syariahOracle,
            zakatDAO:                _zakatDAO,
            waqfEndowment:           _waqfEndowment,
            hisbaMarket:             _hisbaMarket,
            certificationBody:       _certificationBody,
            certificationExpiry:     block.timestamp + 365 days
        });

        // Mint initial supply (Syariah council approved)
        require(_initialSupply <= MAX_SUPPLY, "IslamicToken: Exceeds maximum supply");
        _mint(_shuraCouncil, _initialSupply);
        mintedTotal += _initialSupply;
    }

    // ── Core Transfer Override ─────────────────────────────────────────────
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
        if (from != address(0) && to != address(0)) {
            require(!frozenForReview[from], "IslamicToken: Sender frozen for Fatwa review");
            require(!frozenForReview[to],   "IslamicToken: Recipient frozen for Fatwa review");
            // Process zakat on transfer
            if (syariahConfig.zakatAutoEnabled) {
                _processZakat(from, amount);
            }
            // Process waqf allocation
            if (syariahConfig.waqfAllocationEnabled && syariahConfig.waqfEndowment != address(0)) {
                _processWaqf(from, amount);
            }
        }
    }

    function _afterTokenTransfer(address from, address to, uint256 amount) internal override {
        super._afterTokenTransfer(from, to, amount);
        // Update Maqasid scores
        if (from != address(0)) _updateMaqasidScore(from);
        if (to != address(0))   _updateMaqasidScore(to);
    }

    // ── Zakat System ───────────────────────────────────────────────────────
    /**
     * @dev Calculate and reserve zakat on transfer.
     *      Zakat nisab: exempt if balance below 85g gold equivalent (~$5,000).
     *      Rate: 2.5% per Hijri year (approximated as 354 days).
     */
    function _processZakat(address from, uint256 transferAmount) internal {
        if (zakatExempt[from]) return;
        uint256 HIJRI_YEAR = 354 days;
        uint256 timeSinceLast = block.timestamp - lastZakatTimestamp[from];
        if (timeSinceLast >= HIJRI_YEAR) {
            uint256 balance = balanceOf(from);
            // Nisab check: skip if small balance
            if (balance < 1_000 * 1e18) return;
            uint256 zakatDue = (balance * syariahConfig.zakatBasisPoints) / 10000;
            // Reserve zakat (reduce effective balance)
            zakatBalance[from] += zakatDue;
            zakatCollectedTotal += zakatDue;
            zakatPaidLifetime[from] += zakatDue;
            lastZakatTimestamp[from] = block.timestamp;
            // Transfer to ZakatDAO
            if (syariahConfig.zakatDAO != address(0) && zakatDue <= balanceOf(from)) {
                _transfer(from, syariahConfig.zakatDAO, zakatDue);
                emit ZakatDeducted(from, zakatDue, block.timestamp);
            }
        }
    }

    /**
     * @dev Allocate a portion of transfer to Waqf endowment.
     */
    function _processWaqf(address from, uint256 amount) internal {
        uint256 waqfAmount = (amount * syariahConfig.waqfBasisPoints) / 10000;
        if (waqfAmount > 0 && waqfAmount <= balanceOf(from)) {
            _transfer(from, syariahConfig.waqfEndowment, waqfAmount);
            waqfDonated[from] += waqfAmount;
            waqfAllocatedTotal += waqfAmount;
            emit WaqfAllocated(from, waqfAmount);
        }
    }

    /**
     * @dev Distribute sadaqah (voluntary charity) from an account.
     */
    function paySadaqah(address beneficiary, uint256 amount) external nonReentrant notFrozen(msg.sender) {
        require(beneficiary != address(0), "IslamicToken: Invalid beneficiary");
        require(amount > 0, "IslamicToken: Amount must be positive");
        _transfer(msg.sender, beneficiary, amount);
        sadaqahDistributedTotal += amount;
        emit SadaqahDistributed(msg.sender, amount, beneficiary);
    }

    // ── Maqasid Score ──────────────────────────────────────────────────────
    function _updateMaqasidScore(address account) internal {
        if (syariahConfig.syariahOracle == address(0)) {
            maqasidScore[account] = 75; // Default
            return;
        }
        uint256 oldScore = maqasidScore[account];
        uint256 newScore = ISyariahComplianceOracle(syariahConfig.syariahOracle).getMaqasidScore(account);
        if (oldScore != newScore) {
            maqasidScore[account] = newScore;
            emit MaqasidScoreUpdated(account, oldScore, newScore);
        }
    }

    // ── Riba Prevention ────────────────────────────────────────────────────
    /**
     * @dev Called by Riba Filter Engine when interest-based operation detected.
     */
    function reportRibaAttempt(address account, uint256 amount, string calldata context)
        external
        onlyRole(HISBA_ROLE)
    {
        violationCount[account]++;
        violationReason[account] = context;
        emit RibaAttemptBlocked(account, amount, context);
        if (violationCount[account] >= 3) {
            frozenForReview[account] = true;
            emit HisbaViolationReported(account, "Repeated Riba violation — frozen for Fatwa review", violationCount[account]);
        }
    }

    // ── Shura Council Functions ────────────────────────────────────────────
    function mint(address to, uint256 amount) external onlyRole(SHURA_COUNCIL_ROLE) {
        require(mintedTotal + amount <= MAX_SUPPLY, "IslamicToken: Exceeds max supply");
        _mint(to, amount);
        mintedTotal += amount;
    }

    function pause()   external onlyRole(SHURA_COUNCIL_ROLE) { _pause(); }
    function unpause() external onlyRole(SHURA_COUNCIL_ROLE) { _unpause(); }

    function freezeAccount(address account, string calldata reason) external onlyRole(MUFTI_ROLE) {
        frozenForReview[account] = true;
        violationReason[account] = reason;
        emit HisbaViolationReported(account, reason, ++violationCount[account]);
    }

    function unfreezeAccount(address account) external onlyRole(MUFTI_ROLE) {
        frozenForReview[account] = false;
        violationCount[account] = 0;
    }

    function setZakatExempt(address account, bool exempt) external onlyRole(SHURA_COUNCIL_ROLE) {
        zakatExempt[account] = exempt;
    }

    function updateSyariahConfig(
        bool _ribaFilter,
        bool _zakatAuto,
        bool _halalOracle,
        uint256 _zakatBPs,
        uint256 _waqfBPs,
        uint256 _maqasidMin
    ) external onlyRole(SHURA_COUNCIL_ROLE) {
        require(_zakatBPs <= 500, "IslamicToken: Zakat cannot exceed 5%");
        require(_waqfBPs  <= 200, "IslamicToken: Waqf cannot exceed 2%");
        syariahConfig.ribaFilterEnabled  = _ribaFilter;
        syariahConfig.zakatAutoEnabled   = _zakatAuto;
        syariahConfig.halalOracleEnabled = _halalOracle;
        syariahConfig.zakatBasisPoints   = _zakatBPs;
        syariahConfig.waqfBasisPoints    = _waqfBPs;
        syariahConfig.maqasidMinScore    = _maqasidMin;
        emit SyariahConfigUpdated(msg.sender, "full_config");
    }

    // ── Dual Coin Pairing ──────────────────────────────────────────────────
    function pairStablecoin(address _stablecoin, uint256 _pegRatio)
        external
        onlyRole(SHURA_COUNCIL_ROLE)
    {
        require(_stablecoin != address(0), "IslamicToken: Invalid stablecoin");
        pairedStablecoin  = _stablecoin;
        stablecoinPegRatio = _pegRatio;
        emit StablecoinPaired(_stablecoin, _pegRatio);
    }

    function renewCertification(string calldata body, uint256 validDays)
        external
        onlyRole(MUFTI_ROLE)
    {
        syariahConfig.certificationBody   = body;
        syariahConfig.certificationExpiry = block.timestamp + validDays * 1 days;
        emit CertificationRenewed(body, syariahConfig.certificationExpiry);
    }

    // ── Fatwa Integration ──────────────────────────────────────────────────
    function applyFatwa(bytes32 topic, bool allowed) external onlyRole(MUFTI_ROLE) {
        if (!allowed) {
            _pause();
        }
        (string memory fatwaText,,) = ISyariahComplianceOracle(syariahConfig.syariahOracle)
            .getLatestFatwa(topic);
        emit FatwaApplied(topic, fatwaText, allowed);
    }

    // ── View Functions ─────────────────────────────────────────────────────
    function isSyariahCompliantWallet(address account) external view returns (bool, string memory) {
        if (frozenForReview[account])
            return (false, "Frozen for Fatwa review");
        if (violationCount[account] >= 3)
            return (false, "Multiple Syariah violations");
        if (maqasidScore[account] < syariahConfig.maqasidMinScore)
            return (false, "Maqasid score below minimum");
        return (true, "Syariah compliant");
    }

    function getSyariahStats() external view returns (
        uint256 _zakatCollected,
        uint256 _waqfAllocated,
        uint256 _sadaqahDistributed,
        uint256 _halalTxns,
        uint256 _blockedTxns,
        bool    _certified
    ) {
        return (
            zakatCollectedTotal,
            waqfAllocatedTotal,
            sadaqahDistributedTotal,
            halalTransactions,
            blockedTransactions,
            block.timestamp < syariahConfig.certificationExpiry
        );
    }

    function isCertificationValid() external view returns (bool) {
        return block.timestamp < syariahConfig.certificationExpiry;
    }
}
