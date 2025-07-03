import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaKey, FaDownload, FaEye, FaEyeSlash, FaFileImport, FaSignInAlt } from 'react-icons/fa';
import { walletAPI } from '../services/api';

const WalletImportPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('access'); // 'access', 'private_key', 'mnemonic'
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Form data for different import methods
  const [accessForm, setAccessForm] = useState({
    address: '',
    password: ''
  });
  
  const [privateKeyForm, setPrivateKeyForm] = useState({
    private_key: '',
    password: ''
  });
  
  const [mnemonicForm, setMnemonicForm] = useState({
    mnemonic: '',
    password: ''
  });

  // Load wallet session from localStorage on component mount
  useEffect(() => {
    const savedSession = localStorage.getItem('mycoin_wallet_session');
    if (savedSession) {
      try {
        const walletSession = JSON.parse(savedSession);
        setWallet(walletSession);
      } catch (error) {
        console.error('Error loading wallet session:', error);
        localStorage.removeItem('mycoin_wallet_session');
      }
    }
  }, []);

  const handleAccessFormChange = (e) => {
    setAccessForm({
      ...accessForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePrivateKeyFormChange = (e) => {
    setPrivateKeyForm({
      ...privateKeyForm,
      [e.target.name]: e.target.value
    });
  };

  const handleMnemonicFormChange = (e) => {
    setMnemonicForm({
      ...mnemonicForm,
      [e.target.name]: e.target.value
    });
  };

  const accessWallet = async () => {
    try {
      setLoading(true);
      // Get wallet details with private key using password
      const walletData = await walletAPI.getWalletWithPrivateKey(accessForm.address, accessForm.password);
      
      // Lưu vào localStorage để duy trì phiên
      const walletSession = {
        ...walletData.wallet,
        access_method: 'address',
        accessed_at: new Date().toISOString()
      };
      
      localStorage.setItem('mycoin_wallet_session', JSON.stringify(walletSession));
      
      // Also set as last accessed wallet for notifications
      localStorage.setItem('lastAccessedWallet', walletData.wallet.address);
      
      setWallet(walletSession);
      
      // Auto redirect to wallet dashboard
      setTimeout(() => {
        navigate('/wallet/accessed');
      }, 1500);
    } catch (error) {
      console.error('Error accessing wallet:', error);
      alert(error.error || 'Error accessing wallet. Please check your address and password.');
    } finally {
      setLoading(false);
    }
  };

  const importFromPrivateKey = async () => {
    try {
      setLoading(true);
      // Chỉ access wallet, không import
      // Tạo wallet object từ private key để lấy address
      const tempWallet = {
        private_key: privateKeyForm.private_key
      };
      
      // TODO: Cần tạo utility function để generate address từ private key
      // Hiện tại yêu cầu người dùng cung cấp address
      const address = prompt("Please enter your wallet address to verify:");
      
      if (!address) {
        alert("Address is required to access wallet");
        return;
      }
      
      // Access wallet bằng address và private key làm password tạm
      const walletData = await walletAPI.getWalletWithPrivateKey(address, privateKeyForm.password);
      
      // Lưu vào localStorage để duy trì phiên
      const walletSession = {
        ...walletData.wallet,
        private_key: privateKeyForm.private_key,
        access_method: 'private_key',
        accessed_at: new Date().toISOString()
      };
      
      localStorage.setItem('mycoin_wallet_session', JSON.stringify(walletSession));
      
      // Also set as last accessed wallet for notifications
      localStorage.setItem('lastAccessedWallet', walletData.wallet.address);
      
      setWallet(walletSession);
    } catch (error) {
      console.error('Error accessing wallet:', error);
      alert(error.error || 'Error accessing wallet. Please check your private key and password.');
    } finally {
      setLoading(false);
    }
  };

  const importFromMnemonic = async () => {
    try {
      setLoading(true);
      
      // Chỉ access wallet, không import
      const address = prompt("Please enter your wallet address to verify:");
      
      if (!address) {
        alert("Address is required to access wallet");
        return;
      }
      
      // Access wallet bằng address và password
      const walletData = await walletAPI.getWalletWithPrivateKey(address, mnemonicForm.password);
      
      // Lưu vào localStorage để duy trì phiên
      const walletSession = {
        ...walletData.wallet,
        mnemonic: mnemonicForm.mnemonic,
        access_method: 'mnemonic',
        accessed_at: new Date().toISOString()
      };
      
      localStorage.setItem('mycoin_wallet_session', JSON.stringify(walletSession));
      
      // Also set as last accessed wallet for notifications
      localStorage.setItem('lastAccessedWallet', walletData.wallet.address);
      
      setWallet(walletSession);
      
    } catch (error) {
      console.error('Error accessing wallet with mnemonic:', error);
      alert(error.error || 'Error accessing wallet. Please check your mnemonic phrase and password.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(false), 2000);
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

  const logoutWallet = () => {
    localStorage.removeItem('mycoin_wallet_session');
    setWallet(null);
    setAccessForm({ address: '', password: '' });
    setPrivateKeyForm({ private_key: '', password: '' });
    setMnemonicForm({ mnemonic: '', password: '' });
  };

  // If wallet is loaded, show wallet details
  if (wallet) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          background: '#f8f9fa', 
          border: '1px solid #e3e6ea', 
          borderRadius: '12px', 
          padding: '30px',
          textAlign: 'center'
        }}>
          <FaWallet style={{ fontSize: '48px', color: '#28a745', marginBottom: '20px' }} />
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Wallet Access Successful!</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Your wallet has been {wallet.access_method === 'address' ? 'accessed' : 'imported'} successfully.
          </p>

          <div style={{ textAlign: 'left', marginBottom: '30px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Wallet Address:
              </label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'white', 
                border: '1px solid #ddd', 
                borderRadius: '6px', 
                padding: '10px' 
              }}>
                <input 
                  type="text" 
                  value={wallet.address} 
                  readOnly 
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontSize: '14px'
                  }} 
                />
                <button 
                  onClick={() => copyToClipboard(wallet.address, 'address')}
                  style={{ 
                    marginLeft: '10px', 
                    padding: '5px 10px', 
                    background: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {copied === 'address' ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {wallet.private_key && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Private Key:
                </label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: 'white', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px', 
                  padding: '10px' 
                }}>
                  <input 
                    type={showPrivateKey ? "text" : "password"} 
                    value={wallet.private_key} 
                    readOnly 
                    style={{ 
                      flex: 1, 
                      border: 'none', 
                      outline: 'none',
                      fontFamily: 'monospace',
                      fontSize: '14px'
                    }} 
                  />
                  <button 
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    style={{ 
                      marginLeft: '10px', 
                      padding: '5px 10px', 
                      background: '#6c757d', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {showPrivateKey ? <FaEyeSlash /> : <FaEye />}
                  </button>
                  <button 
                    onClick={() => copyToClipboard(wallet.private_key, 'privateKey')}
                    style={{ 
                      marginLeft: '10px', 
                      padding: '5px 10px', 
                      background: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {copied === 'privateKey' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {wallet.mnemonic && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                  Mnemonic Phrase:
                </label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  background: 'white', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px', 
                  padding: '10px' 
                }}>
                  <textarea 
                    value={wallet.mnemonic} 
                    readOnly 
                    rows="3"
                    style={{ 
                      flex: 1, 
                      border: 'none', 
                      outline: 'none',
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      resize: 'none'
                    }} 
                  />
                  <button 
                    onClick={() => copyToClipboard(wallet.mnemonic, 'mnemonic')}
                    style={{ 
                      marginLeft: '10px', 
                      padding: '5px 10px', 
                      background: '#28a745', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {copied === 'mnemonic' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={downloadWallet}
              style={{ 
                padding: '12px 24px', 
                background: '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaDownload /> Download Wallet
            </button>
            <button 
              onClick={() => navigate('/wallet/accessed')}
              style={{ 
                padding: '12px 24px', 
                background: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FaWallet /> Go to Wallet Dashboard
            </button>
            <button 
              onClick={() => {
                logoutWallet();
              }}
              style={{ 
                padding: '12px 24px', 
                background: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Logout Wallet
            </button>
          </div>

          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '6px',
            textAlign: 'left'
          }}>
            <h4 style={{ color: '#856404', marginBottom: '10px' }}>⚠️ Important Security Notice:</h4>
            <ul style={{ color: '#856404', marginBottom: '0' }}>
              <li>Never share your private key or mnemonic phrase with anyone</li>
              <li>Store them in a secure location</li>
              <li>Anyone with access to these can control your funds</li>
              <li>Always double-check addresses before sending transactions</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Main form with tabs
  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ 
        background: '#f8f9fa', 
        border: '1px solid #e3e6ea', 
        borderRadius: '12px', 
        padding: '30px'
      }}>
        <FaWallet style={{ fontSize: '48px', color: '#007bff', marginBottom: '20px', display: 'block', margin: '0 auto' }} />
        <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Access Your Wallet</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          Choose how you want to access your existing wallet
        </p>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '30px', 
          borderBottom: '1px solid #ddd',
          gap: '0'
        }}>
          <button
            onClick={() => setActiveTab('access')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'access' ? '#007bff' : 'transparent',
              color: activeTab === 'access' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'access' ? '2px solid #007bff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <FaSignInAlt style={{ marginRight: '8px' }} />
            By Address
          </button>
          <button
            onClick={() => setActiveTab('private_key')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'private_key' ? '#007bff' : 'transparent',
              color: activeTab === 'private_key' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'private_key' ? '2px solid #007bff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <FaKey style={{ marginRight: '8px' }} />
            By Private Key
          </button>
          <button
            onClick={() => setActiveTab('mnemonic')}
            style={{
              flex: 1,
              padding: '12px',
              background: activeTab === 'mnemonic' ? '#007bff' : 'transparent',
              color: activeTab === 'mnemonic' ? 'white' : '#666',
              border: 'none',
              borderBottom: activeTab === 'mnemonic' ? '2px solid #007bff' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <FaFileImport style={{ marginRight: '8px' }} />
            By Mnemonic
          </button>
        </div>

        {/* Access Wallet Tab */}
        {activeTab === 'access' && (
          <div>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Access an existing wallet using your wallet address and password to retrieve your private key.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Wallet Address:
              </label>
              <input 
                type="text"
                name="address"
                value={accessForm.address}
                onChange={handleAccessFormChange}
                placeholder="Enter your wallet address"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }} 
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Password:
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={accessForm.password}
                  onChange={handleAccessFormChange}
                  placeholder="Enter your wallet password"
                  style={{ 
                    width: '100%', 
                    padding: '12px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    paddingRight: '40px'
                  }} 
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ 
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#666'
                  }}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button 
              onClick={accessWallet}
              disabled={loading || !accessForm.address || !accessForm.password}
              style={{ 
                width: '100%',
                padding: '15px', 
                fontSize: '16px',
                background: (loading || !accessForm.address || !accessForm.password) ? '#ccc' : '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: (loading || !accessForm.address || !accessForm.password) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? 'Accessing...' : 'Access Wallet & Get Private Key'}
            </button>
          </div>
        )}

        {/* Private Key Tab */}
        {activeTab === 'private_key' && (
          <div>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Access your existing wallet using your private key and the original password.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Private Key:
              </label>
              <textarea 
                name="private_key"
                value={privateKeyForm.private_key}
                onChange={handlePrivateKeyFormChange}
                placeholder="Enter your private key"
                rows="3"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical'
                }} 
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Wallet Password:
              </label>
              <input 
                type="password"
                name="password"
                value={privateKeyForm.password}
                onChange={handlePrivateKeyFormChange}
                placeholder="Enter your wallet password"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }} 
              />
            </div>

            <button 
              onClick={importFromPrivateKey}
              disabled={loading || !privateKeyForm.private_key || !privateKeyForm.password}
              style={{ 
                width: '100%',
                padding: '15px', 
                fontSize: '16px',
                background: (loading || !privateKeyForm.private_key || !privateKeyForm.password) ? '#ccc' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: (loading || !privateKeyForm.private_key || !privateKeyForm.password) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? 'Accessing...' : 'Access Wallet with Private Key'}
            </button>
          </div>
        )}

        {/* Mnemonic Tab */}
        {activeTab === 'mnemonic' && (
          <div>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Access your existing wallet using your mnemonic phrase and the password you used when creating it.
              <br />
              <strong>Note:</strong> If this is the first time accessing with this mnemonic, it will be imported to the system.
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Mnemonic Phrase:
              </label>
              <textarea 
                name="mnemonic"
                value={mnemonicForm.mnemonic}
                onChange={handleMnemonicFormChange}
                placeholder="Enter your 12 or 24 word mnemonic phrase"
                rows="3"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px',
                  fontSize: '14px',
                  resize: 'vertical'
                }} 
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                Wallet Password:
              </label>
              <input 
                type="password"
                name="password"
                value={mnemonicForm.password}
                onChange={handleMnemonicFormChange}
                placeholder="Enter the password you used when creating this wallet"
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }} 
              />
            </div>

            <button 
              onClick={importFromMnemonic}
              disabled={loading || !mnemonicForm.mnemonic || !mnemonicForm.password}
              style={{ 
                width: '100%',
                padding: '15px', 
                fontSize: '16px',
                background: (loading || !mnemonicForm.mnemonic || !mnemonicForm.password) ? '#ccc' : '#28a745', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px',
                cursor: (loading || !mnemonicForm.mnemonic || !mnemonicForm.password) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? 'Accessing...' : 'Access Wallet with Mnemonic'}
            </button>
          </div>
        )}

        <div style={{ 
          marginTop: '30px', 
          padding: '15px', 
          background: '#e9ecef', 
          border: '1px solid #ced4da', 
          borderRadius: '6px'
        }}>
          <p style={{ color: '#495057', margin: '0', fontSize: '14px' }}>
            <strong>Need help?</strong> If you don't have a wallet yet, you can{' '}
            <button
              onClick={() => navigate('/wallet/create')}
              style={{
                background: 'none',
                border: 'none',
                color: '#007bff',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit'
              }}
            >
              create a new wallet
            </button>{' '}
            instead.
          </p>
        </div>
      </div>
    </div>
  );
};

export default WalletImportPage;