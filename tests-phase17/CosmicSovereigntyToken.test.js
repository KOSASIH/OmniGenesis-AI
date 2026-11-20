const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("CosmicSovereigntyToken", () => {
  let t, owner, a, b;
  beforeEach(async () => {
    [owner, a, b] = await ethers.getSigners();
    t = await (await ethers.getContractFactory("CosmicSovereigntyToken")).deploy();
    await t.transfer(a.address, ethers.parseEther("20000"));
  });

  it("mints 25% of the cap at deploy and enforces the hard cap", async () => {
    expect(await t.totalSupply()).to.equal(ethers.parseEther("4250000"));
    await expect(t.sovereigntyMint(a.address, ethers.parseEther("13000000"), "x")).to.be.revertedWith("CSOV: max supply");
  });

  it("only the oracle may mint", async () => {
    await expect(t.connect(a).sovereigntyMint(a.address, 1, "x")).to.be.reverted;
  });

  it("burns tokens when claiming a domain and rejects invalid input", async () => {
    const before = await t.totalSupply();
    await t.connect(a).claimDomain("Temporal", 5000, 9, true, false);
    expect(before - (await t.totalSupply())).to.equal(ethers.parseEther("50"));
    await expect(t.connect(a).claimDomain("x", 10001, 9, true, true)).to.be.revertedWith("CSOV: BPS > 100%");
    await expect(t.connect(a).claimDomain("x", 100, 17, true, true)).to.be.revertedWith("CSOV: dim 1-16");
  });

  it("intervention burns up front and the oracle resolves it exactly once", async () => {
    await t.connect(a).executeIntervention("Causal", "test");
    expect((await t.interventions(0)).resolved).to.equal(false);
    await expect(t.connect(a).resolveIntervention(0, true)).to.be.reverted;
    await t.resolveIntervention(0, true);
    expect((await t.interventions(0)).succeeded).to.equal(true);
    await expect(t.resolveIntervention(0, true)).to.be.revertedWith("CSOV: already resolved");
  });

  it("staking returns principal plus pro-rata yield after the lock (regression: funds were previously lost)", async () => {
    const amt = ethers.parseEther("10000");
    const bal0 = await t.balanceOf(a.address);
    await t.connect(a).stake(amt, 10, 365 * 24 * 3600);
    expect(await t.balanceOf(a.address)).to.equal(bal0 - amt);
    await expect(t.connect(a).unstake()).to.be.revertedWith("CSOV: locked");
    await time.increase(365 * 24 * 3600 + 1);
    await t.connect(a).unstake();
    // 10% APR over a full year on 10,000 = 1,000
    expect(await t.balanceOf(a.address)).to.equal(bal0 + ethers.parseEther("1000"));
    expect((await t.stakes(a.address)).amount).to.equal(0n);
  });

  it("cannot stake twice or with zero amount", async () => {
    await t.connect(a).stake(ethers.parseEther("1"), 1, 7 * 24 * 3600);
    await expect(t.connect(a).stake(1, 1, 7 * 24 * 3600)).to.be.revertedWith("CSOV: already staked");
    await expect(t.connect(b).stake(0, 1, 7 * 24 * 3600)).to.be.revertedWith("CSOV: zero amount");
  });
});
