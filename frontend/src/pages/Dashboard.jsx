import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import ErrorBoundary from '../components/ErrorBoundary';
import MapView from '../components/Map/MapView';

const Dashboard = () => {
  // 🔴 DIAGNOSTIC V2: Red Box Test - Enable to see if Dashboard container is rendering
  const ENABLE_DIAGNOSTIC_BORDERS = false;
  const dashboardRef = useRef(null);

  // Add class to body for CSS targeting - DISABLED to prevent pointer-events issues
  useEffect(() => {
    console.log('✅✅✅ DIAGNOSTIC VERSION 2 LOADED ✅✅✅');
    // document.body.classList.add('map-page-active'); // DISABLED
    console.log('🔵 [Dashboard V2] Test Active - Container should have a BLUE border.');

    // Log dimensions after a delay to ensure DOM is updated
    const timer = setTimeout(() => {
      if (dashboardRef.current) {
        const rect = dashboardRef.current.getBoundingClientRect();
        console.log('🔵 [Dashboard V2] Container Dimensions (500ms):', {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          visible: rect.width > 0 && rect.height > 0,
        });
      } else {
        console.log('🔵 [Dashboard V2] Container ref NOT FOUND after 500ms.');
      }
    }, 500);

    return () => {
      // document.body.classList.remove('map-page-active'); // DISABLED
      clearTimeout(timer);
    };
  }, []);

  return (
    <Box
      ref={dashboardRef}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        '@supports (height: 100dvh)': {
          height: '100dvh',
        },
        overflow: 'visible',
        backgroundColor: ENABLE_DIAGNOSTIC_BORDERS ? 'rgba(0, 0, 255, 0.1)' : 'transparent',
        zIndex: 1000,
        pointerEvents: 'auto',
        border: ENABLE_DIAGNOSTIC_BORDERS ? '8px solid blue' : 'none',
      }}
      className="dashboard-map-container"
    >
      <ErrorBoundary>
        <MapView />
      </ErrorBoundary>
    </Box>
  );
};

export default Dashboard;

