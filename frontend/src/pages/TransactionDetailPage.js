import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaArrowUp, 
  FaArrowDown, 
  FaCopy, 
  FaSpinner, 
  FaCheckCircle,
  FaExternalLinkAlt,
  FaClock,
  FaGasPump,
  FaHashtag
} from 'react-icons/fa';
import { transactionAPI, blockAPI } from '../services/api';

const TransactionDetailPage = () => {
  const { txId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTransactionDetail();
  }, [txId]);

  const loadTransactionDetail = async () => {
    try {
      setLoading(true);
      const data = await transactionAPI.getTransaction(txId);
      setTransaction(data);
    } catch (error) {
      console.error('Error loading transaction:', error);
      setError('Transaction not found');
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

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '60vh' 
      }}>
        <FaSpinner style={{ fontSize: '24px', animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: '10px' }}>Loading transaction...</span>
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
        <h2 style={{ color: '#dc2626', marginBottom: '20px' }}>Transaction Not Found</h2>
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
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px' }}>
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
        
        <h1 style={{ margin: '0', color: '#1e3a8a' }}>Transaction Details</h1>
        <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
          Complete information about this transaction
        </p>
      </div>

      {/* Transaction Overview */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '30px', 
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          {transaction.transaction_type === 'transfer' ? (
            <FaArrowUp style={{ fontSize: '24px', color: '#3b82f6', marginRight: '15px' }} />
          ) : (
            <FaHashtag style={{ fontSize: '24px', color: '#10b981', marginRight: '15px' }} />
          )}
          <div>
            <h3 style={{ margin: '0', color: '#1e3a8a' }}>
              {transaction.transaction_type === 'transfer' ? 'Transfer Transaction' : 'Mining Reward'}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '5px' }}>
              <FaCheckCircle style={{ color: '#10b981', marginRight: '8px' }} />
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>Confirmed</span>
              <span style={{ margin: '0 10px', color: '#d1d5db' }}>•</span>
              <span style={{ color: '#6b7280' }}>{transaction.confirmations} confirmations</span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div style={{ 
          background: '#f3f4f6', 
          padding: '20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '5px' }}>AMOUNT</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e3a8a' }}>
            {formatAmount(transaction.amount)} MYCOIN
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            ≈ ${(parseFloat(transaction.amount) * 0.1).toFixed(2)} USD
          </div>
        </div>

        {/* Transaction Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>TRANSACTION HASH</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: '10px', 
              background: '#f9fafb', 
              borderRadius: '6px',
              wordBreak: 'break-all',
              fontFamily: 'monospace',
              fontSize: '14px'
            }}>
              {transaction.transaction_id}
              <button
                onClick={() => copyToClipboard(transaction.transaction_id)}
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
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>STATUS</div>
            <div style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#dcfce7',
              color: '#166534',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              <FaCheckCircle style={{ marginRight: '6px' }} />
              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>TIMESTAMP</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '14px',
              color: '#374151'
            }}>
              <FaClock style={{ marginRight: '8px', color: '#6b7280' }} />
              {formatTime(transaction.timestamp)}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>BLOCK</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '14px'
            }}>
              <button
                onClick={() => navigate(`/block/${transaction.block_hash}`)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                #{transaction.block_index}
                <FaExternalLinkAlt style={{ marginLeft: '6px', fontSize: '12px' }} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* From/To Details */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '30px', 
        marginBottom: '20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>Transfer Details</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '20px', alignItems: 'center' }}>
          {/* From */}
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>FROM</div>
            <div style={{ 
              padding: '15px', 
              background: '#fef3c7', 
              borderRadius: '8px',
              border: '1px solid #f59e0b'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                {transaction.from_address === '0' ? 'System (Mining Reward)' : 'Address'}
              </div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '13px', 
                wordBreak: 'break-all',
                color: '#92400e'
              }}>
                {transaction.from_address}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div style={{ textAlign: 'center' }}>
            <FaArrowRight style={{ fontSize: '24px', color: '#6b7280' }} />
          </div>

          {/* To */}
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>TO</div>
            <div style={{ 
              padding: '15px', 
              background: '#dcfce7', 
              borderRadius: '8px',
              border: '1px solid #10b981'
            }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>Address</div>
              <div style={{ 
                fontFamily: 'monospace', 
                fontSize: '13px', 
                wordBreak: 'break-all',
                color: '#166534'
              }}>
                {transaction.to_address}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>Technical Details</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>TRANSACTION FEE</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              fontSize: '16px',
              fontWeight: 'bold',
              color: '#374151'
            }}>
              <FaGasPump style={{ marginRight: '8px', color: '#6b7280' }} />
              {formatAmount(transaction.fee)} MYCOIN
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>GAS USED</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>
              {transaction.gas_used} Gas
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>GAS PRICE</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>
              {formatAmount(transaction.gas_price)} MYCOIN
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>NONCE</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151' }}>
              {transaction.nonce}
            </div>
          </div>
        </div>

        {transaction.data && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>TRANSACTION DATA</div>
            <div style={{ 
              padding: '15px', 
              background: '#f3f4f6', 
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '14px',
              wordBreak: 'break-all'
            }}>
              {transaction.data}
            </div>
          </div>
        )}

        {transaction.signature && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>SIGNATURE</div>
            <div style={{ 
              padding: '15px', 
              background: '#f3f4f6', 
              borderRadius: '6px',
              fontFamily: 'monospace',
              fontSize: '14px',
              wordBreak: 'break-all'
            }}>
              {transaction.signature}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Missing import
const FaArrowRight = ({ style }) => (
  <span style={{ ...style, display: 'inline-block', transform: 'rotate(0deg)' }}>→</span>
);

export default TransactionDetailPage;
