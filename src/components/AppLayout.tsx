
import React from "react";
import { Outlet } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./common/ErrorBoundary";
import ConnectivityMonitor from "./common/ConnectivityMonitor";

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toaster richColors position="top-center" />
      <ConnectivityMonitor />
    </div>
  );
}
