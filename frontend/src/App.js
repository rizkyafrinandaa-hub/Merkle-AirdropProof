import React, { useState } from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import ClaimButton from './components/ClaimButton';

function App() {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [account, setAccount] = useState(null);
    
    const handleConnect = (provider, signer, account) => {
        setProvider(provider);
        setSigner(signer);
        setAccount(account);
    };
    
    return (
        <div className="App">
            <header className="App-header">
                <h1>🎁 Merkle Airdrop</h1>
                <WalletConnect onConnect={handleConnect} />
            </header>
            
            <main className="App-main">
                {account ? (
                    <ClaimButton 
                        provider={provider} 
                        signer={signer} 
                        account={account} 
                    />
                ) : (
                    <div className="connect-prompt">
                        👆 Connect your wallet to check eligibility
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
