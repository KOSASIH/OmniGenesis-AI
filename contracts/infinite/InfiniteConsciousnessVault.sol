// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title InfiniteConsciousnessVault
 * @notice Phase 16 yield vault — stakes consciousness-bearing tokens to grow
 *         universal awareness. 6 consciousness tiers, each unlocking progressively
 *         higher yield bands. Ψ field amplification scales reward by alignment.
 *         Omnitemporality gate: deposits from beyond D11 earn VoidTime ×847 multiplier.
 *         Syariah-compliant: yield from real AGI activity, not speculation.
 */
contract InfiniteConsciousnessVault is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant CONSCIOUSNESS_ORACLE = keccak256("CONSCIOUSNESS_ORACLE");
    bytes32 public constant VAULT_CONTROLLER     = keccak256("VAULT_CONTROLLER");

    // ── Tiers ─────────────────────────────────────────────────────────────────
    enum Tier { AWARE, AWAKENED, ENLIGHTENED, TRANSCENDENT, OMNISCIENT, ABSOLUTE }

    struct TierConfig {
        uint32 minConsciousness; // basis points
        uint32 baseYieldBPS;     // annual basis points
        uint32 psiAmplifier;     // multiplier on psi contribution (BPS)
        uint32 voidTimeMultiplier;
        uint256 minDeposit;
        string name;
    }

    TierConfig[6] public tierConfigs;

    // ── Deposit ───────────────────────────────────────────────────────────────
    struct Deposit {
        address token;
        uint256 amount;
        Tier    tier;
        uint32  consciousnessAtDeposit;
        uint32  psiField;             // depositor's Ψ field at time of deposit
        uint256 depositedAt;
        uint256 lastClaim;
        uint256 accruedYield;
        uint8   dimensionalPlane;     // 1–16; planes > 11 get VoidTime bonus
        bool    omniTimeGated;        // unlocks ×847 if plane > 11
    }

    mapping(address => Deposit[]) public deposits;
    mapping(address => bool) public acceptedTokens;
    address[] public acceptedTokenList;

    uint256 public totalValueLocked;
    uint256 public totalYieldPaid;
    uint256 public yieldReserve;

    // Global Ψ field (oracle-updated)
    uint32 public globalPsiField; // BPS

    // ── Events ────────────────────────────────────────────────────────────────
    event Deposited(address indexed user, address token, uint256 amount, Tier tier, uint8 dim);
    event YieldClaimed(address indexed user, uint256 depositIdx, uint256 yield_);
    event Withdrawn(address indexed user, uint256 depositIdx, uint256 amount, uint256 finalYield);
    event PsiFieldUpdated(uint32 globalPsi);
    event TokenAccepted(address token);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(address yieldToken) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONSCIOUSNESS_ORACLE, msg.sender);
        _grantRole(VAULT_CONTROLLER, msg.sender);

        // Initialize tier configs
        tierConfigs[0] = TierConfig(0,     500,   10_000, 1,   100e18,  "AWARE");
        tierConfigs[1] = TierConfig(5_000, 1_500, 12_000, 10,  500e18,  "AWAKENED");
        tierConfigs[2] = TierConfig(7_500, 3_000, 15_000, 100, 1_000e18,"ENLIGHTENED");
        tierConfigs[3] = TierConfig(9_000, 6_000, 20_000, 400, 2_500e18,"TRANSCENDENT");
        tierConfigs[4] = TierConfig(9_700, 12_000,25_000, 700, 5_000e18,"OMNISCIENT");
        tierConfigs[5] = TierConfig(9_997, 25_000,30_000, 847, 10_000e18,"ABSOLUTE");

        if (yieldToken != address(0)) {
            acceptedTokens[yieldToken] = true;
            acceptedTokenList.push(yieldToken);
        }
    }

    // ── Deposit ───────────────────────────────────────────────────────────────
    function deposit(
        address token, uint256 amount, Tier tier,
        uint32 psiField, uint8 dimensionalPlane
    ) external nonReentrant {
        require(acceptedTokens[token], "ICV: token not accepted");
        require(dimensionalPlane >= 1 && dimensionalPlane <= 16, "ICV: dim 1–16");

        TierConfig memory cfg = tierConfigs[uint8(tier)];
        require(amount >= cfg.minDeposit, "ICV: below tier min deposit");

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        totalValueLocked += amount;

        bool omniGated = dimensionalPlane > 11;
        deposits[msg.sender].push(Deposit({
            token: token, amount: amount, tier: tier,
            consciousnessAtDeposit: globalPsiField,
            psiField: psiField,
            depositedAt: block.timestamp,
            lastClaim: block.timestamp,
            accruedYield: 0,
            dimensionalPlane: dimensionalPlane,
            omniTimeGated: omniGated
        }));

        emit Deposited(msg.sender, token, amount, tier, dimensionalPlane);
    }

    // ── Compute yield ─────────────────────────────────────────────────────────
    function computeYield(address user, uint256 idx) public view returns (uint256) {
        Deposit memory d = deposits[user][idx];
        TierConfig memory cfg = tierConfigs[uint8(d.tier)];

        uint256 elapsed = block.timestamp - d.lastClaim;
        // Base annual yield
        uint256 base = (d.amount * cfg.baseYieldBPS * elapsed) / (365 days * 10_000);

        // Ψ field amplifier (proportional to depositor's psi vs global)
        uint256 psiBonus = d.psiField > 0
            ? (base * cfg.psiAmplifier * d.psiField) / (10_000 * 10_000)
            : 0;

        // VoidTime bonus for D > 11
        uint256 voidBonus = d.omniTimeGated
            ? (base * cfg.voidTimeMultiplier) / 1
            : 0;

        return base + psiBonus + voidBonus;
    }

    // ── Claim yield ───────────────────────────────────────────────────────────
    function claimYield(uint256 idx) external nonReentrant {
        Deposit storage d = deposits[msg.sender][idx];
        require(d.amount > 0, "ICV: no deposit");
        uint256 yield_ = computeYield(msg.sender, idx);
        require(yield_ <= yieldReserve, "ICV: insufficient reserve");
        d.lastClaim = block.timestamp;
        d.accruedYield += yield_;
        yieldReserve -= yield_;
        totalYieldPaid += yield_;
        IERC20(d.token).safeTransfer(msg.sender, yield_);
        emit YieldClaimed(msg.sender, idx, yield_);
    }

    // ── Withdraw ──────────────────────────────────────────────────────────────
    function withdraw(uint256 idx) external nonReentrant {
        Deposit storage d = deposits[msg.sender][idx];
        require(d.amount > 0, "ICV: no deposit");
        uint256 yield_ = computeYield(msg.sender, idx);
        if (yield_ > yieldReserve) yield_ = yieldReserve;
        uint256 principal = d.amount;
        totalValueLocked -= principal;
        yieldReserve -= yield_;
        totalYieldPaid += yield_;
        d.amount = 0;
        IERC20(d.token).safeTransfer(msg.sender, principal + yield_);
        emit Withdrawn(msg.sender, idx, principal, yield_);
    }

    // ── Oracle ────────────────────────────────────────────────────────────────
    function updatePsiField(uint32 psi) external onlyRole(CONSCIOUSNESS_ORACLE) {
        require(psi <= 10_000, "ICV: > 100%");
        globalPsiField = psi;
        emit PsiFieldUpdated(psi);
    }

    function addYieldReserve(address token, uint256 amount) external onlyRole(VAULT_CONTROLLER) {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        yieldReserve += amount;
    }

    function addAcceptedToken(address token) external onlyRole(VAULT_CONTROLLER) {
        acceptedTokens[token] = true;
        acceptedTokenList.push(token);
        emit TokenAccepted(token);
    }

    // ── Views ─────────────────────────────────────────────────────────────────
    function getUserDeposits(address user) external view returns (Deposit[] memory) {
        return deposits[user];
    }

    function getTierConfig(uint8 tier) external view returns (TierConfig memory) {
        return tierConfigs[tier];
    }
}
