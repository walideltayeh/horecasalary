
import React, { useState, useEffect } from 'react';
import { isOnline } from '@/utils/networkUtils';
import { Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

/**
 * Component that monitors network connectivity and displays status
 */
export const ConnectivityMonitor: React.FC = () => {
  const [online, setOnline] = useState(isOnline());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Update initial state
    setOnline(isOnline());
    
    // Handle online status
    const handleOnline = () => {
      setOnline(true);
      setVisible(true);
      toast.success('Connection restored', { id: 'connection-restored' });
      // Hide after 5 seconds
      setTimeout(() => setVisible(false), 5000);
    };
    
    // Handle offline status
    const handleOffline = () => {
      setOnline(false);
      setVisible(true);
      toast.error('You are offline', {
        id: 'connection-lost',
        duration: Infinity
      });
    };
    
    // Set up listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show when status changes or explicitly set to visible
  if (!visible && online) return null;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${online ? 'bg-green-100' : 'bg-red-100'} 
                     rounded-full px-4 py-2 flex items-center gap-2 shadow-md 
                     transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
         onClick={() => setVisible(false)}>
      {online ? (
        <>
          <Wifi size={18} className="text-green-600" />
          <span className="text-green-800 text-sm font-medium">Connected</span>
        </>
      ) : (
        <>
          <WifiOff size={18} className="text-red-600" />
          <span className="text-red-800 text-sm font-medium">Offline</span>
        </>
      )}
    </div>
  );
};

export default ConnectivityMonitor;
