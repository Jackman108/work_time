/**
 * Точка входа renderer процесса
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@renderer/App';
import '@renderer/styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


