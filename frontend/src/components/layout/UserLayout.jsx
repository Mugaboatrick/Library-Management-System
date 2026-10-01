import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BackButton from '../common/BackButton';

const UserLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar (persistent on desktop, overlay on mobile) */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setSidebarOpen(prev => !prev)} menuOpen={sidebarOpen} />
        <main className="flex-1 w-full px-0 py-0">
          <div className="w-full px-4 sm:px-6 lg:px-8 pt-4">
            <BackButton />
          </div>
          <div className="w-full min-h-[calc(100vh-120px)] px-0 sm:px-0 lg:px-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserLayout;