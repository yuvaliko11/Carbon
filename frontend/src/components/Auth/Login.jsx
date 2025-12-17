import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Fade,
  InputAdornment,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../Loading/LoadingSpinner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, logout, user, loading: authLoading, isAuthenticated } = useAuth();

  console.log('🔍 [Login] Render state:', { user, loading, isAuthenticated });

  // Redirect if already authenticated
  useEffect(() => {
    // ... (keep existing logic)
  }, [user, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔐 [Login] handleSubmit called');
    console.log('🔐 [Login] Email:', email);
    console.log('🔐 [Login] Password length:', password.length);

    setError('');
    setLoading(true);

    // Basic validation
    if (!email || !password) {
      console.warn('⚠️ [Login] Validation failed - missing fields');
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    console.log('🔐 [Login] Validation passed, calling login function');

    // Add timeout to prevent infinite loading (shorter for better UX)
    let timeoutReached = false;
    let timeoutId = null;
    let progressInterval = null; // Declare at function scope

    // Set timeout IMMEDIATELY
    timeoutId = setTimeout(() => {
      if (!timeoutReached) {
        timeoutReached = true;
        console.error('❌ [Login] Timeout reached - login took more than 10 seconds');

        // Clear progress timer
        if (progressInterval) {
          clearInterval(progressInterval);
        }

        setLoading(false);
        setError('Request timed out after 10 seconds. The server may be down or unreachable. Please check your connection and try again.');

        // Update status on screen
        const statusEl = document.getElementById('login-status');
        if (statusEl) {
          statusEl.textContent = 'Timeout - Server not responding';
          statusEl.style.color = '#FF385C';
        }
      }
    }, 10000); // 10 second max for login

    try {
      console.log('🔐 [Login] Attempting login with email:', email);
      console.log('🔐 [Login] API URL:', process.env.REACT_APP_API_URL || 'using default');

      // Add visual feedback on screen
      const statusEl = document.getElementById('login-status');
      if (statusEl) {
        statusEl.textContent = 'Checking connection...';
        statusEl.style.color = '#999';
      }

      // CRITICAL: Test network connection first
      const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://gis.chocoinsurance.com/api' : 'http://localhost:5002/api');
      const healthCheckUrl = `${API_URL.replace('/api', '')}/api/health`;

      console.log('🔍 [Login] Testing server connection:', healthCheckUrl);

      try {
        // Quick health check (2 second timeout)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const healthResponse = await fetch(healthCheckUrl, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Check if server responded (even with degraded status, 200 is OK)
        if (healthResponse.status >= 500) {
          throw new Error(`Health check failed: ${healthResponse.status}`);
        }

        const healthData = await healthResponse.json().catch(() => ({}));
        if (healthData.status === 'degraded') {
          console.warn('⚠️ [Login] Server is reachable but database is disconnected');
        } else {
          console.log('✅ [Login] Server is reachable');
        }
        if (statusEl) {
          statusEl.textContent = 'Server connected, logging in...';
        }
      } catch (healthError) {
        console.error('❌ [Login] Health check failed:', healthError);
        if (statusEl) {
          statusEl.textContent = 'Cannot reach server. Check your connection.';
          statusEl.style.color = '#FF385C';
        }

        // Still try login, but warn user
        setError('Cannot connect to server. Please check your internet connection and try again.');
        setLoading(false);
        if (timeoutId) clearTimeout(timeoutId);
        if (progressInterval) clearInterval(progressInterval);
        return;
      }

      // Start a progress timer to show user something is happening
      let progressSeconds = 0;
      progressInterval = setInterval(() => {
        progressSeconds++;
        const currentStatusEl = document.getElementById('login-status');
        if (currentStatusEl && !timeoutReached) {
          // Update status every second
          currentStatusEl.textContent = `Logging in... (${progressSeconds}s)`;
          currentStatusEl.style.color = '#999';

          // Change color if taking too long
          if (progressSeconds >= 5) {
            currentStatusEl.style.color = '#FF9800'; // Orange warning
          }
          if (progressSeconds >= 8) {
            currentStatusEl.style.color = '#FF385C'; // Red error
          }
        }
        if (progressSeconds >= 10) {
          clearInterval(progressInterval);
        }
      }, 1000);

      console.log('🔐 [Login] Calling login function...');
      const loginStartTime = Date.now();
      const result = await login(email, password);
      const loginDuration = Date.now() - loginStartTime;
      console.log(`✅ [Login] Login function completed in ${loginDuration}ms`);

      // Clear progress timer
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (timeoutReached) {
        console.warn('⚠️ [Login] Timeout was reached but login completed');
        return;
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      console.log('🔐 [Login] Login result:', result);

      if (result && result.success) {
        console.log('✅ [Login] Login successful');

        // Detect if mobile to redirect to /reports instead of /
        const isMobile = window.innerWidth < 900;
        const redirectPath = isMobile ? '/reports' : '/';

        console.log(`🔄 [Login] Reloading page to ${redirectPath} (mobile: ${isMobile})`);

        // CRITICAL: Force full page reload to ensure clean state
        // This prevents issues with stale cache and ensures App loads correctly
        // Small delay to ensure token is saved to localStorage
        setTimeout(() => {
          // Force full reload - this will trigger index.js to detect token and load full App
          window.location.href = redirectPath;
        }, 300);
      } else {
        const errorMsg = result?.message || 'Login failed. Please check your credentials.';
        console.error('❌ [Login] Login failed:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      // Clear progress timer if still running
      if (progressInterval) {
        clearInterval(progressInterval);
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.error('❌ [Login] Login error:', err);
      console.error('❌ [Login] Error stack:', err.stack);
      console.error('❌ [Login] Error code:', err.code);
      console.error('❌ [Login] Error response:', err.response);

      // Update status on screen
      const statusEl = document.getElementById('login-status');
      if (statusEl) {
        statusEl.textContent = 'Connection failed';
        statusEl.style.color = '#FF385C';
      }

      // More specific error messages
      let errorMessage = 'An error occurred. Please check your connection and try again.';
      if (err.code === 'ERR_NETWORK' || !err.response) {
        errorMessage = 'Unable to connect to server. Please check your internet connection and that the server is running.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The server may be slow or unreachable.';
      } else if (err.response?.status === 503) {
        errorMessage = 'Service temporarily unavailable. The database may be connecting.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }

      setError(errorMessage);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setLoading(false);
      console.log('🔐 [Login] Login process finished, loading set to false');
    }
  };

  const handleLogout = () => {
    logout();
    window.location.reload();
  };

  const handleForceLogout = () => {
    console.log('⚠️ [Login] Force logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <Box
      className="login-page-container"
    // ... (keep styles)
    >
      <Paper
      // ... (keep styles)
      >
        {/* ... (keep loading spinner logic) */}

        {user ? (
          // ... (keep Welcome Back logic)
          <Box sx={{ textAlign: 'center', width: '100%' }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
              You are already logged in as <strong>{user.name || user.email}</strong>
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                sx={{ maxWidth: '300px' }}
                onClick={() => {
                  const isMobile = window.innerWidth < 900;
                  const redirectPath = isMobile ? '/reports' : '/';
                  window.location.href = redirectPath;
                }}
              >
                Go to Dashboard
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                fullWidth
                sx={{ maxWidth: '300px' }}
                onClick={handleLogout}
              >
                Logout & Switch Account
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Box sx={{ textAlign: 'center', width: '100%' }}>
              {/* ... (keep Login header and error alert) */}
              <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 1 }}>
                Login
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  {error}
                </Alert>
              )}
              <div id="login-status" style={{
                marginTop: '10px',
                marginBottom: '10px',
                color: '#999',
                fontSize: '12px',
                textAlign: 'center',
                minHeight: '20px',
                fontWeight: '500'
              }}>
                {loading ? 'Logging in...' : ''}
              </div>

              <form onSubmit={handleSubmit}>
                {/* ... (keep form fields) */}
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 1 }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    margin="normal"
                    required
                    autoComplete="email"
                    disabled={loading}
                    fullWidth
                    variant="outlined"
                    sx={{
                      width: '80%',
                      maxWidth: '400px',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#DDDDDD',
                        },
                        '&:hover fieldset': {
                          borderColor: '#717171',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF385C',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: '#FF385C',
                        },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 1 }}>
                  <TextField
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    margin="normal"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    fullWidth
                    variant="outlined"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            disabled={loading}
                            sx={{
                              color: 'action.active',
                              '&:hover': {
                                color: 'action.hover',
                              }
                            }}
                          >
                            {showPassword ? <VisibilityOff sx={{ fontSize: 20 }} /> : <Visibility sx={{ fontSize: 20 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      width: '80%',
                      maxWidth: '400px',
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#DDDDDD',
                        },
                        '&:hover fieldset': {
                          borderColor: '#717171',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#FF385C',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        '&.Mui-focused': {
                          color: '#FF385C',
                        },
                      },
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mt: 3 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      mb: 2,
                      minHeight: '48px',
                      width: '80%',
                      maxWidth: '400px',
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                        <Typography component="span" sx={{ color: 'white' }}>
                          Logging in...
                        </Typography>
                      </Box>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 2, mb: 1 }}>
                  <Typography variant="body2" align="center">
                    Don't have an account?{' '}
                    <span
                      onClick={() => window.location.href = '/signup'}
                      style={{ textDecoration: 'none', color: '#1976d2', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Sign up here
                    </span>
                  </Typography>
                </Box>

                {/* Force Logout Button for debugging */}
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleForceLogout}
                    sx={{ textTransform: 'none', fontSize: '0.75rem', opacity: 0.7 }}
                  >
                    Trouble logging in? Click here to reset.
                  </Button>
                </Box>
              </form>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default Login;
