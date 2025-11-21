import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '../utils/config';
import { AIRDROP_ABI, TOKEN_ABI } from '../utils/contractABI';

function ClaimButton({ provider, signer, account }) {
    const [claimData, setClaimData] = useState(null);
    const [isClaimed, setIsClaimed] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [tokenBalance, setTokenBalance] = useState('0');
    
    useEffect(() => {
        if (account) {
            loadClaimData();
            checkClaimStatus();
            loadTokenBalance();
        }
    }, [account]);
    
    const loadClaimData = async () => {
        try {
            const response = await fetch('/proofs.json');
            const proofs = await response.json();
            const data = proofs.find(p => p.address.toLowerCase() === account.toLowerCase());
            setClaimData(data);
        } catch (error) {
            console.error('Failed to load claim data:', error);
        }
    };
    
    const checkClaimStatus = async () => {
        if (!claimData) return;
        
        try {
            const airdrop = new ethers.Contract(CONTRACT_ADDRESSES.airdrop, AIRDROP_ABI, provider);
            const claimed = await airdrop.isClaimed(claimData.index);
            setIsClaimed(claimed);
        } catch (error) {
            console.error('Failed to check claim status:', error);
        }
    };
    
    const loadTokenBalance = async () => {
        try {
            const token = new ethers.Contract(CONTRACT_ADDRESSES.token, TOKEN_ABI, provider);
            const balance = await token.balanceOf(account);
            setTokenBalance(ethers.formatEther(balance));
        } catch (error) {
            console.error('Failed to load balance:', error);
        }
    };
    
    const handleClaim = async () => {
        if (!claimData) {
            alert('Address not eligible for airdrop');
            return;
        }
        
        setIsClaiming(true);
        try {
            const airdrop = new ethers.Contract(CONTRACT_ADDRESSES.airdrop, AIRDROP_ABI, signer);
            
            const tx = await airdrop.claim(
                claimData.index,
                claimData.address,
                claimData.amount,
                claimData.proof
            );
            
            console.log('Transaction sent:', tx.hash);
            await tx.wait();
            
            alert('Airdrop claimed successfully!');
            setIsClaimed(true);
            loadTokenBalance();
        } catch (error) {
            console.error('Claim failed:', error);
            alert('Claim failed: ' + error.message);
        }
        setIsClaiming(false);
    };
    
    if (!claimData) {
        return <div className="not-eligible">❌ Address not eligible for airdrop</div>;
    }
    
    return (
        <div className="claim-section">
            <div className="claim-info">
                <h3>Your Airdrop</h3>
                <p>Amount: {ethers.formatEther(claimData.amount)} ADROP</p>
                <p>Your Balance: {tokenBalance} ADROP</p>
                <p>Status: {isClaimed ? '✅ Claimed' : '⏳ Pending'}</p>
            </div>
            
            {!isClaimed && (
                <button 
                    onClick={handleClaim} 
                    disabled={isClaiming}
                    className="claim-button"
                >
                    {isClaiming ? 'Claiming...' : 'Claim Airdrop'}
                </button>
            )}
        </div>
    );
}

export default ClaimButton;
