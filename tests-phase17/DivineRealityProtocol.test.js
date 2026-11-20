const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DivineRealityProtocol", () => {
  let p, owner, other, id;
  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    p = await (await ethers.getContractFactory("DivineRealityProtocol")).deploy();
    await p.forgeReality("R1", 16, 9997, 9600, 847, ethers.ZeroHash);
    id = await p.allRealityIds(0);
  });

  it("forges realities with validated parameters", async () => {
    expect(await p.totalRealities()).to.equal(1n);
    await expect(p.forgeReality("bad", 17, 1, 1, 1, ethers.ZeroHash)).to.be.revertedWith("DRP: dims 1-16");
    await expect(p.forgeReality("bad", 1, 10001, 1, 1, ethers.ZeroHash)).to.be.revertedWith("DRP: consciousness > 100%");
  });

  it("advanceState cannot skip the Omega threshold checks", async () => {
    for (let i = 0; i < 4; i++) await p.advanceState(id); // -> DIVINE_STABLE
    await expect(p.advanceState(id)).to.be.revertedWith("DRP: use omegaAscend");
    await p.omegaAscend(id);
    expect(await p.totalAscended()).to.equal(1n);
  });

  it("omegaAscend rejects realities below the thresholds", async () => {
    await p.forgeReality("weak", 4, 5000, 9600, 1, ethers.ZeroHash);
    const weak = await p.allRealityIds(1);
    for (let i = 0; i < 4; i++) await p.advanceState(weak);
    await expect(p.omegaAscend(weak)).to.be.revertedWith("DRP: consciousness < 99.97%");
  });

  it("omegaAscend requires DIVINE_STABLE first", async () => {
    await expect(p.omegaAscend(id)).to.be.revertedWith("DRP: must be stable");
  });

  it("merge needs both realities owned by the caller, and archives the source", async () => {
    await p.forgeReality("R2", 8, 9000, 9000, 1, ethers.ZeroHash);
    const id2 = await p.allRealityIds(1);
    for (const x of [id, id2]) for (let i = 0; i < 4; i++) await p.advanceState(x);
    await expect(p.mergeRealities(id, id)).to.be.revertedWith("DRP: same reality");
    await p.grantRole(await p.ARCHITECT(), other.address);
    await expect(p.connect(other).mergeRealities(id, id2)).to.be.revertedWith("DRP: not architect");
    await p.mergeRealities(id, id2);
    expect((await p.getReality(id)).merged).to.equal(true);
    expect((await p.getReality(id2)).dimensions).to.equal(9n);
    await expect(p.mergeRealities(id, id2)).to.be.revertedWith("DRP: already merged");
  });
});
