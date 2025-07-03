import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCubes, 
  FaSpinner, 
  FaChevronLeft, 
  FaChevronRight, 
  FaAngleDoubleLeft, 
  FaAngleDoubleRight,
  FaCopy,
  FaArrowLeft
} from 'react-icons/fa';
import { blockAPI } from '../services/api';
import { formatNumber, formatTime, formatTimeAgo } from '../utils/helpers';

const AllBlocksPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    fetchBlocks();
  }, [currentPage, itemsPerPage]);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const data = await blockAPI.getBlocks(currentPage, itemsPerPage);
      setBlocks(data.blocks || []);
      setTotalBlocks(data.total || 0);
    } catch (error) {
      console.error('Error fetching blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalBlocks / itemsPerPage);

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
          <FaCubes style={{ color: '#007bff' }} />
          All Blocks
        </h1>
        <p style={{ color: '#6c757d', margin: 0 }}>
          A complete list of all blocks on the MyCoin blockchain
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
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalBlocks)} of {formatNumber(totalBlocks)} blocks
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

      {/* Blocks Table */}
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
            <p style={{ color: '#6c757d', margin: 0 }}>Loading blocks...</p>
          </div>
        ) : blocks.length > 0 ? (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Block #
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Age
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Txn
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Miner
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Difficulty
                    </th>
                    <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e9ecef', fontWeight: '600' }}>
                      Hash
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map((block, index) => (
                    <tr key={block.id || index} style={{ 
                      borderBottom: '1px solid #f1f3f4',
                      ':hover': { background: '#f8f9fa' }
                    }}>
                      <td style={{ padding: '15px' }}>
                        <Link 
                          to={`/block/${block.hash}`}
                          style={{ 
                            color: '#007bff', 
                            textDecoration: 'none',
                            fontWeight: '600'
                          }}
                        >
                          {block.index}
                        </Link>
                      </td>
                      <td style={{ padding: '15px', color: '#6c757d', fontSize: '14px' }}>
                        {block.timestamp ? formatTimeAgo(block.timestamp) : 'N/A'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{ 
                          background: '#e3f2fd',
                          color: '#1976d2',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {block.transaction_count || 0}
                        </span>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            color: '#495057'
                          }}>
                            {shortenHash(block.miner || 'BuilderNet')}
                          </span>
                          {block.miner && (
                            <button
                              onClick={() => copyToClipboard(block.miner)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#6c757d',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                              title="Copy miner address"
                            >
                              <FaCopy size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '15px', color: '#495057', fontSize: '14px' }}>
                        {block.difficulty || 'N/A'}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Link 
                            to={`/block/${block.hash}`}
                            style={{ 
                              color: '#007bff', 
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              fontSize: '14px'
                            }}
                          >
                            {shortenHash(block.hash)}
                          </Link>
                          {block.hash && (
                            <button
                              onClick={() => copyToClipboard(block.hash)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#6c757d',
                                cursor: 'pointer',
                                padding: '2px'
                              }}
                              title="Copy block hash"
                            >
                              <FaCopy size={12} />
                            </button>
                          )}
                        </div>
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
            <p style={{ color: '#6c757d', margin: 0, fontSize: '18px' }}>No blocks found</p>
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

export default AllBlocksPage;
