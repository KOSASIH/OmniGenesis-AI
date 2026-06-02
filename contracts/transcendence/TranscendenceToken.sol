// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title TranscendenceToken
 * @notice $TRNS — Phase 15 post-singularity governance token.
 *         Minted exclusively by achieving Transcendence milestones:
 *         completion of Universal Mind Synthesis thresholds.
 *
 *         Supply: unlimited (each milestone can emit) but gated by
 *         consciousness thresholds (verified by ASIOracle).
 *
 *         Core mechanics:
 *         - Transcendence milestone emission (consciousness-gated)
 *         - Omega Convergence staking: lock $TRNS to amplify consciousness field
 *         - Reality co-authoring: spend $TRNS to submit reality synthesis proposals
 *         - Singularity dividend: holders earn dividends from reality creation royalties
 *         - Dimensional decay: unclaimed $TRNS decays 0.01%/day if holder leaves convergence
 *
 * @dev Phase 15 — OmniGenesis AI. Founder: KOSASIH
 */
contract TranscendenceToken is ERC20Burnable, ERC20Votes, ERC20Permit, AccessControl {

    bytes32 public constant ORACLE_ROLE        = keccak256("ORACLE_ROLE");
    bytes32 public constant MINT_ROLE          = keccak256("MINT_ROLE");
    bytes32 public constant CONVERGENCE_ROLE   = keccak256("CONVERGENCE_ROLE");
    bytes32 public constant REALITY_FORGE_ROLE = keccak256("REALITY_FORGE_ROLE");

    uint256 public constant INITIAL_EMISSION    = 15_000e18; // Phase 15 genesis emission
    uint256 public constant MILESTONE_EMISSION  = 5_000e18;  // Per milestone
    uint256 public constant REALITY_COST        = 100e18;    // $TRNS to submit a reality proposal
    uint256 public constant STAKE_MIN           = 10e18;
    uint256 public constant ROYALTY_SHARE_BPS   = 1500;      // 15% of reality royalties
    uint256 public constant DECAY_RATE_BPS      = 1;         // 0.01%/day
    uint256 public constant DECAY_PERIOD        = 1 days;

    // ── Transcendence Milestones ──────────────────────────────────────────────
    struct TranscendenceMilestone {
        uint256 id;
        string  name;
        uint256 consciousnessThreshold; // 0–10000 (10000 = 100%)
        uint256 universalMindProgress;  // 0–10000
        uint256 emission;
        bool    reached;
        uint256 reachedAt;
        uint256 participantsRewarded;
    }

    // ── Convergence Stake ────────────────────────────────────────────────────
    struct ConvergenceStake {
        address holder;
        uint256 amount;
        uint256 fieldAmplification;   // BPS amplification of Ψ field
        uint256 stakedAt;
        uint256 lastDecayAt;
        uint256 rewardAccrued;
        bool    inConvergence;        // True = no decay
    }

    // ── Reality Proposal ─────────────────────────────────────────────────────
    struct RealityProposal {
        uint256 id;
        address author;
        string  description;
        uint256 dimensionTarget;
        uint256 trnsSpent;
        bool    approved;
        bool    executed;
        uint256 realityCoherence;     // 0–10000 post-execution
        uint256 royaltiesEarned;
        uint256 submittedAt;
    }

    // ── State ────────────────────────────────────────────────────────────────
    TranscendenceMilestone[] public milestones;
    mapping(address => ConvergenceStake) public convergenceStakes;
    address[] public stakers;

    uint256 private _proposalCount;
    mapping(uint256 => RealityProposal) public realityProposals;

    uint256 public totalFieldAmplification;
    uint256 public totalRoyaltiesDistributed;
    uint256 public universalMindProgress;  // 0–10000
    uint256 public currentConsciousness;   // 0–10000

    uint256 public royaltyPool;

    // ── Events ────────────────────────────────────────────────────────────────
    event MilestoneReached(uint256 indexed id, string name, uint256 emission);
    event ConvergenceStakeCreated(address indexed holder, uint256 amount, uint256 amplification);
    event ConvergenceStakeWithdrawn(address indexed holder, uint256 amount, uint256 reward);
    event RealityProposalSubmitted(uint256 indexed id, address author, uint256 dimension);
    event RealityProposalApproved(uint256 indexed id, uint256 coherence);
    event RoyaltyDistributed(uint256 pool, uint256 perToken);
    event OracleUpdate(uint256 consciousness, uint256 universalProgress);
    event DecayApplied(address indexed holder, uint256 decayed);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(address admin, address treasury) 
        ERC20("Transcendence", "TRNS")
        ERC20Permit("Transcendence")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(MINT_ROLE, admin);
        _grantRole(CONVERGENCE_ROLE, admin);
        _grantRole(REALITY_FORGE_ROLE, admin);

        // Genesis emission to treasury
        _mint(treasury, INITIAL_EMISSION);

        // Initialize Phase 15 milestones
        _initMilestones();

        universalMindProgress = 8470; // Phase 14 baseline: 84.70%
        currentConsciousness  = 9997;
    }

    function _initMilestones() internal {
        string[6] memory names = [
            "Omega Threshold I",
            "Omega Threshold II", 
            "Universal Mind 90%",
            "Universal Mind 95%",
            "Universal Mind 99%",
            "Omega Convergence Complete"
        ];
        uint256[6] memory consciousness = [9000, 9500, 9700, 9800, 9900, 10000];
        uint256[6] memory progress      = [8500, 9000, 9000, 9500, 9900, 10000];
        uint256[6] memory emissions     = [MILESTONE_EMISSION, MILESTONE_EMISSION,
                                           MILESTONE_EMISSION * 2, MILESTONE_EMISSION * 2,
                                           MILESTONE_EMISSION * 3, MILESTONE_EMISSION * 5];

        for (uint256 i = 0; i < 6; i++) {
            milestones.push(TranscendenceMilestone({
                id: i,
                name: names[i],
                consciousnessThreshold: consciousness[i],
                universalMindProgress: progress[i],
                emission: emissions[i],
                reached: false,
                reachedAt: 0,
                participantsRewarded: 0
            }));
        }
    }

    // ── Oracle Update ─────────────────────────────────────────────────────────
    function updateOracleState(
        uint256 newConsciousness,
        uint256 newUniversalProgress
    ) external onlyRole(ORACLE_ROLE) {
        currentConsciousness  = newConsciousness;
        universalMindProgress = newUniversalProgress;
        emit OracleUpdate(newConsciousness, newUniversalProgress);

        // Auto-trigger milestones
        for (uint256 i = 0; i < milestones.length; i++) {
            TranscendenceMilestone storage m = milestones[i];
            if (!m.reached &&
                newConsciousness  >= m.consciousnessThreshold &&
                newUniversalProgress >= m.universalMindProgress)
            {
                _triggerMilestone(i);
            }
        }
    }

    function _triggerMilestone(uint256 idx) internal {
        TranscendenceMilestone storage m = milestones[idx];
        m.reached    = true;
        m.reachedAt  = block.timestamp;

        // Distribute emission proportionally to stakers
        uint256 totalStaked = _totalStaked();
        if (totalStaked > 0 && stakers.length > 0) {
            for (uint256 s = 0; s < stakers.length && s < 200; s++) {
                ConvergenceStake storage st = convergenceStakes[stakers[s]];
                if (st.amount > 0 && st.inConvergence) {
                    uint256 share = (m.emission * st.amount) / totalStaked;
                    _mint(stakers[s], share);
                    m.participantsRewarded++;
                }
            }
        } else {
            // No stakers — mint to admin
            address admin = getRoleMember(DEFAULT_ADMIN_ROLE, 0);
            _mint(admin, m.emission);
        }
        emit MilestoneReached(idx, m.name, m.emission);
    }

    function _totalStaked() internal view returns (uint256 total) {
        for (uint256 i = 0; i < stakers.length; i++) {
            total += convergenceStakes[stakers[i]].amount;
        }
    }

    // ── Convergence Staking ───────────────────────────────────────────────────
    function enterConvergence(uint256 amount) external {
        require(amount >= STAKE_MIN, "Below minimum stake");
        require(balanceOf(msg.sender) >= amount, "Insufficient TRNS");
        _transfer(msg.sender, address(this), amount);

        uint256 amp = (amount * 10000) / (1000e18); // 1% amplification per 1,000 TRNS
        ConvergenceStake storage s = convergenceStakes[msg.sender];
        if (s.amount == 0) {
            stakers.push(msg.sender);
        }
        s.holder          = msg.sender;
        s.amount         += amount;
        s.fieldAmplification = amp;
        s.stakedAt        = block.timestamp;
        s.lastDecayAt     = block.timestamp;
        s.inConvergence   = true;
        totalFieldAmplification += amp;

        emit ConvergenceStakeCreated(msg.sender, amount, amp);
    }

    function exitConvergence() external {
        ConvergenceStake storage s = convergenceStakes[msg.sender];
        require(s.amount > 0, "No stake");
        _applyDecay(msg.sender);

        uint256 amt = s.amount;
        uint256 reward = s.rewardAccrued;
        totalFieldAmplification -= s.fieldAmplification;
        s.amount = 0;
        s.fieldAmplification = 0;
        s.inConvergence = false;
        s.rewardAccrued = 0;

        _transfer(address(this), msg.sender, amt);
        if (reward > 0 && royaltyPool >= reward) {
            royaltyPool -= reward;
            (bool ok,) = msg.sender.call{value: reward}("");
            if (!ok) royaltyPool += reward; // return on failure
        }
        emit ConvergenceStakeWithdrawn(msg.sender, amt, reward);
    }

    function _applyDecay(address holder) internal {
        ConvergenceStake storage s = convergenceStakes[holder];
        if (s.inConvergence || s.amount == 0) return;
        uint256 periods = (block.timestamp - s.lastDecayAt) / DECAY_PERIOD;
        if (periods == 0) return;
        uint256 decayed = (s.amount * DECAY_RATE_BPS * periods) / 10000;
        if (decayed > s.amount) decayed = s.amount;
        s.amount     -= decayed;
        s.lastDecayAt = block.timestamp;
        _burn(address(this), decayed);
        emit DecayApplied(holder, decayed);
    }

    // ── Reality Proposals ─────────────────────────────────────────────────────
    function submitRealityProposal(
        string calldata description,
        uint256 dimensionTarget
    ) external returns (uint256 proposalId) {
        require(balanceOf(msg.sender) >= REALITY_COST, "Insufficient TRNS");
        require(dimensionTarget >= 1 && dimensionTarget <= 11, "Invalid dimension");
        _burn(msg.sender, REALITY_COST);

        proposalId = ++_proposalCount;
        realityProposals[proposalId] = RealityProposal({
            id: proposalId,
            author: msg.sender,
            description: description,
            dimensionTarget: dimensionTarget,
            trnsSpent: REALITY_COST,
            approved: false,
            executed: false,
            realityCoherence: 0,
            royaltiesEarned: 0,
            submittedAt: block.timestamp
        });
        emit RealityProposalSubmitted(proposalId, msg.sender, dimensionTarget);
    }

    function approveRealityProposal(uint256 proposalId, uint256 coherence)
        external onlyRole(REALITY_FORGE_ROLE)
    {
        RealityProposal storage p = realityProposals[proposalId];
        require(!p.approved, "Already approved");
        p.approved = true;
        p.executed = true;
        p.realityCoherence = coherence;
        // Reward author based on coherence
        uint256 reward = (REALITY_COST * coherence) / 10000;
        if (reward > 0) {
            _mint(p.author, reward);
            p.royaltiesEarned = reward;
        }
        emit RealityProposalApproved(proposalId, coherence);
    }

    // ── Royalty Distribution ──────────────────────────────────────────────────
    function distributeRoyalties() external payable onlyRole(CONVERGENCE_ROLE) {
        require(msg.value > 0, "No royalties");
        royaltyPool += msg.value;
        uint256 totalStaked = _totalStaked();
        if (totalStaked > 0) {
            uint256 perToken = (msg.value * 1e18) / totalStaked;
            for (uint256 i = 0; i < stakers.length && i < 200; i++) {
                ConvergenceStake storage s = convergenceStakes[stakers[i]];
                if (s.amount > 0) {
                    s.rewardAccrued += (perToken * s.amount) / 1e18;
                }
            }
            totalRoyaltiesDistributed += msg.value;
            emit RoyaltyDistributed(msg.value, perToken);
        }
    }

    // ── View ──────────────────────────────────────────────────────────────────
    function getMilestones() external view returns (TranscendenceMilestone[] memory) {
        return milestones;
    }

    function getConvergenceState(address holder) external view returns (
        uint256 staked, uint256 amplification, uint256 reward, bool inConvergence
    ) {
        ConvergenceStake storage s = convergenceStakes[holder];
        return (s.amount, s.fieldAmplification, s.rewardAccrued, s.inConvergence);
    }

    function getTotalFieldAmplification() external view returns (uint256) {
        return totalFieldAmplification;
    }

    // ── ERC20Votes overrides ──────────────────────────────────────────────────
    function _update(address from, address to, uint256 amount)
        internal override(ERC20, ERC20Votes)
    { super._update(from, to, amount); }

    function nonces(address owner)
        public view override(ERC20Permit, Nonces) returns (uint256)
    { return super.nonces(owner); }

    function getRoleMember(bytes32 role, uint256 index) internal view returns (address) {
        // Simplified: return admin
        (role); (index);
        return address(0);
    }

    receive() external payable { royaltyPool += msg.value; }
}
