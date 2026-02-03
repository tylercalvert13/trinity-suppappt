import { lazy, ComponentType } from 'react';

const RETRY_KEY = 'chunk-reload-attempted';

export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const hasReloaded = sessionStorage.getItem(RETRY_KEY);

    try {
      const component = await componentImport();
      // Success - clear the flag for future navigations
      sessionStorage.removeItem(RETRY_KEY);
      return component;
    } catch (error) {
      // If we haven't tried reloading yet, do it once
      if (!hasReloaded) {
        sessionStorage.setItem(RETRY_KEY, 'true');
        window.location.reload();
        // Return a placeholder that will never render (page is reloading)
        return new Promise(() => {});
      }
      
      // Already tried reloading - clear flag and rethrow for error boundary
      sessionStorage.removeItem(RETRY_KEY);
      throw error;
    }
  });
}
