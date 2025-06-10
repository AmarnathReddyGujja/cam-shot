
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseStyles = "px-6 py-3 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2";

  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = "bg-white hover:bg-gray-200 text-black focus:ring-gray-400";
      break;
    case 'secondary':
      variantStyles = "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500";
      break;
    case 'danger':
      variantStyles = "bg-black hover:bg-gray-800 text-white border border-white focus:ring-white";
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
