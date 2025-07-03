import React from 'react';
import { FaGithub, FaTwitter, FaDiscord, FaCoins } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Logo Section */}
          <div className="footer-section">
            <div className="footer-logo">
              <FaCoins className="footer-logo-icon" />
              <span className="footer-logo-text">MyCoin</span>
            </div>
            <p className="footer-description">
              A decentralized cryptocurrency built with Proof of Work consensus, 
              featuring secure transactions and mining capabilities.
            </p>
            <div className="social-links">
              <a href="https://github.com/mycoin" className="social-link" aria-label="GitHub">
                <FaGithub />
              </a>
              <a href="https://twitter.com/mycoin" className="social-link" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://discord.gg/mycoin" className="social-link" aria-label="Discord">
                <FaDiscord />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/">Home</a></li>
              <li><a href="/wallet/create">Create Wallet</a></li>
              <li><a href="/explorer">Block Explorer</a></li>
              <li><a href="/mining">Mining</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="footer-section">
            <h4 className="footer-title">Resources</h4>
            <ul className="footer-links">
              <li><a href="#whitepaper">Whitepaper</a></li>
              <li><a href="#api-docs">API Documentation</a></li>
              <li><a href="#developer-guide">Developer Guide</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>

          {/* Network Info */}
          <div className="footer-section">
            <h4 className="footer-title">Network</h4>
            <ul className="footer-links">
              <li><span className="network-item">Network: MyCoin Mainnet</span></li>
              <li><span className="network-item">Consensus: Proof of Work</span></li>
              <li><span className="network-item">Block Time: ~10 minutes</span></li>
              <li><span className="network-item">Max Supply: 21M MYC</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} MyCoin. All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
              <a href="#security">Security</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
