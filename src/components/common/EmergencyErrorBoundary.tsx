
import React, { useState, useEffect, ReactNode } from 'react';

interface EmergencyErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
}

const EmergencyErrorBoundary: React.FC<EmergencyErrorBoundaryProps> = ({ 
  children, 
  fallbackMessage = "Something went wrong. Please refresh the page." 
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      console.error("Emergency Error Boundary caught error:", event.error);
      setHasError(true);
      setError(event.error);
    };
    
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      console.error("Emergency Error Boundary caught promise rejection:", event.reason);
      setHasError(true);
      setError(new Error(event.reason));
    };
    
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);
  
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Application Error
            </h2>
            <p className="text-red-600 mb-4">
              {fallbackMessage}
            </p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
            {error && (
              <details className="mt-4 text-sm text-left">
                <summary className="cursor-pointer text-red-800">Error Details</summary>
                <pre className="mt-2 p-2 bg-red-100 rounded text-red-900 overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

export default EmergencyErrorBoundary;
