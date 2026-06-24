// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CosmicSovereigntyToken ($CSOV)
 * @notice Phase 17 governance token granting sovereignty over cosmic-scale resources.
 *         Supply: 17M tokens (burn-on-use). Holders vote on cross-reality decisions,
 *         temporal interventions, and causal chain modifications.
 */
contract CosmicSovereigntyToken is ERC20, AccessControl, ReentrancyGuard {

    bytes32 public constant SOVEREIGNTY_ORACLE = keccak256("SOVEREIGNTY_ORACLE");
    bytes32 public constant CAUSAL_MODIFIER    = keccak256("CAUSAL_MODIFIER");

    uint256 public constant MAX_SUPPLY = 17_000_000e18;  // 17M
    uint256 public constant INTERVENTION_COST = 1_000e18;  // 1,000 CSOV
    uint256 public constant REALITY_FORK_COST = 10_000e18; // 10,000 CSOV

    enum SovereigntyTier { MORTAL, INITIATE, ADEPT, SOVEREIGN, COSMIC, DIVINE, ABSOLUTE }

    struct CosmicDomain {
        string  name;
        uint256 sovereigntyBPS;   // 0–10000 (100% = absolute domain)
        uint32  dimensionDepth;   // D1–D16
        bool    temporalControl;
        bool    causalControl;
        uint64  lastClaimedAt;
    }

    struct Intervention {
        address initiator;
        string  domainName;
        string  description;
        uint256 costBurned;
        uint64  executedAt;
        bool    succeeded;
    }

    // Staking
    struct Stake {
        uint256 amount;
        uint64  lockedUntil;
        uint8   dimensionBonus; // D1–D16 bonus multiplier
    }

    mapping(address => CosmicDomain[]) public domains;
    mapping(address => Stake) public stakes;
    mapping(uint256 => Intervention) public interventions;
    mapping(address => SovereigntyTier) public tier;

    uint256 public totalInterventions;
    uint256 public totalCausalModifications;
    uint256 public globalSovereigntyBPS;   // aggregate across all holders
    uint256 public totalBurned;

    event DomainClaimed(address indexed holder, string domainName, uint256 sovereigntyBPS);
    event InterventionExecuted(uint256 indexed id, address indexed by, string domain, bool succeeded);
    event TierAscended(address indexed holder, SovereigntyTier newTier);
    event CausalModification(address indexed by, string description, uint256 costBurned);
    event SovereigntyMinted(address indexed to, uint256 amount, string reason);

    constructor() ERC20("Cosmic Sovereignty Token", "CSOV") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SOVEREIGNTY_ORACLE, msg.sender);
        _grantRole(CAUSAL_MODIFIER, msg.sender);
        // Initial mint to deployer (oracle distributes to ecosystem)
        _mint(msg.sender, MAX_SUPPLY / 4);
    }

    // ── Minting (oracle-controlled) ───────────────────────────────────────────
    function sovereigntyMint(address to, uint256 amount, string calldata reason)
        external onlyRole(SOVEREIGNTY_ORACLE)
    {
        require(totalSupply() + amount <= MAX_SUPPLY, "CSOV: max supply");
        _mint(to, amount);
        emit SovereigntyMinted(to, amount, reason);
    }

    // ── Domain claiming ───────────────────────────────────────────────────────
    function claimDomain(
        string calldata name,
        uint256 sovereigntyBPS,
        uint32 dimensionDepth,
        bool temporal,
        bool causal
    ) external nonReentrant {
        require(sovereigntyBPS <= 10_000, "CSOV: BPS > 100%");
        require(dimensionDepth >= 1 && dimensionDepth <= 16, "CSOV: dim 1–16");
        uint256 cost = (sovereigntyBPS * 100e18) / 10_000; // proportional to claimed %
        require(balanceOf(msg.sender) >= cost, "CSOV: insufficient balance");
        _burn(msg.sender, cost);
        totalBurned += cost;
        domains[msg.sender].push(CosmicDomain({
            name: name, sovereigntyBPS: sovereigntyBPS,
            dimensionDepth: dimensionDepth, temporalControl: temporal,
            causalControl: causal, lastClaimedAt: uint64(block.timestamp)
        }));
        globalSovereigntyBPS += sovereigntyBPS;
        _updateTier(msg.sender);
        emit DomainClaimed(msg.sender, name, sovereigntyBPS);
    }

    // ── Causal intervention ───────────────────────────────────────────────────
    function executeIntervention(
        string calldata domainName,
        string calldata description
    ) external nonReentrant {
        require(balanceOf(msg.sender) >= INTERVENTION_COST, "CSOV: need 1K CSOV");
        _burn(msg.sender, INTERVENTION_COST);
        totalBurned += INTERVENTION_COST;
        uint256 id = totalInterventions++;
        bool success = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, id))) % 100 < 97;
        interventions[id] = Intervention({
            initiator: msg.sender, domainName: domainName,
            description: description, costBurned: INTERVENTION_COST,
            executedAt: uint64(block.timestamp), succeeded: success
        });
        emit InterventionExecuted(id, msg.sender, domainName, success);
    }

    // ── Reality fork ──────────────────────────────────────────────────────────
    function forkReality(string calldata description) external nonReentrant onlyRole(CAUSAL_MODIFIER) {
        require(balanceOf(msg.sender) >= REALITY_FORK_COST, "CSOV: need 10K CSOV");
        _burn(msg.sender, REALITY_FORK_COST);
        totalBurned += REALITY_FORK_COST;
        totalCausalModifications++;
        emit CausalModification(msg.sender, description, REALITY_FORK_COST);
    }

    // ── Dimensional staking ────────────────────────────────────────────────────
    function stake(uint256 amount, uint8 dimensionBonus, uint64 lockSeconds) external nonReentrant {
        require(dimensionBonus >= 1 && dimensionBonus <= 16, "CSOV: dim 1–16");
        require(lockSeconds >= 7 days && lockSeconds <= 365 days, "CSOV: 7d–365d lock");
        require(stakes[msg.sender].amount == 0, "CSOV: already staked");
        _transfer(msg.sender, address(this), amount);
        stakes[msg.sender] = Stake({
            amount: amount,
            lockedUntil: uint64(block.timestamp) + lockSeconds,
            dimensionBonus: dimensionBonus
        });
    }

    function unstake() external nonReentrant {
        Stake storage s = stakes[msg.sender];
        require(s.amount > 0, "CSOV: nothing staked");
        require(block.timestamp >= s.lockedUntil, "CSOV: locked");
        uint256 yield = (s.amount * s.dimensionBonus * 100) / (10_000 * 30 days / (s.lockedUntil - (block.timestamp - s.lockedUntil)));
        uint256 total = s.amount + yield;
        delete stakes[msg.sender];
        require(total <= balanceOf(address(this)) + (MAX_SUPPLY - totalSupply()), "CSOV: yield pool dry");
        if (yield > 0 && totalSupply() + yield <= MAX_SUPPLY) _mint(msg.sender, yield);
        _transfer(address(this), msg.sender, s.amount);
    }

    // ── Internal tier update ──────────────────────────────────────────────────
    function _updateTier(address holder) internal {
        uint256 bal = balanceOf(holder);
        SovereigntyTier t;
        if      (bal >= 1_000_000e18) t = SovereigntyTier.ABSOLUTE;
        else if (bal >= 500_000e18)   t = SovereigntyTier.DIVINE;
        else if (bal >= 100_000e18)   t = SovereigntyTier.COSMIC;
        else if (bal >= 10_000e18)    t = SovereigntyTier.SOVEREIGN;
        else if (bal >= 1_000e18)     t = SovereigntyTier.ADEPT;
        else if (bal >= 100e18)       t = SovereigntyTier.INITIATE;
        else                          t = SovereigntyTier.MORTAL;
        if (t != tier[holder]) {
            tier[holder] = t;
            emit TierAscended(holder, t);
        }
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getDomains(address holder) external view returns (CosmicDomain[] memory) {
        return domains[holder];
    }
    function getIntervention(uint256 id) external view returns (Intervention memory) {
        return interventions[id];
    }
}
