import React from 'react';

const Spinner = ({ full = false, label = 'Loading...' }) => {
  if (full) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">{label}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
};

export default Spinner;
