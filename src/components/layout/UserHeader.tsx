
import React from 'react';
import { User } from '@/types';

interface UserHeaderProps {
  user: User | null;
}

const UserHeader: React.FC<UserHeaderProps> = ({ user }) => {
  return (
    <header className="bg-custom-red text-white p-4 shadow-md">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">HoReCa Mobile</h1>
        <div className="flex items-center">
          <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center text-custom-red font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
