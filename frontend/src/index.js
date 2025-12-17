import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppSimple from './App.simple';
import App from './App'; // Direct import - no lazy loading to avoid loading issues
import ErrorBoundary from './components/ErrorBoundary';
import SuspenseTimeout from './components/SuspenseTimeout';

// Check if device is mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768);
};

// Check network connection
const checkNetwork = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      return {
        online: navigator.onLine,
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
      };
    }
  }
  return {
    online: navigator.onLine,
  };
};

// Update loading step on screen (for mobile debugging without devtools)
const updateLoadingStep = (step, message) => {
  const loadingDiv = document.getElementById('initial-loading');
  if (loadingDiv) {
    const statusText = loadingDiv.querySelector('#loading-status');
    if (statusText) {
      statusText.textContent = `Step ${step}: ${message}`;
    }
  } else {
    // Loading indicator removed - log to console instead
    console.log(`📊 [STEP ${step}] ${message}`);
  }
};

// Show immediate loading indicator for mobile with step tracking
let timerInterval = null;
let timerStartTime = null;
let fallbackTimerInterval = null;

// Start timer function (using recursive setTimeout - more reliable on mobile Safari)
const startTimer = () => {
  // Clear existing timer if any
  if (timerInterval) {
    clearTimeout(timerInterval);
    timerInterval = null;
  }

  // Reset start time
  timerStartTime = Date.now();

  // Update timer immediately (only if loading indicator exists)
  const loadingDiv = document.getElementById('initial-loading');
  if (loadingDiv) {
    const timerEl = document.getElementById('loading-timer');
    if (timerEl) {
      timerEl.textContent = '0s';
      console.log('⏱️ [TIMER] Timer started, element found');
    } else {
      // Timer element not found - this is OK, it might not be rendered yet
      // Don't log as error, just continue
      console.log('⏱️ [TIMER] Timer element not found yet, will retry');
    }
  } else {
    // Loading indicator already removed - don't start timer
    console.log('⏱️ [TIMER] Loading indicator already removed, skipping timer');
    return;
  }

  // Update timer using recursive setTimeout (more reliable on mobile Safari)
  const updateTimer = () => {
    const loadingDiv = document.getElementById('initial-loading');
    if (!loadingDiv) {
      // Loading div removed, stop timer
      if (timerInterval) {
        clearTimeout(timerInterval);
        timerInterval = null;
      }
      return;
    }

    const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
    const timerEl = document.getElementById('loading-timer');
    if (timerEl) {
      timerEl.textContent = `${elapsed}s`;
      // If more than 8 seconds, show warning
      if (elapsed > 8) {
        timerEl.style.color = '#FF385C';
        timerEl.textContent = `${elapsed}s - Taking longer than expected...`;
      }
    }
    // Don't log warning if timer element not found - it's OK, just continue

    // Schedule next update
    timerInterval = setTimeout(updateTimer, 1000);
  };

  // Start updating after 1 second
  timerInterval = setTimeout(updateTimer, 1000);
  console.log('⏱️ [TIMER] Timer interval set (recursive setTimeout)');

  // Also start fallback timer that updates directly (in case recursive setTimeout fails)
  if (fallbackTimerInterval) {
    clearInterval(fallbackTimerInterval);
  }
  fallbackTimerInterval = setInterval(() => {
    const loadingDiv = document.getElementById('initial-loading');
    if (!loadingDiv) {
      clearInterval(fallbackTimerInterval);
      fallbackTimerInterval = null;
      return;
    }

    if (timerStartTime) {
      const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
      const timerEl = document.getElementById('loading-timer');
      if (timerEl) {
        timerEl.textContent = `${elapsed}s`;
        if (elapsed > 8) {
          timerEl.style.color = '#FF385C';
          timerEl.textContent = `${elapsed}s - Taking longer than expected...`;
        }
      }
    }
  }, 1000);
};

const showLoadingIndicator = () => {
  const rootElement = document.getElementById('root');
  // CRITICAL: Only show loading if root is empty AND no loading indicator exists
  // This prevents duplicate loading indicators on mobile
  const existingLoading = document.getElementById('initial-loading');
  if (existingLoading) {
    console.log('⚠️ [INIT] Loading indicator already exists, skipping');
    return;
  }

  if (rootElement && !rootElement.hasChildNodes()) {
    const networkInfo = checkNetwork();
    const networkStatus = networkInfo.online ? 'Connected' : 'No connection';
    const networkType = networkInfo.effectiveType ? ` (${networkInfo.effectiveType})` : '';

    rootElement.innerHTML = `
      <div id="initial-loading" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        z-index: 999999;
      ">
        <div style="
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #00A86B;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        "></div>
        <p style="margin-top: 20px; color: #717171; font-size: 16px;">Loading app...</p>
        <p id="loading-status" style="margin-top: 10px; color: #999; font-size: 12px; text-align: center; max-width: 300px; min-height: 20px;">
          Initializing...
        </p>
        <p style="margin-top: 5px; color: #999; font-size: 11px;">${networkStatus}${networkType}</p>
        <p id="loading-timer" style="margin-top: 10px; color: #ccc; font-size: 10px; min-height: 14px;">0s</p>
        <div id="debug-info" style="margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 8px; max-width: 300px; font-size: 10px; color: #666; text-align: left; display: block !important;">
          <div style="font-weight: bold; margin-bottom: 5px;">🔍 Debug Info:</div>
          <div id="debug-env" style="line-height: 1.6;">Loading environment variables...</div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;

    // Start timer IMMEDIATELY - don't wait
    // Use requestAnimationFrame to ensure DOM is ready
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        startTimer();
      });
    } else {
      // Fallback for older browsers
      setTimeout(() => {
        startTimer();
      }, 0);
    }
  } else {
    // If loading indicator already exists, just start timer immediately
    const loadingDiv = document.getElementById('initial-loading');
    if (loadingDiv && !timerInterval) {
      startTimer();
    }
  }
};

// Show error on page for mobile debugging
const showError = (error) => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="
        padding: 40px 20px;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background: #ffffff;
      ">
        <h1 style="color: #FF385C; margin-bottom: 20px; font-size: 24px;">Loading Error</h1>
        <p style="color: #717171; margin-bottom: 20px; font-size: 16px; max-width: 400px;">
          ${error.message || 'Failed to initialize the app'}
        </p>
        <div style="
          background: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          max-width: 400px;
          text-align: left;
          font-size: 11px;
          color: #666;
        ">
          <strong>Environment Variables:</strong><br>
          NODE_ENV: ${process.env.NODE_ENV || 'not set'}<br>
          API_URL: ${process.env.REACT_APP_API_URL || 'not set'}<br>
          MAPS_KEY: ${process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? process.env.REACT_APP_GOOGLE_MAPS_API_KEY.substring(0, 15) + '...' : 'not set'}<br>
          MAP_ID: ${process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'not set'}
        </div>
        <p style="color: #999; margin-bottom: 30px; font-size: 12px; max-width: 400px; word-break: break-all;">
          ${error.stack ? error.stack.substring(0, 200) : ''}
        </p>
        <button 
          onclick="window.location.reload()" 
          style="
            background: #FF385C;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 24px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            min-width: 120px;
            min-height: 44px;
          "
        >
          Reload Page
        </button>
      </div>
    `;
  }
};

// Suppress only Google Maps API errors - log everything else
if (typeof window !== 'undefined') {
  const originalError = window.console.error;
  const originalWarn = window.console.warn;

  window.console.error = function (...args) {
    const errorMessage = args.join(' ');
    // Only suppress Google Maps API 404 errors
    if (
      errorMessage.includes('Failed to load resource: the server responded with a status of 404') &&
      (errorMessage.includes('kh:1') || errorMessage.includes('maps.googleapis.com'))
    ) {
      return; // Silently ignore
    }
    // Suppress Map ID warning - we have fallback to regular markers
    if (
      errorMessage.includes('Map ID') ||
      errorMessage.includes('map ID') ||
      errorMessage.includes('mapId') ||
      errorMessage.includes('initialized without a valid Map ID')
    ) {
      return; // Silently ignore - map works fine without Map ID
    }
    // Suppress aria-hidden blocked error
    if (errorMessage.includes('Blocked aria-hidden on an element')) {
      return;
    }
    // Log all other errors
    originalError.apply(console, args);
  };

  window.console.warn = function (...args) {
    const warningMessage = args.join(' ');
    // Only suppress Google Maps API warnings
    if (
      warningMessage.includes('Google Maps JavaScript API') &&
      (warningMessage.includes('preregistered map type') ||
        warningMessage.includes('mapId is present') ||
        warningMessage.includes('map styles are controlled via the cloud console'))
    ) {
      return; // Silently ignore
    }
    // Suppress deprecated google.maps.Marker warning
    if (warningMessage.includes('google.maps.Marker is deprecated')) {
      return;
    }
    originalWarn.apply(console, args);
  };

  // Catch script loading errors
  window.addEventListener('error', (event) => {
    // Only suppress Google Maps API errors
    if (
      event.message &&
      (event.message.includes('kh:1') ||
        (event.filename && event.filename.includes('maps.googleapis.com') && event.message.includes('404')))
    ) {
      event.preventDefault();
      return false;
    }
    // Suppress aria-hidden blocked warning
    if (event.message && event.message.includes('Blocked aria-hidden on an element')) {
      event.preventDefault();
      return false;
    }
    // Log other errors
    console.error('Script error:', event.filename, event.message);
  }, true);

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Don't prevent default - let React handle it
  });
}

// Initialize app with detailed debugging for mobile
const initApp = () => {
  const startTime = performance.now();
  console.log('🔍 [INIT] Step 1: initApp called');
  console.log('🔍 [INIT] User agent:', navigator.userAgent);
  console.log('🔍 [INIT] Screen:', window.innerWidth, 'x', window.innerHeight);
  console.log('🔍 [INIT] Network:', navigator.onLine ? 'online' : 'offline');
  console.log('🔍 [INIT] Is mobile:', isMobile());
  console.log('🔍 [INIT] NODE_ENV:', process.env.NODE_ENV);
  console.log('🔍 [INIT] REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'not set (will use default)');
  console.log('🔍 [INIT] REACT_APP_GOOGLE_MAPS_API_KEY:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? `${process.env.REACT_APP_GOOGLE_MAPS_API_KEY.substring(0, 10)}...` : 'not set');
  console.log('🔍 [INIT] REACT_APP_GOOGLE_MAPS_MAP_ID:', process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'not set');

  // Show debug info on screen for mobile (where console is not accessible)
  // Update immediately and also after delays to ensure it shows
  // Note: These elements only exist during the loading phase, so it's normal if they're not found
  const updateDebugInfo = () => {
    const debugDiv = document.getElementById('debug-info');
    const debugEnv = document.getElementById('debug-env');
    if (debugDiv && debugEnv) {
      const envInfo = [
        `NODE_ENV: ${process.env.NODE_ENV || 'not set'}`,
        `API_URL: ${process.env.REACT_APP_API_URL || 'not set (using default)'}`,
        `MAPS_KEY: ${process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? process.env.REACT_APP_GOOGLE_MAPS_API_KEY.substring(0, 15) + '...' : 'not set'}`,
        `MAP_ID: ${process.env.REACT_APP_GOOGLE_MAPS_MAP_ID || 'not set'}`,
      ].join('<br>');
      debugEnv.innerHTML = envInfo;
      debugDiv.style.display = 'block';
      debugDiv.style.visibility = 'visible';
      console.log('✅ [INIT] Debug info updated on screen');
    }
    // Silently ignore if elements don't exist - they're removed when app loads
    // This is normal behavior, not an error
  };

  // Update debug info multiple times to ensure it shows (only if loading indicator exists)
  updateDebugInfo(); // Immediate
  setTimeout(updateDebugInfo, 100); // After 100ms
  setTimeout(updateDebugInfo, 500); // After 500ms
  setTimeout(updateDebugInfo, 1000); // After 1s

  // Clear any corrupted localStorage data on app start
  // This helps with cache issues in regular browsing mode
  try {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token format
      if (typeof token !== 'string' || token.trim().length === 0 || token.split('.').length < 2) {
        console.warn('⚠️ [INIT] Corrupted token detected, clearing localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  } catch (e) {
    console.warn('⚠️ [INIT] Error checking localStorage:', e);
  }

  // Show loading immediately
  showLoadingIndicator();
  updateLoadingStep(1, 'Starting initialization');
  console.log('🔍 [INIT] Step 2: Loading indicator shown');

  // Ensure timer starts IMMEDIATELY (in case showLoadingIndicator didn't start it)
  // Use multiple fallbacks to ensure timer starts
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      if (!timerInterval && !fallbackTimerInterval) {
        console.log('⏱️ [INIT] Starting timer as fallback (requestAnimationFrame)');
        startTimer();
      }
    });
  }
  setTimeout(() => {
    if (!timerInterval && !fallbackTimerInterval) {
      console.log('⏱️ [INIT] Starting timer as fallback (setTimeout)');
      startTimer();
    } else {
      console.log('⏱️ [INIT] Timer already running');
    }
  }, 50);

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    updateLoadingStep(0, 'ERROR: Root element not found!');
    console.error('❌ [INIT] Root element not found!');
    setTimeout(initApp, 100);
    return;
  }
  updateLoadingStep(2, 'Root element found');
  console.log('🔍 [INIT] Step 3: Root element found');

  // SHORTER timeout - force remove after 3 seconds (mobile fix - faster!)
  const maxTimeoutDuration = 3000; // 3 seconds max (reduced for mobile)
  const maxTimeout = setTimeout(() => {
    updateLoadingStep(99, 'TIMEOUT - Force removing loading');
    console.warn('⚠️ [INIT] Timeout reached (3s) - force removing loading indicator');
    if (timerInterval) {
      clearTimeout(timerInterval);
      timerInterval = null;
    }
    if (fallbackTimerInterval) {
      clearInterval(fallbackTimerInterval);
      fallbackTimerInterval = null;
    }
    const loadingDiv = document.getElementById('initial-loading');
    if (loadingDiv) {
      loadingDiv.remove();
      console.warn('⚠️ [INIT] Loading indicator force removed after 3s timeout');
    }

    // Check if React rendered
    const rootCheck = document.getElementById('root');
    const hasContent = rootCheck?.children.length > 0 &&
      rootCheck?.children[0]?.id !== 'initial-loading';

    if (!hasContent) {
      // Always show error after timeout
      showError(new Error('App failed to load after 3 seconds. Please refresh the page or clear your browser cache.'));
    }
  }, maxTimeoutDuration);

  try {
    updateLoadingStep(3, 'Creating React root');
    console.log('🔍 [INIT] Step 4: About to create React root');
    const root = ReactDOM.createRoot(rootElement);
    updateLoadingStep(4, 'React root created');
    console.log('🔍 [INIT] Step 5: React root created');

    updateLoadingStep(5, 'Removing loading indicator');
    console.log('🔍 [INIT] Step 6: About to render App component');

    // CRITICAL: Remove loading indicator BEFORE React render
    // This prevents the loading indicator from blocking React
    // Also set aggressive timeout to force remove it on mobile
    const loadingDiv = rootElement.querySelector('#initial-loading');
    if (loadingDiv) {
      loadingDiv.remove();
      console.log('✅ [INIT] Removed loading indicator before React render');
    } else {
      console.warn('⚠️ [INIT] Loading indicator not found - may have been removed already');
    }

    // AGGRESSIVE: Force remove loading indicator after 2 seconds (mobile timeout)
    // This ensures it's always removed even if React fails
    setTimeout(() => {
      const forceRemoveDiv = document.getElementById('initial-loading');
      if (forceRemoveDiv) {
        console.warn('⚠️ [INIT] Force removing loading indicator after 2s (aggressive timeout)');
        forceRemoveDiv.remove();

        // Stop all timers
        if (timerInterval) {
          clearTimeout(timerInterval);
          timerInterval = null;
        }
        if (fallbackTimerInterval) {
          clearInterval(fallbackTimerInterval);
          fallbackTimerInterval = null;
        }
      }
    }, 2000);

    // Check if user is already logged in (has token)
    // Also validate token format to avoid issues with corrupted tokens
    const hasToken = (() => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return false;

        // Basic validation: token should be a non-empty string
        // JWT tokens typically have 3 parts separated by dots
        if (typeof token !== 'string' || token.trim().length === 0) {
          console.warn('⚠️ [INIT] Invalid token format, clearing');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return false;
        }

        // Check if token looks like a JWT (has at least one dot)
        const parts = token.split('.');
        if (parts.length < 2) {
          console.warn('⚠️ [INIT] Token does not look like JWT, clearing');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return false;
        }

        return true;
      } catch (e) {
        console.warn('⚠️ [INIT] Error checking token:', e);
        return false;
      }
    })();

    console.log('🔍 [INIT] Has token:', hasToken);

    // CRITICAL: If no token, load AppSimple IMMEDIATELY (no delays, no complexity)
    if (!hasToken) {
      console.log('🔍 [INIT] No token - loading AppSimple immediately');
      updateLoadingStep(6, 'Loading login page');

      // Remove loading indicator IMMEDIATELY before rendering
      const loadingDiv = rootElement.querySelector('#initial-loading');
      if (loadingDiv) {
        loadingDiv.remove();
        console.log('✅ [INIT] Removed loading indicator before AppSimple render');
      }

      try {
        root.render(
          <ErrorBoundary>
            <AppSimple />
          </ErrorBoundary>
        );
        console.log('✅ [INIT] AppSimple rendered');
        clearTimeout(maxTimeout);
        return; // Exit early - don't continue with other checks
      } catch (simpleError) {
        console.error('❌ [INIT] Error rendering AppSimple:', simpleError);
        showError(simpleError);
        return;
      }
    }

    if (hasToken) {
      // User is logged in - load full App directly (no lazy loading)
      console.log('🔍 [INIT] User logged in, loading full App directly');
      updateLoadingStep(6, 'Loading full App (user logged in)');

      try {
        root.render(
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        );
        console.log('✅ [INIT] Full App render called (direct import)');

        const renderTime = performance.now() - startTime;
        console.log(`✅ [INIT] React app rendered in ${renderTime.toFixed(2)}ms`);

        // Check if App actually loaded after a short delay
        setTimeout(() => {
          const rootCheck = document.getElementById('root');
          const hasReactContent = rootCheck?.querySelector('nav') ||
            rootCheck?.querySelector('[role="navigation"]') ||
            rootCheck?.querySelector('main') ||
            rootCheck?.querySelector('.MuiContainer-root') ||
            (rootCheck?.children.length > 0 &&
              !rootCheck?.querySelector('#initial-loading'));

          if (!hasReactContent) {
            console.error('❌ [INIT] App did not load after 5 seconds');
            updateLoadingStep(0, 'ERROR: App failed to load');
            showError(new Error('The app failed to load. This might be due to a JavaScript error. Please check the browser console and refresh the page.'));
          } else {
            console.log('✅ [INIT] App content detected');
          }
        }, 5000); // 5 seconds timeout
      } catch (appError) {
        console.error('❌ [INIT] Error rendering full App:', appError);
        console.error('❌ [INIT] Error stack:', appError.stack);
        updateLoadingStep(0, `ERROR: ${appError.message}`);
        showError(appError);
        return; // Exit early on error
      }
    }

    // Check if React actually rendered after a short delay - CRITICAL for mobile
    setTimeout(() => {
      const rootCheck = document.getElementById('root');
      console.log('🔍 [INIT] Checking React content after 500ms');
      console.log('🔍 [INIT] Root element:', rootCheck);
      console.log('🔍 [INIT] Root children count:', rootCheck?.children.length);
      console.log('🔍 [INIT] Root innerHTML length:', rootCheck?.innerHTML?.length);

      // Check for React content in multiple ways
      const reactRoot1 = rootCheck?.querySelector('[data-reactroot]');
      const reactRoot2 = rootCheck?.querySelector('div:not(#initial-loading)');
      const reactRoot3 = rootCheck?.children.length > 0 && rootCheck?.children[0]?.id !== 'initial-loading' ? rootCheck?.children[0] : null;
      const reactRoot4 = rootCheck?.querySelector('*:not(#initial-loading)');

      console.log('🔍 [INIT] React root check 1 (data-reactroot):', reactRoot1);
      console.log('🔍 [INIT] React root check 2 (div:not):', reactRoot2);
      console.log('🔍 [INIT] React root check 3 (first child):', reactRoot3);
      console.log('🔍 [INIT] React root check 4 (any:not):', reactRoot4);

      const reactRoot = reactRoot1 || reactRoot2 || reactRoot3 || reactRoot4;

      if (reactRoot) {
        console.log('✅ [INIT] React content detected:', reactRoot.tagName, reactRoot.className, reactRoot.id);
        updateLoadingStep(7, 'React content detected');
      } else {
        console.warn('⚠️ [INIT] React content NOT detected after render');
        console.warn('⚠️ [INIT] All root children:', Array.from(rootCheck?.children || []).map(c => ({ tag: c.tagName, id: c.id, className: c.className })));
        updateLoadingStep(0, 'WARNING: React content not detected');

        // CRITICAL: Show error message on screen if React didn't render
        if (rootCheck && (!rootCheck.children || rootCheck.children.length === 0 || rootCheck.innerHTML.trim() === '')) {
          console.error('❌ [INIT] Root is empty - React did not render!');
          showError(new Error('React failed to render. The app may have a JavaScript error. Please check the console.'));
        }
      }
    }, 500);

    // Clear loading indicator after React renders (shorter delay)
    const clearDelay = 1000; // 1 second - shorter delay
    setTimeout(() => {
      const rootCheck = document.getElementById('root');
      const reactContent = rootCheck?.querySelector('[data-reactroot]') ||
        rootCheck?.querySelector('div:not(#initial-loading)') ||
        (rootCheck?.children.length > 0 && rootCheck?.children[0]?.id !== 'initial-loading' ? rootCheck?.children[0] : null);

      console.log('🔍 [INIT] Checking for React content after 1s');
      console.log('🔍 [INIT] Root children:', rootCheck?.children.length);
      console.log('🔍 [INIT] React content found:', !!reactContent);

      // CRITICAL: Always remove loading indicator - even if React didn't render
      // This prevents stuck "loading app" screen on mobile
      const loadingDiv = rootElement.querySelector('#initial-loading');
      if (loadingDiv) {
        loadingDiv.remove();
        console.log('✅ [INIT] Loading indicator removed (forced)');

        // Stop all timers
        if (timerInterval) {
          clearTimeout(timerInterval);
          timerInterval = null;
        }
        if (fallbackTimerInterval) {
          clearInterval(fallbackTimerInterval);
          fallbackTimerInterval = null;
        }
      }

      if (reactContent) {
        console.log('✅ [INIT] React content found, app loaded successfully');
        clearTimeout(maxTimeout);
        updateLoadingStep(8, 'App loaded');
        const totalTime = performance.now() - startTime;
        console.log(`✅ [INIT] App fully loaded in ${totalTime.toFixed(2)}ms`);
      } else {
        console.warn('⚠️ [INIT] React content not found after removing loading indicator');
        console.warn('⚠️ [INIT] Root is empty - React may still be loading or there is an error');
        updateLoadingStep(0, 'WARNING: React content not detected');
        // Don't show error immediately - React might still be loading
        // Only show error after longer timeout
      }
    }, clearDelay);

    // AGGRESSIVE: Force remove loading indicator after 2.5 seconds regardless
    // This ensures mobile users never see stuck "loading app" screen
    setTimeout(() => {
      const loadingDiv = document.getElementById('initial-loading');
      if (loadingDiv) {
        console.warn('⚠️ [INIT] Force removing loading indicator after 2.5s timeout (mobile fix)');
        loadingDiv.remove();

        // Stop all timers
        if (timerInterval) {
          clearTimeout(timerInterval);
          timerInterval = null;
        }
        if (fallbackTimerInterval) {
          clearInterval(fallbackTimerInterval);
          fallbackTimerInterval = null;
        }

        // Check if React actually rendered
        const rootCheck = document.getElementById('root');
        const hasContent = rootCheck?.children.length > 0 &&
          rootCheck?.children[0]?.id !== 'initial-loading';

        if (!hasContent) {
          console.error('❌ [INIT] React did not render after 2.5s - showing error');
          showError(new Error('The app failed to load. Please refresh the page or clear your browser cache.'));
        } else {
          console.log('✅ [INIT] React content found after force removal');
        }
      }
    }, 2500);

    // Fallback check - if React didn't render after 3 seconds, show warning
    setTimeout(() => {
      const rootElementCheck = document.getElementById('root');
      const loadingDiv = rootElementCheck?.querySelector('#initial-loading');
      const reactContent = rootElementCheck?.querySelector('[data-reactroot]') ||
        rootElementCheck?.querySelector('div:not(#initial-loading)');

      // If loading div still exists and no React content after 3 seconds
      if (loadingDiv && !reactContent && performance.now() - startTime > 3000) {
        updateLoadingStep(0, 'WARNING: React may have failed to render');
        console.warn('⚠️ [INIT] React may have failed to render - still showing loading after 3s');
        console.warn('⚠️ [INIT] Root children:', rootElementCheck?.children.length);
        console.warn('⚠️ [INIT] Root innerHTML length:', rootElementCheck?.innerHTML?.length);
      }
    }, 3000);

    // More aggressive check after 5 seconds
    setTimeout(() => {
      const rootElementCheck = document.getElementById('root');
      const loadingDiv = rootElementCheck?.querySelector('#initial-loading');
      const reactContent = rootElementCheck?.querySelector('[data-reactroot]') ||
        rootElementCheck?.querySelector('div:not(#initial-loading)');

      // If still loading after 5 seconds, force show error
      if (loadingDiv && !reactContent && performance.now() - startTime > 5000) {
        updateLoadingStep(0, 'ERROR: React failed to render content');
        console.error('❌ [INIT] React failed to render after 5s - forcing error display');
        console.error('❌ [INIT] Root element:', rootElementCheck);
        console.error('❌ [INIT] Root children count:', rootElementCheck?.children.length);
        console.error('❌ [INIT] Root innerHTML preview:', rootElementCheck?.innerHTML?.substring(0, 200));

        // Try to find any React errors in console
        const errorInfo = 'React failed to render the app. This may be due to a JavaScript error. Check the browser console for details.';

        // Force remove loading and show error
        loadingDiv.remove();
        showError(new Error(errorInfo));
      }
    }, 5000);

  } catch (error) {
    clearTimeout(maxTimeout);
    if (timerInterval) {
      clearTimeout(timerInterval);
      timerInterval = null;
    }
    if (fallbackTimerInterval) {
      clearInterval(fallbackTimerInterval);
      fallbackTimerInterval = null;
    }
    updateLoadingStep(0, `ERROR: ${error.message}`);
    console.error('❌ [INIT] Error initializing app:', error);
    console.error('❌ [INIT] Error stack:', error.stack);
    showError(error);
  }
};

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  // DOM is already ready
  initApp();
}
