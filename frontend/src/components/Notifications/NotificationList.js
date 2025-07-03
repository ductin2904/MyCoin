import React, { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTimes, FaSpinner, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { notificationAPI } from '../../services/api';
import { formatTime, formatNumber } from '../../utils/helpers';

const NotificationList = ({ address, onUpdate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState({});

  useEffect(() => {
    if (address) {
      fetchNotifications();
    }
  }, [address]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Only fetch pending notifications
      const data = await notificationAPI.getNotifications(address, 'pending');
      
      // Backend returns { success: true, notifications: [], total: 0, pending: 0 }
      const notificationList = data.notifications || data.results || [];
      setNotifications(notificationList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (notificationId, response, privateKey) => {
    try {
      setResponding(prev => ({ ...prev, [notificationId]: true }));
      
      await notificationAPI.respondNotification({
        notification_id: notificationId,
        action: response,
        private_key: privateKey
      });

      // Refresh notifications and parent data
      await fetchNotifications();
      if (onUpdate) onUpdate();
      
      alert(`Transaction ${response}ed successfully!`);
    } catch (error) {
      console.error(`Error ${response}ing transaction:`, error);
      alert(`Error ${response}ing transaction. Please check your private key and try again.`);
    } finally {
      setResponding(prev => ({ ...prev, [notificationId]: false }));
    }
  };

  const showResponseModal = (notification, response) => {
    const privateKey = prompt(`Enter your private key to ${response} this transaction:`);
    if (privateKey) {
      handleResponse(notification.id, response, privateKey);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <FaSpinner className="spin" style={{ fontSize: '24px', color: '#007bff' }} />
        <p style={{ marginTop: '10px', color: '#666' }}>Loading notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px', 
        color: '#666',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <FaBell style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }} />
        <h3>No pending notifications</h3>
        <p>You have no transactions waiting for confirmation.</p>
        <p style={{ fontSize: '14px', marginTop: '10px', opacity: 0.8 }}>
          When someone sends you MyCoin, you'll see a notification here to accept or reject the payment.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        <FaBell style={{ color: '#007bff' }} />
        <h3 style={{ margin: 0 }}>Transaction Confirmations</h3>
        <span style={{ 
          background: '#dc3545', 
          color: 'white', 
          borderRadius: '10px', 
          padding: '2px 8px', 
          fontSize: '12px', 
          fontWeight: 'bold' 
        }}>
          {notifications.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {notifications
          .filter(notification => notification && notification.id && notification.transaction)
          .map((notification) => (
          <div
            key={notification.id}
            style={{
              background: 'white',
              border: '1px solid #e3e6ea',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <FaExclamationTriangle style={{ color: '#ffc107' }} />
                  <h4 style={{ margin: 0, color: '#333' }}>Transaction Confirmation Required</h4>
                </div>
                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '14px' }}>
                  Someone wants to send you MyCoin. Please confirm to receive the payment.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6c757d', fontSize: '12px' }}>
                <FaClock />
                {formatTime(notification.created_at)}
              </div>
            </div>

            {/* Transaction Details */}
            <div style={{ 
              background: '#f8f9fa', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '15px' 
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                <div>
                  <strong>From:</strong>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '12px', 
                    background: 'white', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    marginTop: '4px' 
                  }}>
                    {notification.transaction?.from_address || 'Unknown'}
                  </div>
                </div>
                <div>
                  <strong>To:</strong>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '12px', 
                    background: 'white', 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    marginTop: '4px' 
                  }}>
                    {notification.transaction?.to_address || 'Unknown'}
                  </div>
                </div>
                <div>
                  <strong>Amount:</strong>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: '#28a745', 
                    marginTop: '4px' 
                  }}>
                    {formatNumber(notification.transaction?.amount || 0)} MYC
                  </div>
                </div>
                <div>
                  <strong>Status:</strong>
                  <div style={{ 
                    marginTop: '4px',
                    padding: '2px 8px',
                    background: '#ffc107',
                    color: '#212529',
                    borderRadius: '4px',
                    fontSize: '12px',
                    display: 'inline-block'
                  }}>
                    {(notification.transaction?.status || 'unknown').replace('_', ' ').toUpperCase()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => showResponseModal(notification, 'reject')}
                disabled={responding[notification.id]}
                style={{
                  padding: '10px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: responding[notification.id] ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: responding[notification.id] ? 0.6 : 1
                }}
              >
                {responding[notification.id] ? (
                  <FaSpinner className="spin" />
                ) : (
                  <FaTimes />
                )}
                Reject
              </button>
              <button
                onClick={() => showResponseModal(notification, 'accept')}
                disabled={responding[notification.id]}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: responding[notification.id] ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: responding[notification.id] ? 0.6 : 1
                }}
              >
                {responding[notification.id] ? (
                  <FaSpinner className="spin" />
                ) : (
                  <FaCheck />
                )}
                Accept
              </button>
            </div>
          </div>
        ))}
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

export default NotificationList;
