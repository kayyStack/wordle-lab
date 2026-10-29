import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Help } from './Help.tsx';
import './index.css';
import './help.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Help />
  </StrictMode>,
);
