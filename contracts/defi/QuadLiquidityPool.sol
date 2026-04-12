// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title QuadLiquidityPool
 * @notice 4-Token AMM for OMNI/OGEN/PNX/PiNEX quad farming
 */
contract QuadLiquidityPool is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");

    uint256 public constant NUM_TOKENS = 4;
    uint256 public constant PRECISION = 1e18;
    uint256 public constant FEE_DENOMINATOR = 10000;

    IERC20[4] public tokens;
    uint256[4] public weights;
    uint256[4] public reserves;
    uint256 public swapFee;
    uint256 public totalLPShares;
    mapping(address => uint256) public lpShares;

    event LiquidityAdded(address indexed provider, uint256 shares);
    event LiquidityRemoved(address indexed provider, uint256 shares);
    event Swap(address indexed user, uint256 tokenIn, uint256 tokenOut, uint256 amountIn, uint256 amountOut);

    constructor(address[4] memory _tokens, uint256[4] memory _weights, uint256 _swapFee, address admin) {
        uint256 wsum;
        for (uint256 i = 0; i < 4; i++) {
            tokens[i] = IERC20(_tokens[i]);
            weights[i] = _weights[i];
            wsum += _weights[i];
        }
        require(wsum == PRECISION);
        swapFee = _swapFee;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(FEE_MANAGER_ROLE, admin);
    }

    function addLiquidity(uint256[4] calldata amounts) external nonReentrant whenNotPaused returns (uint256 shares) {
        if (totalLPShares == 0) {
            for (uint256 i = 0; i < 4; i++) {
                require(amounts[i] > 0);
                tokens[i].safeTransferFrom(msg.sender, address(this), amounts[i]);
                reserves[i] += amounts[i];
            }
            shares = _sqrt(amounts[0] * amounts[1]);
        } else {
            uint256 ratio = (amounts[0] * PRECISION) / reserves[0];
            for (uint256 i = 0; i < 4; i++) {
                tokens[i].safeTransferFrom(msg.sender, address(this), amounts[i]);
                reserves[i] += amounts[i];
            }
            shares = (totalLPShares * ratio) / PRECISION;
        }
        require(shares > 0);
        totalLPShares += shares;
        lpShares[msg.sender] += shares;
        emit LiquidityAdded(msg.sender, shares);
    }

    function removeLiquidity(uint256 shares) external nonReentrant returns (uint256[4] memory amounts) {
        require(shares > 0 && shares <= lpShares[msg.sender]);
        for (uint256 i = 0; i < 4; i++) {
            amounts[i] = (reserves[i] * shares) / totalLPShares;
            reserves[i] -= amounts[i];
            tokens[i].safeTransfer(msg.sender, amounts[i]);
        }
        totalLPShares -= shares;
        lpShares[msg.sender] -= shares;
        emit LiquidityRemoved(msg.sender, shares);
    }

    function swap(uint256 tIn, uint256 tOut, uint256 amountIn, uint256 minOut) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        require(tIn < 4 && tOut < 4 && tIn != tOut && amountIn > 0);
        uint256 fee = (amountIn * swapFee) / FEE_DENOMINATOR;
        uint256 netIn = amountIn - fee;
        amountOut = (reserves[tOut] * netIn) / (reserves[tIn] + netIn);
        require(amountOut >= minOut && amountOut < reserves[tOut]);
        tokens[tIn].safeTransferFrom(msg.sender, address(this), amountIn);
        tokens[tOut].safeTransfer(msg.sender, amountOut);
        reserves[tIn] += amountIn;
        reserves[tOut] -= amountOut;
        emit Swap(msg.sender, tIn, tOut, amountIn, amountOut);
    }

    function getAmountOut(uint256 tIn, uint256 tOut, uint256 amountIn) external view returns (uint256) {
        uint256 netIn = amountIn - (amountIn * swapFee) / FEE_DENOMINATOR;
        return (reserves[tOut] * netIn) / (reserves[tIn] + netIn);
    }

    function updateSwapFee(uint256 newFee) external onlyRole(FEE_MANAGER_ROLE) {
        require(newFee >= 10 && newFee <= 100);
        swapFee = newFee;
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) { y = z; z = (x / z + z) / 2; }
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
