
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { useEffect } from "react";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CafeManagement from "./pages/CafeManagement";
import KPISettings from "./pages/KPISettings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import AppLayout from "./components/AppLayout";
import UserApp from "./pages/UserApp";
import Index from "./pages/Index";

// Create a custom event bus for cross-tab communication
const setupCrossTabSync = () => {
  // Create a broadcast channel if supported
  let broadcastChannel: BroadcastChannel | null = null;
  
  try {
    broadcastChannel = new BroadcastChannel('horeca_sync_channel');
    
    broadcastChannel.onmessage = (event) => {
      console.log("[CrossTab] Message received:", event.data);
      if (event.data.type === 'DATA_UPDATED') {
        // Dispatch a custom event that components can listen for
        window.dispatchEvent(new CustomEvent('horeca_data_updated', { 
          detail: event.data 
        }));
      }
    };
    
    console.log("[CrossTab] Broadcast channel setup successful");
  } catch (err) {
    console.warn("[CrossTab] BroadcastChannel not supported, falling back to localStorage");
  }
  
  // Function to notify other tabs about data changes
  window.notifyCafesUpdated = () => {
    const message = { 
      type: 'DATA_UPDATED', 
      timestamp: new Date().getTime() 
    };
    
    // Try broadcast channel first
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage(message);
      } catch (err) {
        console.error("[CrossTab] Error sending via broadcast channel:", err);
      }
    }
    
    // Also use localStorage as fallback
    try {
      localStorage.setItem('cafe_data_updated', String(new Date().getTime()));
    } catch (err) {
      console.error("[CrossTab] Error using localStorage:", err);
    }
  };
  
  // Cleanup function
  return () => {
    if (broadcastChannel) {
      broadcastChannel.close();
    }
  };
};

// Route tracker component for analytics and sync
const RouteTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Log page changes
    console.log(`[Navigation] Page changed to: ${location.pathname}`);
    
    // Special handling for dashboard - refresh data when navigating to it
    if (location.pathname === '/dashboard') {
      // Small delay to ensure components are mounted
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dashboard_opened'));
      }, 500);
    }
  }, [location]);
  
  return null;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30000, // Consider data fresh for 30 seconds
    },
  },
});

const App = () => {
  // Set up cross-tab sync when the app loads
  useEffect(() => {
    const cleanup = setupCrossTabSync();
    
    // Global error handler for fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        return response;
      } catch (error) {
        console.error("[Network] Fetch error:", error);
        throw error;
      }
    };
    
    return cleanup;
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <DataProvider>
            <BrowserRouter>
              <RouteTracker />
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/user-app" element={<UserApp />} />
                
                <Route path="/" element={<AppLayout />}>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="cafe-management" element={<CafeManagement />} />
                  <Route path="kpi-settings" element={<KPISettings />} />
                  <Route path="admin" element={<Admin />} />
                </Route>
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </DataProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

// Add the global notifyCafesUpdated method for TypeScript
declare global {
  interface Window {
    notifyCafesUpdated: () => void;
  }
}
