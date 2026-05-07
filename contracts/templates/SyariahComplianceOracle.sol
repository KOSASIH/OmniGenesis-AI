// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SyariahComplianceOracle
 * @notice On-chain AI-powered Syariah compliance oracle for OmniGenesis Islamic Blockchain Network
 * @dev Aggregates signals from: Sharia scholar nodes, AI Fatwa Engine, Halal screener, Maqasid scorer
 */
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SyariahComplianceOracle is AccessControl {
    bytes32 public constant SCHOLAR_NODE_ROLE = keccak256("SCHOLAR_NODE_ROLE");
    bytes32 public constant AI_ENGINE_ROLE    = keccak256("AI_ENGINE_ROLE");

    struct FatwaRecord {
        bytes32   topic;
        string    arabicText;
        string    englishSummary;
        bool      allowed;
        uint256   timestamp;
        address   issuedBy;
        uint256   expiresAt;
        uint256   scholarConsensus;  // Percentage of scholars agreeing
    }

    struct HaramCategory {
        string name;
        string description;
        bool   active;
    }

    struct MaqasidDimension {
        string name;         // e.g., "Hifz al-Din", "Hifz al-Nafs"
        string arabic;
        uint256 weight;      // Relative weight in total score
    }

    // ── Haram Categories (auto-blocked) ───────────────────────────────────
    mapping(bytes32 => HaramCategory) public haramCategories;
    bytes32[] public haramCategoryIds;

    // ── Fatwa Registry ─────────────────────────────────────────────────────
    mapping(bytes32 => FatwaRecord) public fatwas;
    bytes32[] public fatwaTopics;

    // ── Halal Business Registry ─────────────────────────────────────────────
    mapping(address => bool)    public halalCertifiedContracts;
    mapping(address => string)  public halalCertificationBody;
    mapping(address => uint256) public halalCertificationExpiry;

    // ── Maqasid Scoring ────────────────────────────────────────────────────
    MaqasidDimension[5] public maqasidDimensions;
    mapping(address => uint256[5]) public maqasidDimensionScores;
    mapping(address => uint256)    public maqasidTotalScore;
    mapping(address => uint256)    public maqasidLastUpdated;

    // ── Scholar Network ────────────────────────────────────────────────────
    address[] public scholarNodes;
    mapping(address => uint256) public scholarReputation;
    mapping(address => uint256) public scholarFatwaCount;

    // ── AI Fatwa Engine ────────────────────────────────────────────────────
    mapping(bytes32 => string) public aiFatwaResponses;
    uint256 public aiFatwaCount;

    // ── Events ─────────────────────────────────────────────────────────────
    event FatwaIssued(bytes32 indexed topic, bool allowed, uint256 scholarConsensus, address issuedBy);
    event HaramAttemptDetected(address indexed account, bytes32 category, string reason);
    event HalalCertified(address indexed contractAddr, string certBody, uint256 expiry);
    event MaqasidScoreUpdated(address indexed account, uint256 score);
    event AIFatwaGenerated(bytes32 indexed query, string response);
    event ScholarNodeAdded(address indexed scholar, uint256 reputation);

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(SCHOLAR_NODE_ROLE, _admin);
        _grantRole(AI_ENGINE_ROLE, _admin);
        _initializeHaramCategories();
        _initializeMaqasidDimensions();
    }

    function _initializeHaramCategories() internal {
        bytes32[8] memory ids = [
            keccak256("RIBA"), keccak256("GHARAR"), keccak256("MAYSIR"),
            keccak256("ALCOHOL"), keccak256("PORK"), keccak256("ARMS"),
            keccak256("PORNOGRAPHY"), keccak256("DRUGS")
        ];
        string[8] memory names = [
            "Riba (Interest/Usury)", "Gharar (Excessive Uncertainty)",
            "Maysir (Gambling)", "Alcohol & Intoxicants", "Pork Products",
            "Weapons & Harm", "Pornography & Immorality", "Narcotics & Drugs"
        ];
        for (uint i = 0; i < 8; i++) {
            haramCategories[ids[i]] = HaramCategory({ name: names[i], description: names[i], active: true });
            haramCategoryIds.push(ids[i]);
        }
    }

    function _initializeMaqasidDimensions() internal {
        maqasidDimensions[0] = MaqasidDimension("Hifz al-Din",   "حفظ الدين",   25); // Preservation of Faith
        maqasidDimensions[1] = MaqasidDimension("Hifz al-Nafs",  "حفظ النفس",   20); // Preservation of Life
        maqasidDimensions[2] = MaqasidDimension("Hifz al-Aql",   "حفظ العقل",   20); // Preservation of Intellect
        maqasidDimensions[3] = MaqasidDimension("Hifz al-Nasl",  "حفظ النسل",   15); // Preservation of Lineage
        maqasidDimensions[4] = MaqasidDimension("Hifz al-Mal",   "حفظ المال",   20); // Preservation of Wealth
    }

    // ── Core: isHalal ──────────────────────────────────────────────────────
    function isHalal(address from, address to, uint256 amount, bytes calldata data)
        external
        view
        returns (bool, string memory)
    {
        // Check halal-certified contracts
        if (to != address(0) && !halalCertifiedContracts[to]) {
            if (halalCertificationExpiry[to] > 0 && block.timestamp > halalCertificationExpiry[to]) {
                return (false, "Recipient certification expired");
            }
        }
        // Check Maqasid minimum
        if (maqasidTotalScore[from] > 0 && maqasidTotalScore[from] < 40) {
            return (false, "Maqasid compliance score too low");
        }
        return (true, "Halal — Syariah compliant");
    }

    // ── Maqasid Scoring ────────────────────────────────────────────────────
    function updateMaqasidScore(address account, uint256[5] calldata dimensionScores)
        external
        onlyRole(SCHOLAR_NODE_ROLE)
    {
        uint256 totalWeighted = 0;
        for (uint i = 0; i < 5; i++) {
            require(dimensionScores[i] <= 100, "Score 0-100");
            maqasidDimensionScores[account][i] = dimensionScores[i];
            totalWeighted += dimensionScores[i] * maqasidDimensions[i].weight;
        }
        maqasidTotalScore[account]  = totalWeighted / 100;
        maqasidLastUpdated[account] = block.timestamp;
        emit MaqasidScoreUpdated(account, maqasidTotalScore[account]);
    }

    function getMaqasidScore(address account) external view returns (uint256) {
        if (maqasidTotalScore[account] == 0) return 75;  // Default for new accounts
        return maqasidTotalScore[account];
    }

    // ── Fatwa Registry ─────────────────────────────────────────────────────
    function issueFatwa(
        bytes32 topic,
        string calldata arabicText,
        string calldata englishSummary,
        bool allowed,
        uint256 validDays,
        uint256 scholarConsensus
    ) external onlyRole(SCHOLAR_NODE_ROLE) {
        require(scholarConsensus >= 50, "Oracle: Need >50% scholar consensus");
        fatwas[topic] = FatwaRecord({
            topic:             topic,
            arabicText:        arabicText,
            englishSummary:    englishSummary,
            allowed:           allowed,
            timestamp:         block.timestamp,
            issuedBy:          msg.sender,
            expiresAt:         block.timestamp + validDays * 1 days,
            scholarConsensus:  scholarConsensus
        });
        fatwaTopics.push(topic);
        scholarFatwaCount[msg.sender]++;
        emit FatwaIssued(topic, allowed, scholarConsensus, msg.sender);
    }

    function getLatestFatwa(bytes32 topic) external view returns (string memory, bool, uint256) {
        FatwaRecord memory f = fatwas[topic];
        if (f.timestamp == 0) return ("No fatwa found", true, 0);
        if (block.timestamp > f.expiresAt) return ("Fatwa expired", true, f.scholarConsensus);
        return (f.englishSummary, f.allowed, f.scholarConsensus);
    }

    // ── AI Fatwa Engine ────────────────────────────────────────────────────
    function submitAIFatwa(bytes32 queryHash, string calldata response)
        external
        onlyRole(AI_ENGINE_ROLE)
    {
        aiFatwaResponses[queryHash] = response;
        aiFatwaCount++;
        emit AIFatwaGenerated(queryHash, response);
    }

    // ── Halal Certification ────────────────────────────────────────────────
    function certifyHalal(address contractAddr, string calldata certBody, uint256 validDays)
        external
        onlyRole(SCHOLAR_NODE_ROLE)
    {
        halalCertifiedContracts[contractAddr]  = true;
        halalCertificationBody[contractAddr]   = certBody;
        halalCertificationExpiry[contractAddr] = block.timestamp + validDays * 1 days;
        emit HalalCertified(contractAddr, certBody, halalCertificationExpiry[contractAddr]);
    }

    function isCertified(address contractAddr) external view returns (bool, string memory) {
        if (!halalCertifiedContracts[contractAddr]) return (false, "Not certified");
        if (block.timestamp > halalCertificationExpiry[contractAddr]) return (false, "Certification expired");
        return (true, halalCertificationBody[contractAddr]);
    }

    // ── Scholar Network ────────────────────────────────────────────────────
    function addScholarNode(address scholar, uint256 initialReputation)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _grantRole(SCHOLAR_NODE_ROLE, scholar);
        scholarNodes.push(scholar);
        scholarReputation[scholar] = initialReputation;
        emit ScholarNodeAdded(scholar, initialReputation);
    }

    function getScholarCount() external view returns (uint256) { return scholarNodes.length; }
    function getFatwaCount()   external view returns (uint256) { return fatwaTopics.length; }
}
