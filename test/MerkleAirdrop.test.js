const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

describe("MerkleAirdrop", function () {
    let token, airdrop;
    let owner, addr1, addr2, addr3;
    let tree, merkleRoot;
    
    beforeEach(async function () {
        [owner, addr1, addr2, addr3] = await ethers.getSigners();
        
        // Deploy token
        const MyToken = await ethers.getContractFactory("MyToken");
        token = await MyToken.deploy();
        await token.waitForDeployment();
        
        // Generate merkle tree
        const values = [
            [0, addr1.address, ethers.parseEther("10")],
            [1, addr2.address, ethers.parseEther("20")],
            [2, addr3.address, ethers.parseEther("30")]
        ];
        
        tree = StandardMerkleTree.of(values, ["uint256", "address", "uint256"]);
        merkleRoot = tree.root;
        
        // Deploy airdrop (30 days)
        const MerkleAirdrop = await ethers.getContractFactory("MerkleAirdrop");
        airdrop = await MerkleAirdrop.deploy(await token.getAddress(), merkleRoot, 30);
        await airdrop.waitForDeployment();
        
        // Transfer tokens
        const totalAmount = ethers.parseEther("60");
        await token.transfer(await airdrop.getAddress(), totalAmount);
    });
    
    describe("Deployment", function () {
        it("Should set correct token and merkle root", async function () {
            expect(await airdrop.token()).to.equal(await token.getAddress());
            expect(await airdrop.merkleRoot()).to.equal(merkleRoot);
        });
        
        it("Should have correct token balance", async function () {
            const balance = await token.balanceOf(await airdrop.getAddress());
            expect(balance).to.equal(ethers.parseEther("60"));
        });
    });
    
    describe("Claiming", function () {
        it("Should claim successfully with valid proof", async function () {
            const proof = tree.getProof(0);
            const amount = ethers.parseEther("10");
            
            await expect(airdrop.connect(addr1).claim(0, addr1.address, amount, proof))
                .to.emit(airdrop, "Claimed")
                .withArgs(0, addr1.address, amount);
            
            expect(await token.balanceOf(addr1.address)).to.equal(amount);
            expect(await airdrop.isClaimed(0)).to.be.true;
        });
        
        it("Should fail to claim twice", async function () {
            const proof = tree.getProof(0);
            const amount = ethers.parseEther("10");
            
            await airdrop.connect(addr1).claim(0, addr1.address, amount, proof);
            
            await expect(
                airdrop.connect(addr1).claim(0, addr1.address, amount, proof)
            ).to.be.revertedWith("Already claimed");
        });
        
        it("Should fail with invalid proof", async function () {
            const wrongProof = tree.getProof(1);
            const amount = ethers.parseEther("10");
            
            await expect(
                airdrop.connect(addr1).claim(0, addr1.address, amount, wrongProof)
            ).to.be.revertedWith("Invalid proof");
        });
        
        it("Should fail if wrong person tries to claim", async function () {
            const proof = tree.getProof(0);
            const amount = ethers.parseEther("10");
            
            await expect(
                airdrop.connect(addr2).claim(0, addr1.address, amount, proof)
            ).to.be.revertedWith("Not your claim");
        });
        
        it("Should check claimed status correctly", async function () {
            expect(await airdrop.isClaimed(0)).to.be.false;
            
            const proof = tree.getProof(0);
            await airdrop.connect(addr1).claim(0, addr1.address, ethers.parseEther("10"), proof);
            
            expect(await airdrop.isClaimed(0)).to.be.true;
        });
        
        it("Should batch check claimed status", async function () {
            const proof0 = tree.getProof(0);
            await airdrop.connect(addr1).claim(0, addr1.address, ethers.parseEther("10"), proof0);
            
            const results = await airdrop.isClaimedBatch([0, 1, 2]);
            expect(results[0]).to.be.true;
            expect(results[1]).to.be.false;
            expect(results[2]).to.be.false;
        });
    });
    
    describe("Withdrawal", function () {
        it("Should fail to withdraw before end time", async function () {
            await expect(airdrop.withdraw()).to.be.revertedWith("Airdrop still active");
        });
        
        it("Should withdraw successfully after end time", async function () {
            // Fast forward time 31 days
            await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
            await ethers.provider.send("evm_mine");
            
            const balanceBefore = await token.balanceOf(owner.address);
            await airdrop.withdraw();
            const balanceAfter = await token.balanceOf(owner.address);
            
            expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("60"));
        });
    });
});
