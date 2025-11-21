import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function WalletConnect({ onConnect }) {
    const [account, setAccount] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    
    const connectWallet = async () => {
        if (typeof window.ethereum === 'undefined') {
            alert('Please install MetaMask!');
            return;
        }
        
        setIsConnecting(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            
            setAccount(accounts[0]);
            onConnect(provider, signer, accounts[0]);
        } catch (error) {
            console.error('Failed to connect:', error);
            alert('Failed to connect wallet');
        }
        setIsConnecting(false);
    };
    
    useEffect(() => {
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length === 0) {
                    setAccount(null);
                } else {
                    setAccount(accounts[0]);
                    window.location.reload();
                }
            });
        }
    }, []);
    
    return (
        <div className="wallet-connect">
            {!account ? (
                <button onClick={connectWallet} disabled={isConnecting}>
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
            ) : (
                <div className="connected">
                    <span>Connected: {account.slice(0, 6)}...{account.slice(-4)}</span>
                </div>
            )}
        </div>
    );
}

export default WalletConnect;
