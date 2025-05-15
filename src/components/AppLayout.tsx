
import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./common/ErrorBoundary";
import ConnectivityMonitor from "./common/ConnectivityMonitor";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorBoundary fallback={
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h2>
          <p className="mb-4 text-gray-600">The application encountered an error. Please try refreshing the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      }>
        <Outlet />
      </ErrorBoundary>
      <Toaster richColors position="top-center" />
      <ConnectivityMonitor />
    </div>
  );
}
