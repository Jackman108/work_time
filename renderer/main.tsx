/**
 * Точка входа renderer процесса
 */

import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@renderer/App';
import '@renderer/styles/global.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);


