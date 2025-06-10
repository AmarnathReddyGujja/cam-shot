
import React, { useEffect, useRef } from 'react';
import type { BoundingBox } from '../types';

interface CroppedImageViewerProps {
  src: string;
  alt: string;
  boundingBox: BoundingBox | null;
}

export const CroppedImageViewer: React.FC<CroppedImageViewerProps> = ({ src, alt, boundingBox }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.crossOrigin = "anonymous"; // Handle potential CORS issues if src is remote and server allows
    image.src = src;

    image.onload = () => {
      if (!boundingBox || 
          boundingBox.width <= 0 || boundingBox.height <= 0 ||
          boundingBox.x < 0 || boundingBox.y < 0 ||
          (boundingBox.x + boundingBox.width) > 1.001 || // add tolerance
          (boundingBox.y + boundingBox.height) > 1.001 ) { // add tolerance
        // If no valid bounding box, draw the whole image or a portion, or handle error
        // For now, let's try to draw the whole image scaled if no valid box
        // Or, more simply, if there's no valid box, perhaps this component shouldn't render or show a message.
        // The App.tsx logic handles not rendering this component if boundingBox is null.
        // This is a fallback in case of bad data somehow getting through.
        console.warn("Invalid or null boundingBox for CroppedImageViewer, attempting to draw full image scaled to common aspect ratio if possible, or clearing canvas.");
        // Fallback: draw the image respecting canvas aspect ratio (e.g. 16:9)
        const targetAspectRatio = 16 / 9;
        let drawWidth = image.naturalWidth;
        let drawHeight = image.naturalHeight;

        if (drawWidth / drawHeight > targetAspectRatio) {
            drawHeight = drawWidth / targetAspectRatio;
        } else {
            drawWidth = drawHeight * targetAspectRatio;
        }
        // Center the image
        const offsetX = (image.naturalWidth - drawWidth) / 2;
        const offsetY = (image.naturalHeight - drawHeight) / 2;
        
        canvas.width = Math.min(600, image.naturalWidth); // Max width for canvas
        canvas.height = canvas.width / targetAspectRatio;

        ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight, 0, 0, canvas.width, canvas.height);
        return;
      }

      const { x, y, width, height } = boundingBox;
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;

      const sx = naturalWidth * x;
      const sy = naturalHeight * y;
      const sWidth = naturalWidth * width;
      const sHeight = naturalHeight * height;
      
      // Set canvas dimensions to the cropped part's dimensions
      // Consider a max width/height for the canvas display for UI consistency
      const displayMaxWidth = 600; // Example max width
      let displayWidth = sWidth;
      let displayHeight = sHeight;

      if (sWidth > displayMaxWidth) {
        displayWidth = displayMaxWidth;
        displayHeight = (sHeight / sWidth) * displayMaxWidth;
      }
      
      canvas.width = displayWidth;
      canvas.height = displayHeight;
      
      // Draw the cropped portion of the image onto the canvas, scaled to fit canvas
      ctx.drawImage(image, sx, sy, sWidth, sHeight, 0, 0, displayWidth, displayHeight);
    };

    image.onerror = () => {
      console.error("Failed to load image for CroppedImageViewer:", src);
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas on error
      // Optionally draw an error message on canvas
      // ctx.font = "16px Arial";
      // ctx.fillStyle = "red";
      // ctx.textAlign = "center";
      // ctx.fillText("Error loading image", canvas.width / 2, canvas.height / 2);
    };

  }, [src, boundingBox]);

  if (!boundingBox) { // This check might be redundant if App.tsx handles it, but good for component self-containment
      return <p className="text-center text-gray-400 my-4">AI did not provide specific crop visualization for this image.</p>;
  }

  return (
    <div className="my-4 flex justify-center">
      <canvas 
        ref={canvasRef} 
        aria-label={alt}
        className="rounded-lg shadow-xl border-4 border-gray-600 object-contain max-w-full h-auto"
        style={{ maxHeight: '60vh' }} // Consistent with ImageViewer
      />
    </div>
  );
};
