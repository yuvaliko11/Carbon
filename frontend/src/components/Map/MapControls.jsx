import React, { useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import DeleteIcon from '@mui/icons-material/Delete';

const MapControls = ({
  mapType = 'roadmap',
  onSatelliteToggle,
  onRemovePolygons
}) => {
  // Debug logging
  useEffect(() => {
    console.log('🚀 [MapControls] Component mounted', { mapType });
    return () => console.log('🚀 [MapControls] Component unmounted');
  }, [mapType]);

  // Fallback handlers if not provided
  const handleSatelliteClick = onSatelliteToggle || (() => {
    console.warn('Satellite toggle not available');
  });

  const handleRemovePolygons = onRemovePolygons || (() => {
    console.warn('Remove polygons not available');
  });

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        padding: '4px',
        pointerEvents: 'auto',
        minWidth: '88px',
      }}
      data-testid="map-controls-container"
      className="map-controls-container"
    >
      {/* Satellite Toggle Button */}
      <Tooltip title={mapType === 'satellite' ? 'Switch to Roadmap' : 'Switch to Satellite View'}>
        <IconButton
          onClick={handleSatelliteClick}
          aria-label={mapType === 'satellite' ? 'Switch to Roadmap' : 'Switch to Satellite View'}
          data-testid="satellite-toggle-button"
          sx={{
            backgroundColor: mapType === 'satellite' ? '#1976d2' : '#f5f5f5',
            color: mapType === 'satellite' ? 'white' : '#1976d2',
            border: mapType === 'satellite' ? 'none' : '1px solid #e0e0e0',
            '&:hover': {
              backgroundColor: mapType === 'satellite' ? '#1565c0' : '#e3f2fd',
              border: mapType === 'satellite' ? 'none' : '1px solid #1976d2',
            },
            width: 40,
            height: 40,
            minWidth: 40,
            minHeight: 40,
            display: 'flex !important',
            visibility: 'visible !important',
            opacity: '1 !important',
            position: 'relative',
            zIndex: 1501,
            transition: 'all 0.2s ease-in-out',
            flexShrink: 0,
            '& svg': {
              fontSize: '20px',
              display: 'block !important',
              width: '20px',
              height: '20px',
            },
          }}
        >
          {mapType === 'satellite' ? <MapIcon sx={{ display: 'block' }} /> : <SatelliteAltIcon sx={{ display: 'block' }} />}
        </IconButton>
      </Tooltip>

      {/* Remove Polygons Button */}
      <Tooltip title="Remove All Polygons">
        <IconButton
          onClick={handleRemovePolygons}
          aria-label="Remove All Polygons"
          sx={{
            backgroundColor: '#f5f5f5',
            color: '#d32f2f',
            border: '1px solid #e0e0e0',
            '&:hover': {
              backgroundColor: '#ffebee',
              border: '1px solid #d32f2f',
            },
            width: 40,
            height: 40,
            minWidth: 40,
            minHeight: 40,
            transition: 'all 0.2s ease-in-out',
            '& svg': {
              fontSize: '20px',
            },
          }}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default MapControls;

