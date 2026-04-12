import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying OmniGenesis contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // 1. Deploy OMNI Token
  console.log("\n--- Deploying OMNI Token ---");
  const OMNI = await ethers.getContractFactory("OMNI");
  const omni = await OMNI.deploy(deployer.address);
  await omni.waitForDeployment();
  const omniAddress = await omni.getAddress();
  console.log("OMNI deployed to:", omniAddress);

  // 2. Deploy OmniOracle
  console.log("\n--- Deploying OmniOracle ---");
  const OmniOracle = await ethers.getContractFactory("OmniOracle");
  const oracle = await OmniOracle.deploy(deployer.address);
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();
  console.log("OmniOracle deployed to:", oracleAddress);

  // 3. Deploy OGEN Stablecoin
  console.log("\n--- Deploying OGEN Stablecoin ---");
  const OGEN = await ethers.getContractFactory("OGEN");
  const ogen = await OGEN.deploy(deployer.address, oracleAddress);
  await ogen.waitForDeployment();
  const ogenAddress = await ogen.getAddress();
  console.log("OGEN deployed to:", ogenAddress);

  // 4. Deploy OmniStaking
  console.log("\n--- Deploying OmniStaking ---");
  const OmniStaking = await ethers.getContractFactory("OmniStaking");
  const staking = await OmniStaking.deploy(deployer.address);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("OmniStaking deployed to:", stakingAddress);

  // 5. Deploy PiNexusOmniBridge
  console.log("\n--- Deploying PiNexusOmniBridge ---");
  const Bridge = await ethers.getContractFactory("PiNexusOmniBridge");
  const bridge = await Bridge.deploy(deployer.address, 3); // 3 validator threshold
  await bridge.waitForDeployment();
  const bridgeAddress = await bridge.getAddress();
  console.log("PiNexusOmniBridge deployed to:", bridgeAddress);

  // Summary
  console.log("\n========================================");
  console.log("   OmniGenesis Deployment Summary");
  console.log("========================================");
  console.log(`OMNI Token:          ${omniAddress}`);
  console.log(`OGEN Stablecoin:     ${ogenAddress}`);
  console.log(`OmniOracle:          ${oracleAddress}`);
  console.log(`OmniStaking:         ${stakingAddress}`);
  console.log(`PiNexusOmniBridge:   ${bridgeAddress}`);
  console.log("========================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
