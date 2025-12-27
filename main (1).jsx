import React from 'react';
import { createRoot } from 'react-dom/client';
import FaceSwapLite from './FaceSwapLite';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <FaceSwapLite />
  </React.StrictMode>
);
