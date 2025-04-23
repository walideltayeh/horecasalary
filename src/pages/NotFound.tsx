
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-custom-red">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-gray-600 max-w-md">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="mt-4 bg-custom-red hover:bg-red-700">
          <Link to="/">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
