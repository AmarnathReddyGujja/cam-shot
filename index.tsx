
import React from 'react';
import { createRoot } from 'react-dom/client'; // Corrected: Use named import
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement); // Corrected: Use createRoot directly
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);