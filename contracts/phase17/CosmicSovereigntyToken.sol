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
        uint256 sovereigntyBPS;   // 0-10000 (100% = absolute domain)
        uint32  dimensionDepth;   // D1-D16
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
        bool    resolved;
        bool    succeeded;
    }

    // Staking
    struct Stake {
        uint256 amount;
        uint64  lockedUntil;
        uint64  lockSeconds;
        uint8   dimensionBonus; // D1-D16: yield = amount * bonus% APR (pro rata)
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
    event InterventionRequested(uint256 indexed id, address indexed by, string domain);
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
        require(dimensionDepth >= 1 && dimensionDepth <= 16, "CSOV: dim 1-16");
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

    // -- Causal intervention: burn is immediate, outcome is attested by the oracle
    // (no on-chain pseudo-randomness: block data is manipulable by validators).
    function executeIntervention(
        string calldata domainName,
        string calldata description
    ) external nonReentrant returns (uint256 id) {
        require(balanceOf(msg.sender) >= INTERVENTION_COST, "CSOV: need 1K CSOV");
        _burn(msg.sender, INTERVENTION_COST);
        totalBurned += INTERVENTION_COST;
        id = totalInterventions++;
        interventions[id] = Intervention({
            initiator: msg.sender, domainName: domainName,
            description: description, costBurned: INTERVENTION_COST,
            executedAt: uint64(block.timestamp), resolved: false, succeeded: false
        });
        emit InterventionRequested(id, msg.sender, domainName);
    }

    function resolveIntervention(uint256 id, bool succeeded) external onlyRole(SOVEREIGNTY_ORACLE) {
        require(id < totalInterventions, "CSOV: unknown intervention");
        Intervention storage iv = interventions[id];
        require(!iv.resolved, "CSOV: already resolved");
        iv.resolved = true;
        iv.succeeded = succeeded;
        emit InterventionExecuted(id, iv.initiator, iv.domainName, succeeded);
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
        require(amount > 0, "CSOV: zero amount");
        require(dimensionBonus >= 1 && dimensionBonus <= 16, "CSOV: dim 1-16");
        require(lockSeconds >= 7 days && lockSeconds <= 365 days, "CSOV: 7d-365d lock");
        require(stakes[msg.sender].amount == 0, "CSOV: already staked");
        _transfer(msg.sender, address(this), amount);
        stakes[msg.sender] = Stake({
            amount: amount,
            lockedUntil: uint64(block.timestamp) + lockSeconds,
            lockSeconds: lockSeconds,
            dimensionBonus: dimensionBonus
        });
        _updateTier(msg.sender);
    }

    function pendingYield(address who) public view returns (uint256) {
        Stake memory s = stakes[who];
        if (s.amount == 0) return 0;
        // bonus% APR, pro rata over the lock period
        return (s.amount * s.dimensionBonus * s.lockSeconds) / (365 days * 100);
    }

    function unstake() external nonReentrant {
        Stake memory s = stakes[msg.sender];
        require(s.amount > 0, "CSOV: nothing staked");
        require(block.timestamp >= s.lockedUntil, "CSOV: locked");
        uint256 reward = pendingYield(msg.sender);
        delete stakes[msg.sender];
        // reward is minted only while the hard cap allows it
        if (reward > MAX_SUPPLY - totalSupply()) reward = MAX_SUPPLY - totalSupply();
        if (reward > 0) _mint(msg.sender, reward);
        _transfer(address(this), msg.sender, s.amount);
        _updateTier(msg.sender);
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
