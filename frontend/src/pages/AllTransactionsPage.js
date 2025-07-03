import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaExchangeAlt, 
  FaSpinner, 
  FaChevronLeft, 
  FaChevronRight, 
  FaAngleDoubleLeft, 
  FaAngleDoubleRight,
  FaCopy,
  FaArrowLeft
} from 'react-icons/fa';
import { transactionAPI } from '../services/api';
import { formatNumber, formatTime, formatTimeAgo } from '../utils/helpers';

const AllTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, itemsPerPage]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await transactionAPI.getTransactions(currentPage, itemsPerPage);
      setTransactions(data.transactions || []);
      setTotalTransactions(data.total || 0);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const shortenHash = (hash, start = 8, end = 6) => {
    if (!hash || hash.length <= start + end) return hash;
    return `${hash.substring(0, start)}...${hash.substring(hash.length - end)}`;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        padding: '20px',
        background: '#f8f9fa',
        borderTop: '1px solid #e9ecef'
      }}>
        {/* First Page */}
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            background: currentPage === 1 ? '#e9ecef' : '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            color: currentPage === 1 ? '#6c757d' : '#495057'
          }}
        >
          <FaAngleDoubleLeft />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            padding: '8px 12px',
            background: currentPage === 1 ? '#e9ecef' : '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            color: currentPage === 1 ? '#6c757d' : '#495057'
          }}
        >
          <FaChevronLeft />
        </button>

        {/* Page Numbers */}
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={{
              padding: '8px 12px',
              background: currentPage === page ? '#007bff' : '#fff',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              cursor: 'pointer',
              color: currentPage === page ? '#fff' : '#495057',
              fontWeight: currentPage === page ? 'bold' : 'normal'
            }}
          >
            {page}
          </button>
        ))}

        {/* Next Page */}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            background: currentPage === totalPages ? '#e9ecef' : '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            color: currentPage === totalPages ? '#6c757d' : '#495057'
          }}
        >
          <FaChevronRight />
        </button>

        {/* Last Page */}
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 12px',
            background: currentPage === totalPages ? '#e9ecef' : '#fff',
            border: '1px solid #dee2e6',
            borderRadius: '6px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            color: currentPage === totalPages ? '#6c757d' : '#495057'
          }}
        >
          <FaAngleDoubleRight />
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <Link 
            to="/explorer" 
            style={{ 
              color: '#007bff', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaArrowLeft /> Back to Explorer
          </Link>
        </div>
        <h1 style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          margin: '0 0 10px 0',
          color: '#212529'
        }}>
          <FaExchangeAlt style={{ color: '#28a745' }} />
          All Transactions
        </h1>
        <p style={{ color: '#6c757d', margin: 0 }}>
          A complete list of all transactions on the MyCoin blockchain
        </p>
      </div>

      {/* Controls */}
      <div style={{ 
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: '8px 8px 0 0',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#6c757d' }}>
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalTransactions)} of {formatNumber(totalTransactions)} transactions
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', color: '#495057' }}>Show:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 10px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span style={{ fontSize: '14px', color: '#495057' }}>entries</span>
        </div>
      </div>

      {/* Transactions Table */}
      <div style={{ 
        background: 'white',
        border: '1px solid #e9ecef',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <FaSpinner className="spin" style={{ fontSize: '32px', color: '#007bff', marginBottom: '10px' }} />
            <p style={{ color: '#6c757d', margin: 0 }}>Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Transaction Hash
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Block
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      From
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      To
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Amount
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Fee
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Status
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Age
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <tr key={tx.transaction_id || index} style={{ 
                      borderBottom: '1px solid #f1f3f4',
                      ':hover': { background: '#f8f9fa' }
                    }}>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link 
                            to={`/transaction/${tx.transaction_id}`}
                            style={{ 
                              color: '#007bff', 
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
                              padding: '2px'
                            }}
                            title="Copy transaction hash"
                          >
                            <FaCopy size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        {tx.block_index !== undefined ? (
                          <Link 
                            to={`/block/${tx.block_hash || tx.block_index}`}
                            style={{ 
                              color: '#007bff', 
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
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link 
                            to={`/wallet/${tx.from_address}`}
                            style={{ 
                              color: '#007bff', 
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              fontSize: '14px'
                            }}
                          >
                            {shortenHash(tx.from_address)}
                          </Link>
                          <button
                            onClick={() => copyToClipboard(tx.from_address)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6c757d',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                            title="Copy address"
                          >
                            <FaCopy size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link 
                            to={`/wallet/${tx.to_address}`}
                            style={{ 
                              color: '#007bff', 
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              fontSize: '14px'
                            }}
                          >
                            {shortenHash(tx.to_address)}
                          </Link>
                          <button
                            onClick={() => copyToClipboard(tx.to_address)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#6c757d',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                            title="Copy address"
                          >
                            <FaCopy size={12} />
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ fontWeight: '600', color: '#28a745' }}>
                          {formatNumber(tx.amount)} MYC
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ color: '#6c757d', fontSize: '14px' }}>
                          {formatNumber(tx.fee)} MYC
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          background: tx.status === 'mined' ? '#d4edda' : 
                                     tx.status === 'pending_notification' ? '#fff3cd' : 
                                     tx.status === 'confirmed' ? '#cce5ff' : '#f8d7da',
                          color: tx.status === 'mined' ? '#155724' : 
                                 tx.status === 'pending_notification' ? '#856404' : 
                                 tx.status === 'confirmed' ? '#004085' : '#721c24'
                        }}>
                          {tx.status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', color: '#6c757d', fontSize: '14px' }}>
                        {tx.timestamp ? formatTimeAgo(tx.timestamp) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        ) : (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <p style={{ color: '#6c757d', margin: 0, fontSize: '18px' }}>No transactions found</p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        
        tr:hover {
          background-color: #f8f9fa !important;
        }
      `}</style>
    </div>
  );
};

export default AllTransactionsPage;
