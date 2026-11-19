import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { applyTheme, loadSettings } from './ui/settings';
import './ui/styles.css';
import './ui/card.css';

// Apply the saved theme before the first render, so the page doesn't flash the default colors.
applyTheme(loadSettings().theme);

const rootElement = document.getElementById('root');
if (rootElement === null) throw new Error('Missing #root element in index.html');

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
