import React, { useState, useEffect } from 'react';

/**
 * Offline/Online Status Indicator Component
 * Shows user's connection status in the app
 */
const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[999] animate-pulse">
      <div className="bg-orange-500/90 backdrop-blur-md text-white px-4 py-3 rounded-lg shadow-lg border border-orange-400/30 flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.332a9 9 0 11-7.443-7.443m11.882-4.882V4.5m0 0L12 3m3.889 1.447l-3.889-1.447m0 0l-3.889 1.447" />
        </svg>
        <span className="text-sm font-medium flex-1">
          Offline - Changes will sync when back online
        </span>
        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

export default OfflineIndicator;
