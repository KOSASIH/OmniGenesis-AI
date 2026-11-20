const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("OmegaPointDAO", () => {
  let tok, dao, o, a, b, c;
  beforeEach(async () => {
    [o, a, b, c] = await ethers.getSigners();
    tok = await (await ethers.getContractFactory("CosmicSovereigntyToken")).deploy();
    dao = await (await ethers.getContractFactory("OmegaPointDAO")).deploy(await tok.getAddress());
    await tok.transfer(a.address, ethers.parseEther("600000"));
    await tok.transfer(b.address, ethers.parseEther("300000"));
    await dao.propose(0, "Forge", "desc");
  });

  it("voting weight comes from token balance, not caller input", async () => {
    await expect(dao.connect(c).castVote(0, true)).to.be.revertedWith("DAO: no voting power");
    await dao.connect(a).castVote(0, true);
    expect((await dao.getProposal(0)).forVotes).to.equal(ethers.parseEther("600000"));
    await expect(dao.connect(a).castVote(0, true)).to.be.revertedWith("DAO: already voted");
  });

  it("consciousness amplifier is oracle-assigned only", async () => {
    await expect(dao.connect(a).setConsciousness(a.address, 10000)).to.be.reverted;
    await dao.setConsciousness(a.address, 5000);
    await dao.connect(a).castVote(0, true);
    expect((await dao.getProposal(0)).forVotes).to.equal(ethers.parseEther("900000"));
  });

  it("finalizes as SUCCEEDED only after the voting period (regression: could never finalize)", async () => {
    await dao.connect(a).castVote(0, true);
    await expect(dao.finalize(0)).to.be.revertedWith("DAO: voting open");
    await time.increase(7 * 24 * 3600 + 1);
    await dao.finalize(0);
    expect((await dao.getProposal(0)).state).to.equal(2n); // SUCCEEDED
    await dao.execute(0);
    expect((await dao.getProposal(0)).state).to.equal(4n); // EXECUTED
  });

  it("is DEFEATED below minimum participation or below 51% for", async () => {
    await dao.connect(b).castVote(0, false);
    await dao.connect(a).castVote(0, false);
    await time.increase(7 * 24 * 3600 + 1);
    await dao.finalize(0);
    expect((await dao.getProposal(0)).state).to.equal(3n);
    await dao.propose(0, "Tiny", "x");
    await time.increase(7 * 24 * 3600 + 1);
    await dao.finalize(1); // no votes
    expect((await dao.getProposal(1)).state).to.equal(3n);
  });

  it("Omega proposals need 99.97% approval, 50% participation and both sign-offs", async () => {
    await tok.transfer(a.address, ethers.parseEther("2000000")); // push turnout above 50% of supply
    await dao.propose(8, "Omega", "x"); // id 1
    await dao.connect(a).castVote(1, true);
    await dao.connect(b).castVote(1, true);
    await time.increase(14 * 24 * 3600 + 1);
    await dao.finalize(1);
    expect((await dao.getProposal(1)).state).to.equal(2n);
    await expect(dao.execute(1)).to.be.revertedWith("DAO: Syariah not approved");
    await dao.syariahApprove(1);
    await expect(dao.execute(1)).to.be.revertedWith("DAO: Safety not approved");
    await dao.safetyApprove(1);
    await dao.execute(1);
    expect((await dao.getProposal(1)).state).to.equal(4n);
  });

  it("safety council can veto before execution", async () => {
    await dao.veto(0, "unsafe");
    expect((await dao.getProposal(0)).state).to.equal(5n);
  });
});
