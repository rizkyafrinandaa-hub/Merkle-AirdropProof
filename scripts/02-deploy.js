const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Contracts...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying from:", deployer.address);
    console.log("Balance:", await hre.ethers.provider.getBalance(deployer.address));
    
    // Load merkle tree
    const treePath = path.join(__dirname, "../data/merkle-tree.json");
    if (!fs.existsSync(treePath)) {
        throw new Error("Merkle tree not found! Run 01-generateMerkleTree.js first");
    }
    
    const treeData = JSON.parse(fs.readFileSync(treePath, "utf8"));
    const merkleRoot = treeData.root;
    console.log("\n📌 Merkle Root:", merkleRoot);
    
    // 1. Deploy Token
    console.log("\n1️⃣ Deploying MyToken...");
    const MyToken = await hre.ethers.getContractFactory("MyToken");
    const token = await MyToken.deploy();
    await token.waitForDeployment();
    const tokenAddress = await token.getAddress();
    console.log("✅ Token deployed to:", tokenAddress);
    
    // 2. Deploy Airdrop
    console.log("\n2️⃣ Deploying MerkleAirdrop...");
    const durationDays = 30; // 30 hari
    const MerkleAirdrop = await hre.ethers.getContractFactory("MerkleAirdrop");
    const airdrop = await MerkleAirdrop.deploy(tokenAddress, merkleRoot, durationDays);
    await airdrop.waitForDeployment();
    const airdropAddress = await airdrop.getAddress();
    console.log("✅ Airdrop deployed to:", airdropAddress);
    
    // 3. Calculate total amount needed
    const proofs = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/proofs.json")));
    const totalAmount = proofs.reduce((sum, p) => sum + BigInt(p.amount), 0n);
    
    console.log("\n3️⃣ Transferring tokens to airdrop contract...");
    console.log("Total amount:", totalAmount.toString(), "wei");
    
    const tx = await token.transfer(airdropAddress, totalAmount);
    await tx.wait();
    console.log("✅ Tokens transferred!");
    
    // 4. Verify balances
    const airdropBalance = await token.balanceOf(airdropAddress);
    console.log("\n📊 Airdrop contract balance:", airdropBalance.toString(), "wei");
    
    // Save deployment info
    const deploymentInfo = {
        network: hre.network.name,
        deployer: deployer.address,
        token: tokenAddress,
        airdrop: airdropAddress,
        merkleRoot: merkleRoot,
        totalAmount: totalAmount.toString(),
        durationDays: durationDays,
        deployedAt: new Date().toISOString()
    };
    
    const deployPath = path.join(__dirname, "../data/deployment.json");
    fs.writeFileSync(deployPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Deployment info saved to:", deployPath);
    
    console.log("\n✅ Deployment Complete!");
    console.log("\n📋 Summary:");
    console.log("Token Address:", tokenAddress);
    console.log("Airdrop Address:", airdropAddress);
    console.log("Merkle Root:", merkleRoot);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
