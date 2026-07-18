import React from 'react';

export const Loader = () => {
  return (
    <div className="min-h-screen bg-[#030303] w-full fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]" />
    </div>
  );
};

export default Loader;
