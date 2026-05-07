// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ZakatAutomation
 * @notice Fully automated Zakat collection, management, and distribution for OmniGenesis Islamic chains
 * @dev Implements the five pillars of Zakat distribution (asnaf):
 *  1. Al-Fuqara (The Poor)         2. Al-Masakin (The Needy)
 *  3. Al-Amilin (Zakat collectors) 4. Al-Muallaf (New Muslims)
 *  5. Ar-Riqab (Freeing captives)  6. Al-Gharimin (Debtors)
 *  7. Fi Sabilillah (In God's cause) 8. Ibnus Sabil (Travelers in need)
 */
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZakatAutomation is AccessControl, ReentrancyGuard {
    bytes32 public constant SHURA_COUNCIL_ROLE = keccak256("SHURA_COUNCIL_ROLE");
    bytes32 public constant AMIL_ROLE          = keccak256("AMIL_ROLE");

    enum Asnaf { FUQARA, MASAKIN, AMILIN, MUALLAF, RIQAB, GHARIMIN, FI_SABILILLAH, IBNUS_SABIL }

    struct ZakatPeriod {
        uint256 periodId;
        uint256 startTime;
        uint256 endTime;
        uint256 totalCollected;
        uint256 totalDistributed;
        bool    distributed;
        mapping(Asnaf => uint256) asnafAllocation;
        mapping(Asnaf => uint256) asnafDistributed;
    }

    struct Beneficiary {
        address wallet;
        Asnaf   category;
        uint256 shareWeight;
        bool    active;
        uint256 lifetimeReceived;
        uint256 lastReceived;
        string  verificationHash;    // Off-chain KYC hash
    }

    struct NisabConfig {
        uint256 goldNisabGrams;        // 85 grams of gold
        uint256 silverNisabGrams;      // 595 grams of silver
        uint256 nisabInTokenUnits;     // Calculated nisab in token units
        address goldOracleAddr;
        bool    useGoldNisab;          // Gold nisab preferred by most scholars
    }

    // Distribution weights (total = 10000)
    uint256[8] public asnafWeights = [2000, 2000, 125, 625, 625, 1625, 2500, 500];

    mapping(uint256 => ZakatPeriod) public zakatPeriods;
    uint256 public currentPeriodId;
    mapping(address => bool) public isRegisteredBeneficiary;
    Beneficiary[] public beneficiaries;
    NisabConfig public nisabConfig;

    mapping(address => uint256) public contributorZakatPaid;
    mapping(address => uint256) public lastZakatYear;
    uint256 public totalLifetimeCollected;
    uint256 public totalLifetimeDistributed;
    uint256 public totalBeneficiariesHelped;

    IERC20 public zakatToken;

    event ZakatReceived(address indexed payer, uint256 amount, uint256 periodId);
    event ZakatDistributed(uint256 periodId, Asnaf indexed category, uint256 amount, uint256 beneficiaryCount);
    event BeneficiaryRegistered(address indexed wallet, Asnaf category, uint256 shareWeight);
    event NisabUpdated(uint256 newNisabInTokenUnits);
    event NewPeriodStarted(uint256 periodId, uint256 startTime);

    constructor(address _admin, address _zakatToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(SHURA_COUNCIL_ROLE, _admin);
        zakatToken = IERC20(_zakatToken);
        nisabConfig = NisabConfig({ goldNisabGrams: 85, silverNisabGrams: 595,
            nisabInTokenUnits: 1_000 * 1e18, goldOracleAddr: address(0), useGoldNisab: true });
        _startNewPeriod();
    }

    function _startNewPeriod() internal {
        currentPeriodId++;
        ZakatPeriod storage p = zakatPeriods[currentPeriodId];
        p.periodId  = currentPeriodId;
        p.startTime = block.timestamp;
        p.endTime   = block.timestamp + 354 days;  // Hijri year
        emit NewPeriodStarted(currentPeriodId, block.timestamp);
    }

    function receiveZakat(address token, uint256 amount) external nonReentrant {
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        zakatPeriods[currentPeriodId].totalCollected += amount;
        contributorZakatPaid[msg.sender] += amount;
        totalLifetimeCollected += amount;
        emit ZakatReceived(msg.sender, amount, currentPeriodId);
    }

    function distributeZakat() external onlyRole(AMIL_ROLE) nonReentrant {
        ZakatPeriod storage period = zakatPeriods[currentPeriodId];
        require(!period.distributed, "ZakatDAO: Already distributed");
        require(period.totalCollected > 0, "ZakatDAO: Nothing to distribute");
        uint256 total = period.totalCollected;
        for (uint8 i = 0; i < 8; i++) {
            uint256 allocation = (total * asnafWeights[i]) / 10000;
            period.asnafAllocation[Asnaf(i)] = allocation;
        }
        // Distribute to registered beneficiaries per category
        for (uint i = 0; i < beneficiaries.length; i++) {
            Beneficiary storage b = beneficiaries[i];
            if (!b.active) continue;
            uint256 categoryPool = period.asnafAllocation[b.category];
            uint256 share = (categoryPool * b.shareWeight) / 10000;
            if (share > 0) {
                zakatToken.transfer(b.wallet, share);
                b.lifetimeReceived += share;
                b.lastReceived = block.timestamp;
                period.asnafDistributed[b.category] += share;
                period.totalDistributed += share;
                totalLifetimeDistributed += share;
                totalBeneficiariesHelped++;
            }
        }
        period.distributed = true;
        _startNewPeriod();
        emit ZakatDistributed(currentPeriodId - 1, Asnaf.FUQARA, total, beneficiaries.length);
    }

    function registerBeneficiary(address wallet, Asnaf category, uint256 shareWeight, string calldata verificationHash)
        external onlyRole(AMIL_ROLE)
    {
        require(!isRegisteredBeneficiary[wallet], "ZakatDAO: Already registered");
        beneficiaries.push(Beneficiary({
            wallet: wallet, category: category, shareWeight: shareWeight,
            active: true, lifetimeReceived: 0, lastReceived: 0, verificationHash: verificationHash
        }));
        isRegisteredBeneficiary[wallet] = true;
        emit BeneficiaryRegistered(wallet, category, shareWeight);
    }

    function isAboveNisab(address account) external view returns (bool) {
        return zakatToken.balanceOf(account) >= nisabConfig.nisabInTokenUnits;
    }
}
