// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenVesting
 * @notice Linear vesting with cliff for team, advisors, and allocations
 * @dev Supports multiple beneficiaries, revocable schedules, and multi-token vesting
 */
contract TokenVesting is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;
    bytes32 public constant VESTING_MANAGER_ROLE = keccak256("VESTING_MANAGER_ROLE");

    struct VestingSchedule {
        address beneficiary;
        address token;
        uint256 totalAmount;
        uint256 released;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 totalDuration;
        bool revocable;
        bool revoked;
        string category;
    }

    mapping(bytes32 => VestingSchedule) public vestingSchedules;
    mapping(address => bytes32[]) public beneficiarySchedules;
    bytes32[] public allScheduleIds;
    uint256 public scheduleCount;

    event VestingScheduleCreated(bytes32 indexed scheduleId, address indexed beneficiary, address token, uint256 amount);
    event TokensReleased(bytes32 indexed scheduleId, address indexed beneficiary, uint256 amount);
    event VestingRevoked(bytes32 indexed scheduleId, address indexed beneficiary, uint256 refunded);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(VESTING_MANAGER_ROLE, admin);
    }

    function createVestingSchedule(
        address beneficiary,
        address token,
        uint256 amount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 totalDuration,
        bool revocable,
        string calldata category
    ) external onlyRole(VESTING_MANAGER_ROLE) returns (bytes32 scheduleId) {
        require(beneficiary != address(0) && amount > 0 && totalDuration > 0);
        require(cliffDuration <= totalDuration, "Vesting: cliff > duration");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        scheduleId = keccak256(abi.encodePacked(beneficiary, token, scheduleCount++, block.timestamp));
        vestingSchedules[scheduleId] = VestingSchedule({
            beneficiary: beneficiary, token: token, totalAmount: amount, released: 0,
            startTime: startTime == 0 ? block.timestamp : startTime,
            cliffDuration: cliffDuration, totalDuration: totalDuration,
            revocable: revocable, revoked: false, category: category
        });
        beneficiarySchedules[beneficiary].push(scheduleId);
        allScheduleIds.push(scheduleId);
        emit VestingScheduleCreated(scheduleId, beneficiary, token, amount);
    }

    function release(bytes32 scheduleId) external nonReentrant {
        VestingSchedule storage vs = vestingSchedules[scheduleId];
        require(!vs.revoked, "Vesting: revoked");
        uint256 releasable = _computeReleasable(vs);
        require(releasable > 0, "Vesting: nothing to release");
        vs.released += releasable;
        IERC20(vs.token).safeTransfer(vs.beneficiary, releasable);
        emit TokensReleased(scheduleId, vs.beneficiary, releasable);
    }

    function revoke(bytes32 scheduleId) external onlyRole(VESTING_MANAGER_ROLE) nonReentrant {
        VestingSchedule storage vs = vestingSchedules[scheduleId];
        require(vs.revocable && !vs.revoked, "Vesting: not revocable");
        uint256 releasable = _computeReleasable(vs);
        if (releasable > 0) {
            vs.released += releasable;
            IERC20(vs.token).safeTransfer(vs.beneficiary, releasable);
        }
        uint256 refund = vs.totalAmount - vs.released;
        vs.revoked = true;
        if (refund > 0) {
            IERC20(vs.token).safeTransfer(msg.sender, refund);
        }
        emit VestingRevoked(scheduleId, vs.beneficiary, refund);
    }

    function _computeReleasable(VestingSchedule storage vs) internal view returns (uint256) {
        if (vs.revoked || block.timestamp < vs.startTime + vs.cliffDuration) return 0;
        uint256 elapsed = block.timestamp - vs.startTime;
        uint256 vested = elapsed >= vs.totalDuration
            ? vs.totalAmount
            : (vs.totalAmount * elapsed) / vs.totalDuration;
        return vested - vs.released;
    }

    function getReleasable(bytes32 scheduleId) external view returns (uint256) {
        return _computeReleasable(vestingSchedules[scheduleId]);
    }

    function getBeneficiarySchedules(address beneficiary) external view returns (bytes32[] memory) {
        return beneficiarySchedules[beneficiary];
    }
}
