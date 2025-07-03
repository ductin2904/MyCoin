import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaWallet, 
  FaEye, 
  FaEyeSlash, 
  FaCopy, 
  FaDownload, 
  FaSignOutAlt,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaHistory,
  FaSpinner,
  FaCog,
  FaChartLine,
  FaCoins,
  FaExchangeAlt,
  FaSearch,
  FaFilter,
  FaExternalLinkAlt,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight
} from 'react-icons/fa';
import { walletAPI, transactionAPI, blockAPI } from '../services/api';
import NotificationList from '../components/Notifications/NotificationList';

const WalletAccessedPage = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [balance, setBalance] = useState('0');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, send, receive, history
  
  // Send transaction form
  const [sendForm, setSendForm] = useState({
    to_address: '',
    amount: '',
    fee: '0.001',
    note: ''
  });
  const [sendLoading, setSendLoading] = useState(false);
  
  // Transaction history filters and pagination
  const [txFilter, setTxFilter] = useState('all'); // all, sent, received
  const [txSearch, setTxSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // số transactions mỗi trang
  
  // Network stats
  const [networkStats, setNetworkStats] = useState(null);

  useEffect(() => {
    loadWalletSession();
  }, []);

  const loadWalletSession = async () => {
    try {
      const savedSession = localStorage.getItem('mycoin_wallet_session');
      if (!savedSession) {
        navigate('/wallet/import');
        return;
      }

      const walletSession = JSON.parse(savedSession);
      setWallet(walletSession);

      // Set as last accessed wallet for notifications
      if (walletSession.address) {
        localStorage.setItem('lastAccessedWallet', walletSession.address);
      }

      // Fetch updated balance and transactions
      if (walletSession.address) {
        try {
          const [balanceData, transactionsData] = await Promise.all([
            walletAPI.getBalance(walletSession.address).catch(() => ({ balance: '0' })),
            walletAPI.getTransactions(walletSession.address).catch(() => ({ transactions: [] }))
          ]);
          
          setBalance(balanceData.balance || '0');
          setTransactions(transactionsData.transactions || []);
          
        } catch (error) {
          console.error('Error fetching wallet data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading wallet session:', error);
      localStorage.removeItem('mycoin_wallet_session');
      navigate('/wallet/import');
    } finally {
      setLoading(false);
    }
  };

  // Send transaction handlers
  const handleSendFormChange = (e) => {
    setSendForm({
      ...sendForm,
      [e.target.name]: e.target.value
    });
  };

  const sendTransaction = async (e) => {
    e.preventDefault();
    
    if (!sendForm.to_address || !sendForm.amount) {
      alert('Please fill in recipient address and amount');
      return;
    }

    if (parseFloat(sendForm.amount) > parseFloat(balance)) {
      alert('Insufficient balance');
      return;
    }

    if (!wallet.private_key) {
      alert('Private key is required to send transactions');
      return;
    }

    try {
      setSendLoading(true);
      
      const txData = {
        from_address: wallet.address,
        to_address: sendForm.to_address,
        amount: parseFloat(sendForm.amount),
        fee: parseFloat(sendForm.fee),
        private_key: wallet.private_key,
        data: sendForm.note || ''
      };

      const response = await transactionAPI.sendTransaction(txData);
      
      if (response.success) {
        alert('Transaction sent successfully!');
        setSendForm({ to_address: '', amount: '', fee: '0.001', note: '' });
        
        // Refresh balance and transactions
        loadWalletSession();
        setActiveTab('history');
      } else {
        throw new Error(response.error || 'Transaction failed');
      }
      
    } catch (error) {
      console.error('Error sending transaction:', error);
      alert(error.error || 'Error sending transaction. Please try again.');
    } finally {
      setSendLoading(false);
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = 
      txFilter === 'all' || 
      (txFilter === 'sent' && tx.from_address === wallet?.address) ||
      (txFilter === 'received' && tx.to_address === wallet?.address);
    
    const matchesSearch = 
      !txSearch || 
      tx.transaction_id?.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.from_address?.toLowerCase().includes(txSearch.toLowerCase()) ||
      tx.to_address?.toLowerCase().includes(txSearch.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });
  
  // Pagination logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  
  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [txFilter, txSearch, itemsPerPage]);
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(6);
  };

  const logoutWallet = () => {
    localStorage.removeItem('mycoin_wallet_session');
    navigate('/wallet/import');
  };

  const downloadWallet = () => {
    const walletData = {
      address: wallet.address,
      public_key: wallet.public_key,
      ...(wallet.private_key && { private_key: wallet.private_key }),
      ...(wallet.mnemonic && { mnemonic: wallet.mnemonic }),
      access_method: wallet.access_method,
      accessed_at: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(walletData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mycoin-wallet-${wallet.address.substring(0, 8)}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <FaSpinner style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: '10px' }}>Loading wallet...</span>
      </div>
    );
  }

  if (!wallet) {
    navigate('/wallet/import');
    return null;
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '20px',
      display: 'grid',
      gridTemplateColumns: '280px 1fr 320px',
      gap: '20px',
      minHeight: '100vh'
    }}>
      {/* Left Sidebar */}
      <div style={{
        background: '#1e3a8a',
        color: 'white',
        borderRadius: '12px',
        padding: '20px',
        height: 'fit-content',
        position: 'sticky',
        top: '20px'
      }}>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <FaWallet style={{ fontSize: '32px', color: '#fbbf24', marginBottom: '10px' }} />
          <h3 style={{ margin: '0 0 5px 0', color: '#fbbf24' }}>PORTFOLIO VALUE</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{balance} MYCOIN</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>≈ ${(parseFloat(balance) * 0.1).toFixed(2)}</div>
        </div>

        <nav style={{ marginTop: '30px' }}>
          <div 
            style={{ 
              marginBottom: '12px',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'overview' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
            onClick={() => setActiveTab('overview')}
          >
            <FaChartLine style={{ marginRight: '10px' }} />
            Portfolio Overview
          </div>
          <div 
            style={{ 
              marginBottom: '12px',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'send' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
            onClick={() => setActiveTab('send')}
          >
            <FaArrowUp style={{ marginRight: '10px' }} />
            Send MyCoin
          </div>
          <div 
            style={{ 
              marginBottom: '12px',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'receive' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
            onClick={() => setActiveTab('receive')}
          >
            <FaBell style={{ marginRight: '10px' }} />
            Notifications
          </div>
          <div 
            style={{ 
              marginBottom: '12px',
              padding: '12px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: activeTab === 'history' ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory style={{ marginRight: '10px' }} />
            Transaction History
          </div>
        </nav>

        <div style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
          <button
            onClick={logoutWallet}
            style={{
              width: '100%',
              padding: '12px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
          >
            <FaSignOutAlt style={{ marginRight: '8px' }} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        {activeTab === 'overview' && (
          <div>
            <h2 style={{ margin: '0 0 30px 0', color: '#1e3a8a' }}>Portfolio Overview</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Balance</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>{balance} MYCOIN</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>≈ ${(parseFloat(balance) * 0.1).toFixed(2)} USD</div>
              </div>
              
              <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#374151' }}>Total Transactions</h4>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>{transactions.length}</div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  Sent: {transactions.filter(tx => tx.from_address === wallet.address).length} | 
                  Received: {transactions.filter(tx => tx.to_address === wallet.address).length}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Quick Actions</h4>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={() => setActiveTab('send')}
                  style={{
                    padding: '12px 24px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}
                >
                  <FaArrowUp style={{ marginRight: '8px' }} />
                  Send
                </button>
                <button
                  onClick={() => setActiveTab('receive')}
                  style={{
                    padding: '12px 24px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}
                >
                  <FaBell style={{ marginRight: '8px' }} />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  style={{
                    padding: '12px 24px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}
                >
                  <FaHistory style={{ marginRight: '8px' }} />
                  History
                </button>
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>Recent Transactions</h4>
              {transactions.slice(0, 5).map((tx, index) => (
                <div key={index} style={{ 
                  padding: '15px', 
                  background: '#f9fafb', 
                  marginBottom: '10px', 
                  borderRadius: '6px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {tx.from_address === wallet.address ? 'Sent' : 'Received'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {tx.from_address === wallet.address ? `To: ${tx.to_address?.substring(0, 12)}...` : `From: ${tx.from_address?.substring(0, 12)}...`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: 'bold', 
                      color: tx.from_address === wallet.address ? '#dc2626' : '#10b981' 
                    }}>
                      {tx.from_address === wallet.address ? '-' : '+'}{formatAmount(tx.amount)} MYCOIN
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      {formatTime(tx.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div>
            <h2 style={{ margin: '0 0 30px 0', color: '#1e3a8a' }}>Send MyCoin</h2>
            
            <form onSubmit={sendTransaction} style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Recipient Address *
                </label>
                <input
                  type="text"
                  name="to_address"
                  value={sendForm.to_address}
                  onChange={handleSendFormChange}
                  placeholder="Enter recipient wallet address"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Amount (MYCOIN) *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={sendForm.amount}
                  onChange={handleSendFormChange}
                  placeholder="0.000000"
                  step="0.000001"
                  min="0"
                  max={balance}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                  required
                />
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
                  Balance: {balance} MYCOIN
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Transaction Fee (MYCOIN)
                </label>
                <input
                  type="number"
                  name="fee"
                  value={sendForm.fee}
                  onChange={handleSendFormChange}
                  step="0.000001"
                  min="0.000001"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
                  Note (Optional)
                </label>
                <textarea
                  name="note"
                  value={sendForm.note}
                  onChange={handleSendFormChange}
                  placeholder="Add a note to this transaction"
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={sendLoading || !wallet.private_key}
                style={{
                  padding: '15px 30px',
                  background: sendLoading ? '#6b7280' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: sendLoading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {sendLoading ? (
                  <>
                    <FaSpinner style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                    Sending...
                  </>
                ) : (
                  <>
                    <FaArrowUp style={{ marginRight: '8px' }} />
                    Send Transaction
                  </>
                )}
              </button>

              {!wallet.private_key && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '10px', 
                  background: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  ⚠️ Private key is required to send transactions. Please import your wallet with private key.
                </div>
              )}
            </form>
          </div>
        )}

        {activeTab === 'receive' && (
          <div>
            <h2 style={{ margin: '0 0 30px 0', color: '#1e3a8a' }}>
              <FaCoins style={{ marginRight: '10px' }} />
              Incoming Payments & Notifications
            </h2>
            
            <div style={{ 
              padding: '20px', 
              background: '#eff6ff', 
              border: '1px solid #3b82f6', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>
                How It Works
              </h4>
              <p style={{ margin: 0, color: '#1e40af', fontSize: '14px' }}>
                When someone sends you MyCoin, you'll receive a notification here. 
                You must <strong>accept</strong> the payment before it's processed and added to your balance.
              </p>
            </div>

            <NotificationList address={wallet?.address} onUpdate={loadWalletSession} />
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 style={{ margin: '0 0 30px 0', color: '#1e3a8a' }}>Transaction History</h2>
            
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Transactions</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
              </select>
              
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1); // Reset to first page
                }}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
              
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <FaSearch style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#6b7280' 
                }} />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={txSearch}
                  onChange={(e) => setTxSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 40px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div>
              {filteredTransactions.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#6b7280' 
                }}>
                  <FaHistory style={{ fontSize: '48px', marginBottom: '15px' }} />
                  <div>No transactions found</div>
                </div>
              ) : (
                <div>
                  {paginatedTransactions.map((tx, index) => (
                    <div key={index} style={{ 
                      padding: '20px', 
                      background: '#f9fafb', 
                      marginBottom: '15px', 
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '5px' 
                          }}>
                            {tx.from_address === wallet.address ? (
                              <FaArrowUp style={{ color: '#dc2626', marginRight: '8px' }} />
                            ) : (
                              <FaArrowDown style={{ color: '#10b981', marginRight: '8px' }} />
                            )}
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                              {tx.from_address === wallet.address ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {formatTime(tx.timestamp)}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ 
                            fontSize: '18px', 
                            fontWeight: 'bold', 
                            color: tx.from_address === wallet.address ? '#dc2626' : '#10b981' 
                          }}>
                            {tx.from_address === wallet.address ? '-' : '+'}{formatAmount(tx.amount)} MYCOIN
                          </div>
                          {tx.fee && (
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              Fee: {formatAmount(tx.fee)} MYCOIN
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '10px' }}>
                        <div><strong>From:</strong> {tx.from_address}</div>
                        <div><strong>To:</strong> {tx.to_address}</div>
                        <div><strong>Transaction ID:</strong> {tx.transaction_id}</div>
                        {tx.data && <div><strong>Note:</strong> {tx.data}</div>}
                      </div>
                      
                      <div style={{ fontSize: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          background: '#10b981', 
                          color: 'white', 
                          borderRadius: '4px' 
                        }}>
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{ 
                      marginTop: '30px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '20px',
                      background: '#f9fafb',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb'
                    }}>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        Showing {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {/* First Page */}
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          style={{
                            padding: '8px 12px',
                            background: currentPage === 1 ? '#e5e7eb' : '#fff',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            color: currentPage === 1 ? '#9ca3af' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FaAngleDoubleLeft />
                        </button>
                        
                        {/* Previous Page */}
                        <button
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{
                            padding: '8px 12px',
                            background: currentPage === 1 ? '#e5e7eb' : '#fff',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            color: currentPage === 1 ? '#9ca3af' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FaChevronLeft /> Prev
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else {
                            const start = Math.max(1, currentPage - 2);
                            const end = Math.min(totalPages, start + 4);
                            pageNum = start + i;
                            if (pageNum > end) return null;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              style={{
                                padding: '8px 12px',
                                background: currentPage === pageNum ? '#3b82f6' : '#fff',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                color: currentPage === pageNum ? '#fff' : '#374151',
                                fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {/* Next Page */}
                        <button
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '8px 12px',
                            background: currentPage === totalPages ? '#e5e7eb' : '#fff',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            color: currentPage === totalPages ? '#9ca3af' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Next <FaChevronRight />
                        </button>
                        
                        {/* Last Page */}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          style={{
                            padding: '8px 12px',
                            background: currentPage === totalPages ? '#e5e7eb' : '#fff',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            color: currentPage === totalPages ? '#9ca3af' : '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <FaAngleDoubleRight />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        height: 'fit-content',
        position: 'sticky',
        top: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>Wallet Information</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>ADDRESS</div>
          <div style={{ 
            fontSize: '13px', 
            fontFamily: 'monospace', 
            wordBreak: 'break-all',
            padding: '8px',
            background: '#f3f4f6',
            borderRadius: '4px'
          }}>
            {wallet.address}
          </div>
          <button
            onClick={() => copyToClipboard(wallet.address)}
            style={{
              marginTop: '5px',
              padding: '4px 8px',
              background: '#e5e7eb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            <FaCopy style={{ marginRight: '4px' }} />
            Copy
          </button>
        </div>

        {wallet.private_key && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>PRIVATE KEY</div>
            <div style={{ 
              fontSize: '13px', 
              fontFamily: 'monospace', 
              wordBreak: 'break-all',
              padding: '8px',
              background: '#f3f4f6',
              borderRadius: '4px'
            }}>
              {showPrivateKey ? wallet.private_key : '•'.repeat(64)}
            </div>
            <div style={{ marginTop: '5px', display: 'flex', gap: '5px' }}>
              <button
                onClick={() => setShowPrivateKey(!showPrivateKey)}
                style={{
                  padding: '4px 8px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {showPrivateKey ? <FaEyeSlash /> : <FaEye />}
              </button>
              {showPrivateKey && (
                <button
                  onClick={() => copyToClipboard(wallet.private_key)}
                  style={{
                    padding: '4px 8px',
                    background: '#e5e7eb',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <FaCopy style={{ marginRight: '4px' }} />
                  Copy
                </button>
              )}
            </div>
          </div>
        )}

        {wallet.mnemonic && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>MNEMONIC</div>
            <div style={{ 
              fontSize: '13px', 
              fontFamily: 'monospace', 
              wordBreak: 'break-all',
              padding: '8px',
              background: '#f3f4f6',
              borderRadius: '4px'
            }}>
              {showMnemonic ? wallet.mnemonic : '•'.repeat(wallet.mnemonic.length)}
            </div>
            <div style={{ marginTop: '5px', display: 'flex', gap: '5px' }}>
              <button
                onClick={() => setShowMnemonic(!showMnemonic)}
                style={{
                  padding: '4px 8px',
                  background: '#e5e7eb',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {showMnemonic ? <FaEyeSlash /> : <FaEye />}
              </button>
              {showMnemonic && (
                <button
                  onClick={() => copyToClipboard(wallet.mnemonic)}
                  style={{
                    padding: '4px 8px',
                    background: '#e5e7eb',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <FaCopy style={{ marginRight: '4px' }} />
                  Copy
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={downloadWallet}
            style={{
              width: '100%',
              padding: '12px',
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}
          >
            <FaDownload style={{ marginRight: '8px' }} />
            Download Wallet
          </button>
        </div>

        <div style={{ 
          padding: '15px', 
          background: '#fef3c7', 
          border: '1px solid #f59e0b', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>⚠️ Security Notice:</strong>
          <br />
          Never share your private key or mnemonic with anyone. Store them securely offline.
        </div>
      </div>
    </div>
  );
};

export default WalletAccessedPage;
