import React, { useState, useEffect } from 'react';
import { 
  FaCoins, 
  FaSpinner, 
  FaPlay,
  FaTrophy,
  FaLock,
  FaUnlock,
  FaInfoCircle,
  FaPercentage
} from 'react-icons/fa';
import { networkAPI } from '../services/api';

const StakingPage = () => {
  const [stats, setStats] = useState(null);
  // const [stakingPools, setStakingPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staking, setStaking] = useState(false);
  const [stakingData, setStakingData] = useState({
    staker_address: '',
    amount: '',
    duration: '30' // days
  });
  const [myStakes, setMyStakes] = useState([]);

  useEffect(() => {
    loadStakingData();
  }, []);

  const loadStakingData = async () => {
    try {
      setLoading(true);
      const [statsData, poolsData] = await Promise.all([
        networkAPI.getStats().catch(() => null),
        networkAPI.getStakingPools().catch(() => ({ staking_pools: [] }))
      ]);
      
      setStats(statsData?.stats || null);
      // setStakingPools(poolsData?.staking_pools || []);
      
      // Load user's stakes from localStorage (in real app, this would come from backend)
      const savedStakes = localStorage.getItem('mycoin_stakes');
      if (savedStakes) {
        setMyStakes(JSON.parse(savedStakes));
      }
    } catch (error) {
      console.error('Error loading staking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStakingFormChange = (e) => {
    setStakingData({
      ...stakingData,
      [e.target.name]: e.target.value
    });
  };

  const calculateAPY = (duration) => {
    // Simple APY calculation based on duration
    const basePart = 5; // 5% base
    const durationBonus = duration / 365 * 10; // Up to 10% bonus for 1 year
    return Math.min(basePart + durationBonus, 15); // Max 15% APY
  };

  const calculateRewards = (amount, duration) => {
    const apy = calculateAPY(duration);
    const dailyRate = apy / 100 / 365;
    return amount * dailyRate * duration;
  };

  const startStaking = () => {
    if (!stakingData.staker_address.trim() || !stakingData.amount || parseFloat(stakingData.amount) <= 0) {
      alert('Please enter valid staker address and amount');
      return;
    }

    try {
      setStaking(true);
      
      // Simulate staking process
      setTimeout(() => {
        const newStake = {
          id: Date.now(),
          staker_address: stakingData.staker_address,
          amount: parseFloat(stakingData.amount),
          duration: parseInt(stakingData.duration),
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + parseInt(stakingData.duration) * 24 * 60 * 60 * 1000).toISOString(),
          apy: calculateAPY(parseInt(stakingData.duration)),
          status: 'active',
          rewards_earned: 0
        };

        const updatedStakes = [...myStakes, newStake];
        setMyStakes(updatedStakes);
        localStorage.setItem('mycoin_stakes', JSON.stringify(updatedStakes));
        
        setStakingData({
          staker_address: '',
          amount: '',
          duration: '30'
        });
        
        setStaking(false);
        alert('Staking started successfully!');
      }, 2000);
      
    } catch (error) {
      console.error('Staking error:', error);
      alert('Staking failed: ' + error.message);
      setStaking(false);
    }
  };

  const unstakeCoins = (stakeId) => {
    const stake = myStakes.find(s => s.id === stakeId);
    if (!stake) return;

    const now = new Date();
    const endDate = new Date(stake.end_date);
    const isEarly = now < endDate;
    
    if (isEarly) {
      const confirm = window.confirm('Unstaking early will result in reduced rewards. Continue?');
      if (!confirm) return;
    }

    // Calculate final rewards
    const daysStaked = Math.floor((now - new Date(stake.start_date)) / (1000 * 60 * 60 * 24));
    const finalRewards = calculateRewards(stake.amount, Math.min(daysStaked, stake.duration));
    const penalty = isEarly ? finalRewards * 0.5 : 0; // 50% penalty for early unstaking
    
    const updatedStakes = myStakes.map(s => 
      s.id === stakeId 
        ? { ...s, status: 'completed', rewards_earned: finalRewards - penalty, end_date: now.toISOString() }
        : s
    );
    
    setMyStakes(updatedStakes);
    localStorage.setItem('mycoin_stakes', JSON.stringify(updatedStakes));
    
    alert(`Unstaked successfully! Rewards: ${(finalRewards - penalty).toFixed(6)} MYCOIN`);
  };

  const formatAmount = (amount) => {
    return parseFloat(amount || 0).toFixed(6);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getDaysRemaining = (endDate) => {
    const now = new Date();
    const end = new Date(endDate);
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
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
        <span style={{ marginLeft: '10px' }}>Loading staking data...</span>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0', color: '#1e3a8a', display: 'flex', alignItems: 'center' }}>
          <FaCoins style={{ marginRight: '15px' }} />
          MyCoin Staking
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#6b7280' }}>
          Stake your MyCoin and earn passive rewards
        </p>
      </div>

      {/* Staking Stats Overview */}
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
            <FaCoins style={{ fontSize: '32px', color: '#10b981', marginBottom: '15px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
              {formatAmount(stats.total_supply)}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Supply</div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <FaLock style={{ fontSize: '32px', color: '#3b82f6', marginBottom: '15px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
              {myStakes.filter(s => s.status === 'active').length}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Active Stakes</div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <FaPercentage style={{ fontSize: '32px', color: '#f59e0b', marginBottom: '15px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
              5-15%
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>APY Range</div>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '25px', 
            borderRadius: '12px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <FaTrophy style={{ fontSize: '32px', color: '#059669', marginBottom: '15px' }} />
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '5px' }}>
              {formatAmount(myStakes.reduce((sum, stake) => sum + stake.rewards_earned, 0))}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Total Rewards</div>
          </div>
        </div>
      )}

      {/* Staking Interface */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', 
        gap: '30px', 
        marginBottom: '30px' 
      }}>
        {/* Staking Form */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>Start Staking</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Staker Address *
            </label>
            <input
              type="text"
              name="staker_address"
              value={stakingData.staker_address}
              onChange={handleStakingFormChange}
              placeholder="Enter your wallet address"
              disabled={staking}
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
              Amount to Stake (MYCOIN) *
            </label>
            <input
              type="number"
              name="amount"
              value={stakingData.amount}
              onChange={handleStakingFormChange}
              placeholder="0.000000"
              step="0.000001"
              min="0"
              disabled={staking}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              Staking Duration (Days)
            </label>
            <select
              name="duration"
              value={stakingData.duration}
              onChange={handleStakingFormChange}
              disabled={staking}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="7">7 Days (5.2% APY)</option>
              <option value="30">30 Days (5.8% APY)</option>
              <option value="90">90 Days (7.5% APY)</option>
              <option value="180">180 Days (10.0% APY)</option>
              <option value="365">365 Days (15.0% APY)</option>
            </select>
          </div>

          {/* Rewards Preview */}
          {stakingData.amount && (
            <div style={{ 
              padding: '15px', 
              background: '#eff6ff', 
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1e40af' }}>Estimated Rewards</h4>
              <div style={{ fontSize: '14px', color: '#1e40af' }}>
                <div>APY: {calculateAPY(parseInt(stakingData.duration)).toFixed(2)}%</div>
                <div>Expected Rewards: {formatAmount(calculateRewards(parseFloat(stakingData.amount), parseInt(stakingData.duration)))} MYCOIN</div>
                <div>Total Return: {formatAmount(parseFloat(stakingData.amount) + calculateRewards(parseFloat(stakingData.amount), parseInt(stakingData.duration)))} MYCOIN</div>
              </div>
            </div>
          )}

          <button
            onClick={startStaking}
            disabled={staking || !stakingData.staker_address.trim() || !stakingData.amount || parseFloat(stakingData.amount) <= 0}
            style={{
              width: '100%',
              padding: '15px',
              background: staking || !stakingData.staker_address.trim() || !stakingData.amount ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: staking || !stakingData.staker_address.trim() || !stakingData.amount ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {staking ? (
              <>
                <FaSpinner style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} />
                Processing...
              </>
            ) : (
              <>
                <FaPlay style={{ marginRight: '8px' }} />
                Start Staking
              </>
            )}
          </button>

          {/* Info */}
          <div style={{ 
            marginTop: '20px',
            padding: '15px', 
            background: '#fef3c7', 
            border: '1px solid #f59e0b', 
            borderRadius: '6px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            <FaInfoCircle style={{ marginRight: '8px' }} />
            <strong>How Staking Works:</strong>
            <ul style={{ margin: '10px 0 0 20px', paddingLeft: 0 }}>
              <li>Lock your MyCoin for a fixed period</li>
              <li>Earn daily rewards based on APY</li>
              <li>Longer staking periods offer higher APY</li>
              <li>Early unstaking results in 50% reward penalty</li>
            </ul>
          </div>
        </div>

        {/* Staking Calculator */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '30px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>Staking Calculator</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
              Amount (MYCOIN)
            </label>
            <input
              type="number"
              placeholder="Enter amount"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                textAlign: 'center'
              }}
              onChange={(e) => {
                const amount = parseFloat(e.target.value) || 0;
                const duration = 365;
                const rewards = calculateRewards(amount, duration);
                document.getElementById('calc-result').innerHTML = `
                  <div style="text-align: center; padding: 20px; background: #f0fdf4; border-radius: 8px;">
                    <div style="font-size: 24px; font-weight: bold; color: #166534; margin-bottom: 10px;">
                      ${formatAmount(rewards)} MYCOIN
                    </div>
                    <div style="font-size: 14px; color: #166534;">
                      Annual rewards (15% APY)
                    </div>
                  </div>
                `;
              }}
            />
          </div>

          <div id="calc-result" style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            color: '#6b7280'
          }}>
            Enter amount to calculate rewards
          </div>

          <div style={{ marginTop: '20px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#374151' }}>APY by Duration</h4>
            <div style={{ fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>7 Days:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>5.2%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>30 Days:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>5.8%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>90 Days:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>7.5%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>180 Days:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>10.0%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>365 Days:</span>
                <span style={{ fontWeight: 'bold', color: '#10b981' }}>15.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Stakes */}
      <div style={{ 
        background: 'white', 
        borderRadius: '12px', 
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e3a8a' }}>
          <FaLock style={{ marginRight: '10px' }} />
          My Stakes ({myStakes.length})
        </h3>
        
        {myStakes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {myStakes.map((stake) => (
              <div key={stake.id} style={{ 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '20px',
                background: stake.status === 'active' ? '#f0fdf4' : '#f9fafb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e3a8a' }}>
                      {formatAmount(stake.amount)} MYCOIN
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      APY: {stake.apy.toFixed(2)}%
                    </div>
                  </div>
                  <span style={{ 
                    padding: '4px 8px', 
                    background: stake.status === 'active' ? '#dcfce7' : '#f3f4f6', 
                    color: stake.status === 'active' ? '#166534' : '#6b7280',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {stake.status}
                  </span>
                </div>

                <div style={{ fontSize: '14px', marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#6b7280' }}>Duration:</span>
                    <span>{stake.duration} days</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#6b7280' }}>Start Date:</span>
                    <span>{formatTime(stake.start_date)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#6b7280' }}>End Date:</span>
                    <span>{formatTime(stake.end_date)}</span>
                  </div>
                  {stake.status === 'active' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ color: '#6b7280' }}>Days Remaining:</span>
                      <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                        {getDaysRemaining(stake.end_date)}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>Rewards Earned:</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                      {formatAmount(stake.rewards_earned)} MYCOIN
                    </span>
                  </div>
                </div>

                {stake.status === 'active' && (
                  <button
                    onClick={() => unstakeCoins(stake.id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FaUnlock style={{ marginRight: '6px' }} />
                    Unstake
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#6b7280' 
          }}>
            <FaCoins style={{ fontSize: '48px', marginBottom: '15px' }} />
            <div>No stakes found</div>
            <div style={{ fontSize: '14px', marginTop: '10px' }}>
              Start staking to earn passive rewards on your MyCoin
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StakingPage;
