import React, { createContext, useContext, useState, useEffect } from 'react';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [currentWallet, setCurrentWallet] = useState(null);

  useEffect(() => {
    // Try to load wallet from localStorage on init
    const savedWallet = localStorage.getItem('currentWallet');
    if (savedWallet) {
      try {
        setCurrentWallet(JSON.parse(savedWallet));
      } catch (error) {
        console.error('Error parsing saved wallet:', error);
        localStorage.removeItem('currentWallet');
      }
    }
  }, []);

  const setWallet = (wallet) => {
    setCurrentWallet(wallet);
    if (wallet) {
      localStorage.setItem('currentWallet', JSON.stringify(wallet));
    } else {
      localStorage.removeItem('currentWallet');
    }
  };

  const clearWallet = () => {
    setCurrentWallet(null);
    localStorage.removeItem('currentWallet');
  };

  return (
    <WalletContext.Provider value={{
      currentWallet,
      setWallet,
      clearWallet,
      isConnected: !!currentWallet
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export default WalletContext;
