import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowUp, FaArrowDown, FaExternalLinkAlt, FaCopy } from 'react-icons/fa';
import { formatTime, formatNumber } from '../utils/helpers';

const TransactionTable = ({ transactions, currentAddress }) => {
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // Could add toast notification here
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'confirmed': { bg: '#d4edda', color: '#155724', icon: '✓' },
      'pending_notification': { bg: '#fff3cd', color: '#856404', icon: '⏳' },
      'pending_confirmation': { bg: '#ffeaa7', color: '#b78108', icon: '⏱️' },
      'pending': { bg: '#e2e3e5', color: '#495057', icon: '⏳' },
      'rejected': { bg: '#f8d7da', color: '#721c24', icon: '✗' }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: config.bg,
        color: config.color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span>{config.icon}</span>
        {status ? status.replace('_', ' ').toUpperCase() : 'PENDING'}
      </span>
    );
  };

  const shortenHash = (hash, startLength = 8, endLength = 6) => {
    if (!hash || hash.length <= startLength + endLength) return hash;
    return `${hash.substring(0, startLength)}...${hash.substring(hash.length - endLength)}`;
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '60px 20px',
        background: '#f8f9fa',
        borderRadius: '12px',
        border: '2px dashed #dee2e6'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📋</div>
        <h3 style={{ color: '#6c757d', marginBottom: '8px' }}>No transactions found</h3>
        <p style={{ color: '#adb5bd', margin: 0 }}>
          Transaction history will appear here once you start sending or receiving MYC
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)',
          padding: '8px',
          borderRadius: '8px'
        }}>
          📊
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px' }}>Transaction History</h3>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>
            {transactions.length} total transaction{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #e9ecef' }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Type
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Transaction Hash
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Block
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                From / To
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Amount
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Fee
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Status
              </th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#495057' }}>
                Age
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => {
              const isOutgoing = tx.from_address === currentAddress;
              const counterparty = isOutgoing ? tx.to_address : tx.from_address;
              
              return (
                <tr 
                  key={tx.transaction_id || index} 
                  style={{ 
                    borderBottom: '1px solid #f1f3f4',
                    transition: 'background-color 0.2s',
                    ':hover': { background: '#f8f9fa' }
                  }}
                  onMouseEnter={(e) => e.target.closest('tr').style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.target.closest('tr').style.background = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isOutgoing ? '#fff5f5' : '#f0fff4',
                        color: isOutgoing ? '#e53e3e' : '#38a169'
                      }}>
                        {isOutgoing ? <FaArrowUp /> : <FaArrowDown />}
                      </div>
                      <span style={{ fontWeight: '500', color: isOutgoing ? '#e53e3e' : '#38a169' }}>
                        {isOutgoing ? 'OUT' : 'IN'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Link 
                        to={`/transaction/${tx.transaction_id}`}
                        style={{ 
                          color: '#0066cc', 
                          textDecoration: 'none',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        {shortenHash(tx.transaction_id)}
                      </Link>
                      <button
                        onClick={() => copyToClipboard(tx.transaction_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6c757d',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        title="Copy transaction hash"
                      >
                        <FaCopy size={12} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {tx.block_index !== undefined ? (
                      <Link 
                        to={`/block/${tx.block_hash || tx.block_index}`}
                        style={{ 
                          color: '#0066cc', 
                          textDecoration: 'none',
                          fontWeight: '500'
                        }}
                      >
                        #{tx.block_index}
                      </Link>
                    ) : (
                      <span style={{ color: '#6c757d', fontStyle: 'italic' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                        {shortenHash(counterparty, 6, 4)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(counterparty)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6c757d',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        title="Copy address"
                      >
                        <FaCopy size={12} />
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      fontWeight: '600',
                      color: isOutgoing ? '#e53e3e' : '#38a169'
                    }}>
                      {isOutgoing ? '-' : '+'}{formatNumber(tx.amount)} MYC
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ color: '#6c757d', fontSize: '14px' }}>
                      {formatNumber(tx.fee)} MYC
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {getStatusBadge(tx.status)}
                  </td>
                  <td style={{ padding: '16px', color: '#6c757d', fontSize: '14px' }}>
                    {tx.timestamp ? formatTime(tx.timestamp) : 'N/A'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ 
        background: '#f8f9fa',
        padding: '16px 20px',
        borderTop: '1px solid #e9ecef',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
        color: '#6c757d'
      }}>
        <span>
          Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </span>
        <Link 
          to="/explorer"
          style={{ 
            color: '#0066cc', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          View on Explorer <FaExternalLinkAlt size={12} />
        </Link>
      </div>
    </div>
  );
};

export default TransactionTable;
