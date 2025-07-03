import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaCubes, 
  FaSearch, 
  FaSpinner, 
  FaExchangeAlt, 
  FaChartLine,
  FaCoins,
  FaGlobe,
  FaClock,
  FaArrowRight,
  FaExternalLinkAlt,
  FaChevronRight,
  FaDatabase,
  FaNetworkWired,
  FaTachometerAlt
} from 'react-icons/fa';
import { blockAPI, networkAPI, transactionAPI } from '../services/api';
import { formatNumber, formatTime, formatTimeAgo } from '../utils/helpers';

const ExplorerPage = () => {
  const [blocks, setBlocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch blocks, stats, and latest transactions
      const [blocksData, statsData, transactionsData] = await Promise.all([
        blockAPI.getBlocks(1, 6).catch(() => ({ results: [] })),
        networkAPI.getStats().catch(() => ({ stats: null })),
        transactionAPI.getTransactions(1, 6).catch(() => ({ transactions: [] }))
      ]);
      
      setBlocks(blocksData.results || blocksData);
      setStats(statsData.stats || {
        total_blocks: 27,
        difficulty: 2,
        total_transactions: 50,
        total_addresses: 10
      });
      
      // Use real transaction data
      setTransactions(transactionsData.transactions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchLoading(true);
      const result = await networkAPI.search(searchQuery.trim());
      // Handle search result based on type
      if (result.type === 'block') {
        window.location.href = `/block/${result.data.hash}`;
      } else if (result.type === 'transaction') {
        window.location.href = `/transaction/${result.data.hash}`;
      } else if (result.type === 'address') {
        window.location.href = `/wallet/${result.data.address}`;
      }
    } catch (error) {
      console.error('Search error:', error);
      alert('No results found for your search.');
    } finally {
      setSearchLoading(false);
    }
  };

  const shortenHash = (hash, start = 8, end = 6) => {
    if (!hash || hash.length <= start + end) return hash;
    return `${hash.substring(0, start)}...${hash.substring(hash.length - end)}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header Section */}
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        backdropFilter: 'blur(10px)',
        padding: '40px 0',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ 
              color: 'white', 
              fontSize: '48px', 
              margin: '0 0 10px 0',
              fontWeight: 'bold',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)'
            }}>
              The MyCoin Blockchain Explorer
            </h1>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '18px', 
              margin: 0 
            }}>
              Search the MyCoin blockchain for transactions, addresses, blocks, and more
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} style={{ 
            maxWidth: '600px', 
            margin: '0 auto',
            position: 'relative'
          }}>
            <div style={{ 
              display: 'flex', 
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              overflow: 'hidden'
            }}>
              <select style={{
                padding: '15px',
                border: 'none',
                background: '#f8f9fa',
                color: '#495057',
                fontSize: '14px',
                minWidth: '120px'
              }}>
                <option>All Filters</option>
                <option>Addresses</option>
                <option>Transactions</option>
                <option>Blocks</option>
              </select>
              <input
                type="text"
                placeholder="Search by Address / Txn Hash / Block / Token / Domain Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  padding: '15px 20px',
                  border: 'none',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={searchLoading}
                style={{
                  padding: '15px 25px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {searchLoading ? <FaSpinner className="spin" /> : <FaSearch />}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginBottom: '40px'
        }}>
          {/* MyCoin Price */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px'
            }}>
              💰
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                MYCOIN PRICE
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>
                $2,590.80 <span style={{ fontSize: '16px', color: '#28a745' }}>📈 +5.56%</span>
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                @ 0.023617 BTC
              </div>
            </div>
          </div>

          {/* Blocks */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #007bff, #0056b3)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              <FaCubes />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                BLOCKS
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#212529' }}>
                {formatNumber(stats?.total_blocks || 27)}
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                DIFFICULTY: {stats?.difficulty || 2}
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #17a2b8, #138496)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              <FaExchangeAlt />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                TRANSACTIONS
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#212529' }}>
                {formatNumber(stats?.total_transactions || 50)} <span style={{ fontSize: '14px', color: '#6c757d' }}>(17.6 TPS)</span>
              </div>
              <div style={{ fontSize: '14px', color: '#6c757d' }}>
                MED GAS PRICE: 1.407 Gwei ($0.08)
              </div>
            </div>
          </div>

          {/* Transaction History Chart */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #28a745, #20c997)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px'
            }}>
              <FaChartLine />
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6c757d', marginBottom: '4px' }}>
                TRANSACTION HISTORY IN 14 DAYS
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#212529' }}>
                1.800k
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '8px' }}>
                <div style={{ 
                  width: '60px', 
                  height: '20px', 
                  background: 'linear-gradient(90deg, #28a745, #17a2b8)',
                  borderRadius: '4px'
                }}></div>
                <span style={{ fontSize: '12px', color: '#6c757d' }}>📈 Growth trend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Latest Blocks and Transactions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Latest Blocks */}
          <div style={{ background: 'white', border: '1px solid #e3e6ea', borderRadius: '8px' }}>
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #e3e6ea',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaCubes style={{ color: '#007bff' }} />
              <h2 style={{ margin: 0 }}>Latest Blocks</h2>
            </div>
            
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <FaSpinner className="spin" style={{ fontSize: '24px', color: '#007bff' }} />
                <p style={{ marginTop: '10px', color: '#666' }}>Loading blocks...</p>
              </div>
            ) : blocks.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>Block #</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>Hash</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>Transactions</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blocks.map((block, index) => (
                      <tr key={block.hash || index} style={{ borderBottom: '1px solid #f8f9fa' }}>
                        <td style={{ padding: '15px' }}>
                          <Link 
                            to={`/block/${block.hash}`}
                            style={{ color: '#007bff', textDecoration: 'none' }}
                          >
                            #{block.index || index}
                          </Link>
                        </td>
                        <td style={{ padding: '15px', fontFamily: 'monospace', fontSize: '14px' }}>
                          <Link 
                            to={`/block/${block.hash}`}
                            style={{ color: '#007bff', textDecoration: 'none' }}
                          >
                            {block.hash ? `${block.hash.substring(0, 16)}...` : 'N/A'}
                          </Link>
                        </td>
                        <td style={{ padding: '15px' }}>
                          {block.transactions?.length || 0}
                        </td>
                        <td style={{ padding: '15px', color: '#666' }}>
                          {block.timestamp ? formatTime(block.timestamp) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#666' }}>No blocks found</p>
              </div>
            )}
          </div>

          {/* Latest Transactions */}
          <div style={{ background: 'white', border: '1px solid #e3e6ea', borderRadius: '8px' }}>
            <div style={{ 
              padding: '20px', 
              borderBottom: '1px solid #e3e6ea',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaExchangeAlt style={{ color: '#28a745' }} />
              <h2 style={{ margin: 0 }}>Latest Transactions</h2>
            </div>
            
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <FaSpinner className="spin" style={{ fontSize: '24px', color: '#007bff' }} />
                <p style={{ marginTop: '10px', color: '#666' }}>Loading transactions...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>Tx Hash</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>From</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>To</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>Amount</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'left', borderBottom: '1px solid #e3e6ea' }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, index) => (
                      <tr key={tx.transaction_id || index} style={{ borderBottom: '1px solid #f8f9fa' }}>
                        <td style={{ padding: '15px', fontFamily: 'monospace', fontSize: '14px' }}>
                          <Link 
                            to={`/transaction/${tx.transaction_id}`}
                            style={{ color: '#007bff', textDecoration: 'none' }}
                          >
                            {tx.transaction_id ? `${tx.transaction_id.substring(0, 16)}...` : 'N/A'}
                          </Link>
                        </td>
                        <td style={{ padding: '15px', fontFamily: 'monospace', fontSize: '14px' }}>
                          <Link 
                            to={`/wallet/${tx.from_address}`}
                            style={{ color: '#007bff', textDecoration: 'none' }}
                          >
                            {tx.from_address ? `${tx.from_address.substring(0, 8)}...${tx.from_address.substring(tx.from_address.length - 6)}` : 'N/A'}
                          </Link>
                        </td>
                        <td style={{ padding: '15px', fontFamily: 'monospace', fontSize: '14px' }}>
                          <Link 
                            to={`/wallet/${tx.to_address}`}
                            style={{ color: '#007bff', textDecoration: 'none' }}
                          >
                            {tx.to_address ? `${tx.to_address.substring(0, 8)}...${tx.to_address.substring(tx.to_address.length - 6)}` : 'N/A'}
                          </Link>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                            {formatNumber(tx.amount)} MYC
                          </span>
                        </td>
                        <td style={{ padding: '15px' }}>
                          <span 
                            style={{ 
                              padding: '4px 8px', 
                              borderRadius: '4px', 
                              fontSize: '12px',
                              background: tx.status === 'mined' ? '#d4edda' : 
                                         tx.status === 'pending_notification' ? '#fff3cd' : 
                                         tx.status === 'confirmed' ? '#cce5ff' : '#f8d7da',
                              color: tx.status === 'mined' ? '#155724' : 
                                     tx.status === 'pending_notification' ? '#856404' : 
                                     tx.status === 'confirmed' ? '#004085' : '#721c24'
                            }}
                          >
                            {tx.status || 'pending'}
                          </span>
                        </td>
                        <td style={{ padding: '15px', color: '#666' }}>
                          {tx.timestamp ? formatTimeAgo(tx.timestamp) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: '#666' }}>No transactions found</p>
              </div>
            )}
          </div>
        </div>

        {/* View All Links */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '20px', 
          gap: '20px' 
        }}>
          <Link 
            to="/blocks" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: '#007bff', 
              textDecoration: 'none',
              padding: '10px 20px',
              border: '1px solid #007bff',
              borderRadius: '6px',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <FaCubes />
            View All Blocks
            <FaArrowRight />
          </Link>
          <Link 
            to="/transactions" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              color: '#28a745', 
              textDecoration: 'none',
              padding: '10px 20px',
              border: '1px solid #28a745',
              borderRadius: '6px',
              flex: 1,
              justifyContent: 'center'
            }}
          >
            <FaExchangeAlt />
            View All Transactions
            <FaArrowRight />
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ExplorerPage;
