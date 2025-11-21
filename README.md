Copy proofs.json to the frontend public folder
cp data/proofs.json frontend/public/
cd frontend
npm install
npm start


Setup: Initialize the Hardhat project and install all required dependencies.
Contracts: Create MyToken.sol and MerkleAirdrop.sol.
Data: Prepare the whitelist in CSV format.
Generate: Run the script to generate the Merkle tree and proofs.
Deploy: Deploy the contracts to the target network.
Verify: Test the proof verification off-chain.
Test: Run comprehensive test cases.
Frontend: Set up the React app for the claim interface.
Integrate: Connect the frontend with the smart contract.
Launch: Deploy and monitor the airdrop.
