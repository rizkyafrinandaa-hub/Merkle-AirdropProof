const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
const fs = require("fs");
const path = require("path");

async function verifyProof(testAddress) {
    console.log("🔍 Verifying Proof...\n");
    
    // Load tree
    const treePath = path.join(__dirname, "../data/merkle-tree.json");
    const tree = StandardMerkleTree.load(JSON.parse(fs.readFileSync(treePath, "utf8")));
    
    console.log("Merkle Root:", tree.root);
    console.log("Testing Address:", testAddress, "\n");
    
    // Find proof for address
    let found = false;
    for (const [i, v] of tree.entries()) {
        if (v[1].toLowerCase() === testAddress.toLowerCase()) {
            found = true;
            const proof = tree.getProof(i);
            const verified = tree.verify(i, proof);
            
            console.log("✅ Address Found!");
            console.log("Index:", v[0]);
            console.log("Address:", v[1]);
            console.log("Amount:", v[2], "wei");
            console.log("Proof:", proof);
            console.log("Verified:", verified);
            break;
        }
    }
    
    if (!found) {
        console.log("❌ Address not in whitelist");
    }
}

// Test dengan address dari whitelist
const testAddress = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
verifyProof(testAddress);
