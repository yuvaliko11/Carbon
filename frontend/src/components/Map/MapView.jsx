import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap, Marker, InfoWindow, Polyline, Polygon } from '@react-google-maps/api';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
// import { Loader } from "@googlemaps/js-api-loader"; // Removed to avoid double loading
import { Box, Typography, Alert, Button, Portal, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { reportsAPI, sitesAPI, assetsAPI, earthquakesAPI, dangerMapsAPI, carbonContractsAPI, parcelsAPI, leasesAPI } from '../../services/api';
import AirbnbCard from './AirbnbCard';
import { LoadingSpinner } from '../Loading';
import ConfirmDialog from '../ConfirmDialog';
import { useAuth } from '../../context/AuthContext';
import logger from '../../utils/logger';
import MapControls from './MapControls';
import DangerMapDialog from './DangerMapDialog';

// Production-safe logger - only logs in development to improve mobile performance
const devLogger = {
  log: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Always log errors, even in production
    console.error(...args);
  },
};

devLogger.log('🚀 [MapView] Module loading - imports completed');
devLogger.log('🔴 [MapView] THIS IS THE NEW VERSION - IF YOU SEE THIS, NEW CODE IS LOADED!');
devLogger.log('🔴 [MapView] Timestamp:', new Date().toISOString());

// Global error handler to catch initialization errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes("Cannot access 'c' before initialization")) {
      console.error('❌ [GLOBAL ERROR HANDLER] Caught "c" initialization error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
      });
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes("Cannot access 'c' before initialization")) {
      console.error('❌ [GLOBAL ERROR HANDLER] Caught unhandled promise rejection with "c" error:', event.reason);
    }
  });
}



const containerStyle = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const defaultCenter = {
  lat: -17.8,
  lng: 178.0,
};

const ZOOM_THRESHOLD = 14; // Show assets when zoom >= 14, sites when < 14

// Helper function to get polygon color based on status
const getStatusColor = (status) => {
  switch (status) {
    case 'compliant':
      return '#4CAF50'; // Green
    case 'warning':
      return '#FF9800'; // Orange
    case 'breach':
      return '#F44336'; // Red
    default:
      return '#9E9E9E'; // Gray (default)
  }
};


const MapView = () => {
  devLogger.log('🚀 [MapView] Component function called');

  // Get auth state
  const { isAuthenticated, token, user, verifyingToken } = useAuth();

  // State for timeout warning (must be at top level, not inside conditionals)
  const [showTimeout, setShowTimeout] = useState(false);

  const [map, setMap] = useState(null);
  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const selectedMarkerRef = useRef(null); // Ref to track selected marker for click handlers
  const [sites, setSites] = useState([]); // Store sites data for images and additional info
  const [assets, setAssets] = useState([]); // Store assets data for images and additional info
  const [carbonContracts, setCarbonContracts] = useState([]); // Store carbon contracts data
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [mapCenter, setMapCenter] = useState(defaultCenter); // Start with default, will update when data loads
  const [mapZoom, setMapZoom] = useState(8); // Start with zoom level 8 for better overview of Fiji
  const hasCenteredOnDataRef = useRef(false); // Track if we've centered on user's data
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' or 'satellite'
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const markersMapRef = useRef(new Map()); // Map from feature ID to marker
  const polygonMarkersRef = useRef([]); // Ref for polygon markers
  const polygonOverlaysRef = useRef([]); // Ref for polygon overlays (for status-based styling)
  const advancedMarkerLibraryRef = useRef(null); // Cache for AdvancedMarkerElement library
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const [isCardVisible, setIsCardVisible] = useState(true);
  const mapContainerRef = useRef(null);

  // Earthquake state
  const [visibleEarthquakeDatasets, setVisibleEarthquakeDatasets] = useState([]);
  const [earthquakeGeoJSON, setEarthquakeGeoJSON] = useState(null);
  const earthquakeCirclesRef = useRef([]); // Ref for earthquake circles
  const earthquakePolylinesRef = useRef([]); // Ref for earthquake polylines

  // Danger map state
  const [dangerMapVisible, setDangerMapVisible] = useState(false);
  const [visibleDangerMaps, setVisibleDangerMaps] = useState([]);
  const [dangerMapGeoJSON, setDangerMapGeoJSON] = useState(null);
  const [dangerMaps, setDangerMaps] = useState([]);
  const [dangerMapDialogOpen, setDangerMapDialogOpen] = useState(false);
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false);
  const dangerMapLayersRef = useRef([]); // Ref for danger map layers (polygons, polylines, etc.)
  const dangerMapInfoWindowRef = useRef(null); // Ref for the single open info window
  const activeInfoWindowRef = useRef(null); // Ref to track the currently open InfoWindow

  devLogger.log('✅ [MapView] State initialized');

  // Detect if we're on mobile - use state to update on resize
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 900
  );
  devLogger.log('✅ [MapView] isMobile initialized:', isMobile);

  // Update mobile detection on resize
  useEffect(() => {
    devLogger.log('🔄 [MapView] Mobile detection useEffect running');
    const handleResize = () => {
      devLogger.log('🔄 [handleResize] Window resized, width:', window.innerWidth);
      setIsMobile(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  const googleMapsMapId = process.env.REACT_APP_GOOGLE_MAPS_MAP_ID;

  // Use global Google Maps context
  const { isLoaded, loadError } = useGoogleMaps();

  // Debug: Log Map ID to console (only in development)
  useEffect(() => {
    logger.log('🔍 Map ID from env:', googleMapsMapId);
    logger.log('🔍 API Key from env:', googleMapsApiKey ? 'Set' : 'Not set');
  }, []);



  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      // Show zoom controls on all devices, but position them properly
      zoomControl: true,
      zoomControlOptions: {
        position: 10, // LEFT_BOTTOM position
      },
      streetViewControl: false,
      // Hide default Map/Satellite control (we have our own custom button)
      mapTypeControl: false,
      // Hide fullscreen control
      fullscreenControl: false,
      // Always set mapTypeId - the warning is suppressed in index.js
      // mapId is required for AdvancedMarkerElement, but we still need mapTypeId for the map to display
      mapTypeId: mapType,
      minZoom: 4, // Prevent zooming out too far
      // maxZoom: 20, // Removed to allow manual control during fitBounds
      restriction: null, // Remove any restrictions on panning
      center: mapCenter || defaultCenter,
      zoom: mapZoom || 8,
      ...(googleMapsMapId && { mapId: googleMapsMapId }),
    }),
    [mapType, mapCenter, mapZoom, googleMapsMapId]
  );

  // Log loading state for debugging
  useEffect(() => {
    console.log('🗺️ [MapView] Google Maps loading state:', {
      isLoaded,
      loadError: loadError?.message || null,
      hasApiKey: !!googleMapsApiKey,
      hasMapId: !!googleMapsMapId,
    });
  }, [isLoaded, loadError, googleMapsApiKey, googleMapsMapId]);


  useEffect(() => {
    let timeoutId = null;

    if (isLoaded && isAuthenticated && token && user && !verifyingToken) {
      // Success state - reset error
      setAuthError(false);
    } else if (isLoaded && token && !user) {
      // Token exists but user not loaded
      if (verifyingToken) {
        // Still verifying, wait
        timeoutId = setTimeout(() => {
          if (token && !user) {
            console.error('❌ [MapView] Token verification timeout');
            setAuthError(true);
            setLoading(false);
          }
        }, 3000);
      } else {
        // Not verifying, but no user. Race condition?
        console.warn('⚠️ [MapView] Token exists but user not loaded yet (verifying=false). Waiting for AuthContext...');
        // Do not set error immediately
      }
    } else if (isLoaded && !isAuthenticated) {
      // Not authenticated
      if (token && !user) {
        setAuthError(true);
      }
      setLoading(false);
    } else if (loadError) {
      console.error('❌ [MapView] Google Maps load error:', loadError);
      setLoading(false);
    } else {
      // Loading...
      console.log('⏳ [MapView] Waiting for map or auth...');
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isLoaded, loadError, isAuthenticated, token, user, verifyingToken]);

  // Set timeout for loading warning (must be before early returns)
  useEffect(() => {
    if (!isLoaded && !loadError) {
      const timeout = setTimeout(() => {
        setShowTimeout(true);
      }, 30000); // 30 seconds timeout

      return () => clearTimeout(timeout);
    } else {
      setShowTimeout(false);
    }
  }, [isLoaded, loadError]);

  // Force remove white overlays on mobile - run this independently
  useEffect(() => {
    return; // DISABLED ENTIRELY to prevent interference with Dialogs
    if (!isMobile) return;

    // Inject a global style tag to override everything
    let styleTag = document.getElementById('mobile-map-overlay-fix');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'mobile-map-overlay-fix';
      styleTag.textContent = `
        body.map-page-active,
        body.map-page-active #root,
        body.map-page-active #root > *,
        body.map-page-active #root > * > *,
        body.map-page-active #root > * > * > *,
        body.map-page-active .layout-map-page,
        body.map-page-active .layout-content-map-page {
          background-color: transparent !important;
          background: transparent !important;
        }
        body.map-page-active *:not(.MuiAppBar-root):not(.MuiAppBar-root *):not(.map-container):not(.map-container *):not(.gm-style):not(.gm-style *) {
          background-color: transparent !important;
          background: transparent !important;
        }
      `;
      document.head.appendChild(styleTag);
    }

    // Run overlay removal immediately, don't wait for map to load
    const removeOverlaysNow = () => {
      try {
        // Calculate viewport area ONCE at the start (before any loops)
        const viewportArea = window.innerWidth * window.innerHeight;

        // FIRST: Find the exact white overlay by checking what's covering the map
        // Get map container position
        const mapContainer = document.querySelector('.dashboard-map-container');
        if (mapContainer) {
          const mapRect = mapContainer.getBoundingClientRect();

          // Find element at center of screen that might be the overlay
          const screenCenterX = window.innerWidth / 2;
          const screenCenterY = window.innerHeight / 2;
          const elementAtCenter = document.elementFromPoint(screenCenterX, screenCenterY);

          if (elementAtCenter &&
            !elementAtCenter.closest('.dashboard-map-container') &&
            !elementAtCenter.closest('.MuiAppBar-root') &&
            !elementAtCenter.closest('.map-container')) {
            const elementCenterStyle = window.getComputedStyle(elementAtCenter);
            const elementCenterBg = elementCenterStyle.backgroundColor;
            const elementCenterRect = elementAtCenter.getBoundingClientRect();

            // If it's white and large, it's likely the overlay
            if (elementCenterBg && (
              elementCenterBg.includes('rgb(255, 255, 255)') ||
              elementCenterBg === 'white' ||
              elementCenterBg === '#ffffff'
            ) && elementCenterRect.width > window.innerWidth * 0.5) {
              devLogger.log('🔍 Found white overlay at screen center:', {
                tag: elementAtCenter.tagName,
                className: elementAtCenter.className,
                id: elementAtCenter.id,
                bgColor: elementCenterBg,
                size: { width: elementCenterRect.width, height: elementCenterRect.height },
                position: window.getComputedStyle(elementAtCenter).position,
                zIndex: window.getComputedStyle(elementAtCenter).zIndex,
                element: elementAtCenter
              });
              elementAtCenter.style.setProperty('background-color', 'transparent', 'important');
              elementAtCenter.style.setProperty('background', 'transparent', 'important');
              elementAtCenter.style.setProperty('pointer-events', 'none', 'important');
              elementAtCenter.style.setProperty('z-index', '-1', 'important');
            }
          }
        }

        // Force body and html to be transparent
        document.body.style.setProperty('background-color', 'transparent', 'important');
        document.documentElement.style.setProperty('background-color', 'transparent', 'important');

        // First, force ALL elements in the root to be transparent (except AppBar and map)
        const rootChildren = document.querySelectorAll('#root > *');
        rootChildren.forEach((child) => {
          if (!child.closest('.MuiAppBar-root') && !child.closest('.map-container')) {
            child.style.setProperty('background-color', 'transparent', 'important');
            child.style.setProperty('background', 'transparent', 'important');
          }
        });

        // Find ALL elements and check for white overlays - be very aggressive
        const allElements = document.querySelectorAll('*');
        allElements.forEach((el) => {
          // Skip if it's the AppBar or its children
          if (el.closest('.MuiAppBar-root') || el.classList.contains('MuiAppBar-root')) {
            return;
          }

          // Skip if it's the map container itself or Google Maps
          if (el.closest('.map-container') || el.classList.contains('map-container') ||
            el.closest('.gm-style') || el.classList.contains('gm-style') ||
            el.closest('.dashboard-map-container') ||
            el.getAttribute('data-testid') === 'map-controls-container' ||
            el.id === 'map-controls-portal-wrapper' || el.closest('#map-controls-portal-wrapper') ||
            el.classList.contains('map-controls-container-wrapper') || el.closest('.map-controls-container-wrapper') ||
            el.getAttribute('data-testid') === 'map-controls-container-wrapper' ||
            // Exclude MUI Dialogs, Modals, and Backdrops
            el.closest('.MuiDialog-root') || el.classList.contains('MuiDialog-root') ||
            el.closest('.MuiModal-root') || el.classList.contains('MuiModal-root') ||
            el.closest('.MuiBackdrop-root') || el.classList.contains('MuiBackdrop-root') ||
            el.closest('.MuiDialog-container') || el.classList.contains('MuiDialog-container') ||
            el.getAttribute('role') === 'presentation' ||
            el.getAttribute('role') === 'dialog') {
            return;
          }

          const computedStyle = window.getComputedStyle(el);
          const bgColor = computedStyle.backgroundColor;
          const rect = el.getBoundingClientRect();
          const zIndex = parseInt(computedStyle.zIndex) || 0;
          const position = computedStyle.position;

          // Check if element covers significant area
          const elementArea = rect.width * rect.height;
          const coversSignificantArea = elementArea > viewportArea * 0.2;
          const isLarge = rect.width > window.innerWidth * 0.6 && rect.height > window.innerHeight * 0.6;

          // If it's white/transparent and large, or has high z-index and is positioned, make it transparent
          const isWhite = bgColor && (
            bgColor.includes('rgb(255, 255, 255)') ||
            bgColor === 'white' ||
            bgColor === '#ffffff' ||
            bgColor === 'rgb(255, 255, 255)'
          );

          // Check if this element might be blocking the map
          const mightBlockMap = (isLarge || coversSignificantArea) &&
            (isWhite || (position === 'absolute' || position === 'fixed') && zIndex > 0);

          if (mightBlockMap) {
            // Log for debugging - log first 5 times we find a white overlay
            if (!window._whiteOverlayLogCount) window._whiteOverlayLogCount = 0;
            if (window._whiteOverlayLogCount < 5) {
              window._whiteOverlayLogCount++;
              devLogger.log(`[${window._whiteOverlayLogCount}] Removing white overlay:`, {
                tag: el.tagName,
                className: el.className,
                id: el.id,
                bgColor,
                position,
                zIndex,
                size: { width: rect.width, height: rect.height },
                location: { top: rect.top, left: rect.left },
                element: el
              });
            }

            // Make it transparent
            el.style.setProperty('background-color', 'transparent', 'important');
            el.style.setProperty('background', 'transparent', 'important');
            el.style.backgroundColor = 'transparent';
            el.style.background = 'transparent';

            // If it's positioned and has z-index, lower it or make pointer-events none
            // Also check if it's between the map and the user (z-index between 1 and 999)
            if ((position === 'absolute' || position === 'fixed' || position === 'relative') &&
              zIndex > 0 && zIndex < 1000 && isLarge) {
              el.style.setProperty('pointer-events', 'none', 'important');
              el.style.setProperty('z-index', '-1', 'important');
            }

            // For any large white element, always disable pointer events
            if (isLarge && isWhite) {
              el.style.setProperty('pointer-events', 'none', 'important');
            }
          }

          // Also check: if element is large and covers most of screen, make it transparent regardless
          if (isLarge && rect.top < 100 && rect.left < 50) {
            // This is likely the overlay - make it transparent and non-interactive
            el.style.setProperty('background-color', 'transparent', 'important');
            el.style.setProperty('background', 'transparent', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
          }
        });

        // Specifically target Layout Box components - be very aggressive
        const layoutBoxes = document.querySelectorAll('#root > div, #root > div > div, #root > div > div > div, .layout-map-page, .layout-content-map-page');
        layoutBoxes.forEach((box) => {
          if (!box.closest('.MuiAppBar-root') && !box.closest('.dashboard-map-container')) {
            const rect = box.getBoundingClientRect();
            const isLarge = rect.width > window.innerWidth * 0.5 && rect.height > window.innerHeight * 0.5;
            const computedStyle = window.getComputedStyle(box);
            const bgColor = computedStyle.backgroundColor;
            const isWhite = bgColor && (
              bgColor.includes('rgb(255, 255, 255)') ||
              bgColor === 'white' ||
              bgColor === '#ffffff'
            );

            // Force transparent
            box.style.setProperty('background-color', 'transparent', 'important');
            box.style.setProperty('background', 'transparent', 'important');
            box.style.backgroundColor = 'transparent';
            box.style.background = 'transparent';

            // If it's large and white, disable pointer events
            if (isLarge && isWhite) {
              box.style.setProperty('pointer-events', 'none', 'important');
              box.style.setProperty('z-index', '-1', 'important');
            }

            // If it's the Layout content box and it's large, always disable pointer events
            if (box.classList.contains('layout-content-map-page') && isLarge) {
              box.style.setProperty('pointer-events', 'none', 'important');
              box.style.setProperty('z-index', '0', 'important');
            }
          }
        });
      } catch (error) {
        // Silently catch any errors to prevent breaking the app
        console.error('Error in removeOverlaysNow:', error);
      }
    };

    // Use MutationObserver to catch dynamically added elements
    const observer = new MutationObserver(() => {
      try {
        removeOverlaysNow();
      } catch (error) {
        // Silently catch errors in observer callback
        console.error('Error in MutationObserver callback:', error);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // Log when overlay removal starts
    devLogger.log('🚀 Starting white overlay removal on mobile');

    // Run immediately and on intervals to catch dynamically added elements
    removeOverlaysNow();
    const interval = setInterval(removeOverlaysNow, 200);

    // Also run after delays to catch elements that load later
    const timeout = setTimeout(() => {
      devLogger.log('⏰ Running overlay removal at 100ms');
      removeOverlaysNow();
    }, 100);
    const timeout2 = setTimeout(() => {
      devLogger.log('⏰ Running overlay removal at 500ms');
      removeOverlaysNow();
    }, 500);
    const timeout3 = setTimeout(() => {
      devLogger.log('⏰ Running overlay removal at 1000ms');
      removeOverlaysNow();
    }, 1000);
    const timeout4 = setTimeout(() => {
      devLogger.log('⏰ Running overlay removal at 2000ms');
      removeOverlaysNow();
    }, 2000);
    const timeout5 = setTimeout(() => {
      devLogger.log('⏰ Running overlay removal at 3000ms');
      removeOverlaysNow();
    }, 3000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
      clearTimeout(timeout5);
    };
  }, [isMobile]);

  // Handle window resize to ensure map fits properly on mobile
  useEffect(() => {
    devLogger.log('🔄 [MapView] Window resize useEffect running, map:', !!map);
    const handleResize = () => {
      devLogger.log('🔄 [handleResize-map] Window resized, mapRef.current:', !!mapRef.current);
      if (mapRef.current && window.google && window.google.maps) {
        devLogger.log('✅ [handleResize-map] Map and Google Maps available');
        setTimeout(() => {
          devLogger.log('⏰ [handleResize-map] setTimeout callback executing');
          window.google.maps.event.trigger(mapRef.current, 'resize');
          // Update zoom controls styling based on screen size - use universal approach
          if (window.innerWidth <= 900) {
            devLogger.log('🔄 [handleResize-map] Mobile width detected, processing controls');
            // Try all possible selectors
            const selectors = [
              '.gm-control-active',
              '.gmnoprint[role="button"]',
              '.gmnoprint button',
              'div[role="button"][aria-label*="Zoom"]',
              'div[role="button"][aria-label*="zoom"]',
              '.gm-style .gm-control-active',
            ];

            devLogger.log('🔄 [handleResize] About to process selectors, count:', selectors.length);
            selectors.forEach((selector, selectorIdx) => {
              try {
                devLogger.log(`🔄 [handleResize] Processing selector ${selectorIdx}:`, selector);
                const controlElements = document.querySelectorAll(selector);
                devLogger.log(`🔄 [handleResize] Found ${controlElements.length} elements for selector ${selectorIdx}`);
                controlElements.forEach((ctrlElement, elemIdx) => {
                  try {
                    devLogger.log(`🔄 [handleResize] Processing element ${elemIdx} of selector ${selectorIdx}`);
                    ctrlElement.style.setProperty('display', 'block', 'important');
                    ctrlElement.style.setProperty('visibility', 'visible', 'important');
                    ctrlElement.style.setProperty('opacity', '1', 'important');
                    ctrlElement.style.setProperty('touch-action', 'manipulation', 'important');
                    ctrlElement.style.setProperty('min-width', '44px', 'important');
                    ctrlElement.style.setProperty('min-height', '44px', 'important');
                    devLogger.log(`✅ [handleResize] Element ${elemIdx} processed successfully`);
                  } catch (err) {
                    console.error(`❌ [handleResize] Error processing element ${elemIdx}:`, err);
                    // Ignore individual element errors
                  }
                });
                devLogger.log(`✅ [handleResize] Selector ${selectorIdx} processed`);
              } catch (e) {
                console.error(`❌ [handleResize] Error processing selector ${selectorIdx}:`, e);
                // Ignore errors
              }
            });
            devLogger.log('✅ [handleResize] All selectors processed');

            // Find by position (bottom-right corner) - only force visibility, not position
            try {
              devLogger.log('🔄 [handleResize] About to query allElements');
              const allElements = document.querySelectorAll('.gmnoprint, [class*="control"]');
              devLogger.log('🔄 [handleResize] Found allElements, count:', allElements.length);
              allElements.forEach((element, elemIdx) => {
                try {
                  devLogger.log(`🔄 [handleResize] Processing allElement ${elemIdx}`);
                  const elementRect = element.getBoundingClientRect();
                  const isBottomLeft = elementRect.bottom > window.innerHeight - 150 && elementRect.left < 150;
                  const isBottomRight = elementRect.bottom > window.innerHeight - 150 && elementRect.right > window.innerWidth - 100;
                  if (isBottomLeft || isBottomRight) {
                    // Only force visibility, don't change position
                    element.style.setProperty('display', 'block', 'important');
                    element.style.setProperty('visibility', 'visible', 'important');
                    element.style.setProperty('opacity', '1', 'important');
                    // Don't override position, left, top, bottom, right styles
                    devLogger.log(`✅ [handleResize] allElement ${elemIdx} processed`);
                  }
                } catch (err) {
                  console.error(`❌ [handleResize] Error processing allElement ${elemIdx}:`, err);
                  // Ignore individual element errors
                }
              });
              devLogger.log('✅ [handleResize] All allElements processed');
            } catch (e) {
              console.error('❌ [handleResize] Error in allElements processing:', e);
              // Ignore errors
            }
          }
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Also trigger on load to ensure proper sizing
    const timer = setTimeout(() => {
      handleResize();
    }, 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      clearTimeout(timer);
    };
  }, [map]);

  // Load earthquake datasets and visibility state
  const loadEarthquakeDatasets = useCallback(async () => {
    try {
      const response = await earthquakesAPI.getAll();

      // Load visibility state from localStorage
      try {
        const stored = localStorage.getItem('earthquakeVisibleDatasets');
        if (stored) {
          const visibleIds = JSON.parse(stored);
          // Filter to only include IDs that exist in the loaded datasets
          const validIds = visibleIds.filter(id =>
            response.data.data.some(dataset => dataset._id === id)
          );
          setVisibleEarthquakeDatasets(validIds);
          // Update localStorage with valid IDs only
          if (validIds.length !== visibleIds.length) {
            localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(validIds));
          }
        }
      } catch (err) {
        logger.error('Error loading visibility state:', err);
      }
    } catch (error) {
      logger.error('Error loading earthquake datasets:', error);
    }
  }, []);

  const normalizeId = (id) => {
    if (!id) return null;
    return String(id);
  };

  const handleToggleDataset = (datasetId) => {
    const normalizedId = normalizeId(datasetId);
    if (!normalizedId) {
      logger.error('Cannot toggle dataset: invalid ID', datasetId);
      return;
    }

    // Use functional update to ensure we have the latest state
    setVisibleEarthquakeDatasets(prevVisible => {
      // Normalize all existing IDs for comparison
      const normalizedVisible = prevVisible.map(id => normalizeId(id));
      const isCurrentlyVisible = normalizedVisible.includes(normalizedId);

      const newVisible = isCurrentlyVisible
        ? normalizedVisible.filter(id => id !== normalizedId)
        : [...normalizedVisible, normalizedId];

      // Save to localStorage immediately with the new state
      const normalizedNewVisible = newVisible.map(id => normalizeId(id)).filter(id => id !== null);
      try {
        localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(normalizedNewVisible));
        logger.log('✅ Toggle dataset - saved to localStorage:', {
          datasetId: normalizedId,
          wasVisible: isCurrentlyVisible,
          nowVisible: !isCurrentlyVisible,
          allVisible: normalizedNewVisible
        });
      } catch (err) {
        logger.error('Error saving visibility state:', err);
      }

      return normalizedNewVisible;
    });
  };

  // Alias for DangerMapDialog
  const handleToggleEarthquake = handleToggleDataset;

  // Load GeoJSON for visible earthquake datasets
  const loadEarthquakeGeoJSON = useCallback(async () => {
    if (visibleEarthquakeDatasets.length === 0) {
      setEarthquakeGeoJSON(null);
      return;
    }

    try {
      const geoJSONPromises = visibleEarthquakeDatasets.map(id =>
        earthquakesAPI.getGeoJSON(id).catch(err => {
          logger.error(`Error loading GeoJSON for dataset ${id}:`, err);
          return null;
        })
      );

      const results = await Promise.all(geoJSONPromises);
      const allFeatures = [];

      results.forEach((result, index) => {
        if (result && result.data && result.data.data) {
          const geojson = result.data.data;
          if (geojson.features && Array.isArray(geojson.features)) {
            allFeatures.push(...geojson.features);
          }
        }
      });

      if (allFeatures.length > 0) {
        setEarthquakeGeoJSON({
          type: 'FeatureCollection',
          features: allFeatures,
        });
      } else {
        setEarthquakeGeoJSON(null);
      }
    } catch (error) {
      logger.error('Error loading earthquake GeoJSON:', error);
      setEarthquakeGeoJSON(null);
    }
  }, [visibleEarthquakeDatasets]);

  // Helper function to get color based on magnitude
  const getMagnitudeColor = useCallback((magnitude) => {
    if (magnitude === null || magnitude === undefined || isNaN(magnitude)) {
      return '#9E9E9E'; // Gray for unknown
    }

    if (magnitude < 3) {
      return '#4CAF50'; // Green - Low
    } else if (magnitude < 5) {
      return '#FFC107'; // Yellow/Orange - Medium
    } else if (magnitude < 7) {
      return '#FF9800'; // Orange/Red - High
    } else {
      return '#F44336'; // Red/Dark Red - Very High
    }
  }, []);

  // Helper function to get radius based on magnitude
  const getMagnitudeRadius = useCallback((magnitude) => {
    if (magnitude === null || magnitude === undefined || isNaN(magnitude)) {
      return 1000; // Default radius
    }
    // Scale: magnitude * 5000 meters, minimum 1000m
    return Math.max(1000, magnitude * 5000);
  }, []);

  // Helper function to extract magnitude from properties
  // Handles various property name formats including spaces and case variations
  const extractMagnitude = useCallback((properties) => {
    if (!properties) return null;

    // First, try exact matches (most common cases)
    const exactKeys = ['mag', 'magnitude', 'Magnitude', 'MAG', 'magValue', 'magnitudeValue'];
    for (const key of exactKeys) {
      if (properties[key] !== undefined && properties[key] !== null) {
        const mag = parseFloat(properties[key]);
        if (!isNaN(mag)) {
          return mag;
        }
      }
    }

    // If no exact match, search through all properties for magnitude-like keys
    // This handles cases like " Magnitude" (with leading space) or "magnitude " (with trailing space)
    for (const key in properties) {
      if (properties.hasOwnProperty(key)) {
        const normalizedKey = key.trim().toLowerCase();
        if (normalizedKey === 'mag' || normalizedKey === 'magnitude' || normalizedKey.includes('magnitude')) {
          const mag = parseFloat(properties[key]);
          if (!isNaN(mag)) {
            return mag;
          }
        }
      }
    }

    return null;
  }, []);

  // Helper function to extract time from properties
  // Handles various property name formats including spaces
  const extractTime = useCallback((properties) => {
    if (!properties) return null;

    // Try common time property names
    const timeKeys = ['time', 'Time', 'TIME', 'timestamp', 'Timestamp', 'date', 'Date'];
    for (const key of timeKeys) {
      if (properties[key] !== undefined && properties[key] !== null) {
        const timeValue = properties[key];
        // Try to parse as Date
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }

    // Search through all properties for time-like keys (handles " Time Stamp" with space)
    for (const key in properties) {
      if (properties.hasOwnProperty(key)) {
        const normalizedKey = key.trim().toLowerCase();
        if (normalizedKey.includes('time') || normalizedKey.includes('timestamp') || normalizedKey.includes('date')) {
          const timeValue = properties[key];
          const date = new Date(timeValue);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }

    return null;
  }, []);

  const loadMapData = useCallback(async () => {
    // CRITICAL: Don't load data if we don't have a valid user
    if (!user || !token) {
      console.warn('⚠️ [loadMapData] Cannot load data - missing user or token', {
        hasUser: !!user,
        hasToken: !!token
      });
      setLoading(false);
      setAuthError(true);
      return;
    }

    // CRITICAL: Verify user has required fields
    if (!user._id && !user.id) {
      console.error('❌ [loadMapData] User missing ID, aborting');
      setLoading(false);
      setAuthError(true);
      return;
    }

    // DOUBLE CHECK: Verify we're still authenticated and not verifying before making API calls
    if (!isAuthenticated || verifyingToken) {
      console.warn('⚠️ [loadMapData] Not authenticated or still verifying, aborting data load', {
        isAuthenticated,
        verifyingToken,
        hasUser: !!user,
        hasToken: !!token
      });
      setLoading(false);
      setAuthError(true);
      return;
    }

    try {
      setLoading(true);

      // Clear cache if reload timestamp exists (from ContractIngest after upload)
      const reloadTimestamp = localStorage.getItem('mapReloadTimestamp');
      if (reloadTimestamp) {
        const { clearCache } = await import('../../services/api');
        clearCache('carbon-contracts');
        clearCache('reports/geojson');
        localStorage.removeItem('mapReloadTimestamp');
        logger.log('🔄 [loadMapData] Cache cleared, reloading fresh data after contract upload');
      }

      // Use Promise.allSettled to handle errors gracefully without waiting for timeout
      const promiseResults = await Promise.allSettled([
        reportsAPI.getGeoJSON({ type: 'sites' }),
        reportsAPI.getGeoJSON({ type: 'properties' }),
        reportsAPI.getGeoJSON({ type: 'carbon-contracts' }),
        sitesAPI.getAll(),
        assetsAPI.getAll(),
        leasesAPI.getAll(), // Fetch leases to identify leased parcels
      ]);

      // Extract results, handling both success and failure
      const sitesGeoJsonRes = promiseResults[0].status === 'fulfilled' ? promiseResults[0].value : null;
      const assetsGeoJsonRes = promiseResults[1].status === 'fulfilled' ? promiseResults[1].value : null;
      const carbonContractsGeoJsonRes = promiseResults[2].status === 'fulfilled' ? promiseResults[2].value : null;
      const sitesRes = promiseResults[3].status === 'fulfilled' ? promiseResults[3].value : null;
      const assetsRes = promiseResults[4].status === 'fulfilled' ? promiseResults[4].value : null;
      const leasesRes = promiseResults[5].status === 'fulfilled' ? promiseResults[5].value : null;

      // Fetch parcels separately (new API)
      let parcelsRes = null;
      try {
        parcelsRes = await parcelsAPI.getAll();
      } catch (err) {
        logger.error('Failed to load parcels:', err);
      }

      // Log errors if any and check for auth errors
      let hasAuthError = false;
      promiseResults.forEach((result, index) => {
        if (result.status === 'rejected') {
          const endpointNames = ['sites GeoJSON', 'properties GeoJSON', 'carbon-contracts GeoJSON', 'sites', 'assets', 'leases'];
          const status = result.reason?.response?.status;
          const message = result.reason?.message;

          if (status === 401) {
            hasAuthError = true;
            logger.error(`❌ Authentication failed for ${endpointNames[index]}: 401 Unauthorized`);
          } else {
            logger.error(`❌ Failed to load ${endpointNames[index]}:`, status || message);
          }
        }
      });

      // If we got auth errors, stop trying and show error
      if (hasAuthError) {
        console.error('❌ [loadMapData] Authentication failed - stopping all data loading');
        setAuthError(true);
        setLoading(false);
        // Clear any partial data
        setGeojsonData({ type: 'FeatureCollection', features: [] });
        setSites([]);
        setAssets([]);
        return;
      }

      // Merge sites, assets, and carbon contracts GeoJSON data
      const sitesGeoData = sitesGeoJsonRes?.data || { type: 'FeatureCollection', features: [] };
      const assetsGeoData = assetsGeoJsonRes?.data || { type: 'FeatureCollection', features: [] };
      let carbonContractsGeoData = carbonContractsGeoJsonRes?.data || { type: 'FeatureCollection', features: [] };

      // Identify leased parcels by ID
      const leasedParcelIds = new Set();
      if (leasesRes?.data?.data) {
        leasesRes.data.data.forEach(lease => {
          if (lease.parcels) {
            lease.parcels.forEach(p => {
              // Handle both populated object and raw ID
              const parcelId = p.parcel && (p.parcel._id || p.parcel.toString());
              if (parcelId) leasedParcelIds.add(parcelId.toString());
            });
          }
        });
      }

      // Process parcels into GeoJSON features
      const parcelFeatures = (parcelsRes?.data?.data || []).map(parcel => {
        // Assuming parcel.boundary is the GeoJSON geometry
        const geometry = parcel.boundary || parcel.geometry;
        if (!geometry) return null;
        return {
          type: 'Feature',
          geometry: geometry,
          properties: {
            ...parcel,
            type: 'parcel', // Explicitly set type for rendering logic
            name: `Parcel ${parcel.parcelId}`,
            id: String(parcel._id) // Ensure ID is a string for filtering
          }
        };
      }).filter(Boolean);

      // Filter out parcels that are leased (ID match) or covered by a contract (geometry match fallback)
      // This prevents the "Purple Polygon" issue where the parcel layer shows underneath the contract layer
      const contractGeometries = new Set(
        (carbonContractsGeoData.features || []).map(f => JSON.stringify(f.geometry.coordinates))
      );

      const filteredParcelFeatures = parcelFeatures.filter(p => {
        // 1. Check if parcel ID is in the leased set
        if (leasedParcelIds.has(p.properties.id)) return false;

        // 2. Fallback: Check for exact geometry match
        if (contractGeometries.has(JSON.stringify(p.geometry.coordinates))) return false;

        return true;
      });

      // Normal mode: merge all data
      const geoData = {
        type: 'FeatureCollection',
        features: [
          ...(sitesGeoData.features || []),
          ...(assetsGeoData.features || []),
          ...filteredParcelFeatures, // Render filtered Parcels first (bottom layer)
          ...(carbonContractsGeoData.features || []) // Render Contracts last (top layer)
        ]
      };

      setGeojsonData(geoData);

      // Store sites and assets data
      setSites(sitesRes?.data?.data || []);
      setAssets(assetsRes?.data?.data || []);
      setCarbonContracts(carbonContractsGeoJsonRes?.data?.features?.map(f => ({
        ...f.properties,
        geoJson: f
      })) || []);

      await loadEarthquakeDatasets();
    } catch (error) {
      logger.error('❌ Error loading map data:', error);
      logger.error('❌ Error details:', error.response?.data || error.message);
      setGeojsonData({ type: 'FeatureCollection', features: [] });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, user, verifyingToken, loadEarthquakeDatasets]);

  // Trigger data load when auth is ready
  useEffect(() => {
    if (isLoaded && isAuthenticated && token && user && !verifyingToken) {
      loadMapData();
    }
  }, [isLoaded, isAuthenticated, token, user, verifyingToken, loadMapData]);

  // Check for map reload trigger (from ContractIngest after upload) - MOVED HERE after loadMapData declaration
  useEffect(() => {
    const checkReload = () => {
      const reloadTimestamp = localStorage.getItem('mapReloadTimestamp');
      if (reloadTimestamp && map) {
        // Clear cache and reload
        import('../../services/api').then(({ clearCache }) => {
          clearCache('carbon-contracts');
          clearCache('reports/geojson');
          localStorage.removeItem('mapReloadTimestamp');
          logger.log('🔄 [MapView] Reloading map data after contract upload');
          loadMapData();
        });
      }
    };

    // Check on mount and when map becomes available
    if (map) {
      checkReload();
    }
  }, [map, loadMapData]);

  // Helper to handle InfoWindow (singleton pattern)
  const handleInfoWindow = useCallback((content, positionOrAnchor, isAnchor = false) => {
    if (!map || !window.google || !window.google.maps) {
      logger.warn('Cannot open InfoWindow: map or Google Maps API not ready.');
      return;
    }

    // Close existing InfoWindow if any
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
    }

    const infoWindow = new window.google.maps.InfoWindow({
      content: content,
      zIndex: 1000,
    });

    if (isAnchor) {
      infoWindow.open(map, positionOrAnchor);
    } else {
      infoWindow.setPosition(positionOrAnchor);
      infoWindow.open(map);
    }

    activeInfoWindowRef.current = infoWindow;

    // Clear ref when closed manually
    infoWindow.addListener('closeclick', () => {
      activeInfoWindowRef.current = null;
    });

    return infoWindow;
  }, [map]);

  const onLoad = useCallback((map) => {
    mapRef.current = map;
    setMap(map);

    // Critical: Trigger multiple resize events to ensure map renders properly
    // This fixes white overlay issues on mobile
    const triggerResize = () => {
      if (window.google && window.google.maps && map) {
        window.google.maps.event.trigger(map, 'resize');
      }
    };

    // Trigger resize immediately and multiple times to ensure proper rendering
    triggerResize();
    setTimeout(triggerResize, 100);
    setTimeout(triggerResize, 300);
    setTimeout(triggerResize, 500);
    setTimeout(triggerResize, 1000);

    // Fix zoom controls to not interfere with touch gestures on mobile
    setTimeout(() => {
      if (window.google && window.google.maps && map) {
        window.google.maps.event.trigger(map, 'resize');

        // On mobile, force zoom controls to be visible and properly styled
        // Use multiple attempts to catch all possible Google Maps implementations
        const forceZoomControlsVisible = () => {
          if (window.innerWidth <= 900) {
            // Try multiple selectors to find zoom controls (different Google Maps versions)
            const selectors = [
              '.gm-control-active',
              '.gmnoprint[role="button"]',
              '.gmnoprint button',
              'div[role="button"][aria-label*="Zoom"]',
              'div[role="button"][aria-label*="zoom"]',
              '.gm-style .gm-control-active',
              '.gm-style-cc + .gmnoprint',
              '[data-control-width]',
              '.gm-fullscreen-control',
            ];

            selectors.forEach(selector => {
              try {
                const elements = document.querySelectorAll(selector);
                elements.forEach((control) => {
                  // Force visibility with all possible methods
                  control.style.setProperty('display', 'block', 'important');
                  control.style.setProperty('visibility', 'visible', 'important');
                  control.style.setProperty('opacity', '1', 'important');
                  control.style.setProperty('touch-action', 'manipulation', 'important');
                  control.style.setProperty('-webkit-tap-highlight-color', 'transparent', 'important');
                  control.style.setProperty('min-width', '44px', 'important');
                  control.style.setProperty('min-height', '44px', 'important');
                  control.setAttribute('style', control.getAttribute('style') + '; display: block !important; visibility: visible !important; opacity: 1 !important;');
                });
              } catch (e) {
                // Ignore selector errors
              }
            });

            // Find and position controls to prevent overlap
            const allElements = document.querySelectorAll('.gmnoprint, [class*="control"], [class*="zoom"]');
            allElements.forEach((element) => {
              const rect = element.getBoundingClientRect();
              const isBottomLeft = rect.bottom > window.innerHeight - 100 && rect.left < 150;
              const isBottomRight = rect.bottom > window.innerHeight - 100 && rect.right > window.innerWidth - 100;
              const hasZoomButtons = element.querySelector('button[aria-label*="Zoom"]') ||
                element.querySelector('button[aria-label*="zoom"]') ||
                (isBottomLeft && element.querySelector('button'));
              const hasRotate = element.querySelector('[aria-label*="Rotate"]') ||
                element.querySelector('[aria-label*="rotate"]') ||
                element.querySelector('[aria-label*="Compass"]') ||
                element.querySelector('[aria-label*="compass"]');

              // Position zoom controls in bottom-left, above map data
              if (hasZoomButtons && (isBottomLeft || isBottomRight)) {
                element.style.setProperty('display', 'block', 'important');
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('opacity', '1', 'important');
                element.style.setProperty('position', 'absolute', 'important');
                element.style.setProperty('bottom', '60px', 'important');
                element.style.setProperty('left', '10px', 'important');
                element.style.setProperty('right', 'auto', 'important');
                element.style.setProperty('z-index', '100', 'important');

                const buttons = element.querySelectorAll('button');
                buttons.forEach(btn => {
                  btn.style.setProperty('display', 'block', 'important');
                  btn.style.setProperty('visibility', 'visible', 'important');
                  btn.style.setProperty('opacity', '1', 'important');
                  btn.style.setProperty('min-width', '44px', 'important');
                  btn.style.setProperty('min-height', '44px', 'important');
                });
              }

              // Hide rotation/compass and 3D/tilt buttons
              if (hasRotate) {
                element.style.setProperty('display', 'none', 'important');
                element.style.setProperty('visibility', 'hidden', 'important');
                element.style.setProperty('opacity', '0', 'important');
              }

              // Hide 3D/tilt controls
              const hasTilt = element.querySelector('[aria-label*="Tilt"]') ||
                element.querySelector('[aria-label*="tilt"]') ||
                element.querySelector('[title*="Tilt"]') ||
                element.querySelector('[title*="tilt"]');
              if (hasTilt) {
                element.style.setProperty('display', 'none', 'important');
                element.style.setProperty('visibility', 'hidden', 'important');
                element.style.setProperty('opacity', '0', 'important');
              }

              // Move scale bar to bottom left - find by text content or class
              const hasScale = (element.textContent && (
                element.textContent.match(/\d+\s*(km|m|קנה מידה)/i) ||
                element.textContent.includes('קנה מידה') ||
                element.textContent.match(/\d+\s*(km|m)/)
              )) || element.classList.toString().toLowerCase().includes('scale') ||
                element.getAttribute('aria-label')?.toLowerCase().includes('scale') ||
                element.getAttribute('title')?.toLowerCase().includes('scale');

              if (hasScale && !hasZoomButtons && !hasRotate && !hasTilt && !hasMapData) {
                element.style.setProperty('display', 'block', 'important');
                element.style.setProperty('visibility', 'visible', 'important');
                element.style.setProperty('opacity', '1', 'important');
                element.style.setProperty('position', 'absolute', 'important');
                element.style.setProperty('left', '10px', 'important');
                element.style.setProperty('right', 'auto', 'important');
                element.style.setProperty('bottom', '40px', 'important'); // Position above Google logo
                element.style.setProperty('z-index', '10', 'important');
                element.style.setProperty('font-size', '14px', 'important'); // Enlarge text
                element.style.setProperty('font-weight', '500', 'important');
                element.style.setProperty('transform', 'scale(1.2)', 'important'); // Enlarge overall
                element.style.setProperty('transform-origin', 'left bottom', 'important');
                element.style.setProperty('pointer-events', 'auto', 'important');
              }

              // Hide map data, keyboard shortcuts, and any white rectangles
              const hasMapData = element.textContent && (
                element.textContent.includes('Map Data') ||
                element.textContent.includes('Terms') ||
                element.textContent.includes('keyboard') ||
                element.textContent.includes('Keyboard') ||
                element.textContent.includes('Google') ||
                element.textContent.includes('Report')
              );
              if (hasMapData) {
                element.style.setProperty('display', 'none', 'important');
                element.style.setProperty('visibility', 'hidden', 'important');
                element.style.setProperty('opacity', '0', 'important');
                element.style.setProperty('height', '0', 'important');
                element.style.setProperty('width', '0', 'important');
                element.style.setProperty('overflow', 'hidden', 'important');
              }

              // Remove white backgrounds and hide white rectangles that aren't zoom buttons or scale
              if (!hasZoomButtons && !hasScale) {
                const bgColor = window.getComputedStyle(element).backgroundColor;
                const rect = element.getBoundingClientRect();
                const isNearZoomControls = (rect.left < 150 && rect.bottom > window.innerHeight - 150) ||
                  (rect.right > window.innerWidth - 150 && rect.bottom > window.innerHeight - 150);

                // Hide small white rectangles, especially near zoom controls
                if (bgColor && (bgColor.includes('rgb(255, 255, 255)') || bgColor.includes('white') || bgColor === 'white')) {
                  if (isNearZoomControls || (rect.width < 100 && rect.height < 100)) {
                    element.style.setProperty('display', 'none', 'important');
                    element.style.setProperty('visibility', 'hidden', 'important');
                    element.style.setProperty('opacity', '0', 'important');
                  } else {
                    element.style.setProperty('background', 'transparent', 'important');
                  }
                }
              }
            });
          }
        };

        // Try multiple times with delays to catch controls that load later
        setTimeout(forceZoomControlsVisible, 200);
        setTimeout(forceZoomControlsVisible, 500);
        setTimeout(forceZoomControlsVisible, 1000);
        setTimeout(forceZoomControlsVisible, 2000);
      }
    }, 100);

    // No need to modify mapTypeId - it's set correctly in options
    // The warning is suppressed in index.js

    // Centering logic moved to useEffect
    logger.log('✅ Map loaded successfully');
  }, [handleInfoWindow]);

  // Unified centering effect - handles initial load and updates
  useEffect(() => {
    // Check for "show all contracts" flag from ContractIngest page
    const showAllContracts = localStorage.getItem('showAllContracts');
    if (showAllContracts === 'true' && map && geojsonData) {
      try {
        // Find all carbon contract polygons and fit bounds to show them all
        const carbonContractFeatures = geojsonData.features.filter(
          f => f.properties.type === 'carbon-contract' && f.geometry.type === 'Polygon'
        );

        if (carbonContractFeatures.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          let hasValidBounds = false;

          carbonContractFeatures.forEach(feature => {
            if (feature.geometry.coordinates && feature.geometry.coordinates[0]) {
              feature.geometry.coordinates[0].forEach(coord => {
                const [lng, lat] = coord;
                if (!isNaN(lat) && !isNaN(lng)) {
                  bounds.extend({ lat, lng });
                  hasValidBounds = true;
                }
              });
            }
          });

          if (hasValidBounds) {
            logger.log('🎯 [MapView] Showing all contracts on map');
            map.fitBounds(bounds, { padding: 100 });
            hasCenteredOnDataRef.current = true;
            localStorage.removeItem('showAllContracts');
            return; // Don't run normal centering logic
          }
        }
      } catch (err) {
        logger.error('Error showing all contracts:', err);
        localStorage.removeItem('showAllContracts');
      }
    }

    // Check for contract location from localStorage (set by "View on Map" button)
    const mapCenterContract = localStorage.getItem('mapCenterContract');
    if (mapCenterContract && map) {
      try {
        const { lat, lng, contractId } = JSON.parse(mapCenterContract);
        if (lat && lng && window.google && window.google.maps) {
          logger.log('🎯 [MapView] Centering on contract from localStorage:', { lat, lng, contractId });
          map.setCenter({ lat, lng });
          map.setZoom(12); // Zoom level 12 for contract view (less zoomed in)
          setMapZoom(12);
          setMapCenter({ lat, lng });
          hasCenteredOnDataRef.current = true;
          // Clear localStorage after using it
          localStorage.removeItem('mapCenterContract');
          return; // Don't run normal centering logic
        }
      } catch (err) {
        logger.error('Error parsing mapCenterContract from localStorage:', err);
        localStorage.removeItem('mapCenterContract');
      }
    }

    // If map is not ready or no data, do nothing
    if (!map || !geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
      return;
    }

    // If we already centered on this data, don't do it again
    if (hasCenteredOnDataRef.current) {
      return;
    }

    // Calculate bounds
    try {
      if (window.google && window.google.maps) {
        const bounds = new window.google.maps.LatLngBounds();
        let hasValidBounds = false;
        let featureCount = 0;
        let lastValidFeature = null;

        // Combine all features from all sources
        const allFeatures = [
          ...(geojsonData?.features || []),
          ...(earthquakeGeoJSON?.features || []),
          ...(dangerMapGeoJSON?.features || [])
        ];

        allFeatures.forEach((feature) => {
          if (feature?.geometry?.type === 'Point' && feature.geometry.coordinates) {
            const [lng, lat] = feature.geometry.coordinates;
            if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 &&
              Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              const point = new window.google.maps.LatLng(lat, lng);
              bounds.extend(point);
              hasValidBounds = true;
              featureCount++;
              lastValidFeature = { lat, lng };
            }
          }
        });

        if (hasValidBounds && featureCount > 0) {
          console.log('🎯 [useEffect] Centering map on', featureCount, 'valid features');

          // Use a timeout to ensure map is fully ready
          setTimeout(() => {
            // Special handling for single feature - center directly
            if (featureCount === 1 && lastValidFeature) {
              console.log('🎯 [useEffect] Single feature detected, centering directly:', lastValidFeature);
              map.setCenter(lastValidFeature);
              map.setZoom(8); // Zoom 8: Overview of Fiji
              setMapZoom(8);
              hasCenteredOnDataRef.current = true;
            } else {
              // Multiple features - use fitBounds with clamped zoom
              // Temporarily restrict maxZoom to prevent zooming in too close
              map.setOptions({ maxZoom: 8 }); // Force zoom 8 for overview

              const padding = window.innerWidth <= 900 ? 50 : 100;
              map.fitBounds(bounds, padding);
              hasCenteredOnDataRef.current = true;

              // Restore maxZoom after map is idle
              const listener = window.google.maps.event.addListenerOnce(map, 'idle', () => {
                // Restore maxZoom to allow user to zoom in
                map.setOptions({ maxZoom: 20 });

                const zoom = map.getZoom();

                // Force zoom 8 for overview if it zoomed in too much
                if (zoom > 8) {
                  map.setZoom(8);
                  setMapZoom(8);
                } else {
                  setMapZoom(zoom);
                }

                const center = map.getCenter();
                if (center) {
                  console.log('✅ [useEffect] Map centered on:', { lat: center.lat(), lng: center.lng(), zoom: map.getZoom() });
                }
              });
            }
          }, 200); // 200ms delay
        } else {
          console.warn('⚠️ [useEffect] No valid bounds found in features');
        }
      }
    } catch (error) {
      logger.error('Error centering map on data:', error);
    }
  }, [map, geojsonData, earthquakeGeoJSON, dangerMapGeoJSON]);

  const onDragEnd = useCallback(() => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      const zoom = mapRef.current.getZoom();
      if (center) {
        setMapCenter({ lat: center.lat(), lng: center.lng() });
      }
      if (zoom) {
        setMapZoom(zoom);
      }
    }
  }, []);

  const onZoomChanged = useCallback(() => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom();
      if (zoom) {
        setMapZoom(zoom);
      }
    }
  }, []);

  const onMapClick = useCallback(() => {
    // Close Popover when clicking on the map (but not on a marker)
    selectedMarkerRef.current = null;
    setSelectedMarker(null);
    setPopoverAnchor(null);
    setIsCardVisible(false);

    // Close danger map info window if open
    if (dangerMapInfoWindowRef.current) {
      dangerMapInfoWindowRef.current.close();
      dangerMapInfoWindowRef.current = null;
    }
    // Close any active info window
    if (activeInfoWindowRef.current) {
      activeInfoWindowRef.current.close();
      activeInfoWindowRef.current = null;
    }
  }, []);

  // Handle Escape key to close card
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && selectedMarker && isCardVisible) {
        onMapClick();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedMarker, isCardVisible, onMapClick]);

  const onUnmount = useCallback(() => {
    // Clear all markers when map unmounts
    if (markersRef.current) {
      markersRef.current.forEach((marker) => {
        if (marker) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    }
    mapRef.current = null;
  }, []);

  // Create markers directly using Google Maps API
  useEffect(() => {
    if (!isLoaded) {
      return; // Wait for Google Maps to be fully loaded
    }

    if (!map || !geojsonData || !geojsonData.features || geojsonData.features.length === 0) {
      return;
    }

    if (!window.google || !window.google.maps) {
      logger.warn('⚠️ Google Maps API not loaded yet');
      return;
    }

    // Load markers asynchronously using the new importLibrary API
    const loadMarkers = async () => {
      try {
        // Import the marker library using the new API (cache it to avoid reloading)
        let AdvancedMarkerElement;
        if (advancedMarkerLibraryRef.current) {
          AdvancedMarkerElement = advancedMarkerLibraryRef.current.AdvancedMarkerElement;
        } else {
          const markerLibrary = await window.google.maps.importLibrary('marker');
          AdvancedMarkerElement = markerLibrary.AdvancedMarkerElement;
          advancedMarkerLibraryRef.current = markerLibrary; // Cache for reuse
        }

        logger.log(`🎯 Creating ${geojsonData.features.length} markers directly on map`);

        // Clear existing markers
        markersRef.current.forEach((marker) => {
          if (marker) {
            marker.setMap(null);
          }
        });
        markersRef.current = [];
        markersMapRef.current.clear();

        // Clear selected marker when switching between sites/assets
        selectedMarkerRef.current = null;
        setSelectedMarker(null);
        setPopoverAnchor(null);
        setIsCardVisible(false);

        // Create new markers - filter based on zoom level
        // NOTE: Carbon contracts should show as POLYGONS, not markers
        // Only show markers for sites and properties, NOT carbon contracts
        geojsonData.features
          .filter((feature) => {
            // Skip carbon contracts - they should be polygons, not markers
            if (feature.properties.type === 'carbon-contract') {
              return false;
            }
            if (mapZoom >= ZOOM_THRESHOLD) {
              // When zoomed in: show assets/properties
              return feature.properties.type === 'property';
            } else {
              // When zoomed out: show only sites
              return feature.properties.type !== 'property';
            }
          })
          .forEach((feature, index) => {
            if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
              return;
            }

            const coordinates = feature.geometry.coordinates;
            if (!Array.isArray(coordinates) || coordinates.length < 2) {
              return;
            }

            const position = {
              lat: parseFloat(coordinates[1]), // GeoJSON format: [lng, lat]
              lng: parseFloat(coordinates[0]),
            };

            if (isNaN(position.lat) || isNaN(position.lng)) {
              return;
            }

            // Basic validation - only skip if truly invalid
            if (position.lat < -90 || position.lat > 90 || position.lng < -180 || position.lng > 180) {
              logger.warn(`⚠️ Invalid coordinates for "${feature.properties.name}": [${position.lat}, ${position.lng}]. Skipping marker.`);
              return;
            }

            logger.log(`📍 Creating Google Maps AdvancedMarkerElement for "${feature.properties.name}" at`, position);

            // Determine marker color based on type (site, asset, or carbon contract)
            const isProperty = feature.properties.type === 'property';
            const isCarbonContract = feature.properties.type === 'carbon-contract';
            // For carbon contracts, use status-based color; otherwise use type-based color
            let pinColor = '#1976D2'; // Default: Blue for sites
            if (isCarbonContract && feature.properties.status) {
              pinColor = getStatusColor(feature.properties.status);
            } else if (isProperty) {
              pinColor = '#F57C00'; // Orange for assets
            }

            // Create Airbnb-style pin marker (arrow pointing down)
            const markerElement = document.createElement('div');
            markerElement.innerHTML = `
              <svg width="30" height="38" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                <defs>
                  <filter id="shadow-pin-${index}" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                    <feOffset dx="0" dy="1.5" result="offsetblur"/>
                    <feComponentTransfer>
                      <feFuncA type="linear" slope="0.3"/>
                    </feComponentTransfer>
                    <feMerge>
                      <feMergeNode/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <path d="M20 0 C8.954 0 0 8.954 0 20 C0 30 20 50 20 50 C20 50 40 30 40 20 C40 8.954 31.046 0 20 0 Z" fill="${pinColor}" stroke="none" filter="url(#shadow-pin-${index})"/>
                <circle cx="20" cy="20" r="6" fill="#ffffff" stroke="none"/>
              </svg>
            `;
            markerElement.style.cssText = `
              cursor: pointer;
              transition: transform 0.2s ease;
              pointer-events: auto;
              display: block;
              width: 30px;
              height: 38px;
              margin: 0;
              padding: 0;
              line-height: 0;
            `;
            markerElement.addEventListener('mouseenter', () => {
              markerElement.style.transform = 'scale(1.15)';
            });
            markerElement.addEventListener('mouseleave', () => {
              markerElement.style.transform = 'scale(1)';
            });

            // Handler function to open popover (always open, no toggle)
            const handleMarkerClick = (e) => {
              if (e) {
                // Prevent event from bubbling to map click
                if (e.stop) {
                  e.stop(); // For Google Maps events
                } else if (e.preventDefault) {
                  e.preventDefault(); // For DOM events
                }
                if (e.stopPropagation) {
                  e.stopPropagation();
                }
              }

              // Always set the selected marker FIRST (open the popover immediately)
              selectedMarkerRef.current = feature;
              setSelectedMarker(feature);

              // Don't set initial position - wait for exact calculation to avoid "jump" from center
              // Card will appear only after exact position is calculated (like Airbnb)
              setIsCardVisible(false);
              setPopoverAnchor(null);

              // Calculate exact pixel position from lat/lng for Popover (card appears only after this)
              if (map && mapContainerRef.current) {
                const latLng = new window.google.maps.LatLng(position.lat, position.lng);
                const overlay = new window.google.maps.OverlayView();
                overlay.draw = function () { };
                overlay.setMap(map);

                // Wait for projection to be ready
                overlay.onAdd = function () {
                  try {
                    const projection = overlay.getProjection();
                    if (projection && mapContainerRef.current) {
                      // Use fromLatLngToContainerPixel - this gives position relative to map container
                      const point = projection.fromLatLngToContainerPixel(latLng);
                      if (!point) {
                        return;
                      }
                      const mapContainer = mapContainerRef.current;
                      if (mapContainer) {
                        const mapRect = mapContainer.getBoundingClientRect();

                        // Marker is 40x50px SVG
                        // point.x, point.y are the top-left corner of the marker (anchor point)
                        const MARKER_WIDTH = 40;
                        const MARKER_HEIGHT = 50;

                        // Marker tip (arrow point) is at bottom center relative to marker anchor
                        // Anchor is at top-left (0, 0), so tip is at (20, 50) relative to anchor
                        const MARKER_TIP_X_OFFSET = MARKER_WIDTH / 2; // 20px from left edge
                        const MARKER_TIP_Y_OFFSET = MARKER_HEIGHT; // 50px from top edge

                        // Card dimensions (from AirbnbCard.jsx: width=362px, approximate height ~300px)
                        const CARD_WIDTH = 362;
                        const CARD_HEIGHT = 300; // Approximate height
                        const CARD_HALF_WIDTH = CARD_WIDTH / 2;
                        const CARD_HALF_HEIGHT = CARD_HEIGHT / 2;

                        // Fixed distance from marker tip to card center (like Airbnb)
                        // This ensures the card stays at a constant distance from the marker tip
                        // regardless of card height or zoom level
                        const FIXED_DISTANCE_FROM_MARKER_TIP = 158; // Distance in pixels from marker tip to card center

                        // Calculate marker tip position in screen coordinates
                        // point.x, point.y are relative to map container, need to add mapRect offset
                        const markerTipX = mapRect.left + point.x + MARKER_TIP_X_OFFSET;
                        const markerTipY = mapRect.top + point.y + MARKER_TIP_Y_OFFSET;

                        // Position card center at fixed distance from marker tip (like Airbnb)
                        // Card uses transform: translate(-50%, -50%), so left/top are the center position
                        let cardCenterX = markerTipX; // Align horizontally with marker tip
                        // Position card center at fixed distance from marker tip (above by default)
                        let cardCenterY = markerTipY - FIXED_DISTANCE_FROM_MARKER_TIP;

                        // Check if card fits with marker below (default position)
                        let isWithinBounds =
                          cardCenterX - CARD_HALF_WIDTH >= mapRect.left &&
                          cardCenterX + CARD_HALF_WIDTH <= mapRect.right &&
                          cardCenterY - CARD_HALF_HEIGHT >= mapRect.top &&
                          cardCenterY + CARD_HALF_HEIGHT <= mapRect.bottom;

                        // If card doesn't fit with marker below, try with marker above
                        if (!isWithinBounds) {
                          cardCenterY = markerTipY + FIXED_DISTANCE_FROM_MARKER_TIP;
                          isWithinBounds =
                            cardCenterX - CARD_HALF_WIDTH >= mapRect.left &&
                            cardCenterX + CARD_HALF_WIDTH <= mapRect.right &&
                            cardCenterY - CARD_HALF_HEIGHT >= mapRect.top &&
                            cardCenterY + CARD_HALF_HEIGHT <= mapRect.bottom;
                        }

                        setIsCardVisible(isWithinBounds);

                        if (isWithinBounds) {
                          setPopoverAnchor({
                            left: cardCenterX,
                            top: cardCenterY,
                          });
                        } else {
                          // Hide card when outside bounds
                          setPopoverAnchor(null);
                        }
                      }
                    }
                  } catch (error) {
                    // Silently handle projection errors
                  } finally {
                    // Clean up after a short delay
                    setTimeout(() => {
                      if (overlay && overlay.setMap) {
                        try {
                          overlay.setMap(null);
                        } catch (cleanupError) {
                          logger.debug('Overlay cleanup error:', cleanupError);
                        }
                      }
                    }, 100);
                  }
                };
              }
            };

            // Use AdvancedMarkerElement API with custom content (new importLibrary method)
            const marker = new AdvancedMarkerElement({
              position: position,
              map: map,
              title: feature.properties.name || 'Site',
              content: markerElement,
              zIndex: selectedMarker && selectedMarker.properties.id === feature.properties.id ? 1001 : 1000,
            });

            // Single click handler - no debounce, immediate response
            let isHandlingClick = false;
            const handleClick = (e) => {
              // Prevent double-trigger from event bubbling only
              if (isHandlingClick) {
                return;
              }

              isHandlingClick = true;
              // Very minimal debounce - just to prevent same event from firing twice
              setTimeout(() => {
                isHandlingClick = false;
              }, 10); // Minimal 10ms - just to prevent event bubbling

              // Call handler immediately - no delay
              handleMarkerClick(e);
            };

            // Add click listener to marker - use both gmp-click and click events
            marker.addListener('gmp-click', handleClick);
            marker.addListener('click', handleClick);

            // Also make marker element itself clickable
            markerElement.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              handleClick(e);
            }, { capture: true });

            // Remove clickable circle - it was causing multiple click issues
            // AdvancedMarkerElement is already clickable enough

            markersRef.current.push(marker);
            // Store mapping from feature ID to marker
            const featureId = feature.properties.id || feature._id || index;
            markersMapRef.current.set(featureId, marker);
            logger.log(`✅ AdvancedMarkerElement created for "${feature.properties.name}"`);
          });

        logger.log(`✅ Total markers created: ${markersRef.current.length}`);
      } catch (error) {
        logger.warn('⚠️ AdvancedMarkerElement not available, using regular markers as fallback:', error.message);

        // Fallback to regular Google Maps markers
        try {
          const ZOOM_THRESHOLD = 14; // Same threshold as used above
          geojsonData.features
            .filter((feature) => {
              // Skip carbon contracts - they should be polygons, not markers
              if (feature.properties.type === 'carbon-contract') {
                return false;
              }
              if (mapZoom >= ZOOM_THRESHOLD) {
                return feature.properties.type === 'property';
              } else {
                return feature.properties.type !== 'property';
              }
            })
            .forEach((feature) => {
              if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
                return;
              }

              const coordinates = feature.geometry.coordinates;
              const position = {
                lat: parseFloat(coordinates[1]),
                lng: parseFloat(coordinates[0]),
              };

              if (isNaN(position.lat) || isNaN(position.lng)) {
                return;
              }

              const isCarbonContract = feature.properties.type === 'carbon-contract';
              let pinColor = '#1976D2';
              if (isCarbonContract && feature.properties.status) {
                pinColor = getStatusColor(feature.properties.status);
              }

              const marker = new window.google.maps.Marker({
                position: position,
                map: map,
                title: feature.properties.name || 'Site',
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: pinColor,
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                },
              });

              // Create a click handler for the fallback marker
              const handleFallbackMarkerClick = () => {
                selectedMarkerRef.current = feature;
                setSelectedMarker(feature);
                setIsCardVisible(false);
                setPopoverAnchor(null);

                // Calculate position for popover
                if (map && mapContainerRef.current) {
                  const latLng = new window.google.maps.LatLng(position.lat, position.lng);
                  const overlay = new window.google.maps.OverlayView();
                  overlay.draw = function () { };
                  overlay.setMap(map);

                  overlay.onAdd = function () {
                    try {
                      const projection = overlay.getProjection();
                      if (projection && mapContainerRef.current) {
                        const point = projection.fromLatLngToContainerPixel(latLng);
                        if (point) {
                          const mapContainer = mapContainerRef.current;
                          const mapRect = mapContainer.getBoundingClientRect();
                          const markerTipX = mapRect.left + point.x + 20;
                          const markerTipY = mapRect.top + point.y + 8;
                          setPopoverAnchor({ x: markerTipX, y: markerTipY });
                          setIsCardVisible(true);
                        }
                      }
                    } catch (err) {
                      logger.debug('Overlay projection error:', err);
                    } finally {
                      setTimeout(() => {
                        if (overlay && overlay.setMap) {
                          try {
                            overlay.setMap(null);
                          } catch (cleanupError) {
                            logger.debug('Overlay cleanup error:', cleanupError);
                          }
                        }
                      }, 100);
                    }
                  };
                }
              };

              marker.addListener('click', handleFallbackMarkerClick);
              markersRef.current.push(marker);
            });

          logger.log(`✅ Fallback: Created ${markersRef.current.length} regular markers`);
        } catch (fallbackError) {
          logger.error('❌ Error creating fallback markers:', fallbackError);
        }
      }
    };

    loadMarkers();

    // Cleanup function
    return () => {
      markersRef.current.forEach((marker) => {
        if (marker) {
          marker.setMap(null);
        }
      });
      markersRef.current = [];
    };
  }, [map, geojsonData, mapZoom, isLoaded, selectedMarker, handleInfoWindow]);

  // Update marker zIndex when selectedMarker changes to keep them interactive
  useEffect(() => {
    if (markersRef.current && markersRef.current.length > 0) {
      markersRef.current.forEach((marker, index) => {
        if (marker && geojsonData && geojsonData.features && geojsonData.features[index]) {
          const feature = geojsonData.features[index];
          const prevId = selectedMarker?.properties?.id || selectedMarker?._id;
          const currentId = feature.properties.id || feature._id;
          const isSelected = selectedMarker && prevId === currentId;

          // For AdvancedMarkerElement, set zIndex property directly
          if (marker.zIndex !== undefined) {
            marker.zIndex = isSelected ? 1001 : 1000;
          }
        }
      });
    }
  }, [selectedMarker, geojsonData]);

  // Render polygon overlays from geojsonData (for carbon contracts with status-based styling)
  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!map || !geojsonData || !geojsonData.features) {
      // Clear existing polygons
      polygonOverlaysRef.current.forEach((polygon) => {
        if (polygon) polygon.setMap(null);
      });
      polygonOverlaysRef.current = [];
      return;
    }

    if (!window.google || !window.google.maps) {
      return;
    }

    // Clear existing polygon overlays
    polygonOverlaysRef.current.forEach((polygon) => {
      if (polygon) polygon.setMap(null);
    });
    polygonOverlaysRef.current = [];

    // Process features with Polygon or MultiPolygon geometry
    let carbonContractCount = 0;
    let parcelCount = 0;
    let polygonCount = 0;

    geojsonData.features.forEach((feature) => {
      // Debug: log feature types
      if (feature.properties && feature.properties.type) {
        logger.log(`🔍 [Polygon] Feature type: ${feature.properties.type}, geometry: ${feature.geometry?.type}`);
        if (feature.properties.type === 'carbon-contract') {
          console.log('🔍 [Polygon] Carbon Contract Details:', JSON.stringify(feature, null, 2));
        }
      }

      // Only process carbon contracts and parcels
      const isCarbonContract = feature.properties.type === 'carbon-contract';
      const isParcel = feature.properties.type === 'parcel';

      if (isCarbonContract) {
        console.log('🔍 [MapView] Found Carbon Contract:', {
          id: feature.properties.id,
          name: feature.properties.name,
          geometryType: feature.geometry?.type,
          coordinates: feature.geometry?.coordinates,
          score: feature.properties.greenScore
        });
      }

      if (!isCarbonContract && !isParcel) {
        return;
      }

      if (isCarbonContract) carbonContractCount++;
      if (isParcel) parcelCount++;

      if (!feature.geometry) {
        logger.warn(`⚠️ [Polygon] ${feature.properties.type} feature has no geometry`);
        return;
      }

      // Check if it's a polygon geometry
      if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
        logger.log(`ℹ️ [Polygon] Feature has ${feature.geometry.type} geometry, skipping polygon rendering`);
        return;
      }

      polygonCount++;

      // Determine styling based on type
      let fillColor, strokeColor, fillOpacity, strokeOpacity, strokeWeight;

      // Helper to get color based on score (0-100)
      const getScoreColor = (score) => {
        if (score === undefined || score === null) return '#9E9E9E'; // Gray

        // Normalize score 0-100
        const n = Math.max(0, Math.min(100, score));

        // Red (0) -> Yellow (50) -> Green (100)
        if (n < 50) {
          // Red to Yellow
          // Red: 255, 0, 0
          // Yellow: 255, 255, 0
          const g = Math.round(255 * (n / 50));
          return `rgb(255, ${g}, 0)`;
        } else {
          // Yellow to Green
          // Yellow: 255, 255, 0
          // Green: 0, 255, 0
          const r = Math.round(255 * ((100 - n) / 50));
          return `rgb(${r}, 255, 0)`;
        }
      };

      if (isCarbonContract) {
        // Use status-based color instead of score-based gradient
        // This ensures consistency with the repository list (Breach=Red, Warning=Orange)
        fillColor = getStatusColor(feature.properties.status);
        strokeColor = fillColor; // Same color for stroke
        fillOpacity = 0.5; // Slightly more opaque
        strokeOpacity = 1.0;
        strokeWeight = 3; // Thicker border
      } else if (isParcel) {
        fillColor = '#9C27B0'; // Purple for Parcels
        strokeColor = '#7B1FA2';
        fillOpacity = 0.3;
        strokeOpacity = 0.8;
        strokeWeight = 2;
      }

      // Handle Polygon geometries
      if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
        const coordinates = feature.geometry.coordinates[0]; // Outer ring
        if (!Array.isArray(coordinates) || coordinates.length < 3) return;

        const path = coordinates.map(coord => ({
          lat: parseFloat(coord[1]),
          lng: parseFloat(coord[0]),
        })).filter(pos =>
          !isNaN(pos.lat) && !isNaN(pos.lng) &&
          pos.lat >= -90 && pos.lat <= 90 &&
          pos.lng >= -180 && pos.lng <= 180
        );

        if (path.length < 3) return;

        const polygon = new window.google.maps.Polygon({
          paths: path,
          strokeColor: strokeColor,
          strokeOpacity: strokeOpacity,
          strokeWeight: strokeWeight,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          map: map,
          zIndex: isParcel ? 400 : 450, // Parcels below carbon contracts
        });

        // Add click handler
        polygon.addListener('click', (event) => {
          // Build info content
          let infoContent = '';

          if (isCarbonContract) {
            infoContent = `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0;">${feature.properties.name || 'Carbon Contract'}</h3>
                ${feature.properties.status ? `<p style="margin: 4px 0;"><strong>Status:</strong> ${feature.properties.status}</p>` : ''}
                ${feature.properties.mataqaliName ? `<p style="margin: 4px 0;"><strong>Owner:</strong> ${feature.properties.mataqaliName}</p>` : ''}
                ${feature.properties.greenScore !== undefined ? `<p style="margin: 4px 0;"><strong>Green Score:</strong> ${feature.properties.greenScore}</p>` : ''}
                ${feature.properties.payoutAmount !== undefined ? `<p style="margin: 4px 0;"><strong>Payout Amount:</strong> ${feature.properties.payoutAmount}</p>` : ''}
                ${feature.properties.address ? `<p style="margin: 4px 0;"><strong>Address:</strong> ${feature.properties.address}</p>` : ''}
              </div>
            `;
          } else if (isParcel) {
            infoContent = `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0;">${feature.properties.name || 'Parcel'}</h3>
                <p style="margin: 4px 0;"><strong>ID:</strong> ${feature.properties.parcelId}</p>
                <p style="margin: 4px 0;"><strong>Area:</strong> ${feature.properties.areaHectares} ha</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> ${feature.properties.status}</p>
                ${feature.properties.landUnit ? `<p style="margin: 4px 0;"><strong>Land Unit:</strong> ${feature.properties.landUnit}</p>` : ''}
              </div>
            `;
          }

          handleInfoWindow(infoContent, event.latLng);
        });

        polygonOverlaysRef.current.push(polygon);
      }
      // Handle MultiPolygon geometries
      else if (feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates) {
        feature.geometry.coordinates.forEach((polygonCoords) => {
          const coordinates = polygonCoords[0]; // Outer ring
          if (!Array.isArray(coordinates) || coordinates.length < 3) return;

          const path = coordinates.map(coord => ({
            lat: parseFloat(coord[1]),
            lng: parseFloat(coord[0]),
          })).filter(pos =>
            !isNaN(pos.lat) && !isNaN(pos.lng) &&
            pos.lat >= -90 && pos.lat <= 90 &&
            pos.lng >= -180 && pos.lng <= 180
          );

          if (path.length < 3) return;

          const polygon = new window.google.maps.Polygon({
            paths: path,
            strokeColor: strokeColor,
            strokeOpacity: strokeOpacity,
            strokeWeight: strokeWeight,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            map: map,
            zIndex: isParcel ? 400 : 450,
          });

          polygon.addListener('click', (event) => {
            let infoContent = '';

            if (isCarbonContract) {
              infoContent = `
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 8px 0;">${feature.properties.name || 'Carbon Contract'}</h3>
                  ${feature.properties.status ? `<p style="margin: 4px 0;"><strong>Status:</strong> ${feature.properties.status}</p>` : ''}
                  ${feature.properties.mataqaliName ? `<p style="margin: 4px 0;"><strong>Owner:</strong> ${feature.properties.mataqaliName}</p>` : ''}
                  ${feature.properties.greenScore !== undefined ? `<p style="margin: 4px 0;"><strong>Green Score:</strong> ${feature.properties.greenScore}</p>` : ''}
                  ${feature.properties.payoutAmount !== undefined ? `<p style="margin: 4px 0;"><strong>Payout Amount:</strong> ${feature.properties.payoutAmount}</p>` : ''}
                  ${feature.properties.address ? `<p style="margin: 4px 0;"><strong>Address:</strong> ${feature.properties.address}</p>` : ''}
                </div>
              `;
            } else if (isParcel) {
              infoContent = `
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 8px 0;">${feature.properties.name || 'Parcel'}</h3>
                  <p style="margin: 4px 0;"><strong>ID:</strong> ${feature.properties.parcelId}</p>
                  <p style="margin: 4px 0;"><strong>Area:</strong> ${feature.properties.areaHectares} ha</p>
                  <p style="margin: 4px 0;"><strong>Status:</strong> ${feature.properties.status}</p>
                  ${feature.properties.landUnit ? `<p style="margin: 4px 0;"><strong>Land Unit:</strong> ${feature.properties.landUnit}</p>` : ''}
                </div>
              `;
            }

            handleInfoWindow(infoContent, event.latLng);
          });

          polygonOverlaysRef.current.push(polygon);
        });
      }
    });

    logger.log(`✅ Created ${polygonOverlaysRef.current.length} polygon overlays (Contracts: ${carbonContractCount}, Parcels: ${parcelCount})`);

    // DEBUG: Add a test polygon over Suva to verify rendering
    if (map && map instanceof window.google.maps.Map) {
      // Test polygon removed
      // Test polygon removed

      // Force center on test polygon to be absolutely sure
      // map.setCenter({ lat: -18.1450, lng: 178.4450 });
      // map.setZoom(14);
    } else {
      console.error('❌ [MapView] Map instance is invalid or not ready for test polygon');
    }

    // Cleanup function
    return () => {
      polygonOverlaysRef.current.forEach((polygon) => {
        if (polygon) polygon.setMap(null);
      });
      polygonOverlaysRef.current = [];
    };
  }, [map, geojsonData, isLoaded, handleInfoWindow]);

  // Removed circle radius update - no longer using clickable circles

  // Load earthquake GeoJSON when visible datasets change
  useEffect(() => {
    if (isLoaded && isAuthenticated && token && user && !verifyingToken) {
      loadEarthquakeGeoJSON();
    }
  }, [loadEarthquakeGeoJSON, isLoaded, isAuthenticated, token, user, verifyingToken]);

  // Render earthquake features (circles for Points, polylines for LineStrings)
  useEffect(() => {
    if (!isLoaded || !map || !earthquakeGeoJSON || !earthquakeGeoJSON.features || earthquakeGeoJSON.features.length === 0) {
      // Clear existing features
      earthquakeCirclesRef.current.forEach(circle => {
        if (circle) circle.setMap(null);
      });
      earthquakeCirclesRef.current = [];
      earthquakePolylinesRef.current.forEach(polyline => {
        if (polyline) polyline.setMap(null);
      });
      earthquakePolylinesRef.current = [];
      return;
    }

    if (!window.google || !window.google.maps) {
      return;
    }

    // Clear existing features
    earthquakeCirclesRef.current.forEach(circle => {
      if (circle) circle.setMap(null);
    });
    earthquakeCirclesRef.current = [];
    earthquakePolylinesRef.current.forEach(polyline => {
      if (polyline) polyline.setMap(null);
    });
    earthquakePolylinesRef.current = [];

    // Process each feature
    earthquakeGeoJSON.features.forEach((feature) => {
      if (!feature.geometry) return;

      const magnitude = extractMagnitude(feature.properties);
      const fillColor = getMagnitudeColor(magnitude);
      const quakeTime = extractTime(feature.properties);

      // Optional: Adjust opacity based on date (newer = brighter)
      let opacity = 0.7;
      if (quakeTime) {
        const now = new Date();
        const daysSince = (now - quakeTime) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          opacity = 0.8;
        } else if (daysSince < 365) {
          opacity = 0.7;
        } else {
          opacity = 0.6;
        }
      }

      // Handle Point geometries - render as circles or markers
      if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
        const coordinates = feature.geometry.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return;

        const position = {
          lat: parseFloat(coordinates[1]),
          lng: parseFloat(coordinates[0]),
        };

        if (isNaN(position.lat) || isNaN(position.lng) ||
          position.lat < -90 || position.lat > 90 ||
          position.lng < -180 || position.lng > 180) {
          return;
        }

        // If magnitude is present, render as earthquake circle
        if (magnitude !== null) {
          const radius = getMagnitudeRadius(magnitude);
          const circle = new window.google.maps.Circle({
            strokeColor: '#FFFFFF',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: fillColor,
            fillOpacity: opacity,
            map: map,
            center: position,
            radius: radius,
            zIndex: 500,
          });

          // Add click handler
          circle.addListener('click', () => {
            // Build info content with all available properties
            let infoContent = `
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 8px 0;">Earthquake</h3>
                  <p style="margin: 4px 0;"><strong>Magnitude:</strong> ${magnitude.toFixed(1)}</p>
            `;

            // Add location if available
            const location = feature.properties.place || feature.properties.region || feature.properties.location || feature.properties[' region'];
            if (location) {
              infoContent += `<p style="margin: 4px 0;"><strong>Location:</strong> ${location}</p>`;
            }

            // Add time if available
            if (quakeTime) {
              infoContent += `<p style="margin: 4px 0;"><strong>Time:</strong> ${quakeTime.toLocaleString()}</p>`;
            }

            // Add depth if available
            const depth = feature.properties.depth || feature.properties.Depth || feature.properties[' Depth'];
            if (depth !== undefined && depth !== null) {
              infoContent += `<p style="margin: 4px 0;"><strong>Depth:</strong> ${depth} km</p>`;
            }

            infoContent += `</div>`;

            handleInfoWindow(infoContent, circle, true);
          });

          earthquakeCirclesRef.current.push(circle);
        } else {
          // Generic point (no magnitude) - render as a small marker/dot
          // Use a simple Circle but with fixed pixel-like size (small radius but high visibility)
          // or just a standard marker if possible. Let's use a distinct circle for now to keep it consistent with "layer" feel.
          const circle = new window.google.maps.Circle({
            strokeColor: '#2196F3', // Blue
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: '#2196F3',
            fillOpacity: 0.6,
            map: map,
            center: position,
            radius: 500, // Fixed 500m radius - might be small but better than nothing.
            zIndex: 500,
          });

          // Add click handler for generic point
          circle.addListener('click', (event) => {
            let infoContent = `<div style="padding: 8px;">`;

            // Try to find a name or title
            const name = feature.properties.name || feature.properties.Name || feature.properties.title || feature.properties.Title || 'Location';
            infoContent += `<h3 style="margin: 0 0 8px 0;">${name}</h3>`;

            // Add description if available
            if (feature.properties.description) {
              infoContent += `<p style="margin: 4px 0;">${feature.properties.description}</p>`;
            }

            // Add any other interesting properties (generic)
            Object.keys(feature.properties).forEach(key => {
              if (['name', 'description', 'styleUrl', 'styleHash'].includes(key)) return;
              if (typeof feature.properties[key] === 'object') return; // Skip complex objects
              infoContent += `<p style="margin: 2px 0; font-size: 0.9em;"><strong>${key}:</strong> ${feature.properties[key]}</p>`;
            });

            infoContent += `</div>`;

            handleInfoWindow(infoContent, event.latLng);
          });

          earthquakeCirclesRef.current.push(circle);
        }
      }
      // Handle LineString geometries - render as polylines
      else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates) {
        const coordinates = feature.geometry.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return;

        const path = coordinates.map(coord => ({
          lat: parseFloat(coord[1]),
          lng: parseFloat(coord[0]),
        })).filter(pos =>
          !isNaN(pos.lat) && !isNaN(pos.lng) &&
          pos.lat >= -90 && pos.lat <= 90 &&
          pos.lng >= -180 && pos.lng <= 180
        );

        if (path.length < 2) return;

        const strokeWidth = Math.max(2, magnitude ? magnitude * 2 : 2);

        const polyline = new window.google.maps.Polyline({
          path: path,
          strokeColor: fillColor,
          strokeOpacity: opacity,
          strokeWeight: strokeWidth,
          map: map,
          zIndex: 500,
        });

        // Add click handler
        polyline.addListener('click', (event) => {
          // Build info content with all available properties
          let infoContent = `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0;">Earthquake Fault Line</h3>
                <p style="margin: 4px 0;"><strong>Magnitude:</strong> ${magnitude !== null ? magnitude.toFixed(1) : 'Unknown'}</p>
          `;

          // Add location if available
          const location = feature.properties.place || feature.properties.region || feature.properties.location || feature.properties[' region'];
          if (location) {
            infoContent += `<p style="margin: 4px 0;"><strong>Location:</strong> ${location}</p>`;
          }

          // Add time if available
          if (quakeTime) {
            infoContent += `<p style="margin: 4px 0;"><strong>Time:</strong> ${quakeTime.toLocaleString()}</p>`;
          }

          infoContent += `</div>`;

          handleInfoWindow(infoContent, event.latLng);
        });

        earthquakePolylinesRef.current.push(polyline);
      }
      // Handle MultiLineString geometries
      else if (feature.geometry.type === 'MultiLineString' && feature.geometry.coordinates) {
        const lineStrings = feature.geometry.coordinates;
        if (!Array.isArray(lineStrings)) return;

        lineStrings.forEach(lineString => {
          if (!Array.isArray(lineString) || lineString.length < 2) return;

          const path = lineString.map(coord => ({
            lat: parseFloat(coord[1]),
            lng: parseFloat(coord[0]),
          })).filter(pos =>
            !isNaN(pos.lat) && !isNaN(pos.lng) &&
            pos.lat >= -90 && pos.lat <= 90 &&
            pos.lng >= -180 && pos.lng <= 180
          );

          if (path.length < 2) return;

          const strokeWidth = Math.max(2, magnitude ? magnitude * 2 : 2);

          const polyline = new window.google.maps.Polyline({
            path: path,
            strokeColor: fillColor,
            strokeOpacity: opacity,
            strokeWeight: strokeWidth,
            map: map,
            zIndex: 500,
          });

          // Add click handler
          polyline.addListener('click', (event) => {
            // Build info content with all available properties
            let infoContent = `
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 8px 0;">Earthquake Fault Line</h3>
                  <p style="margin: 4px 0;"><strong>Magnitude:</strong> ${magnitude !== null ? magnitude.toFixed(1) : 'Unknown'}</p>
            `;

            // Add location if available
            const location = feature.properties.place || feature.properties.region || feature.properties.location || feature.properties[' region'];
            if (location) {
              infoContent += `<p style="margin: 4px 0;"><strong>Location:</strong> ${location}</p>`;
            }

            // Add time if available
            if (quakeTime) {
              infoContent += `<p style="margin: 4px 0;"><strong>Time:</strong> ${quakeTime.toLocaleString()}</p>`;
            }

            infoContent += `</div>`;

            handleInfoWindow(infoContent, event.latLng);
          });

          earthquakePolylinesRef.current.push(polyline);
        });
      }
      // Handle Polygon geometries
      else if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
        const coordinates = feature.geometry.coordinates[0]; // Outer ring
        if (!Array.isArray(coordinates) || coordinates.length < 3) return;

        const path = coordinates.map(coord => ({
          lat: parseFloat(coord[1]),
          lng: parseFloat(coord[0]),
        })).filter(pos =>
          !isNaN(pos.lat) && !isNaN(pos.lng) &&
          pos.lat >= -90 && pos.lat <= 90 &&
          pos.lng >= -180 && pos.lng <= 180
        );

        if (path.length < 3) return;

        const polygon = new window.google.maps.Polygon({
          paths: path,
          strokeColor: fillColor,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: fillColor,
          fillOpacity: 0.35, // Slightly transparent
          map: map,
          zIndex: 450, // Below markers/lines but above base map
        });

        // Add click handler
        polygon.addListener('click', (event) => {
          // Build info content with all available properties
          let infoContent = `
              <div style="padding: 8px;">
                <h3 style="margin: 0 0 8px 0;">Earthquake Zone</h3>
                <p style="margin: 4px 0;"><strong>Magnitude:</strong> ${magnitude !== null ? magnitude.toFixed(1) : 'Unknown'}</p>
          `;

          // Add location if available
          const location = feature.properties.place || feature.properties.region || feature.properties.location || feature.properties[' region'];
          if (location) {
            infoContent += `<p style="margin: 4px 0;"><strong>Location:</strong> ${location}</p>`;
          }

          // Add description if available
          if (feature.properties.description) {
            infoContent += `<p style="margin: 4px 0;">${feature.properties.description}</p>`;
          }

          infoContent += `</div>`;

          handleInfoWindow(infoContent, event.latLng);
        });

        earthquakePolylinesRef.current.push(polygon); // Reuse polylines ref for cleanup
      }
      // Handle MultiPolygon geometries
      else if (feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates) {
        feature.geometry.coordinates.forEach((polygonCoords) => {
          const coordinates = polygonCoords[0]; // Outer ring
          if (!Array.isArray(coordinates) || coordinates.length < 3) return;

          const path = coordinates.map(coord => ({
            lat: parseFloat(coord[1]),
            lng: parseFloat(coord[0]),
          })).filter(pos =>
            !isNaN(pos.lat) && !isNaN(pos.lng) &&
            pos.lat >= -90 && pos.lat <= 90 &&
            pos.lng >= -180 && pos.lng <= 180
          );

          if (path.length < 3) return;

          const polygon = new window.google.maps.Polygon({
            paths: path,
            strokeColor: fillColor,
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: fillColor,
            fillOpacity: 0.35,
            map: map,
            zIndex: 450,
          });

          // Add click handler
          polygon.addListener('click', (event) => {
            // Build info content with all available properties
            let infoContent = `
                <div style="padding: 8px;">
                  <h3 style="margin: 0 0 8px 0;">Earthquake Zone</h3>
                  <p style="margin: 4px 0;"><strong>Magnitude:</strong> ${magnitude !== null ? magnitude.toFixed(1) : 'Unknown'}</p>
            `;

            // Add location if available
            const location = feature.properties.place || feature.properties.region || feature.properties.location || feature.properties[' region'];
            if (location) {
              infoContent += `<p style="margin: 4px 0;"><strong>Location:</strong> ${location}</p>`;
            }

            // Add description if available
            if (feature.properties.description) {
              infoContent += `<p style="margin: 4px 0;">${feature.properties.description}</p>`;
            }

            infoContent += `</div>`;

            handleInfoWindow(infoContent, event.latLng);
          });

          earthquakePolylinesRef.current.push(polygon); // Reuse polylines ref for cleanup
        });
      }
    });

    logger.log(`✅ Created ${earthquakeCirclesRef.current.length} earthquake circles and ${earthquakePolylinesRef.current.length} polylines`);

    // Cleanup function
    return () => {
      earthquakeCirclesRef.current.forEach(circle => {
        if (circle) circle.setMap(null);
      });
      earthquakeCirclesRef.current = [];
      earthquakePolylinesRef.current.forEach(polyline => {
        if (polyline) polyline.setMap(null);
      });
      earthquakePolylinesRef.current = [];
    };
  }, [map, earthquakeGeoJSON, isLoaded, getMagnitudeColor, getMagnitudeRadius, extractMagnitude, extractTime]);

  // Load danger maps and visibility state
  const loadDangerMaps = useCallback(async () => {
    try {
      const response = await dangerMapsAPI.getAll();
      setDangerMaps(response.data.data || []);

      // Load visibility state from localStorage
      try {
        const stored = localStorage.getItem('dangerMapVisibleMaps');
        if (stored) {
          const visibleIds = JSON.parse(stored);
          // Filter to only include IDs that exist in the loaded maps
          const validIds = visibleIds.filter(id =>
            response.data.data.some(map => String(map._id) === String(id))
          );
          setVisibleDangerMaps(validIds);
          setDangerMapVisible(validIds.length > 0);
          // Update localStorage with valid IDs only
          if (validIds.length !== visibleIds.length) {
            localStorage.setItem('dangerMapVisibleMaps', JSON.stringify(validIds));
          }
        }
      } catch (err) {
        logger.error('Error loading danger map visibility state:', err);
      }
    } catch (error) {
      logger.error('Error loading danger maps:', error);
    }
  }, []);

  // Load GeoJSON for visible danger maps
  const loadDangerMapGeoJSON = useCallback(async () => {
    if (!dangerMapVisible || visibleDangerMaps.length === 0) {
      setDangerMapGeoJSON(null);
      return;
    }

    try {
      const geoJSONPromises = visibleDangerMaps.map(id =>
        dangerMapsAPI.getGeoJSON(id).catch(err => {
          logger.error(`Error loading GeoJSON for danger map ${id}:`, err);
          return null;
        })
      );

      const results = await Promise.all(geoJSONPromises);
      const allFeatures = [];

      results.forEach((result) => {
        if (result && result.data && result.data.data) {
          const geojson = result.data.data;
          if (geojson.features && Array.isArray(geojson.features)) {
            allFeatures.push(...geojson.features);
          }
        }
      });

      if (allFeatures.length > 0) {
        setDangerMapGeoJSON({
          type: 'FeatureCollection',
          features: allFeatures,
        });
      } else {
        setDangerMapGeoJSON(null);
      }
    } catch (error) {
      logger.error('Error loading danger map GeoJSON:', error);
      setDangerMapGeoJSON(null);
    }
  }, [visibleDangerMaps, dangerMapVisible]);

  // Load danger maps when authenticated
  useEffect(() => {
    if (isLoaded && isAuthenticated && token && user && !verifyingToken) {
      loadDangerMaps();
    }
  }, [loadDangerMaps, isLoaded, isAuthenticated, token, user, verifyingToken]);

  // Load danger map GeoJSON when visible maps change
  useEffect(() => {
    if (isLoaded && isAuthenticated && token && user && !verifyingToken) {
      loadDangerMapGeoJSON();
    }
  }, [loadDangerMapGeoJSON, isLoaded, isAuthenticated, token, user, verifyingToken]);

  // Render danger map features (polygons, polylines, etc.)
  useEffect(() => {
    if (!isLoaded || !map || !dangerMapGeoJSON || !dangerMapGeoJSON.features || dangerMapGeoJSON.features.length === 0) {
      // Clear existing layers
      dangerMapLayersRef.current.forEach(layer => {
        if (layer) layer.setMap(null);
      });
      dangerMapLayersRef.current = [];
      return;
    }

    if (!window.google || !window.google.maps) {
      return;
    }

    // Clear existing layers
    dangerMapLayersRef.current.forEach(layer => {
      if (layer) layer.setMap(null);
    });
    dangerMapLayersRef.current = [];

    // Helper to open info window (closes existing one first)
    const openDangerMapInfoWindow = (event, feature) => {
      // Create content for the info window
      const content = `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0;">Danger Zone</h3>
          ${feature.properties.name ? `<p style="margin: 4px 0;"><strong>Name:</strong> ${feature.properties.name}</p>` : ''}
          ${feature.properties.description ? `<p style="margin: 4px 0;">${feature.properties.description}</p>` : ''}
        </div>
      `;

      handleInfoWindow(content, event.latLng);
    };

    // Process each feature
    dangerMapGeoJSON.features.forEach((feature) => {
      if (!feature.geometry) return;

      // Default danger zone styling
      const fillColor = '#ff0000'; // Red for danger
      const strokeColor = '#cc0000';
      const fillOpacity = 0.3;
      const strokeOpacity = 0.8;
      const strokeWeight = 2;

      // Handle Polygon geometries
      if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates) {
        const coordinates = feature.geometry.coordinates[0]; // Outer ring
        if (!Array.isArray(coordinates) || coordinates.length < 3) return;

        const path = coordinates.map(coord => ({
          lat: parseFloat(coord[1]),
          lng: parseFloat(coord[0]),
        })).filter(pos =>
          !isNaN(pos.lat) && !isNaN(pos.lng) &&
          pos.lat >= -90 && pos.lat <= 90 &&
          pos.lng >= -180 && pos.lng <= 180
        );

        if (path.length < 3) return;

        const polygon = new window.google.maps.Polygon({
          paths: path,
          strokeColor: strokeColor,
          strokeOpacity: strokeOpacity,
          strokeWeight: strokeWeight,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          map: map,
          zIndex: 400, // Below markers but visible
        });

        // Add click handler
        polygon.addListener('click', (event) => {
          openDangerMapInfoWindow(event, feature);
        });

        dangerMapLayersRef.current.push(polygon);
      }
      // Handle MultiPolygon geometries
      else if (feature.geometry.type === 'MultiPolygon' && feature.geometry.coordinates) {
        feature.geometry.coordinates.forEach((polygonCoords) => {
          const coordinates = polygonCoords[0]; // Outer ring
          if (!Array.isArray(coordinates) || coordinates.length < 3) return;

          const path = coordinates.map(coord => ({
            lat: parseFloat(coord[1]),
            lng: parseFloat(coord[0]),
          })).filter(pos =>
            !isNaN(pos.lat) && !isNaN(pos.lng) &&
            pos.lat >= -90 && pos.lat <= 90 &&
            pos.lng >= -180 && pos.lng <= 180
          );

          if (path.length < 3) return;

          const polygon = new window.google.maps.Polygon({
            paths: path,
            strokeColor: strokeColor,
            strokeOpacity: strokeOpacity,
            strokeWeight: strokeWeight,
            fillColor: fillColor,
            fillOpacity: fillOpacity,
            map: map,
            zIndex: 400,
          });

          polygon.addListener('click', (event) => {
            openDangerMapInfoWindow(event, feature);
          });

          dangerMapLayersRef.current.push(polygon);
        });
      }
      // Handle LineString geometries
      else if (feature.geometry.type === 'LineString' && feature.geometry.coordinates) {
        const coordinates = feature.geometry.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return;

        const path = coordinates.map(coord => ({
          lat: parseFloat(coord[1]),
          lng: parseFloat(coord[0]),
        })).filter(pos =>
          !isNaN(pos.lat) && !isNaN(pos.lng) &&
          pos.lat >= -90 && pos.lat <= 90 &&
          pos.lng >= -180 && pos.lng <= 180
        );

        if (path.length < 2) return;

        const polyline = new window.google.maps.Polyline({
          path: path,
          strokeColor: strokeColor,
          strokeOpacity: strokeOpacity,
          strokeWeight: strokeWeight + 1,
          map: map,
          zIndex: 400,
        });

        polyline.addListener('click', (event) => {
          openDangerMapInfoWindow(event, feature);
        });

        dangerMapLayersRef.current.push(polyline);
      }
      // Handle Point geometries (render as small circles)
      else if (feature.geometry.type === 'Point' && feature.geometry.coordinates) {
        const coordinates = feature.geometry.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length < 2) return;

        const position = {
          lat: parseFloat(coordinates[1]),
          lng: parseFloat(coordinates[0]),
        };

        if (isNaN(position.lat) || isNaN(position.lng) ||
          position.lat < -90 || position.lat > 90 ||
          position.lng < -180 || position.lng > 180) {
          return;
        }

        const circle = new window.google.maps.Circle({
          strokeColor: strokeColor,
          strokeOpacity: strokeOpacity,
          strokeWeight: strokeWeight,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          map: map,
          center: position,
          radius: 1000, // 1km radius
          zIndex: 400,
        });

        circle.addListener('click', (event) => {
          // For circles, event.latLng might be null if clicked on the edge, but usually it's fine.
          // If event.latLng is missing, use center.
          const pos = event.latLng || position;
          openDangerMapInfoWindow({ latLng: pos }, feature);
        });

        dangerMapLayersRef.current.push(circle);
      }
    });

    logger.log(`✅ Created ${dangerMapLayersRef.current.length} danger map layers`);

    // Cleanup function
    return () => {
      // Close info window on cleanup
      if (dangerMapInfoWindowRef.current) {
        dangerMapInfoWindowRef.current.close();
        dangerMapInfoWindowRef.current = null;
      }
      dangerMapLayersRef.current.forEach(layer => {
        if (layer) layer.setMap(null);
      });
      dangerMapLayersRef.current = [];
    };
  }, [map, dangerMapGeoJSON, isLoaded]);

  // Update map type when toggled
  useEffect(() => {
    if (map && mapType) {
      map.setMapTypeId(mapType === 'satellite' ? 'satellite' : 'roadmap');
    }
  }, [map, mapType]);

  const onMapTypeIdChanged = useCallback(() => {
    if (mapRef.current) {
      const newMapType = mapRef.current.getMapTypeId();
      // Only update state if it's different to avoid loops
      setMapType(prev => {
        if (prev !== newMapType) {
          return newMapType;
        }
        return prev;
      });
    }
  }, []);

  // Handlers
  const handleSatelliteToggle = () => {
    setMapType(prev => prev === 'satellite' ? 'roadmap' : 'satellite');
  };

  const handleRemovePolygons = useCallback(() => {
    setCleanupConfirmOpen(true);
  }, []);

  const handleConfirmCleanup = useCallback(async () => {
    setCleanupConfirmOpen(false);

    try {
      logger.log('🗑️ [handleRemovePolygons] Calling backend cleanup...');
      const response = await leasesAPI.cleanupOrphans();

      if (response.data.success) {
        const count = response.data.count || 0;
        alert(`Successfully cleaned up ${count} orphaned polygons.`);

        // Reload map data to reflect changes
        loadMapData();
      } else {
        alert('Cleanup completed, but no orphans were found.');
      }
    } catch (error) {
      console.error('Error cleaning up polygons:', error);
      alert('Failed to cleanup polygons. Please try again.');
    }

    logger.log('🗑️ [handleRemovePolygons] Removing all carbon contract polygons visually...');

    // Clear all carbon contract polygons
    let removedCount = 0;
    polygonOverlaysRef.current.forEach((polygon) => {
      if (polygon && polygon.setMap) {
        try {
          polygon.setMap(null);
          removedCount++;
        } catch (e) {
          logger.error('Error removing polygon:', e);
        }
      }
    });
    polygonOverlaysRef.current = [];
    logger.log(`🗑️ Removed ${removedCount} carbon contract polygons from map.`);

    // Disable demo mode when clearing polygons
    localStorage.removeItem('demoModeActive');
    localStorage.removeItem('recentContract');
    localStorage.removeItem('demoUploadCount');
    localStorage.removeItem('demoUploadFilenames');
    localStorage.removeItem('showAllContracts');
    logger.log('🚫 Demo mode disabled (polygons cleared)');

    // Also clear markers for carbon contracts
    let removedMarkers = 0;
    const markersToKeep = [];
    markersRef.current.forEach(marker => {
      if (!marker) {
        return;
      }

      // Check if marker is an AdvancedMarkerElement or regular Marker
      let featureId = null;
      if (marker.content && marker.content.dataset) {
        featureId = marker.content.dataset.featureId;
      } else if (marker.get && typeof marker.get === 'function') {
        try {
          featureId = marker.get('id');
        } catch (e) {
          // Marker might not have get method
        }
      }

      if (featureId && geojsonData && geojsonData.features) {
        const feature = geojsonData.features.find(f =>
          f.properties && (f.properties.id === featureId || f.properties._id === featureId)
        );

        if (feature && feature.properties && feature.properties.type === 'carbon-contract') {
          try {
            if (marker.setMap) {
              marker.setMap(null);
              removedMarkers++;
            }
          } catch (e) {
            logger.error('Error removing marker:', e);
          }
        } else {
          markersToKeep.push(marker);
        }
      } else {
        markersToKeep.push(marker);
      }
    });
    markersRef.current = markersToKeep;
    logger.log(`🗑️ Removed ${removedMarkers} carbon contract markers from map.`);
    markersRef.current = markersToKeep;
    logger.log(`🗑️ Removed ${removedMarkers} carbon contract markers from map.`);

    // Clear all map data state to ensure visual cleanup
    setGeojsonData({ type: 'FeatureCollection', features: [] });
    setSites([]);
    setAssets([]);
    setCarbonContracts([]);
    logger.log('🗑️ Cleared all map data state.');
  }, [geojsonData]);

  const handleDangerMapToggle = () => {
    if (!dangerMapVisible) {
      // Opening - show dialog to select maps
      // Blur the button to prevent "aria-hidden" warning since the button is inside the root
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setDangerMapDialogOpen(true);
    } else {
      // Closing - hide all maps
      setDangerMapVisible(false);
      setVisibleDangerMaps([]);
      try {
        localStorage.setItem('dangerMapVisibleMaps', JSON.stringify([]));
      } catch (err) {
        logger.error('Error saving danger map visibility state:', err);
      }
    }
  };

  const handleDangerMapDialogClose = () => {
    setDangerMapDialogOpen(false);
    // Update visibility based on current visible maps
    if (visibleDangerMaps.length > 0) {
      setDangerMapVisible(true);
    }
  };

  const handleDangerMapDialogToggle = (mapId) => {
    const normalizedId = String(mapId);
    setVisibleDangerMaps(prev => {
      const normalizedVisible = prev.map(id => String(id));
      const isVisible = normalizedVisible.includes(normalizedId);
      const newVisible = isVisible
        ? normalizedVisible.filter(id => id !== normalizedId)
        : [...normalizedVisible, normalizedId];

      const hasVisible = newVisible.length > 0;
      setDangerMapVisible(hasVisible);

      try {
        localStorage.setItem('dangerMapVisibleMaps', JSON.stringify(newVisible));
      } catch (err) {
        logger.error('Error saving danger map visibility state:', err);
      }

      return newVisible;
    });
  };

  // Update visibility state and save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(visibleEarthquakeDatasets));
    } catch (err) {
      logger.error('Error saving visibility state:', err);
    }
  }, [visibleEarthquakeDatasets]);

  // Listen for localStorage changes (when visibility is toggled on Earthquakes page)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'earthquakeVisibleDatasets' && e.newValue) {
        try {
          const newVisibleIds = JSON.parse(e.newValue);
          // Only update if it's different to avoid unnecessary re-renders
          if (JSON.stringify(newVisibleIds.sort()) !== JSON.stringify([...visibleEarthquakeDatasets].sort())) {
            logger.log('🔄 [MapView] Visibility state changed in localStorage, updating...');
            setVisibleEarthquakeDatasets(newVisibleIds);
          }
        } catch (err) {
          logger.error('Error parsing visibility state from storage event:', err);
        }
      }
    };

    // Listen for storage events (fired when localStorage is changed in another tab/window)
    window.addEventListener('storage', handleStorageChange);

    // Also poll localStorage periodically (for same-tab changes, since storage event only fires cross-tab)
    const pollInterval = setInterval(() => {
      try {
        const stored = localStorage.getItem('earthquakeVisibleDatasets');
        if (stored) {
          const storedIds = JSON.parse(stored);
          const currentIds = visibleEarthquakeDatasets;
          // Only update if different
          if (JSON.stringify(storedIds.sort()) !== JSON.stringify([...currentIds].sort())) {
            logger.log('🔄 [MapView] Visibility state changed (polled), updating...');
            setVisibleEarthquakeDatasets(storedIds);
          }
        }
      } catch (err) {
        // Ignore errors
      }
    }, 1000); // Check every second

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [visibleEarthquakeDatasets]);


  // Polygon markers are now created via useEffect with AdvancedMarkerElement
  const renderPolygons = () => {
    return null;
  };

  // Create polygon markers using AdvancedMarkerElement
  useEffect(() => {
    if (!isLoaded) {
      return; // Wait for Google Maps to be fully loaded
    }

    if (!map || !geojsonData || !geojsonData.features) {
      return;
    }

    if (!window.google || !window.google.maps) {
      return;
    }

    const loadPolygonMarkers = async () => {
      try {
        // Use cached library if available, otherwise load it
        let AdvancedMarkerElement;
        if (advancedMarkerLibraryRef.current) {
          AdvancedMarkerElement = advancedMarkerLibraryRef.current.AdvancedMarkerElement;
        } else {
          const markerLibrary = await window.google.maps.importLibrary('marker');
          AdvancedMarkerElement = markerLibrary.AdvancedMarkerElement;
          advancedMarkerLibraryRef.current = markerLibrary; // Cache for reuse
        }

        // Clear existing polygon markers
        polygonMarkersRef.current.forEach((marker) => {
          if (marker) {
            marker.setMap(null);
          }
        });
        polygonMarkersRef.current = [];

        // Create markers for polygon features
        geojsonData.features
          .filter((feature) => feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon')
          .forEach((feature, index) => {
            if (feature.geometry.type === 'Polygon' && feature.geometry.coordinates[0]) {
              const firstPoint = feature.geometry.coordinates[0][0];
              const position = {
                lat: parseFloat(firstPoint[1]),
                lng: parseFloat(firstPoint[0]),
              };

              if (isNaN(position.lat) || isNaN(position.lng)) {
                return;
              }

              // Create green dot marker element
              const markerElement = document.createElement('div');
              markerElement.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#4CAF50" stroke="white" stroke-width="2"/>
                </svg>
              `;
              markerElement.style.cssText = `
                cursor: pointer;
                width: 24px;
                height: 24px;
                display: block;
              `;

              const marker = new AdvancedMarkerElement({
                position: position,
                map: map,
                title: feature.properties.name || 'Polygon',
                content: markerElement,
              });

              marker.addListener('gmp-click', () => {
                setSelectedMarker(feature);
              });
              marker.addListener('click', () => {
                setSelectedMarker(feature);
              });

              polygonMarkersRef.current.push(marker);
            }
          });
      } catch (error) {
        logger.error('❌ Error loading AdvancedMarkerElement for polygon markers:', error);
      }
    };

    loadPolygonMarkers();

    return () => {
      polygonMarkersRef.current.forEach((marker) => {
        if (marker) {
          marker.setMap(null);
        }
      });
      polygonMarkersRef.current = [];
    };
  }, [map, geojsonData, isLoaded]);

  useEffect(() => {
    if (loadError) {
      logger.error('Google Maps load error:', loadError);
    }
  }, [loadError]);

  // Update Popover position when map is idle or zoomed (Airbnb style - fixed distance, no animation during drag)
  useEffect(() => {
    if (!map || !selectedMarker) {
      return;
    }

    // Create overlay first so it can be used in updatePopoverPosition
    const overlay = new window.google.maps.OverlayView();
    overlay.draw = function () { };

    let overlayReady = false;

    // Wait for overlay to be ready
    overlay.onAdd = function () {
      overlayReady = true;
    };

    overlay.setMap(map);

    // Use requestAnimationFrame for smooth updates without blocking scrolling
    let rafId = null;
    let isUpdating = false;

    const updatePopoverPosition = () => {
      if (!overlayReady || !selectedMarker || selectedMarker.geometry?.type !== 'Point' || isUpdating) {
        return;
      }

      // Cancel any pending updates
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      // Use requestAnimationFrame to avoid blocking scroll
      rafId = requestAnimationFrame(() => {
        isUpdating = true;
        try {
          const position = {
            lat: selectedMarker.geometry.coordinates[1],
            lng: selectedMarker.geometry.coordinates[0],
          };

          const latLng = new window.google.maps.LatLng(position.lat, position.lng);

          const projection = overlay.getProjection();
          if (projection && mapContainerRef.current) {
            // Use fromLatLngToContainerPixel - this gives position relative to map container
            const point = projection.fromLatLngToContainerPixel(latLng);
            if (!point) {
              return;
            }
            const mapContainer = mapContainerRef.current;
            if (mapContainer) {
              const mapRect = mapContainer.getBoundingClientRect();

              // Marker is 40x50px SVG
              // point.x, point.y are relative to map container (top-left of marker anchor)
              // For AdvancedMarkerElement without anchor, top-left is at position
              const MARKER_WIDTH = 40;
              const MARKER_HEIGHT = 50;

              // Marker tip (arrow point) is at bottom center relative to marker anchor
              // Anchor is at top-left (0, 0), so tip is at (20, 50) relative to anchor
              const MARKER_TIP_X_OFFSET = MARKER_WIDTH / 2; // 20px from left edge
              const MARKER_TIP_Y_OFFSET = MARKER_HEIGHT; // 50px from top edge

              // Card dimensions (from AirbnbCard.jsx: width=362px, approximate height ~300px)
              const CARD_WIDTH = 362;
              const CARD_HEIGHT = 300; // Approximate height
              const CARD_HALF_WIDTH = CARD_WIDTH / 2;
              const CARD_HALF_HEIGHT = CARD_HEIGHT / 2;

              // Fixed distance from marker tip to card center (like Airbnb)
              // This ensures the card stays at a constant distance from the marker tip
              // regardless of card height or zoom level
              const FIXED_DISTANCE_FROM_MARKER_TIP = 158; // Distance in pixels from marker tip to card center

              // Calculate marker tip position in screen coordinates
              // point.x, point.y are relative to map container, need to add mapRect offset
              const markerTipX = mapRect.left + point.x + MARKER_TIP_X_OFFSET;
              const markerTipY = mapRect.top + point.y + MARKER_TIP_Y_OFFSET;

              // Position card center at fixed distance from marker tip (like Airbnb)
              // Card uses transform: translate(-50%, -50%), so left/top are the center position
              let cardCenterX = markerTipX; // Align horizontally with marker tip
              // Position card center at fixed distance from marker tip (above by default)
              let cardCenterY = markerTipY - FIXED_DISTANCE_FROM_MARKER_TIP;

              // Check if card fits with marker below (default position)
              let isWithinBounds =
                cardCenterX - CARD_HALF_WIDTH >= mapRect.left &&
                cardCenterX + CARD_HALF_WIDTH <= mapRect.right &&
                cardCenterY - CARD_HALF_HEIGHT >= mapRect.top &&
                cardCenterY + CARD_HALF_HEIGHT <= mapRect.bottom;

              // If card doesn't fit with marker below, try with marker above
              if (!isWithinBounds) {
                cardCenterY = markerTipY + FIXED_DISTANCE_FROM_MARKER_TIP;
                isWithinBounds =
                  cardCenterX - CARD_HALF_WIDTH >= mapRect.left &&
                  cardCenterX + CARD_HALF_WIDTH <= mapRect.right &&
                  cardCenterY - CARD_HALF_HEIGHT >= mapRect.top &&
                  cardCenterY + CARD_HALF_HEIGHT <= mapRect.bottom;
              }

              setIsCardVisible(isWithinBounds);

              if (isWithinBounds) {
                setPopoverAnchor({
                  left: cardCenterX,
                  top: cardCenterY,
                });
              } else {
                // Hide card when outside bounds
                setPopoverAnchor(null);
              }
            }
          }
        } catch (error) {
          // Silently handle projection errors - overlay might not be ready yet
        } finally {
          isUpdating = false;
        }
      });
    };

    // Update position when map is zoomed or drag ends (not on every idle to avoid blocking scroll)
    const zoomListener = window.google.maps.event.addListener(map, 'zoom_changed', () => {
      updatePopoverPosition();
    });
    const dragEndListener = window.google.maps.event.addListener(map, 'dragend', () => {
      updatePopoverPosition();
    });
    // Use idle with debounce to avoid too frequent updates during scrolling
    let idleTimeout = null;
    const idleListener = window.google.maps.event.addListener(map, 'idle', () => {
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      idleTimeout = setTimeout(() => {
        updatePopoverPosition();
      }, 100); // Small delay to avoid blocking scroll
    });

    // Initial update (will work once overlay is ready)
    const initialUpdateTimeout = setTimeout(() => {
      if (overlayReady) {
        updatePopoverPosition();
      }
    }, 200);

    return () => {
      clearTimeout(initialUpdateTimeout);
      if (idleTimeout) {
        clearTimeout(idleTimeout);
      }
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (overlay && overlay.setMap) {
        try {
          overlay.setMap(null);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
      if (zoomListener) {
        window.google.maps.event.removeListener(zoomListener);
      }
      if (dragEndListener) {
        window.google.maps.event.removeListener(dragEndListener);
      }
      if (idleListener) {
        window.google.maps.event.removeListener(idleListener);
      }
    };
  }, [map, selectedMarker]);


  if (!googleMapsApiKey) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="h6">
            Google Maps Configuration Required
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Map API key missing. Please configure REACT_APP_GOOGLE_MAPS_API_KEY to enable full map functionality.
          </Alert>
        </Alert>
      </Box>
    );
  }

  // Map ID is optional - we'll use regular markers if AdvancedMarkerElement isn't available
  // No need to block the map from rendering

  if (authError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">
            Authentication Required
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please log in to view the map data.
          </Typography>
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.href = '/login'}
          sx={{ mt: 2 }}
        >
          Go to Login
        </Button>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">
            Error loading Google Maps
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {loadError.message || 'The API key is invalid or not configured correctly'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, fontSize: '0.875rem', textAlign: 'left', maxWidth: '600px', mx: 'auto' }}>
            <strong>Common fixes:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Ensure <strong>Maps JavaScript API</strong> is enabled in Google Cloud Console</li>
              <li>Add <code>localhost</code> and <code>127.0.0.1</code> to API key HTTP referrer restrictions (or remove restrictions for testing)</li>
              <li>Check that <strong>billing is enabled</strong> for your Google Cloud project</li>
              <li>Verify the API key is correct in <code>frontend/.env.local</code></li>
              <li>Wait a few minutes after enabling the API for changes to propagate</li>
            </ul>
          </Typography>
        </Alert>
      </Box>
    );
  }

  if (!isLoaded) {

    if (showTimeout) {
      return (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#ffffff',
            zIndex: 1,
            padding: 3,
          }}
        >
          <Alert severity="warning" sx={{ mb: 2, maxWidth: '500px' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Map is taking too long to load
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Google Maps is taking longer than expected to load. This might be due to:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mb: 2, pl: 2 }}>
              <li>Slow internet connection</li>
              <li>Google Maps API key issue</li>
              <li>Network restrictions</li>
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ mt: 1 }}
            >
              Reload Page
            </Button>
          </Alert>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          zIndex: 1,
        }}
      >
        <LoadingSpinner message="Loading map..." fullScreen={true} />
        <Typography variant="body2" sx={{ mt: 2, color: '#717171' }}>
          This may take a moment on mobile...
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          zIndex: 1,
        }}
      >
        <LoadingSpinner message="Loading map..." fullScreen={true} />
      </Box>
    );
  }



  console.log('✅ [MapView] All checks passed, rendering Map and Controls...');

  return (
    <>
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'transparent',
          overflow: 'visible',
          border: 'none',
          borderLeft: 'none',
          margin: 0,
          padding: 0,
          zIndex: isMobile ? 999 : 1,
        }}
        ref={mapContainerRef}
        style={{
          zIndex: isMobile ? 999 : 1,
          position: 'absolute',
        }}
      >
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter || defaultCenter}
          zoom={mapZoom || 8}
          onLoad={onLoad}
          onDragEnd={onDragEnd}
          onZoomChanged={onZoomChanged}
          onMapTypeIdChanged={onMapTypeIdChanged}
          onClick={onMapClick}
          mapContainerClassName="map-container"
          options={mapOptions}
        >
          {/* Markers are created directly via useEffect */}
          {renderPolygons()}
        </GoogleMap>
      </Box >

      {/* Render MapControls directly with absolute positioning */}
      {/* Render MapControls directly with fixed positioning (Nuclear Option) */}
      <Box
        sx={{
          position: 'fixed', // Fixed relative to viewport to avoid stacking context issues
          top: '80px !important', // Below AppBar
          right: '20px !important',
          zIndex: '99999 !important', // Extremely high z-index
          pointerEvents: 'none',
          '& > *': {
            pointerEvents: 'auto',
          },
        }}
        className="map-controls-container-wrapper"
        data-testid="map-controls-container-wrapper"
      >
        <MapControls
          mapType={mapType}
          onSatelliteToggle={handleSatelliteToggle}
          onRemovePolygons={handleRemovePolygons}
        />
      </Box>


      {/* Danger Map Dialog */}
      <DangerMapDialog
        open={dangerMapDialogOpen}
        onClose={() => setDangerMapDialogOpen(false)}
        visibleMaps={visibleDangerMaps}
        onToggleMap={handleDangerMapDialogToggle}
        onMapsChange={setDangerMaps}
        // Earthquake props
        visibleEarthquakeDatasets={visibleEarthquakeDatasets}
        onToggleEarthquake={handleToggleEarthquake}
      />

      <ConfirmDialog
        open={cleanupConfirmOpen}
        onClose={() => setCleanupConfirmOpen(false)}
        onConfirm={handleConfirmCleanup}
        title="Remove Orphaned Polygons"
        message="Are you sure you want to remove all orphaned polygons? This action cannot be undone."
        confirmLabel="Remove All"
        severity="error"
      />

      {/* Backdrop overlay - closes card when clicked - only show when card is visible */}
      {
        selectedMarker && popoverAnchor && isCardVisible && (
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1299,
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: isCardVisible ? 'block' : 'none',
            }}
            onClick={onMapClick}
          />
        )
      }

      {/* Airbnb-style Card */}
      {
        selectedMarker && popoverAnchor && isCardVisible && (
          <Box
            sx={{
              position: 'fixed',
              left: `${popoverAnchor.left}px`,
              top: `${popoverAnchor.top}px`,
              transform: 'translate(-50%, -50%)', // Center card on both X and Y axes
              zIndex: 1300,
              pointerEvents: 'auto',
              // NO ANIMATION - instant position updates like Airbnb
              transition: 'none',
              WebkitTransition: 'none',
              MozTransition: 'none',
              OTransition: 'none',
              msTransition: 'none',
              willChange: 'auto',
              '@media (max-width: 600px)': {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: '90vw',
                width: '90vw',
              },
            }}
            style={{
              transition: 'none',
              WebkitTransition: 'none',
              MozTransition: 'none',
              OTransition: 'none',
              msTransition: 'none',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <AirbnbCard
              site={{
                properties: (() => {
                  // Determine if this is a site, property, or carbon contract
                  const isProperty = selectedMarker.properties.type === 'property';
                  const isCarbonContract = selectedMarker.properties.type === 'carbon-contract';
                  const itemId = selectedMarker.properties.id || selectedMarker.properties._id;

                  // Find matching site or property from arrays to get full data including images
                  const matchingSite = !isProperty ? sites.find(s =>
                    s._id === itemId || s.id === itemId ||
                    s.name === selectedMarker.properties.name
                  ) : null;

                  const matchingAsset = isProperty ? assets.find(p =>
                    p._id === itemId || p.id === itemId ||
                    p.name === selectedMarker.properties.name
                  ) : null;

                  const matchingCarbonContract = isCarbonContract ? carbonContracts.find(c =>
                    c._id === itemId || c.id === itemId ||
                    c.name === selectedMarker.properties.name
                  ) : null;

                  // Collect all images from site/property
                  const allImages = [];

                  if (isProperty && matchingAsset) {
                    // For assets: collect images from the asset itself
                    if (matchingAsset.images && Array.isArray(matchingAsset.images)) {
                      matchingAsset.images.forEach(img => {
                        const imagePath = typeof img === 'string' ? img : img.path;
                        if (imagePath && !allImages.includes(imagePath)) {
                          allImages.push(imagePath);
                        }
                      });
                    }

                    return {
                      name: matchingAsset.name || selectedMarker.properties.name,
                      address: matchingAsset.address || selectedMarker.properties.address,
                      description: matchingAsset.description || selectedMarker.properties.description,
                      propertyCount: undefined, // Assets don't have property count
                      propertyType: matchingAsset.propertyType || selectedMarker.properties.propertyType,
                      area: matchingAsset.area || selectedMarker.properties.area,
                      type: 'property',
                      image: allImages.length > 0 ? allImages[0] : null,
                      images: allImages,
                      properties: [], // Assets don't have nested properties
                    };
                  } else if (matchingSite) {
                    // For sites: collect images from site and all its properties
                    if (matchingSite.image) {
                      allImages.push(matchingSite.image);
                    }

                    if (matchingSite.images && Array.isArray(matchingSite.images)) {
                      matchingSite.images.forEach(img => {
                        const imagePath = typeof img === 'string' ? img : img.path;
                        if (imagePath && !allImages.includes(imagePath)) {
                          allImages.push(imagePath);
                        }
                      });
                    }

                    if (matchingSite.properties && Array.isArray(matchingSite.properties)) {
                      matchingSite.properties.forEach(property => {
                        if (property.images && Array.isArray(property.images)) {
                          property.images.forEach(img => {
                            const imagePath = typeof img === 'string' ? img : img.path;
                            if (imagePath && !allImages.includes(imagePath)) {
                              allImages.push(imagePath);
                            }
                          });
                        }
                      });
                    }

                    return {
                      name: matchingSite.name || selectedMarker.properties.name,
                      address: matchingSite.address || selectedMarker.properties.address,
                      description: matchingSite.description || selectedMarker.properties.description,
                      propertyCount: matchingSite.properties?.length || selectedMarker.properties.propertyCount || 0,
                      propertyType: selectedMarker.properties.propertyType,
                      area: matchingSite.totalArea || selectedMarker.properties.area,
                      type: 'site',
                      image: allImages.length > 0 ? allImages[0] : null,
                      images: allImages,
                      properties: matchingSite.properties || [],
                    };
                  } else if (isCarbonContract && matchingCarbonContract) {
                    // For carbon contracts: return contract-specific data from matching contract
                    return {
                      name: matchingCarbonContract.name || selectedMarker.properties.name || 'Carbon Contract',
                      address: matchingCarbonContract.address || selectedMarker.properties.address || 'Fiji',
                      description: `Carbon Contract - ${matchingCarbonContract.status || 'compliant'}`,
                      propertyCount: undefined,
                      propertyType: undefined,
                      area: matchingCarbonContract.area || selectedMarker.properties.area,
                      type: 'carbon-contract',
                      image: null,
                      images: [],
                      properties: [],
                      // Carbon contract specific fields
                      status: matchingCarbonContract.status || selectedMarker.properties.status,
                      payoutAmount: matchingCarbonContract.payoutAmount || selectedMarker.properties.payoutAmount,
                      greenScore: matchingCarbonContract.greenScore || selectedMarker.properties.greenScore,
                      mataqaliName: matchingCarbonContract.mataqaliName || selectedMarker.properties.mataqaliName,
                    };
                  } else if (isCarbonContract) {
                    // Fallback for carbon contracts without match
                    return {
                      name: selectedMarker.properties.name || 'Carbon Contract',
                      address: selectedMarker.properties.address || 'Fiji',
                      description: `Status: ${selectedMarker.properties.status || 'compliant'}`,
                      propertyCount: undefined,
                      propertyType: undefined,
                      area: selectedMarker.properties.area,
                      type: 'carbon-contract',
                      image: null,
                      images: [],
                      properties: [],
                      status: selectedMarker.properties.status,
                      payoutAmount: selectedMarker.properties.payoutAmount,
                      greenScore: selectedMarker.properties.greenScore,
                      mataqaliName: selectedMarker.properties.mataqaliName,
                    };
                  } else {
                    // Fallback to marker properties if no match found
                    return {
                      name: selectedMarker.properties.name,
                      address: selectedMarker.properties.address,
                      description: selectedMarker.properties.description,
                      propertyCount: selectedMarker.properties.propertyCount || 0,
                      propertyType: selectedMarker.properties.propertyType,
                      area: selectedMarker.properties.area,
                      type: isProperty ? 'property' : 'site',
                      image: null,
                      images: [],
                      properties: [],
                    };
                  }
                })(),
              }}
              onClose={() => {
                selectedMarkerRef.current = null;
                setPopoverAnchor(null);
                setSelectedMarker(null);
                setIsCardVisible(false);
              }}
            />
          </Box>
        )
      }

    </>
  );
};

export default MapView;
