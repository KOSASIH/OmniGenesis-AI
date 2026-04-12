import { expect } from "chai";
import { ethers } from "hardhat";
import { OMNI } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("OMNI Token", function () {
  let omni: OMNI;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const OMNI = await ethers.getContractFactory("OMNI");
    omni = await OMNI.deploy(owner.address);
    await omni.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await omni.name()).to.equal("OmniGenesis Token");
      expect(await omni.symbol()).to.equal("OMNI");
    });

    it("Should set the correct max supply", async function () {
      const maxSupply = await omni.MAX_SUPPLY();
      expect(maxSupply).to.equal(ethers.parseEther("1000000000000"));
    });

    it("Should mint initial liquidity to deployer", async function () {
      const balance = await omni.balanceOf(owner.address);
      const expectedInitial = ethers.parseEther("1000000000000") * 5n / 100n;
      expect(balance).to.equal(expectedInitial);
    });

    it("Should grant roles to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = await omni.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await omni.MINTER_ROLE();
      expect(await omni.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.be.true;
      expect(await omni.hasRole(MINTER_ROLE, owner.address)).to.be.true;
    });
  });

  describe("Minting", function () {
    it("Should mint tokens within allocation", async function () {
      const amount = ethers.parseEther("1000000");
      await omni.mintAllocation("liquidity", addr1.address, amount);
      expect(await omni.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should reject minting without MINTER_ROLE", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        omni.connect(addr1).mintAllocation("liquidity", addr1.address, amount)
      ).to.be.reverted;
    });

    it("Should reject minting beyond allocation", async function () {
      const tooMuch = ethers.parseEther("200000000000"); // More than liquidity allocation
      await expect(
        omni.mintAllocation("liquidity", addr1.address, tooMuch)
      ).to.be.revertedWith("OMNI: allocation exceeded");
    });
  });

  describe("Transfers", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("1000");
      await omni.transfer(addr1.address, amount);
      expect(await omni.balanceOf(addr1.address)).to.equal(amount);
    });
  });

  describe("Governance", function () {
    it("Should support vote delegation", async function () {
      await omni.delegate(owner.address);
      const votes = await omni.getVotes(owner.address);
      expect(votes).to.be.gt(0);
    });
  });

  describe("Pausable", function () {
    it("Should pause and unpause", async function () {
      await omni.pause();
      await expect(
        omni.mintAllocation("liquidity", addr1.address, ethers.parseEther("100"))
      ).to.be.reverted;
      await omni.unpause();
    });
  });
});
