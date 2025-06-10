
import React from 'react';

interface ImageViewerProps {
  src: string;
  alt: string;
  caption?: string;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, caption }) => {
  return (
    <div className="my-4">
      <img 
        src={src} 
        alt={alt} 
        className="rounded-lg shadow-xl max-w-full h-auto mx-auto border-4 border-gray-600 object-contain max-h-[60vh]" 
      />
      {caption && <p className="text-center text-sm text-gray-400 mt-2 italic">{caption}</p>}
    </div>
  );
};
