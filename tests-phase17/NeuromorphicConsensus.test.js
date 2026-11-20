const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("NeuromorphicConsensus", () => {
  let c, s, colId;
  beforeEach(async () => {
    s = await ethers.getSigners();
    c = await (await ethers.getContractFactory("NeuromorphicConsensus")).deploy();
    for (let i = 1; i <= 4; i++) await c.registerNeuron(s[i].address, "Cortex", 2500, false);
    await c.registerNeuron(s[6].address, "Cortex", 2500, false);
    const tx = await c.createColumn("col", [s[1], s[2], s[3], s[4]].map(x => x.address));
    const rc = await tx.wait();
    colId = await c.allColumnIds(0);
  });

  it("registers neurons once", async () => {
    await expect(c.registerNeuron(s[1].address, "Cortex", 1, false)).to.be.revertedWith("NC: already registered");
    expect(await c.neuronCount()).to.equal(5n);
  });

  it("does not reach consensus below 75% of column weight", async () => {
    await c.connect(s[1]).fire(colId);
    await c.connect(s[2]).fire(colId);
    expect(await c.totalConsensusFirings()).to.equal(0n);
  });

  it("reaches consensus when >=75% of weight fires inside the window (regression: was unreachable)", async () => {
    await c.connect(s[1]).fire(colId);
    await c.connect(s[2]).fire(colId);
    await c.connect(s[3]).fire(colId);
    expect(await c.totalConsensusFirings()).to.equal(1n);
    expect((await c.getColumn(colId)).consensusRound).to.equal(1n);
  });

  it("does not count firings outside the window", async () => {
    await c.connect(s[1]).fire(colId);
    await mine(10);
    await c.connect(s[2]).fire(colId);
    await c.connect(s[3]).fire(colId);
    expect(await c.totalConsensusFirings()).to.equal(0n);
  });

  it("rejects neurons that are not column members and enforces refractory period", async () => {
    await expect(c.connect(s[6]).fire(colId)).to.be.revertedWith("NC: not in column");
    await c.connect(s[1]).fire(colId);
    await expect(c.connect(s[1]).fire(colId)).to.be.revertedWith("NC: refractory");
  });

  it("strengthens Hebbian bonds between co-firing neurons", async () => {
    await c.connect(s[1]).fire(colId);
    await c.connect(s[2]).fire(colId);
    const [a, b] = s[1].address.toLowerCase() < s[2].address.toLowerCase() ? [s[1], s[2]] : [s[2], s[1]];
    const bondId = ethers.solidityPackedKeccak256(["address", "address"], [a.address, b.address]);
    const bond = await c.synapticBonds(bondId);
    expect(bond.coFires).to.equal(1n);
    expect(bond.strengthBPS).to.equal(50n);
  });

  it("pruned neurons cannot fire", async () => {
    await c.pruneNeuron(s[1].address, "slow");
    await expect(c.connect(s[1]).fire(colId)).to.be.revertedWith("NC: pruned");
  });
});
