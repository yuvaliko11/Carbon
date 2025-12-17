import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import PrivateRoute from './components/Auth/PrivateRoute';

/**
 * Simple App - Login page + simple Dashboard
 * This helps isolate the problem
 */
const theme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#FF385C',
    },
  },
});

// Simple Dashboard component - shows message and reloads to load full app
const SimpleDashboard = () => {
  const [countdown, setCountdown] = React.useState(3);

  React.useEffect(() => {
    console.log('🔄 [SimpleDashboard] Component mounted, starting countdown');

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.log('🔄 [SimpleDashboard] Countdown finished, reloading page to load full app');
          clearInterval(interval);
          // Reload page - index.js will detect token and load full App
          window.location.reload();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ color: '#FF385C' }}>✅ Login Successful!</h1>
      <p style={{ marginTop: '20px', color: '#717171' }}>
        Loading full app in {countdown} seconds...
      </p>
    </div>
  );
};

function AppSimple() {
  console.log('🚀 [AppSimple] Rendering');

  try {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <SimpleDashboard />
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
    console.error('❌ [AppSimple] Error:', error);
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#FF385C' }}>AppSimple Error</h1>
        <p>{error.message}</p>
      </div>
    );
  }
}

export default AppSimple;

