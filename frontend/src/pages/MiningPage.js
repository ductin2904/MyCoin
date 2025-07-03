import React, { useState, useEffect } from 'react';
import { 
  FaHammer, 
  FaCoins, 
  FaSpinner, 
  FaMicrochip,
  FaThermometerHalf,
  FaPlay,
  FaStop,
  FaUsers,
  FaTrophy,
  FaClock,
  FaDatabase,
  FaExclamationTriangle
} from 'react-icons/fa';
import { blockAPI, networkAPI } from '../services/api';

const MiningPage = () => {
  const [stats, setStats] = useState(null);
  const [miningPools, setMiningPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mining, setMining] = useState(false);
  const [miningData, setMiningData] = useState({
    minerAddress: '',
    reward: '10',
    difficulty: 2
  });
  const [miningResult, setMiningResult] = useState(null);
  const [hashRate, setHashRate] = useState(0);

  useEffect(() => {
    loadMiningData();
  }, []);

  const loadMiningData = async () => {
    try {
      setLoading(true);
      const [statsData, poolsData] = await Promise.all([
        networkAPI.getStats().catch(() => null),
        networkAPI.getMiningPools().catch(() => ({ mining_pools: [] }))
      ]);
      
      setStats(statsData?.stats || null);
      setMiningPools(poolsData?.mining_pools || []);
      
      if (statsData?.stats) {
        setMiningData(prev => ({
          ...prev,
          difficulty: statsData.stats.difficulty
        }));
      }
    } catch (error) {
      console.error('Error loading mining data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMiningFormChange = (e) => {
    setMiningData({
      ...miningData,
      [e.target.name]: e.target.value
    });
  };

  const startMining = async () => {
    if (!miningData.minerAddress.trim()) {
      alert('Please enter a miner address');
      return;
    }

    try {
      setMining(true);
      setMiningResult(null);
      setHashRate(0);

      // Simulate mining process with hash rate calculation
      const miningInterval = setInterval(() => {
        setHashRate(prev => prev + Math.random() * 1000);
      }, 100);

      const miningPayload = {
        miner_address: miningData.minerAddress,
        reward: parseFloat(miningData.reward)
      };

      const result = await blockAPI.mineBlock(miningPayload);
      
      clearInterval(miningInterval);
      
      if (result.success) {
        setMiningResult(result);
        // Refresh data after successful mining
        await loadMiningData();
      } else {
        throw new Error(result.error || 'Mining failed');
      }
    } catch (error) {
      console.error('Mining error:', error);
      alert('Mining failed: ' + (error.error || error.message));
    } finally {
      setMining(false);
      setHashRate(0);
    }
  };

  const stopMining = () => {
    setMining(false);
    setHashRate(0);
  };

  const formatHashRate = (rate) => {
    if (rate >= 1000000) {
      return (rate / 1000000).toFixed(2) + ' MH/s';
    } else if (rate >= 1000) {
      return (rate / 1000).toFixed(2) + ' KH/s';
    }
    return rate.toFixed(2) + ' H/s';
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(8);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
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
        <span style={{ marginLeft: '10px' }}>Loading mining data...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0', color: '#1e3a8a', display: 'flex', alignItems: 'center' }}>
          <FaHammer style={{ marginRight: '15px' }} />
          MyCoin Mining
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
          Mine new blocks and earn MyCoin rewards
        </p>
      </div>

      {/* Mining Stats Overview */}
      {stats && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ 
            background: 'white', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <FaDatabase style={{ fontSize: '32px', color: '#3b82f6', marginBottom: '15px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
              {stats.total_blocks}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Blocks</div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <FaThermometerHalf style={{ fontSize: '32px', color: '#f59e0b', marginBottom: '15px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
              {stats.difficulty}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Difficulty</div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <FaClock style={{ fontSize: '32px', color: '#10b981', marginBottom: '15px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
              {stats.avg_block_time ? stats.avg_block_time.toFixed(2) : '0'}s
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Avg Block Time</div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <FaCoins style={{ fontSize: '32px', color: '#059669', marginBottom: '15px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
              {stats.mining_reward}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Mining Reward</div>
          </div>
        </div>
      )}

      {/* Mining Interface */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', 
        gap: '30px', 
        marginBottom: '30px' 
      }}>
        {/* Mining Control */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>Start Mining</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Miner Address *
            </label>
            <input
              type="text"
              name="minerAddress"
              value={miningData.minerAddress}
              onChange={handleMiningFormChange}
              placeholder="Enter your wallet address"
              disabled={mining}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Block Reward (MYCOIN)
            </label>
            <input
              type="number"
              name="reward"
              value={miningData.reward}
              onChange={handleMiningFormChange}
              step="0.1"
              min="0"
              disabled={mining}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Difficulty Level
            </label>
            <input
              type="number"
              name="difficulty"
              value={miningData.difficulty}
              onChange={handleMiningFormChange}
              min="1"
              max="10"
              disabled={true}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: '#f3f4f6'
              }}
            />
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>
              Difficulty is automatically adjusted by the network
            </div>
          </div>

          {!mining ? (
            <button
              onClick={startMining}
              disabled={!miningData.minerAddress.trim()}
              style={{
                width: '100%',
                padding: '15px',
                background: !miningData.minerAddress.trim() ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: !miningData.minerAddress.trim() ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaPlay style={{ marginRight: '8px' }} />
              Start Mining
            </button>
          ) : (
            <button
              onClick={stopMining}
              style={{
                width: '100%',
                padding: '15px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaStop style={{ marginRight: '8px' }} />
              Stop Mining
            </button>
          )}

          {/* Warning */}
          <div style={{ 
            marginTop: '20px',
            padding: '15px', 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            <FaExclamationTriangle style={{ marginRight: '8px' }} />
            <strong>Notice:</strong> Mining requires computational power and may take time to find a valid block.
          </div>
        </div>

        {/* Mining Status */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>Mining Status</h3>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <FaMicrochip style={{ 
              fontSize: '48px', 
              color: mining ? '#10b981' : '#9ca3af',
              marginBottom: '15px'
            }} />
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: mining ? '#10b981' : '#6b7280',
              marginBottom: '10px'
            }}>
              {mining ? 'Mining Active' : 'Mining Idle'}
            </div>
            
            {mining && (
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
                  {formatHashRate(hashRate)}
                </div>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>Current Hash Rate</div>
              </div>
            )}
          </div>

          {mining && (
            <div style={{ 
              padding: '15px', 
              background: '#eff6ff', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <FaSpinner style={{ 
                  marginRight: '10px', 
                  animation: 'spin 1s linear infinite',
                  color: '#3b82f6'
                }} />
                <span style={{ color: '#1e40af', fontWeight: 'bold' }}>
                  Searching for valid block...
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Attempting to find a block with difficulty {miningData.difficulty}
              </div>
            </div>
          )}

          {miningResult && (
            <div style={{ 
              padding: '15px', 
              background: '#dcfce7', 
              border: '1px solid #10b981',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <FaTrophy style={{ marginRight: '10px', color: '#059669' }} />
                <span style={{ color: '#059669', fontWeight: 'bold' }}>
                  Block Mined Successfully!
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#166534', marginBottom: '5px' }}>
                <strong>Block #{miningResult.block.index}</strong>
              </div>
              <div style={{ fontSize: '12px', color: '#166534', marginBottom: '5px' }}>
                Hash: {miningResult.block.hash?.substring(0, 32)}...
              </div>
              <div style={{ fontSize: '12px', color: '#166534' }}>
                Reward: {formatAmount(miningResult.block.block_reward)} MYCOIN
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mining Pools */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>
          <FaUsers style={{ marginRight: '10px' }} />
          Mining Pools ({miningPools.length})
        </h3>
        
        {miningPools.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                    Miner Address
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                    Blocks Mined
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                    Total Rewards
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                    Efficiency
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                    Last Block
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {miningPools.map((pool, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '13px' }}>
                      {pool.miner_address?.substring(0, 20)}...
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold' }}>
                      {pool.blocks_mined}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {formatAmount(pool.total_rewards)} MYCOIN
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '14px' }}>
                      {pool.efficiency?.toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
                      {pool.last_block_time ? formatTime(pool.last_block_time) : 'Never'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        background: pool.is_active ? '#dcfce7' : '#fee2e2', 
                        color: pool.is_active ? '#166534' : '#991b1b',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {pool.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#6b7280' 
          }}>
            <FaUsers style={{ fontSize: '48px', marginBottom: '15px' }} />
            <div>No mining pools found</div>
            <div style={{ fontSize: '14px', marginTop: '10px' }}>
              Start mining to appear in the mining pools list
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MiningPage;
