const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UniversalCausalDAG", () => {
  let g, ids;
  beforeEach(async () => {
    g = await (await ethers.getContractFactory("UniversalCausalDAG")).deploy();
    ids = [];
    for (const n of ["A", "B", "C", "D"]) {
      await g.addNode(n, 0, 9000, 5000, 0, 8);
      ids.push(await g.allNodeIds(ids.length));
    }
  });

  it("adds edges and tracks parents/children", async () => {
    await g.addEdge(ids[0], ids[1], 0, 8000, 0);
    const a = await g.getNode(ids[0]);
    const b = await g.getNode(ids[1]);
    expect(a.effects.length).to.equal(1);
    expect(b.causes.length).to.equal(1);
    expect(await g.edgeCount()).to.equal(1n);
  });

  it("rejects self-loops and cycles (regression: 'DAG' previously allowed cycles)", async () => {
    await expect(g.addEdge(ids[0], ids[0], 0, 1, 0)).to.be.revertedWith("UDAG: self-loop");
    await g.addEdge(ids[0], ids[1], 0, 1, 0);
    await g.addEdge(ids[1], ids[2], 0, 1, 0);
    await expect(g.addEdge(ids[2], ids[0], 0, 1, 0)).to.be.revertedWith("UDAG: would create cycle");
    await g.addEdge(ids[0], ids[2], 0, 1, 0); // diamond/shortcut is fine
  });

  it("flags Omega-converged nodes at >=99.97% resonance", async () => {
    await g.addNode("Omega", 5, 10000, 9997, 0, 1);
    expect(await g.omegaConvergedNodes()).to.equal(1n);
    expect(await g.omegaConvergenceRate()).to.equal(2000n); // 1 of 5
  });

  it("interventions and counterfactuals are role/validation gated", async () => {
    const [, x] = await ethers.getSigners();
    await expect(g.connect(x).intervene(ids[0], 5000, [])).to.be.reverted;
    await g.intervene(ids[0], 5000, []);
    expect(await g.interventionCount()).to.equal(1n);
    await g.queryCounterfactual(ids[0], ids[1], 5000);
    const q = await g.cfQueries(0);
    expect(q.counterfactualBPS).to.equal(4500n); // 5000 * 9000 / 10000
  });
});
