
import React, { useRef } from 'react';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageUpload(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="w-full px-6 py-3 bg-white hover:bg-gray-200 text-black font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition duration-150 ease-in-out flex items-center justify-center space-x-2 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span>Upload Your Image</span>
      </button>
      <p className="text-xs text-gray-400 mt-2 text-center">Supports PNG, JPG, WEBP, GIF</p>
    </div>
  );
};
