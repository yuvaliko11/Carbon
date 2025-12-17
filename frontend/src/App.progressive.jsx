import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Layout from './components/Layout/Layout';

// Simple Dashboard without MapView for testing
const SimpleDashboard = () => {
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ color: '#FF385C' }}>✅ Dashboard Loaded!</h1>
      <p style={{ marginTop: '20px', color: '#717171' }}>
        Layout and Dashboard components are working.
      </p>
      <p style={{ marginTop: '10px', color: '#999', fontSize: '14px' }}>
        If you see this, the problem is likely in MapView component.
      </p>
    </div>
  );
};

const theme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#FF385C',
      light: '#FF5A7F',
      dark: '#E61E4D',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#222222',
      light: '#717171',
      dark: '#000000',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#222222',
      secondary: '#717171',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Circular", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '24px',
          padding: '10px 22px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

function AppProgressive() {
  useEffect(() => {
    console.log('🚀 [AppProgressive] App component mounted');
    console.log('🚀 [AppProgressive] Current URL:', window.location.href);
    console.log('🚀 [AppProgressive] User agent:', navigator.userAgent);
  }, []);

  try {
    console.log('🚀 [AppProgressive] App component rendering - about to return JSX');
    
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Layout>
                      <SimpleDashboard />
                    </Layout>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('❌ [AppProgressive] Error rendering App component:', error);
    console.error('❌ [AppProgressive] Error message:', error?.message);
    console.error('❌ [AppProgressive] Error stack:', error?.stack);
    
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        fontFamily: 'system-ui',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff',
        zIndex: 999999
      }}>
        <h1 style={{ color: '#FF385C', fontSize: '24px', marginBottom: '20px' }}>App Error</h1>
        <p style={{ color: '#717171', marginBottom: '10px' }}>{error?.message || 'Unknown error'}</p>
        <p style={{ color: '#999', fontSize: '12px', marginBottom: '30px', wordBreak: 'break-all' }}>
          {error?.stack?.substring(0, 200) || ''}
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
}

export default AppProgressive;



