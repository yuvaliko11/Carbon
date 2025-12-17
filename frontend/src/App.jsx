import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GoogleMapsProvider } from './context/GoogleMapsContext';
import PrivateRoute from './components/Auth/PrivateRoute';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import Layout from './components/Layout/Layout';

// Direct imports - no lazy loading for better mobile compatibility
// Lazy loading can fail on mobile browsers with slow/unstable networks
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import ContractUploadPage from './pages/ContractUploadPage';
import ContractRegistryPage from './pages/ContractRegistryPage';

const theme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#00A86B', // Fiji Carbon Green
      light: '#33C994',
      dark: '#007A4D',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#1F2937', // Dark Gray
      light: '#4B5563',
      dark: '#111827',
    },
    background: {
      default: '#F9FAFB', // Light Gray background
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      color: '#111827',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 700,
      color: '#111827',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      color: '#111827',
    },
    h4: {
      fontWeight: 600,
      color: '#111827',
    },
    h5: {
      fontWeight: 600,
      color: '#111827',
    },
    h6: {
      fontWeight: 600,
      color: '#111827',
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      borderRadius: '8px',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F9FAFB',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Standard rounded corners, not pill
          padding: '10px 20px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px', // More rounded cards
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          border: '1px solid #E5E7EB',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
  },
});

// Mobile redirect component - redirects authenticated mobile users to /reports
const MobileRedirect = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading, verifyingToken, user, token } = useAuth();
  const [isMobile, setIsMobile] = React.useState(false);
  const [hasRedirected, setHasRedirected] = React.useState(false);

  useEffect(() => {
    // Detect mobile using window width (md breakpoint is 900px in MUI)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 900);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // CRITICAL: Only redirect if ALL conditions are met:
    // 1. Not loading authentication
    // 2. Not currently verifying token
    // 3. User is fully authenticated (isAuthenticated is true)
    // 4. User object actually exists (safety check)
    // 5. On mobile device
    // 6. Not already on /reports
    // 7. NOT on /login or /signup (these should NEVER be redirected)
    // 8. Haven't already redirected (prevent loops)
    const isLoginOrSignup = location.pathname === '/login' || location.pathname === '/signup';
    const isReports = location.pathname === '/reports';

    // Skip redirect entirely if on login/signup or already on reports
    if (isLoginOrSignup || isReports) {
      return;
    }

    // Wait for authentication to be fully complete
    // Use a shorter delay and check more aggressively
    const redirectTimer = setTimeout(() => {
      // More lenient check - if we have a token and user, consider it authenticated
      // Don't wait for verifyingToken to be false if we already have user data
      const hasTokenAndUser = !!token && !!user;
      const isAuthComplete = (!loading && !verifyingToken && isAuthenticated && !!user) ||
        (hasTokenAndUser && !verifyingToken);

      console.log('📱 [MobileRedirect] Check:', {
        isMobile,
        isLoginOrSignup,
        isReports,
        isAuthComplete,
        hasRedirected,
        path: location.pathname
      });

      if (isAuthComplete && isMobile && !hasRedirected) {
        console.log('📱 [MobileRedirect] Redirecting mobile user to /reports');
        setHasRedirected(true);
        navigate('/reports', { replace: true });
      }
    }, 200); // Shorter delay

    return () => clearTimeout(redirectTimer);
  }, [isMobile, location.pathname, navigate, isAuthenticated, loading, verifyingToken, user, hasRedirected, token]);

  return children;
};

function App() {
  // Debug logging for mobile
  useEffect(() => {
    console.log('🚀 [App] App component mounted');
    console.log('🚀 [App] Current URL:', window.location.href);
    console.log('🚀 [App] User agent:', navigator.userAgent);
    console.log('🚀 [App] React version:', React.version);
  }, []);

  // Step-by-step rendering to find where it fails
  try {
    console.log('🚀 [App] App component rendering - about to return JSX');

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
            <GoogleMapsProvider>
              <MobileRedirect>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route
                    path="/"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <ContractRegistryPage />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/upload"
                    element={
                      <PrivateRoute>
                        <Layout>
                          <ContractUploadPage />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  {/* Redirect /contracts to / */}
                  <Route
                    path="/contracts"
                    element={<Navigate to="/" replace />}
                  />

                  {/* Legacy routes - redirect to new routes */}
                  <Route
                    path="/contract-ingest"
                    element={<Navigate to="/upload" replace />}
                  />
                  <Route
                    path="/land-units"
                    element={<Navigate to="/upload" replace />}
                  />
                  <Route
                    path="/leases"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="/parcels"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="/sites"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="/assets"
                    element={<Navigate to="/upload" replace />}
                  />
                  <Route
                    path="/properties"
                    element={<Navigate to="/upload" replace />}
                  />
                  <Route
                    path="/reports"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="/earthquakes"
                    element={<Navigate to="/" replace />}
                  />
                  <Route
                    path="/users"
                    element={
                      <PrivateRoute adminOnly={true}>
                        <Layout>
                          <Users />
                        </Layout>
                      </PrivateRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </MobileRedirect>
            </GoogleMapsProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('❌ [App] Error rendering App component:', error);
    console.error('❌ [App] Error message:', error?.message);
    console.error('❌ [App] Error stack:', error?.stack);
    console.error('❌ [App] Error name:', error?.name);

    // Return error UI instead of crashing
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

export default App;
