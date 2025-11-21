export const AIRDROP_ABI = [
    "function claim(uint256 index, address account, uint256 amount, bytes32[] calldata merkleProof) external",
    "function isClaimed(uint256 index) external view returns (bool)",
    "function merkleRoot() external view returns (bytes32)",
    "function totalClaimed() external view returns (uint256)",
    "event Claimed(uint256 indexed index, address indexed account, uint256 amount)"
];

export const TOKEN_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function symbol() external view returns (string)",
    "function decimals() external view returns (uint8)"
];
