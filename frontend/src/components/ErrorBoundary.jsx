import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ [ErrorBoundary] Caught an error:', error);
    console.error('❌ [ErrorBoundary] Error message:', error?.message);
    console.error('❌ [ErrorBoundary] Error stack:', error?.stack);
    console.error('❌ [ErrorBoundary] Error info:', errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    console.log('🛡️ [ErrorBoundary] Rendering, hasError:', this.state.hasError);
    if (this.state.hasError) {
      console.error('❌ [ErrorBoundary] Showing error UI');
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 3,
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ mb: 2, color: '#FF385C' }}>
            Something went wrong
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, color: '#717171' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

