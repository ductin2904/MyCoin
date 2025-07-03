import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaWallet, FaArrowUp, FaArrowDown, FaCopy, FaSpinner, FaHistory, FaBell } from 'react-icons/fa';
import { walletAPI, transactionAPI } from '../services/api';
import { formatNumber, formatTime } from '../utils/helpers';
import { useWallet } from '../contexts/WalletContext';
import NotificationList from '../components/Notifications/NotificationList';
import TransactionTable from '../components/TransactionTable';

const WalletDashboardPage = () => {
  const { address } = useParams();
  const { setWallet } = useWallet();
  const [wallet, setWalletData] = useState(null);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Check URL hash for direct navigation to tabs
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['overview', 'notifications', 'history'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Set initial tab from hash
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (address) {
      fetchWalletData();
    }
  }, [address]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, balanceData, transactionsData] = await Promise.all([
        walletAPI.getWallet(address).catch(() => null),
        walletAPI.getBalance(address).catch(() => ({ balance: '0' })),
        walletAPI.getTransactions(address).catch(() => ({ transactions: [] }))
      ]);
      
      setWalletData(walletData);
      setBalance(balanceData.balance || '0');
      setTransactions(transactionsData.transactions || []);
      
      // Set current wallet in context and localStorage
      if (walletData) {
        setWallet({ address: walletData.address, ...walletData });
        localStorage.setItem('lastAccessedWallet', address);
      }
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendTransaction = async (e) => {
    e.preventDefault();
    if (!sendAmount || !recipient) {
      alert('Please fill all fields');
      return;
    }

    try {
      setSendLoading(true);
      await transactionAPI.send({
        from_address: address,
        to_address: recipient,
        amount: sendAmount
      });
      alert('Transaction sent successfully! The recipient will need to confirm before it is processed.');
      setSendAmount('');
      setRecipient('');
      fetchWalletData(); // Refresh data
    } catch (error) {
      console.error('Error sending transaction:', error);
      alert('Error sending transaction. Please try again.');
    } finally {
      setSendLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <FaSpinner className="spin" style={{ fontSize: '48px', color: '#007bff' }} />
        <p style={{ marginTop: '20px', color: '#666' }}>Loading wallet...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e3e6ea', 
        borderRadius: '12px', 
        padding: '30px', 
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <FaWallet style={{ fontSize: '48px', color: '#007bff', marginBottom: '20px' }} />
        <h1 style={{ marginBottom: '10px' }}>Wallet Dashboard</h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '10px', 
          marginBottom: '20px' 
        }}>
          <span style={{ 
            fontFamily: 'monospace', 
            fontSize: '14px', 
            background: '#f8f9fa', 
            padding: '8px 12px', 
            borderRadius: '6px' 
          }}>
            {address}
          </span>
          <button 
            onClick={() => copyToClipboard(address)}
            style={{ 
              padding: '8px 12px', 
              background: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaCopy /> {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <h2 style={{ color: '#28a745', margin: '0' }}>
          {formatNumber(balance)} MYC
        </h2>
      </div>

      {/* Tabs Navigation */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e3e6ea', 
        borderRadius: '12px 12px 0 0', 
        borderBottom: 'none'
      }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e3e6ea' }}>
          <button
            onClick={() => {
              setActiveTab('overview');
              window.location.hash = 'overview';
            }}
            style={{
              padding: '15px 25px',
              background: activeTab === 'overview' ? '#007bff' : 'transparent',
              color: activeTab === 'overview' ? 'white' : '#666',
              border: 'none',
              borderRadius: '12px 0 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <FaWallet /> Overview
          </button>
          <button
            onClick={() => {
              setActiveTab('notifications');
              window.location.hash = 'notifications';
            }}
            style={{
              padding: '15px 25px',
              background: activeTab === 'notifications' ? '#007bff' : 'transparent',
              color: activeTab === 'notifications' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <FaBell /> Notifications
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              window.location.hash = 'history';
            }}
            style={{
              padding: '15px 25px',
              background: activeTab === 'history' ? '#007bff' : 'transparent',
              color: activeTab === 'history' ? 'white' : '#666',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px'
            }}
          >
            <FaHistory /> History
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ 
        background: 'white', 
        border: '1px solid #e3e6ea', 
        borderTop: 'none',
        borderRadius: '0 0 12px 12px', 
        padding: '30px',
        minHeight: '400px'
      }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            {/* Send Transaction */}
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e3e6ea', 
              borderRadius: '12px', 
              padding: '30px' 
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                marginBottom: '20px' 
              }}>
                <FaArrowUp style={{ color: '#dc3545' }} />
                <h3 style={{ margin: 0 }}>Send MyCoin</h3>
              </div>
              
              <form onSubmit={handleSendTransaction}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Recipient Address:
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter recipient address..."
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Amount (MYC):
                  </label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00000000"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={sendLoading}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: sendLoading ? '#ccc' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: sendLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {sendLoading ? (
                    <>
                      <FaSpinner className="spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <FaArrowUp /> Send Transaction
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick Actions */}
            <div style={{ 
              background: '#f8f9fa', 
              border: '1px solid #e3e6ea', 
              borderRadius: '12px', 
              padding: '30px' 
            }}>
              <h3 style={{ marginBottom: '20px' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <Link 
                  to="/mining"
                  style={{ 
                    padding: '15px', 
                    background: '#28a745', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '6px',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  Start Mining
                </Link>
                <Link 
                  to="/staking"
                  style={{ 
                    padding: '15px', 
                    background: '#17a2b8', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '6px',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  Stake Coins
                </Link>
                <Link 
                  to="/explorer"
                  style={{ 
                    padding: '15px', 
                    background: '#6f42c1', 
                    color: 'white', 
                    textDecoration: 'none', 
                    borderRadius: '6px',
                    textAlign: 'center',
                    display: 'block'
                  }}
                >
                  Explore Blockchain
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <NotificationList 
            address={address} 
            onUpdate={fetchWalletData}
          />
        )}

        {activeTab === 'history' && (
          <div>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <FaSpinner className="spin" style={{ fontSize: '24px', color: '#007bff' }} />
              </div>
            ) : (
              <div>
                <TransactionTable 
                  transactions={transactions} 
                  currentAddress={address}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default WalletDashboardPage;
