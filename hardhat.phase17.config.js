// Standalone config for the Phase 17 contract tests (the repo's main config is hardhat.config.ts).
// Setup:  npm install --no-save hardhat@2 @nomicfoundation/hardhat-toolbox@4 @openzeppelin/contracts@4.9.6
// Run:    npx hardhat --config hardhat.phase17.config.js test
require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "paris" } },
  paths: { sources: "./contracts/phase17", tests: "./tests-phase17", cache: "./cache-phase17", artifacts: "./artifacts-phase17" },
};
