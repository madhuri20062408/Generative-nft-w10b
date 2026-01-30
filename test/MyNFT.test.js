const { ethers } = require("hardhat");
const { expect } = require("chai");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("MyNFT", function () {
    let MyNFT, myNFT, owner, addr1, addr2, addr3;
    let merkleTree, rootHash;

    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();

        const allowlist = [addr1.address, addr2.address];
        const leafNodes = allowlist.map(addr => keccak256(addr));
        merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
        rootHash = merkleTree.getHexRoot();

        MyNFT = await ethers.getContractFactory("MyNFT");
        myNFT = await MyNFT.deploy("My NFT", "MNFT", "ipfs://base/");
        await myNFT.waitForDeployment();

        await myNFT.setMerkleRoot(rootHash);
    });

    it("Should set the correct owner", async function () {
        expect(await myNFT.owner()).to.equal(owner.address);
    });

    describe("Allowlist Minting", function () {
        it("Should fail if sale state is Paused", async function () {
            const proof = merkleTree.getHexProof(keccak256(addr1.address));
            await expect(myNFT.connect(addr1).allowlistMint(proof, 1, { value: ethers.parseEther("0.05") }))
                .to.be.revertedWithCustomError(myNFT, "InactiveSale");
        });

        it("Should allow minting for whitelisted addresses in Allowlist state", async function () {
            await myNFT.setSaleState(1); // Allowlist
            const proof = merkleTree.getHexProof(keccak256(addr1.address));
            await myNFT.connect(addr1).allowlistMint(proof, 1, { value: ethers.parseEther("0.05") });
            expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
        });

        it("Should fail for non-whitelisted addresses", async function () {
            await myNFT.setSaleState(1); // Allowlist
            const proof = merkleTree.getHexProof(keccak256(addr3.address));
            await expect(myNFT.connect(addr3).allowlistMint(proof, 1, { value: ethers.parseEther("0.05") }))
                .to.be.revertedWithCustomError(myNFT, "NotOnAllowlist");
        });

        it("Should fail with invalid proof", async function () {
            await myNFT.setSaleState(1); // Allowlist
            const invalidProof = merkleTree.getHexProof(keccak256(addr2.address));
            await expect(myNFT.connect(addr1).allowlistMint(invalidProof, 1, { value: ethers.parseEther("0.05") }))
                .to.be.revertedWithCustomError(myNFT, "NotOnAllowlist");
        });
    });

    describe("Public Minting", function () {
        it("Should fail if sale state is Allowlist", async function () {
            await myNFT.setSaleState(1); // Allowlist
            await expect(myNFT.connect(addr3).publicMint(1, { value: ethers.parseEther("0.05") }))
                .to.be.revertedWithCustomError(myNFT, "InactiveSale");
        });

        it("Should allow anyone to mint in Public state", async function () {
            await myNFT.setSaleState(2); // Public
            await myNFT.connect(addr3).publicMint(1, { value: ethers.parseEther("0.05") });
            expect(await myNFT.balanceOf(addr3.address)).to.equal(1);
        });

        it("Should fail if insufficient funds provided", async function () {
            await myNFT.setSaleState(2); // Public
            await expect(myNFT.connect(addr3).publicMint(1, { value: ethers.parseEther("0.01") }))
                .to.be.revertedWithCustomError(myNFT, "InsufficientFunds");
        });
    });

    describe("Reveal Mechanism", function () {
        it("Should return unrevealed URI before reveal", async function () {
            await myNFT.setSaleState(2);
            await myNFT.connect(addr1).publicMint(1, { value: ethers.parseEther("0.05") });
            expect(await myNFT.tokenURI(1)).to.equal("ipfs://base/1.json");
        });

        it("Should return revealed URI after reveal", async function () {
            await myNFT.setSaleState(2);
            await myNFT.connect(addr1).publicMint(1, { value: ethers.parseEther("0.05") });
            await myNFT.setRevealedURI("ipfs://revealed/");
            await myNFT.reveal();
            expect(await myNFT.tokenURI(1)).to.equal("ipfs://revealed/1.json");
        });
    });

    describe("Withdrawal", function () {
        it("Should allow owner to withdraw funds", async function () {
            await myNFT.setSaleState(2);
            await myNFT.connect(addr1).publicMint(1, { value: ethers.parseEther("0.05") });

            const initialBalance = await ethers.provider.getBalance(owner.address);
            await myNFT.withdraw();
            const finalBalance = await ethers.provider.getBalance(owner.address);

            expect(finalBalance).to.be.greaterThan(initialBalance);
        });

        it("Should fail if non-owner tries to withdraw", async function () {
            await expect(myNFT.connect(addr1).withdraw())
                .to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
        });
    });
});
