// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MerkleAirdrop is Ownable, ReentrancyGuard {
    IERC20 public immutable token;
    bytes32 public immutable merkleRoot;
    
    // Bitmap untuk efisiensi gas - 1 storage slot untuk 256 claims
    mapping(uint256 => uint256) private claimedBitMap;
    
    uint256 public totalClaimed;
    uint256 public startTime;
    uint256 public endTime;
    
    event Claimed(uint256 indexed index, address indexed account, uint256 amount);
    event AirdropEnded(uint256 totalClaimed);
    
    constructor(
        address _token, 
        bytes32 _merkleRoot,
        uint256 _durationDays
    ) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token");
        require(_merkleRoot != bytes32(0), "Invalid merkle root");
        
        token = IERC20(_token);
        merkleRoot = _merkleRoot;
        startTime = block.timestamp;
        endTime = block.timestamp + (_durationDays * 1 days);
    }
    
    function isClaimed(uint256 index) public view returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }
    
    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }
    
    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external nonReentrant {
        require(block.timestamp >= startTime, "Airdrop not started");
        require(block.timestamp <= endTime, "Airdrop ended");
        require(!isClaimed(index), "Already claimed");
        require(msg.sender == account, "Not your claim");
        
        // Verify merkle proof
        bytes32 node = keccak256(bytes.concat(keccak256(abi.encode(index, account, amount))));
        require(MerkleProof.verify(merkleProof, merkleRoot, node), "Invalid proof");
        
        // Mark as claimed
        _setClaimed(index);
        totalClaimed += amount;
        
        // Transfer tokens
        require(token.transfer(account, amount), "Transfer failed");
        
        emit Claimed(index, account, amount);
    }
    
    // Batch check untuk frontend
    function isClaimedBatch(uint256[] calldata indices) external view returns (bool[] memory) {
        bool[] memory results = new bool[](indices.length);
        for (uint256 i = 0; i < indices.length; i++) {
            results[i] = isClaimed(indices[i]);
        }
        return results;
    }
    
    // Emergency withdraw setelah airdrop berakhir
    function withdraw() external onlyOwner {
        require(block.timestamp > endTime, "Airdrop still active");
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "Withdraw failed");
        emit AirdropEnded(totalClaimed);
    }
}
