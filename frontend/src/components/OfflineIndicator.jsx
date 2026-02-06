import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { isOnline, syncPendingOperations } from '../services/offlineSync';

const OfflineIndicator = () => {
  const [online, setOnline] = useState(isOnline());
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnline(isOnline());
    };

    const handleSyncComplete = async () => {
      const { syncQueue } = await import('../services/offlineStorage');
      const pending = await syncQueue.getAll();
      setPendingCount(pending.length);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    window.addEventListener('online-sync-complete', handleSyncComplete);

    // Check pending sync count
    const checkPending = async () => {
      const { syncQueue } = await import('../services/offlineStorage');
      const pending = await syncQueue.getAll();
      setPendingCount(pending.length);
    };
    checkPending();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      window.removeEventListener('online-sync-complete', handleSyncComplete);
    };
  }, []);

  const handleManualSync = async () => {
    if (!online) return;
    
    setSyncing(true);
    try {
      await syncPendingOperations();
      const { syncQueue } = await import('../services/offlineStorage');
      const pending = await syncQueue.getAll();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (online && pendingCount === 0) {
    return null; // Don't show when online and synced
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      {!online ? (
        <div className="bg-yellow-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <WifiOff className="w-4 h-4" />
          <span>You're offline. Changes will sync when you're back online.</span>
        </div>
      ) : pendingCount > 0 ? (
        <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>
            {syncing
              ? 'Syncing changes...'
              : `${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending sync`}
          </span>
          {!syncing && (
            <button
              onClick={handleManualSync}
              className="ml-2 underline hover:no-underline"
            >
              Sync Now
            </button>
          )}
        </div>
      ) : (
        <div className="bg-green-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm">
          <Wifi className="w-4 h-4" />
          <span>All synced!</span>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
