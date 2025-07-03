import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';

export const useNotificationCount = (address, refreshInterval = 30000) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) {
      setCount(0);
      return;
    }

    const fetchCount = async () => {
      try {
        setLoading(true);
        // Only fetch pending notifications count
        const data = await notificationAPI.getNotifications(address, 'pending');
        const pendingCount = data.notifications?.length || data.pending || 0;
        setCount(pendingCount);
      } catch (error) {
        console.error('Error fetching notification count:', error);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
    
    const interval = setInterval(fetchCount, refreshInterval);
    return () => clearInterval(interval);
  }, [address, refreshInterval]);

  return { count, loading };
};

export default useNotificationCount;
