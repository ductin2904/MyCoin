import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWallet, FaKey, FaDownload, FaEye, FaEyeSlash } from 'react-icons/fa';
import { walletAPI } from '../services/api';

const WalletCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1); // 1: password form, 2: wallet created
  const [formData, setFormData] = useState({
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const createWallet = async () => {
    if (formData.password !== formData.confirm_password) {
      alert('Passwords do not match!');
      return;
    }
    
    if (formData.password.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    try {
      setLoading(true);
      const response = await walletAPI.createWallet(formData);
      
      // Lưu wallet session để duy trì phiên
      const walletSession = {
        ...response.wallet,
        access_method: 'created',
        accessed_at: new Date().toISOString()
      };
      
      localStorage.setItem('mycoin_wallet_session', JSON.stringify(walletSession));
      
      // Also set as last accessed wallet for notifications
      localStorage.setItem('lastAccessedWallet', response.wallet.address);
      
      setWallet(response.wallet);
      setStep(2);
      
      // Auto redirect to unified wallet dashboard after 2 seconds
      setTimeout(() => {
        navigate('/wallet/accessed');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating wallet:', error);
      alert(error.error || 'Error creating wallet. Please try again.');
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
      mnemonic: wallet.mnemonic,
      createdAt: new Date().toISOString()
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

  if (step === 2 && wallet) {
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
          <h2 style={{ color: '#333', marginBottom: '10px' }}>Wallet Created Successfully!</h2>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Your new MyCoin wallet has been generated. Please save your private key securely.
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
              onClick={() => navigate(`/wallet/${wallet.address}`)}
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
              <FaWallet /> Go to Wallet
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
              <li>Never share your private key with anyone</li>
              <li>Store your private key in a secure location</li>
              <li>Anyone with your private key can access your funds</li>
              <li>Consider using a hardware wallet for large amounts</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ 
          background: '#f8f9fa', 
          border: '1px solid #e3e6ea', 
          borderRadius: '12px', 
          padding: '30px'
        }}>
          <FaWallet style={{ fontSize: '48px', color: '#007bff', marginBottom: '20px', display: 'block', margin: '0 auto' }} />
          <h2 style={{ textAlign: 'center', marginBottom: '10px' }}>Create New Wallet</h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
            Set a password to secure your wallet. This password will be used to encrypt your private key.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Password (minimum 8 characters):
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
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

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
              Confirm Password:
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? "text" : "password"}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleInputChange}
                placeholder="Confirm your password"
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
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button 
            onClick={createWallet}
            disabled={loading || !formData.password || !formData.confirm_password}
            style={{ 
              width: '100%',
              padding: '15px', 
              fontSize: '16px',
              background: (loading || !formData.password || !formData.confirm_password) ? '#ccc' : '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px',
              cursor: (loading || !formData.password || !formData.confirm_password) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {loading ? (
              <>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  border: '2px solid #fff', 
                  borderTop: '2px solid transparent', 
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Creating Wallet...
              </>
            ) : (
              <>
                <FaKey /> Create Wallet
              </>
            )}
          </button>

          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '6px'
          }}>
            <p style={{ color: '#856404', margin: '0', fontSize: '14px' }}>
              <strong>Important:</strong> Your password will be used to encrypt your private key. 
              Keep it safe and never share it with anyone. If you lose your password, you won't be able to access your wallet.
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
      <FaWallet style={{ fontSize: '64px', color: '#007bff', marginBottom: '30px' }} />
      <h1 style={{ marginBottom: '20px' }}>Create New Wallet</h1>
      <p style={{ color: '#666', marginBottom: '40px', fontSize: '16px' }}>
        Generate a new MyCoin wallet with a unique address and private key. 
        Make sure to keep your private key safe and secure.
      </p>
      
      <button 
        onClick={createWallet}
        disabled={loading}
        style={{ 
          padding: '15px 30px', 
          fontSize: '18px',
          background: loading ? '#ccc' : '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          margin: '0 auto'
        }}
      >
        {loading ? (
          <>
            <div style={{ 
              width: '20px', 
              height: '20px', 
              border: '2px solid #fff', 
              borderTop: '2px solid transparent', 
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Creating Wallet...
          </>
        ) : (
          <>
            <FaKey /> Create New Wallet
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WalletCreatePage;
