import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Handle Vite preload errors by reloading the page once
// This catches edge cases where modulepreload fails after deployment
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(<App />);
