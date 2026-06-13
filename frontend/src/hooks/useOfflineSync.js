import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

/**
 * Custom hook for managing offline/online state and sync
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Handle online status change
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('✅ Back online!');
      toast.success('You are back online! 📡', {
        icon: '✅',
        duration: 3000
      });
      // Trigger sync
      window.dispatchEvent(new CustomEvent('sync-tasks'));
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('❌ Offline mode activated');
      toast.error('You are offline - changes will sync when back online', {
        icon: '📴',
        duration: 4000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for SW sync events
    window.addEventListener('online-sync', () => {
      console.log('Service Worker triggered sync');
      window.dispatchEvent(new CustomEvent('sync-tasks'));
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle app-online and app-offline custom events
  useEffect(() => {
    const handleAppOnline = () => {
      setIsOnline(true);
    };

    const handleAppOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('app-online', handleAppOnline);
    window.addEventListener('app-offline', handleAppOffline);

    return () => {
      window.removeEventListener('app-online', handleAppOnline);
      window.removeEventListener('app-offline', handleAppOffline);
    };
  }, []);

  const markSyncStart = useCallback(() => {
    setIsSyncing(true);
    setSyncError(null);
  }, []);

  const markSyncComplete = useCallback(() => {
    setIsSyncing(false);
    setLastSyncTime(new Date().toISOString());
    toast.success('All tasks synced! ✅', { duration: 2000 });
  }, []);

  const markSyncError = useCallback((error) => {
    setIsSyncing(false);
    setSyncError(error);
    toast.error(`Sync failed: ${error}`, { duration: 3000 });
  }, []);

  return {
    isOnline,
    isSyncing,
    syncError,
    lastSyncTime,
    markSyncStart,
    markSyncComplete,
    markSyncError
  };
};

export default useOfflineSync;
