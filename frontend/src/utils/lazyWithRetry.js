import { lazy } from 'react';

/**
 * Enhanced lazy loading with retry and timeout for mobile compatibility
 * This helps prevent infinite loading on mobile browsers when chunks fail to load
 */
export function lazyWithRetry(componentImport, retries = 3, timeout = 10000) {
  return lazy(() => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Component load timeout after ${timeout}ms`));
      }, timeout);

      const attemptLoad = (attempt = 0) => {
        componentImport()
          .then((module) => {
            clearTimeout(timeoutId);
            resolve(module);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            
            if (attempt < retries) {
              // Retry after exponential backoff
              const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
              console.warn(`Failed to load component, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
              
              setTimeout(() => {
                attemptLoad(attempt + 1);
              }, delay);
            } else {
              // All retries failed - return error component
              console.error('Failed to load component after all retries:', error);
              reject(error);
            }
          });
      };

      attemptLoad();
    });
  });
}



