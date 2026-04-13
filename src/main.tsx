import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'
import App from './App.tsx'
import './index.css'

inject()
injectSpeedInsights()

// Handle Vite preload errors by reloading the page once
// This catches edge cases where modulepreload fails after deployment
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
