import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaWallet, 
  FaEye, 
  FaCoins, 
  FaHammer,
  FaShieldAlt,
  FaRocket,
  FaUsers,
  FaCubes
} from 'react-icons/fa';
import { networkAPI } from '../services/api';
import { formatNumber, formatCurrency } from '../utils/helpers';
import './HomePage.css';

const HomePage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await networkAPI.getStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: FaShieldAlt,
      title: 'Secure & Decentralized',
      description: 'Built with Proof of Work consensus algorithm ensuring maximum security and decentralization.',
      color: '#10b981'
    },
    {
      icon: FaRocket,
      title: 'Fast Transactions',
      description: 'Experience lightning-fast transactions with low fees and high throughput.',
      color: '#3b82f6'
    },
    {
      icon: FaHammer,
      title: 'Easy Mining',
      description: 'Start mining MyCoin with our user-friendly mining interface and earn rewards.',
      color: '#8b5cf6'
    },
    {
      icon: FaUsers,
      title: 'Community Driven',
      description: 'Join our growing community of developers, miners, and cryptocurrency enthusiasts.',
      color: '#f59e0b'
    }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome to MyCoin
            </h1>
            <p className="hero-subtitle">
              The next generation decentralized cryptocurrency with Proof of Work consensus
            </p>
            <div className="hero-buttons">
              <Link to="/wallet/create" className="btn btn-primary btn-lg">
                <FaWallet className="btn-icon" />
                Create Wallet
              </Link>
              <Link to="/explorer" className="btn btn-secondary btn-lg">
                <FaEye className="btn-icon" />
                Explore Blockchain
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          {loading ? (
            <div className="stats-loading">
              <div className="loading"></div>
              <span>Loading network statistics...</span>
            </div>
          ) : stats ? (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <FaCubes />
                </div>
                <div className="stat-value">{formatNumber(stats.total_blocks, 0)}</div>
                <div className="stat-label">Total Blocks</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <FaCoins />
                </div>
                <div className="stat-value">{formatCurrency(stats.circulating_supply)}</div>
                <div className="stat-label">Circulating Supply</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <FaUsers />
                </div>
                <div className="stat-value">{formatNumber(stats.active_addresses, 0)}</div>
                <div className="stat-label">Active Addresses</div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">
                  <FaHammer />
                </div>
                <div className="stat-value">{stats.difficulty}</div>
                <div className="stat-label">Mining Difficulty</div>
              </div>
            </div>
          ) : (
            <div className="stats-error">
              <p>Unable to load network statistics</p>
              <button className="btn btn-primary" onClick={fetchStats}>
                Retry
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Why Choose MyCoin?</h2>
            <p className="section-subtitle">
              Discover the features that make MyCoin the perfect choice for your cryptocurrency needs
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="feature-card">
                  <div 
                    className="feature-icon"
                    style={{ color: feature.color }}
                  >
                    <Icon />
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="quick-actions-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Get Started</h2>
            <p className="section-subtitle">
              Choose your path into the MyCoin ecosystem
            </p>
          </div>
          
          <div className="quick-actions-grid">
            <Link to="/wallet/create" className="action-card">
              <div className="action-icon">
                <FaWallet />
              </div>
              <h3 className="action-title">Create New Wallet</h3>
              <p className="action-description">
                Generate a new secure wallet with private key and mnemonic phrase
              </p>
              <span className="action-button">Get Started →</span>
            </Link>
            
            <Link to="/wallet/import" className="action-card">
              <div className="action-icon">
                <FaCoins />
              </div>
              <h3 className="action-title">Import Existing Wallet</h3>
              <p className="action-description">
                Import your wallet using private key or mnemonic phrase
              </p>
              <span className="action-button">Import Now →</span>
            </Link>
            
            <Link to="/explorer" className="action-card">
              <div className="action-icon">
                <FaEye />
              </div>
              <h3 className="action-title">Explore Blockchain</h3>
              <p className="action-description">
                Browse blocks, transactions, and addresses on the blockchain
              </p>
              <span className="action-button">Explore →</span>
            </Link>
            
            <Link to="/mining" className="action-card">
              <div className="action-icon">
                <FaHammer />
              </div>
              <h3 className="action-title">Start Mining</h3>
              <p className="action-description">
                Mine MyCoin and earn rewards for securing the network
              </p>
              <span className="action-button">Mine Now →</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
