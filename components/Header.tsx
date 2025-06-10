import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-8 mb-8 text-center">
      <h1 className="text-5xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
        Cinematic Frame Finder
      </h1>
      <p className="mt-3 text-xl text-gray-300">You took the shot. We show you how it shines.</p>
    </header>
  );
};