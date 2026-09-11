import React from 'react';
import Navbar from './Navbar';

const UserLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-up">{children}</main>
    </div>
  );
};

export default UserLayout;
