import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/teko/500.css';
import '@fontsource/teko/600.css';
import '@fontsource/teko/700.css';
import '@fontsource/mukta/400.css';
import '@fontsource/mukta/600.css';
import '@fontsource/mukta/700.css';
import '@fontsource/hind/400.css';
import '@fontsource/hind/500.css';
import '@fontsource/hind/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import './styles.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
