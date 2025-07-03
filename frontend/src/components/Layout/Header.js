import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FaWallet, 
  FaSearch, 
  FaCubes, 
  FaHammer, 
  FaCoins,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { networkAPI } from '../../services/api';
import { useWallet } from '../../contexts/WalletContext';
import SearchModal from './SearchModal';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [networkStats, setNetworkStats] = useState(null);
  const { currentWallet } = useWallet();
  const location = useLocation();

  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNetworkStats = async () => {
    try {
      const data = await networkAPI.getStats();
      setNetworkStats(data.stats);
    } catch (error) {
      console.error('Error fetching network stats:', error);
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: FaCoins },
    { path: '/wallet/create', label: 'Create Wallet', icon: FaWallet },
    { path: '/explorer', label: 'Explorer', icon: FaCubes },
    { path: '/mining', label: 'Mining', icon: FaHammer },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header-content">
            {/* Logo */}
            <Link to="/" className="logo">
              <FaCoins className="logo-icon" />
              <span className="logo-text">MyCoin</span>
            </Link>

            {/* Network Stats */}
            {networkStats && (
              <div className="network-stats">
                <div className="stat-item">
                  <span className="stat-label">Blocks:</span>
                  <span className="stat-value">{networkStats.total_blocks.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Difficulty:</span>
                  <span className="stat-value">{networkStats.difficulty}</span>
                </div>
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className="nav-desktop">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <Icon className="nav-icon" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Search and Menu */}
            <div className="header-actions">
              <button 
                className="search-btn"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search blockchain"
              >
                <FaSearch />
              </button>
              
              <button 
                className="menu-toggle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <FaTimes /> : <FaBars />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className={`nav-mobile ${isMenuOpen ? 'open' : ''}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link-mobile ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
};

export default Header;
