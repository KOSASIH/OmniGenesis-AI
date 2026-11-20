const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PhotonicComputeOracle", () => {
  let p, n1, n2;
  beforeEach(async () => {
    p = await (await ethers.getContractFactory("PhotonicComputeOracle")).deploy();
    await p.registerNode("D9-A", 847, 100, 4, 0);
    await p.registerNode("D9-B", 900, 200, 2, 1);
    n1 = await p.allNodeIds(0); n2 = await p.allNodeIds(1);
  });

  it("registers nodes with validated frequency and depth", async () => {
    expect(await p.nodeCount()).to.equal(2n);
    expect(await p.globalBandwidthTbps()).to.equal(300n);
    await expect(p.registerNode("x", 0, 1, 1, 0)).to.be.revertedWith("PCO: freq 1-10000 THz");
    await expect(p.registerNode("x", 1, 1, 17, 0)).to.be.revertedWith("PCO: depth 1-16");
  });

  it("entangles each node at most once", async () => {
    await p.linkEntanglement(n1, n2);
    expect((await p.getNode(n1)).entangledPairId).to.equal(n2);
    await expect(p.linkEntanglement(n1, n2)).to.be.revertedWith("PCO: already entangled");
  });

  it("records jobs; empty result hash is not attested", async () => {
    await p.submitJob(n1, "causal-solve", 1, 2, 50, 1000);
    expect((await p.getJob(await p.allJobIds(0))).verified).to.equal(true);
    await p.submitJob(n1, "causal-solve", 1, 0, 50, 1000);
    expect((await p.getJob(await p.allJobIds(1))).verified).to.equal(false);
    expect(await p.totalComputations()).to.equal(2n);
  });

  it("feeds can only be written by relays", async () => {
    const [, x] = await ethers.getSigners();
    await expect(p.connect(x).updateFeed("globalComputeTHz", 1, n1)).to.be.reverted;
    await p.updateFeed("globalComputeTHz", 1747, n1);
    expect((await p.getFeed("globalComputeTHz")).value).to.equal(1747n);
    expect(await p.computeCapacityTHz()).to.equal(1747n);
  });
});
