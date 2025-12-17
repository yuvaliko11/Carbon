import React from 'react';
import { Box, CircularProgress, Typography, Fade } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false, size = 60 }) => {
  return (
    <Fade in={true} timeout={600}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          minHeight: fullScreen ? '100vh' : 'calc(100vh - 200px)',
          height: fullScreen ? '100vh' : 'calc(100vh - 200px)',
          width: '100%',
          py: 4,
          position: 'relative',
          margin: 0,
          padding: 0,
        }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: fullScreen ? '100vh' : 'calc(100vh - 200px)',
          height: fullScreen ? '100vh' : 'calc(100vh - 200px)',
          width: '100%',
        }}
      >
        <Box
          className="loading-spinner-container"
          sx={{
            position: 'relative',
            display: 'inline-flex',
            width: size,
            height: size,
            minWidth: size,
            minHeight: size,
            aspectRatio: '1 / 1',
            overflow: 'visible',
          }}
        >
          {/* Outer pulsing circle */}
          <Box
            className="loading-spinner-outer-ring"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size + 20,
              height: size + 20,
              borderRadius: '50%',
              border: '2px solid',
              borderColor: '#00A86B',
              opacity: 0.2,
            }}
          />

          {/* Main circular spinner */}
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: '#00A86B',
              animationDuration: '1.4s',
              width: size,
              height: size,
              minWidth: size,
              minHeight: size,
              aspectRatio: '1 / 1',
              borderRadius: '50%',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
                transition: 'stroke-dashoffset 0.35s',
              },
            }}
          />

          {/* Inner pulsing dot */}
          <Box
            className="loading-spinner-inner-dot"
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: size * 0.35,
              height: size * 0.35,
              borderRadius: '50%',
              backgroundColor: '#00A86B',
              opacity: 0.3,
            }}
          />
        </Box>

        {/* Loading message */}
        {message && (
          <Typography
            variant="body1"
            className="loading-spinner-text"
            sx={{
              color: '#717171',
              fontWeight: 500,
              fontSize: '1rem',
              letterSpacing: '0.02em',
            }}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Fade>
  );
};

export default LoadingSpinner;

