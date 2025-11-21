const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

async function generateMerkleTree() {
    console.log("🌳 Generating Merkle Tree...\n");
    
    const values = [];
    let index = 0;
    
    // Read CSV file
    const csvPath = path.join(__dirname, "../data/airdrop-whitelist.csv");
    
    return new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (row) => {
                values.push([index, row.address, row.amount]);
                console.log(`Added: ${row.address} => ${row.amount} wei`);
                index++;
            })
            .on('end', () => {
                // Generate merkle tree
                const tree = StandardMerkleTree.of(values, ["uint256", "address", "uint256"]);
                
                console.log("\n✅ Merkle Tree Generated!");
                console.log("📌 Merkle Root:", tree.root);
                console.log("📊 Total Addresses:", values.length);
                
                // Calculate total amount
                const totalAmount = values.reduce((sum, v) => sum + BigInt(v[2]), 0n);
                console.log("💰 Total Amount:", totalAmount.toString(), "wei");
                
                // Save tree
                const treePath = path.join(__dirname, "../data/merkle-tree.json");
                fs.writeFileSync(treePath, JSON.stringify(tree.dump(), null, 2));
                console.log("\n📄 Tree saved to:", treePath);
                
                // Generate proofs
                const proofs = [];
                for (const [i, v] of tree.entries()) {
                    const proof = tree.getProof(i);
                    proofs.push({
                        index: v[0],
                        address: v[1],
                        amount: v[2],
                        proof: proof
                    });
                }
                
                // Save proofs
                const proofsPath = path.join(__dirname, "../data/proofs.json");
                fs.writeFileSync(proofsPath, JSON.stringify(proofs, null, 2));
                console.log("📄 Proofs saved to:", proofsPath);
                
                // Display tree structure
                console.log("\n🌲 Tree Structure:");
                console.log(tree.render());
                
                resolve(tree);
            })
            .on('error', reject);
    });
}

generateMerkleTree()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
