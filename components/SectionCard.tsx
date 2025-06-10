
import React from 'react';

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-gray-900 bg-opacity-70 backdrop-filter backdrop-blur-md p-6 rounded-xl shadow-2xl border border-gray-700 ${className}`}>
      <h2 className="text-2xl font-semibold mb-6 text-white border-b-2 border-gray-500 pb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
        {title}
      </h2>
      {children}
    </div>
  );
};
