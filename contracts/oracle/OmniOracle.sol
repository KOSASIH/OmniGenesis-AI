// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract OmniOracle is AccessControl {
    bytes32 public constant ORACLE_AGENT_ROLE = keccak256("ORACLE_AGENT_ROLE");

    uint256 public constant MAX_DEVIATION = 500;
    uint256 public constant STALENESS_THRESHOLD = 1 hours;
    uint256 public constant MIN_SUBMISSIONS = 3;

    struct PriceData {
        uint256 price;
        uint8 decimals;
        uint256 timestamp;
        uint256 roundId;
    }

    struct PriceRound {
        uint256[] submissions;
        address[] submitters;
        uint256 finalPrice;
        uint256 timestamp;
        bool finalized;
    }

    mapping(address => PriceData) public latestPrice;
    mapping(address => mapping(uint256 => PriceRound)) public priceRounds;
    mapping(address => uint256) public currentRound;
    mapping(address => uint8) public tokenDecimals;

    event PriceSubmitted(address indexed token, address indexed agent, uint256 price, uint256 roundId);
    event PriceFinalized(address indexed token, uint256 price, uint256 roundId);
    event TokenRegistered(address indexed token, uint8 decimals);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function registerToken(address token, uint8 _decimals) external onlyRole(DEFAULT_ADMIN_ROLE) {
        tokenDecimals[token] = _decimals;
        currentRound[token] = 1;
        emit TokenRegistered(token, _decimals);
    }

    function submitPrice(address token, uint256 price) external onlyRole(ORACLE_AGENT_ROLE) {
        require(tokenDecimals[token] > 0, "Oracle: token not registered");
        require(price > 0, "Oracle: zero price");

        uint256 roundId = currentRound[token];
        PriceRound storage round = priceRounds[token][roundId];
        require(!round.finalized, "Oracle: round finalized");

        for (uint256 i = 0; i < round.submitters.length; i++) {
            require(round.submitters[i] != msg.sender, "Oracle: already submitted");
        }

        round.submissions.push(price);
        round.submitters.push(msg.sender);

        emit PriceSubmitted(token, msg.sender, price, roundId);

        if (round.submissions.length >= MIN_SUBMISSIONS) {
            _finalizeRound(token, roundId);
        }
    }

    function getPrice(address token) external view returns (uint256 price, uint8 decimals) {
        PriceData storage data = latestPrice[token];
        require(data.timestamp > 0, "Oracle: no price");
        require(block.timestamp - data.timestamp <= STALENESS_THRESHOLD, "Oracle: stale price");
        return (data.price, data.decimals);
    }

    function _finalizeRound(address token, uint256 roundId) internal {
        PriceRound storage round = priceRounds[token][roundId];
        uint256[] memory sorted = _sortArray(round.submissions);
        uint256 median;
        uint256 len = sorted.length;

        if (len % 2 == 0) {
            median = (sorted[len / 2 - 1] + sorted[len / 2]) / 2;
        } else {
            median = sorted[len / 2];
        }

        uint256 sum = 0;
        uint256 count = 0;
        for (uint256 i = 0; i < sorted.length; i++) {
            uint256 deviation = sorted[i] > median
                ? ((sorted[i] - median) * 10000) / median
                : ((median - sorted[i]) * 10000) / median;
            if (deviation <= MAX_DEVIATION) {
                sum += sorted[i];
                count++;
            }
        }

        uint256 finalPrice = count > 0 ? sum / count : median;
        round.finalPrice = finalPrice;
        round.timestamp = block.timestamp;
        round.finalized = true;

        latestPrice[token] = PriceData({
            price: finalPrice,
            decimals: tokenDecimals[token],
            timestamp: block.timestamp,
            roundId: roundId
        });

        currentRound[token] = roundId + 1;
        emit PriceFinalized(token, finalPrice, roundId);
    }

    function _sortArray(uint256[] memory arr) internal pure returns (uint256[] memory) {
        uint256[] memory sorted = new uint256[](arr.length);
        for (uint256 i = 0; i < arr.length; i++) sorted[i] = arr[i];
        for (uint256 i = 0; i < sorted.length; i++) {
            for (uint256 j = i + 1; j < sorted.length; j++) {
                if (sorted[j] < sorted[i]) {
                    (sorted[i], sorted[j]) = (sorted[j], sorted[i]);
                }
            }
        }
        return sorted;
    }
}
