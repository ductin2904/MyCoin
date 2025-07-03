import React from 'react';
import { FaBell } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationCount } from '../../hooks/useNotificationCount';

const NotificationBadge = ({ walletAddress }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect current wallet from multiple sources with priority
  const getCurrentWalletAddress = () => {
    // Priority 1: Explicit prop (from WalletContext)
    if (walletAddress) {
      return walletAddress;
    }
    
    // Priority 2: URL path (/wallet/:address)
    const match = location.pathname.match(/^\/wallet\/([^\/]+)$/);
    if (match && match[1] !== 'create' && match[1] !== 'import' && match[1] !== 'accessed') {
      return match[1];
    }
    
    // Priority 3: Current wallet session (for /wallet/accessed)
    if (location.pathname === '/wallet/accessed') {
      try {
        const savedSession = localStorage.getItem('mycoin_wallet_session');
        if (savedSession) {
          const walletSession = JSON.parse(savedSession);
          if (walletSession.address) {
            return walletSession.address;
          }
        }
      } catch (error) {
        console.error('Error parsing wallet session:', error);
      }
    }
    
    // Priority 4: Last accessed wallet from localStorage
    const lastWallet = localStorage.getItem('lastAccessedWallet');
    if (lastWallet) {
      return lastWallet;
    }
    
    return null;
  };

  const currentAddress = getCurrentWalletAddress();
  const { count, loading } = useNotificationCount(currentAddress);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (currentAddress) {
      // Navigate to wallet with notifications tab
      navigate(`/wallet/${currentAddress}`);
      setTimeout(() => {
        window.location.hash = 'notifications';
        // Trigger hash change event
        const event = new HashChangeEvent('hashchange');
        window.dispatchEvent(event);
      }, 100);
    } else {
      // More helpful message with options
      const shouldCreateWallet = window.confirm(
        'No wallet detected. To view notifications, you need to have a wallet.\n\n' +
        'Click OK to create a new wallet, or Cancel to import/access an existing one.'
      );
      
      if (shouldCreateWallet) {
        navigate('/wallet/create');
      } else {
        navigate('/wallet/import');
      }
    }
  };

  // Always show the bell icon, but only show count if there are notifications
  return (
    <button
      onClick={handleClick}
      style={{
        position: 'relative',
        background: 'transparent',
        border: 'none',
        color: '#007bff',
        padding: '8px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        zIndex: 1000
      }}
      onMouseEnter={(e) => {
        e.target.style.background = '#f8f9fa';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'transparent';
      }}
      title={currentAddress ? 
        `${count} pending notifications for ${currentAddress.substring(0, 8)}...` : 
        'No wallet detected - Click to create or import wallet'
      }
    >
      <FaBell size={20} />
      {currentAddress && count > 0 && (
        <span style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          background: '#dc3545',
          color: 'white',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          fontSize: '10px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '18px',
          zIndex: 1001
        }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBadge;