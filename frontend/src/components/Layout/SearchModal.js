import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaCube, FaExchangeAlt, FaWallet } from 'react-icons/fa';
import { networkAPI } from '../../services/api';
import { isValidAddress, formatHash } from '../../utils/helpers';
import toast from 'react-hot-toast';
import './SearchModal.css';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await networkAPI.search(searchQuery.trim());
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleResultClick = (result) => {
    switch (result.type) {
      case 'block':
        navigate(`/block/${result.id}`);
        break;
      case 'transaction':
        navigate(`/transaction/${result.id}`);
        break;
      case 'address':
        navigate(`/wallet/${result.id}`);
        break;
      default:
        break;
    }
    onClose();
    setQuery('');
    setResults([]);
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'block':
        return <FaCube className="result-icon block" />;
      case 'transaction':
        return <FaExchangeAlt className="result-icon transaction" />;
      case 'address':
        return <FaWallet className="result-icon address" />;
      default:
        return <FaSearch className="result-icon" />;
    }
  };

  const handleQuickSearch = () => {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      toast.error('Please enter a search term');
      return;
    }

    // Quick navigation based on format
    if (isValidAddress(trimmedQuery)) {
      navigate(`/wallet/${trimmedQuery}`);
      onClose();
      return;
    }

    // If it looks like a hash (64 chars hex)
    if (/^[a-fA-F0-9]{64}$/.test(trimmedQuery)) {
      // Try transaction first, then block
      navigate(`/transaction/${trimmedQuery}`);
      onClose();
      return;
    }

    // If it's a number, try block index
    if (/^\d+$/.test(trimmedQuery)) {
      navigate(`/block/${trimmedQuery}`);
      onClose();
      return;
    }

    toast.error('Invalid format. Please enter a valid address, transaction hash, or block number.');
  };

  if (!isOpen) return null;

  return (
    <div className="search-modal-overlay" onClick={onClose}>
      <div className="search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="search-header">
          <h3>Search MyCoin Blockchain</h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="search-input-container">
          <FaSearch className="search-input-icon" />
          <input
            type="text"
            placeholder="Search by address, transaction hash, or block number..."
            value={query}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
            className="search-input"
            autoFocus
          />
          {query && (
            <button 
              className="clear-btn"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
            >
              <FaTimes />
            </button>
          )}
        </div>

        <div className="search-hints">
          <span className="hint">Examples:</span>
          <span className="hint-item">Address: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa</span>
          <span className="hint-item">Block: 12345 or hash</span>
          <span className="hint-item">Transaction: tx_hash</span>
        </div>

        {loading && (
          <div className="search-loading">
            <div className="loading"></div>
            <span>Searching...</span>
          </div>
        )}

        {results.length > 0 && (
          <div className="search-results">
            <div className="results-header">
              <span>Search Results ({results.length})</span>
            </div>
            <div className="results-list">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="result-item"
                  onClick={() => handleResultClick(result)}
                >
                  {getResultIcon(result.type)}
                  <div className="result-content">
                    <div className="result-title">
                      {result.type === 'block' && `Block #${result.index}`}
                      {result.type === 'transaction' && 'Transaction'}
                      {result.type === 'address' && 'Address'}
                    </div>
                    <div className="result-subtitle">
                      {formatHash(result.id, 16)}
                    </div>
                    {result.description && (
                      <div className="result-description">
                        {result.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {query && !loading && results.length === 0 && (
          <div className="no-results">
            <FaSearch className="no-results-icon" />
            <p>No results found for "{query}"</p>
            <p className="no-results-hint">
              Try searching with a different term or use exact formats
            </p>
            <button className="btn btn-primary" onClick={handleQuickSearch}>
              Search Anyway
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
