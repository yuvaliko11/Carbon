import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

/**
 * Stepwise App - tests each component layer to find where it fails
 */
const theme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#FF385C',
    },
  },
});

function AppStepwise() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log(`🔍 [AppStepwise] Current step: ${step}`);
  }, [step]);

  // Step 0: Just a div
  if (step === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1>Step 0: Basic div works</h1>
        <button onClick={() => setStep(1)}>Next: ThemeProvider</button>
      </div>
    );
  }

  // Step 1: ThemeProvider
  if (step === 1) {
    try {
      return (
        <ThemeProvider theme={theme}>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>Step 1: ThemeProvider works</h1>
            <button onClick={() => setStep(2)}>Next: CssBaseline</button>
          </div>
        </ThemeProvider>
      );
    } catch (e) {
      setError(e);
      return <div>Error in ThemeProvider: {e.message}</div>;
    }
  }

  // Step 2: CssBaseline
  if (step === 2) {
    try {
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <h1>Step 2: CssBaseline works</h1>
            <button onClick={() => setStep(3)}>Next: Router</button>
          </div>
        </ThemeProvider>
      );
    } catch (e) {
      setError(e);
      return <div>Error in CssBaseline: {e.message}</div>;
    }
  }

  // Step 3: Router
  if (step === 3) {
    try {
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <h1>Step 3: Router works</h1>
              <button onClick={() => setStep(4)}>Next: AuthProvider</button>
            </div>
          </Router>
        </ThemeProvider>
      );
    } catch (e) {
      setError(e);
      return <div>Error in Router: {e.message}</div>;
    }
  }

  // Step 4: AuthProvider
  if (step === 4) {
    try {
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <AuthProvider>
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <h1>Step 4: AuthProvider works</h1>
                <button onClick={() => setStep(5)}>Next: Routes</button>
              </div>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      );
    } catch (e) {
      setError(e);
      return <div>Error in AuthProvider: {e.message}</div>;
    }
  }

  // Step 5: Routes (without Login component to avoid import issues)
  if (step === 5) {
    try {
      return (
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<div style={{ padding: '40px', textAlign: 'center' }}>
                  <h1>Step 5: Routes works</h1>
                  <p>All core components loaded successfully!</p>
                  <p style={{ color: '#999', fontSize: '14px', marginTop: '20px' }}>
                    If you see this, the problem is likely in one of the page components (Login, Dashboard, etc.)
                  </p>
                </div>} />
              </Routes>
            </AuthProvider>
          </Router>
        </ThemeProvider>
      );
    } catch (e) {
      setError(e);
      return <div>Error in Routes: {e.message}</div>;
    }
  }

  if (error) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h1 style={{ color: '#FF385C' }}>Error</h1>
        <p>{error.message}</p>
        <pre style={{ textAlign: 'left', overflow: 'auto' }}>{error.stack}</pre>
      </div>
    );
  }

  return <div>Unknown step: {step}</div>;
}

export default AppStepwise;

