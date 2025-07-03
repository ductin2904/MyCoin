import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaCube, 
  FaCopy, 
  FaSpinner, 
  FaCheckCircle,
  FaExternalLinkAlt,
  FaClock,
  FaHammer,
  FaHashtag,
  FaFileAlt,
  FaCoins,
  FaChevronRight
} from 'react-icons/fa';
import { blockAPI, transactionAPI } from '../services/api';

const BlockDetailPage = () => {
  const { blockId } = useParams();
  const navigate = useNavigate();
  const [block, setBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadBlockDetail();
  }, [blockId]);

  const loadBlockDetail = async () => {
    try {
      setLoading(true);
      const data = await blockAPI.getBlock(blockId);
      setBlock(data);
    } catch (error) {
      console.error('Error loading block:', error);
      setError('Block not found');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(8);
  };

  const formatHash = (hash, length = 16) => {
    if (!hash) return '';
    return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
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
        <span style={{ marginLeft: '10px' }}>Loading block...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: '800px', 
        margin: '40px auto', 
        padding: '40px', 
        textAlign: 'center',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#dc2626', marginBottom: '20px' }}>Block Not Found</h2>
        <p style={{ color: '#6b7280', marginBottom: '30px' }}>{error}</p>
        <button
          onClick={() => navigate('/explorer')}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            margin: '0 auto'
          }}
        >
          <FaArrowLeft style={{ marginRight: '8px' }} />
          Back to Explorer
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '8px 16px',
            background: '#e5e7eb',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <FaArrowLeft style={{ marginRight: '8px' }} />
          Back
        </button>
        
        <h1 style={{ margin: '0', color: '#1e3a8a' }}>Block #{block.index}</h1>
        <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
          Complete information about this block
        </p>
      </div>

      {/* Block Overview */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '30px', 
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FaCube style={{ fontSize: '32px', color: '#3b82f6', marginRight: '15px' }} />
          <div>
            <h3 style={{ margin: '0', color: '#1e3a8a' }}>Block #{block.index}</h3>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
              <FaCheckCircle style={{ color: '#10b981', marginRight: '8px' }} />
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>Confirmed</span>
              <span style={{ margin: '0 10px', color: '#d1d5db' }}>•</span>
              <span style={{ color: '#6b7280' }}>{formatTime(block.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Block Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <FaFileAlt style={{ fontSize: '24px', color: '#6b7280', marginBottom: '10px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>
              {block.transaction_count}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Transactions</div>
          </div>

          <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <FaCoins style={{ fontSize: '24px', color: '#6b7280', marginBottom: '10px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>
              {formatAmount(block.block_reward)}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Block Reward</div>
          </div>

          <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <FaHammer style={{ fontSize: '24px', color: '#6b7280', marginBottom: '10px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>
              {block.difficulty}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Difficulty</div>
          </div>

          <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
            <FaClock style={{ fontSize: '24px', color: '#6b7280', marginBottom: '10px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a' }}>
              {block.block_time.toFixed(2)}s
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Block Time</div>
          </div>
        </div>

        {/* Block Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => navigate(`/block/${block.index - 1}`)}
            disabled={block.index === 0}
            style={{
              padding: '8px 16px',
              background: block.index === 0 ? '#e5e7eb' : '#3b82f6',
              color: block.index === 0 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: block.index === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FaArrowLeft style={{ marginRight: '8px' }} />
            Previous Block
          </button>

          <span style={{ color: '#6b7280' }}>Block #{block.index}</span>

          <button
            onClick={() => navigate(`/block/${block.index + 1}`)}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            Next Block
            <FaChevronRight style={{ marginLeft: '8px' }} />
          </button>
        </div>
      </div>

      {/* Block Details */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '30px', 
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>Block Information</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '15px', alignItems: 'start' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Hash:</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all'
          }}>
            {block.hash}
            <button
              onClick={() => copyToClipboard(block.hash)}
              style={{
                marginLeft: '10px',
                padding: '4px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280'
              }}
            >
              <FaCopy />
            </button>
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Previous Hash:</div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all'
          }}>
            {block.previous_hash === '0' ? 'Genesis Block' : (
              <button
                onClick={() => navigate(`/block/${block.index - 1}`)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  wordBreak: 'break-all'
                }}
              >
                {block.previous_hash}
              </button>
            )}
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Merkle Root:</div>
          <div style={{ 
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all'
          }}>
            {block.merkle_root}
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Timestamp:</div>
          <div style={{ fontSize: '14px' }}>
            {formatTime(block.timestamp)}
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Miner:</div>
          <div style={{ 
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all'
          }}>
            {block.miner_address}
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Nonce:</div>
          <div style={{ fontSize: '14px' }}>
            {block.nonce}
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Total Fees:</div>
          <div style={{ fontSize: '14px' }}>
            {formatAmount(block.total_fees)} MYCOIN
          </div>

          <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: 'bold' }}>Block Size:</div>
          <div style={{ fontSize: '14px' }}>
            {block.block_size} bytes
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>
          Transactions ({block.transaction_count})
        </h3>
        
        {block.transactions && block.transactions.length > 0 ? (
          <div>
            {block.transactions.map((tx, index) => (
              <div key={index} style={{ 
                padding: '20px', 
                background: '#f9fafb', 
                marginBottom: '15px', 
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '10px' 
                    }}>
                      <FaHashtag style={{ color: '#3b82f6', marginRight: '8px' }} />
                      <button
                        onClick={() => navigate(`/transaction/${tx.transaction_id}`)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#3b82f6',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}
                      >
                        {formatHash(tx.transaction_id)}
                      </button>
                      <FaExternalLinkAlt style={{ marginLeft: '6px', fontSize: '12px', color: '#6b7280' }} />
                    </div>
                    
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>
                      <strong>From:</strong> {tx.from_address === '0' ? 'System (Mining)' : formatHash(tx.from_address)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '5px' }}>
                      <strong>To:</strong> {formatHash(tx.to_address)}
                    </div>
                    {tx.data && (
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        <strong>Data:</strong> {tx.data}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold', 
                      color: '#1e3a8a',
                      marginBottom: '5px'
                    }}>
                      {formatAmount(tx.amount)} MYCOIN
                    </div>
                    {tx.fee && parseFloat(tx.fee) > 0 && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>
                        Fee: {formatAmount(tx.fee)} MYCOIN
                      </div>
                    )}
                    <div style={{ fontSize: '12px' }}>
                      <span style={{ 
                        padding: '2px 6px', 
                        background: '#10b981', 
                        color: 'white', 
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>
                        {tx.transaction_type}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#6b7280' 
          }}>
            <FaFileAlt style={{ fontSize: '48px', marginBottom: '15px' }} />
            <div>No transactions in this block</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockDetailPage;
