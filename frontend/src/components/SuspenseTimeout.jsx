import React, { useState, useEffect, useRef } from 'react';

/**
 * SuspenseTimeout - Shows timeout error if Suspense takes too long
 * This helps catch lazy loading failures on mobile
 */
const SuspenseTimeout = ({ children, timeout = 30000 }) => {
  const [elapsed, setElapsed] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const intervalRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const isLoadedRef = useRef(false); // Track to prevent multiple checks

  useEffect(() => {
    // If already loaded, don't start timer
    if (isLoadedRef.current) {
      return;
    }

    // Check if children have actually rendered (app loaded)
    const checkIfLoaded = () => {
      if (isLoadedRef.current) return; // Early return if already loaded
      
      const root = document.getElementById('root');
      if (root) {
        // Check if there's actual React content (not just Suspense fallback)
        // React 18 doesn't use data-reactroot, so check for actual app content
        const hasReactContent = root.querySelector('[data-reactroot]') || 
                                root.querySelector('nav') || // Navigation bar
                                root.querySelector('[role="navigation"]') || // Navigation
                                root.querySelector('main') || // Main content
                                root.querySelector('.MuiContainer-root') || // Material-UI container
                                (root.children.length > 0 && 
                                 !root.querySelector('#initial-loading') &&
                                 !root.textContent?.includes('Loading app...') &&
                                 !root.textContent?.includes('This may take a moment'));
        
        if (hasReactContent) {
          isLoadedRef.current = true;
          setIsLoaded(true); // Trigger re-render
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
          }
        }
      }
    };

    // Check immediately
    checkIfLoaded();
    
    // Also check periodically
    checkIntervalRef.current = setInterval(checkIfLoaded, 500);
    
    const startTime = Date.now();
    
    // Update elapsed time every second (only if not loaded)
    intervalRef.current = setInterval(() => {
      // Check if loaded before updating
      if (isLoadedRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }
      
      const root = document.getElementById('root');
      const hasReactContent = root?.querySelector('[data-reactroot]') || 
                              root?.querySelector('nav') ||
                              root?.querySelector('[role="navigation"]') ||
                              root?.querySelector('main') ||
                              root?.querySelector('.MuiContainer-root') ||
                              (root?.children.length > 0 && 
                               !root?.querySelector('#initial-loading') &&
                               !root?.textContent?.includes('Loading app...') &&
                               !root?.textContent?.includes('This may take a moment'));
      
      if (hasReactContent) {
        isLoadedRef.current = true;
        setIsLoaded(true); // Trigger re-render
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
        return;
      }
      
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setElapsed(elapsedSeconds);
      
      // Show timeout error after timeout duration
      if (elapsedSeconds >= timeout / 1000) {
        setShowTimeout(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
          checkIntervalRef.current = null;
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [timeout]);

  // If timeout reached, show error
  if (showTimeout) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        fontFamily: 'system-ui',
        padding: '20px',
        zIndex: 999999
      }}>
        <h1 style={{ color: '#FF385C', fontSize: '24px', marginBottom: '20px' }}>
          App is taking too long to load
        </h1>
        <p style={{ color: '#717171', marginBottom: '10px', textAlign: 'center', maxWidth: '400px' }}>
          The app component is taking longer than expected to load ({elapsed} seconds).
        </p>
        <p style={{ color: '#999', fontSize: '14px', marginBottom: '20px', textAlign: 'center', maxWidth: '400px' }}>
          This might be due to a slow connection or a loading error. Please try refreshing the page.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            background: '#FF385C',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '24px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 600,
            minWidth: '120px',
            minHeight: '44px'
          }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  // If app loaded, don't show timer
  if (isLoaded) {
    return <>{children}</>;
  }

  // Wrap children to show timer
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {children}
      {/* Show timer overlay if loading takes more than 5 seconds */}
      {elapsed > 5 && !isLoaded && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '20px',
          fontSize: '14px',
          fontFamily: 'system-ui',
          zIndex: 999998
        }}>
          Loading... {elapsed}s
        </div>
      )}
    </div>
  );
};

export default SuspenseTimeout;

