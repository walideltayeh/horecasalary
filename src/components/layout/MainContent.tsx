
import React from 'react';

interface MainContentProps {
  children: React.ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default MainContent;
