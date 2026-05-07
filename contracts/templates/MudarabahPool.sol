// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MudarabahPool
 * @notice Syariah-compliant profit-sharing liquidity pool (NO interest)
 * @dev Mudarabah: Rabb al-Mal (capital provider) + Mudarib (entrepreneur)
 *      Profit split pre-agreed. Losses borne by capital provider only.
 *      Replaces conventional lending/AMM with Halal profit-sharing.
 */
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MudarabahPool is AccessControl, ReentrancyGuard {
    bytes32 public constant MUDARIB_ROLE = keccak256("MUDARIB_ROLE");

    struct MudarabahContract {
        uint256  contractId;
        address  rabbAlMal;        // Capital provider
        address  mudarib;          // Entrepreneur
        address  capitalToken;
        uint256  capitalAmount;
        uint256  profitShareRabbBPs;   // Capital provider share (e.g., 4000 = 40%)
        uint256  profitShareMudaribBPs;// Entrepreneur share (e.g., 6000 = 60%)
        uint256  openedAt;
        uint256  maturityDate;
        uint256  profitGenerated;
        uint256  lossIncurred;
        bool     settled;
        string   purpose;
        string   businessType;        // Must be Halal business
    }

    struct PoolStats {
        uint256 totalCapitalDeployed;
        uint256 totalProfitGenerated;
        uint256 totalLossIncurred;
        uint256 activeContracts;
        uint256 settledContracts;
        uint256 avgProfitRateBPs;
    }

    mapping(uint256 => MudarabahContract) public contracts;
    uint256 public contractCount;
    PoolStats public poolStats;
    address public syariahOracle;

    event ContractOpened(uint256 indexed contractId, address indexed rabbAlMal, address indexed mudarib, uint256 capital);
    event ProfitDistributed(uint256 indexed contractId, uint256 rabbShare, uint256 mudaribShare);
    event LossAbsorbed(uint256 indexed contractId, uint256 lossAmount, address indexed rabbAlMal);
    event ContractSettled(uint256 indexed contractId);

    constructor(address _admin, address _syariahOracle) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(MUDARIB_ROLE, _admin);
        syariahOracle = _syariahOracle;
    }

    function openContract(
        address mudarib, address capitalToken, uint256 capitalAmount,
        uint256 profitShareRabbBPs, uint256 maturityDays, string calldata purpose, string calldata businessType
    ) external nonReentrant returns (uint256 contractId) {
        require(profitShareRabbBPs <= 9000, "Mudarabah: Rabb share cannot exceed 90%");
        require(profitShareRabbBPs >= 1000, "Mudarabah: Rabb share must be at least 10%");
        IERC20(capitalToken).transferFrom(msg.sender, address(this), capitalAmount);
        contractId = ++contractCount;
        contracts[contractId] = MudarabahContract({
            contractId: contractId, rabbAlMal: msg.sender, mudarib: mudarib,
            capitalToken: capitalToken, capitalAmount: capitalAmount,
            profitShareRabbBPs: profitShareRabbBPs,
            profitShareMudaribBPs: 10000 - profitShareRabbBPs,
            openedAt: block.timestamp, maturityDate: block.timestamp + maturityDays * 1 days,
            profitGenerated: 0, lossIncurred: 0, settled: false,
            purpose: purpose, businessType: businessType
        });
        poolStats.totalCapitalDeployed += capitalAmount;
        poolStats.activeContracts++;
        emit ContractOpened(contractId, msg.sender, mudarib, capitalAmount);
    }

    function reportProfitAndSettle(uint256 contractId, uint256 profit) external onlyRole(MUDARIB_ROLE) nonReentrant {
        MudarabahContract storage c = contracts[contractId];
        require(!c.settled, "Mudarabah: Already settled");
        c.profitGenerated = profit;
        uint256 rabbProfit   = (profit * c.profitShareRabbBPs) / 10000;
        uint256 mudaribProfit = profit - rabbProfit;
        IERC20(c.capitalToken).transfer(c.rabbAlMal, c.capitalAmount + rabbProfit);
        IERC20(c.capitalToken).transfer(c.mudarib, mudaribProfit);
        c.settled = true;
        poolStats.totalProfitGenerated += profit;
        poolStats.activeContracts--;
        poolStats.settledContracts++;
        emit ProfitDistributed(contractId, rabbProfit, mudaribProfit);
        emit ContractSettled(contractId);
    }

    function reportLossAndSettle(uint256 contractId, uint256 lossAmount) external onlyRole(MUDARIB_ROLE) nonReentrant {
        MudarabahContract storage c = contracts[contractId];
        require(!c.settled, "Mudarabah: Already settled");
        uint256 actualLoss = lossAmount > c.capitalAmount ? c.capitalAmount : lossAmount;
        uint256 returned = c.capitalAmount - actualLoss;
        if (returned > 0) IERC20(c.capitalToken).transfer(c.rabbAlMal, returned);
        c.lossIncurred = actualLoss;
        c.settled = true;
        poolStats.totalLossIncurred += actualLoss;
        poolStats.activeContracts--;
        poolStats.settledContracts++;
        emit LossAbsorbed(contractId, actualLoss, c.rabbAlMal);
        emit ContractSettled(contractId);
    }
}
