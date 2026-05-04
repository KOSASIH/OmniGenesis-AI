import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying OmniGenesis AI v2 with:", deployer.address);

  const results: Record<string, string> = {};

  const deploy = async (name: string, ...args: any[]) => {
    console.log(`\nDeploying ${name}...`);
    const F = await ethers.getContractFactory(name);
    const c = await F.deploy(...args);
    await c.waitForDeployment();
    const addr = await c.getAddress();
    results[name] = addr;
    console.log(`  ${name}: ${addr}`);
    return c;
  };

  // Core tokens
  const omni = await deploy("OMNI", deployer.address);
  const oracle = await deploy("OmniOracle", deployer.address);
  const ogen = await deploy("OGEN", deployer.address, results.OmniOracle);

  // Governance
  const Timelock = await ethers.getContractFactory("TimelockController");
  const timelock = await Timelock.deploy(2 * 24 * 3600, [deployer.address], [deployer.address], deployer.address);
  await timelock.waitForDeployment();
  results.Timelock = await timelock.getAddress();
  await deploy("OmniGovernor", results.OMNI, results.Timelock);

  // DeFi
  await deploy("OmniStaking", deployer.address);
  await deploy("OmniYieldOptimizer", deployer.address);

  // Bridge & Fabric
  await deploy("PiNexusOmniBridge", deployer.address, 3);
  const hcf = await deploy("HyperChainFabric", deployer.address, deployer.address, 3);
  await (hcf as any).registerChain(1, "Ethereum", ethers.ZeroAddress, 12, ethers.parseEther("0.001"));
  await (hcf as any).registerChain(56, "BSC", ethers.ZeroAddress, 5, ethers.parseEther("0.0001"));
  await (hcf as any).registerChain(137, "Polygon", ethers.ZeroAddress, 3, ethers.parseEther("0.00001"));
  await (hcf as any).registerChain(42161, "Arbitrum", ethers.ZeroAddress, 5, ethers.parseEther("0.00005"));
  await (hcf as any).registerChain(8453, "Base", ethers.ZeroAddress, 3, ethers.parseEther("0.00001"));

  // Vesting & Airdrop
  await deploy("TokenVesting", deployer.address);
  await deploy("PioneerAirdrop", deployer.address);

  // NFT & Registry
  await deploy("OmniNFT", deployer.address);
  await deploy("AgentRegistry", deployer.address, results.OMNI, ethers.parseEther("1000"));

  // AetherNova Forge
  await deploy("AetherNovaForge", deployer.address, results.OMNI, 3, ethers.parseEther("100000"));

  // Save
  const network = await ethers.provider.getNetwork();
  const path = `deployments/${network.name}_${network.chainId}.json`;
  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(path, JSON.stringify({ ...results, network: network.name, chainId: Number(network.chainId), deployer: deployer.address, timestamp: new Date().toISOString() }, null, 2));

  console.log("\n✅ Full OmniGenesis AI v2 deployment complete!");
  console.log("📄 Deployment saved to:", path);
  console.log(`\n${Object.keys(results).length} contracts deployed`);
}

main().catch((e) => { console.error(e); process.exit(1); });
