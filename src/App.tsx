
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import EmergencyErrorBoundary from "@/components/common/EmergencyErrorBoundary";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const App = () => {
  return (
    <EmergencyErrorBoundary fallbackMessage="The app encountered a critical error. Please refresh to continue.">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TooltipProvider>
            <LanguageProvider>
              <EmergencyErrorBoundary fallbackMessage="Authentication system error. Please refresh.">
                <AuthProvider>
                  <EmergencyErrorBoundary fallbackMessage="Data loading error. Please refresh.">
                    <DataProvider>
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
                    </DataProvider>
                  </EmergencyErrorBoundary>
                </AuthProvider>
              </EmergencyErrorBoundary>
            </LanguageProvider>
          </TooltipProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </EmergencyErrorBoundary>
  );
};

export default App;
