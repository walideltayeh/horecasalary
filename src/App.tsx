
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
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
                  <Toaster />
                  <Sonner />
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/user-app" element={<UserApp />} />
                    
                    {/* Admin routes with DataProvider wrapper */}
                    <Route path="/*" element={
                      <EmergencyErrorBoundary fallbackMessage="Data loading error. Please refresh.">
                        <Routes>
                          <Route path="/" element={<AppLayout />}>
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="cafe-management" element={<CafeManagement />} />
                            <Route path="kpi-settings" element={<KPISettings />} />
                            <Route path="admin" element={<Admin />} />
                          </Route>
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </EmergencyErrorBoundary>
                    } />
                  </Routes>
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
