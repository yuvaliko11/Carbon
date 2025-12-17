import React, { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { authAPI } from '../services/api';
// Safe logger - won't break if module fails
const logger = {
  error: (...args) => console.error('[AuthContext]', ...args),
  log: (...args) => console.log('[AuthContext]', ...args),
  warn: (...args) => console.warn('[AuthContext]', ...args),
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Safe localStorage access for mobile browsers
const safeLocalStorage = {
  getItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage.getItem failed:', e);
    }
    return null;
  },
  setItem: (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('localStorage.setItem failed:', e);
    }
  },
  removeItem: (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('localStorage.removeItem failed:', e);
    }
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Track if we're currently verifying the token
  // CRITICAL: Start as true if we have a token (to prevent isAuthenticated from being true before verification)
  const [token, setToken] = useState(() => {
    const storedToken = safeLocalStorage.getItem('token');
    // CRITICAL: If we have a token, clear any stale user data from localStorage
    // We'll verify the token and load fresh user data
    if (storedToken) {
      safeLocalStorage.removeItem('user');
    }
    return storedToken;
  });
  const [verifyingToken, setVerifyingToken] = useState(() => {
    // If we have a token on mount, we need to verify it first
    // CRITICAL: This must be true initially if token exists to prevent isAuthenticated from being true
    const hasToken = !!safeLocalStorage.getItem('token');
    console.log('🔍 [AuthContext] Initial verifyingToken state:', hasToken);
    return hasToken;
  });
  // NEVER block - always allow app to render
  const [loading, setLoading] = useState(false);

  const logout = () => {
    console.log('🔓 [AuthContext] Logging out - clearing all auth data');
    setToken(null);
    setUser(null);
    setVerifyingToken(false);
    safeLocalStorage.removeItem('token');
    safeLocalStorage.removeItem('user');
  };

  // Simplified auth check - no delays, immediate check but non-blocking
  useEffect(() => {
    // CRITICAL: Immediately set loading to false - NEVER block rendering
    setLoading(false);

    // If we have a token, try to verify it in the background (no delay)
    if (token) {
      // CRITICAL: Set verifying flag IMMEDIATELY to prevent isAuthenticated from being true
      setVerifyingToken(true);
      // CRITICAL: Clear user immediately when starting verification to prevent stale data
      setUser(null);

      const loadUser = async () => {
        const startTime = Date.now();
        try {
          logger.log('🔍 [AuthContext] Loading user with token');
          const response = await authAPI.getMe();
          const duration = Date.now() - startTime;

          logger.log('🔍 [AuthContext] getMe response status:', response.status);
          logger.log('🔍 [AuthContext] getMe response data:', response.data);

          // CRITICAL: Verify response has user data
          const userData = response.data?.data || response.data;

          if (!userData) {
            logger.error('❌ [AuthContext] Invalid response - no user data');
            setVerifyingToken(false);
            setUser(null);
            logout();
            return;
          }

          // CRITICAL: Verify user has required fields
          if (!userData._id && !userData.id) {
            logger.error('❌ [AuthContext] User data missing ID');
            setVerifyingToken(false);
            setUser(null);
            logout();
            return;
          }

          logger.log(`✅ [AuthContext] User loaded successfully in ${duration}ms`);
          setUser(userData);
          setVerifyingToken(false);
        } catch (error) {
          // If verification fails (especially 401), clear the token
          // NEVER set loading to true - always allow app to render
          if (error.response?.status === 401) {
            // 401 is expected when token is invalid - don't log as error, just clear
            // This is normal behavior during token verification
            logger.log('🔍 [AuthContext] Token invalid (401), clearing auth silently');
            // CRITICAL: Clear everything immediately to prevent further API calls
            setToken(null);
            setUser(null);
            setVerifyingToken(false);
            safeLocalStorage.removeItem('token');
            safeLocalStorage.removeItem('user');
          } else {
            // For other errors (network, timeout, etc.), log as error
            logger.error('❌ [AuthContext] Error loading user:', error);
            // For any error, clear auth to be safe
            setToken(null);
            setUser(null);
            setVerifyingToken(false);
            safeLocalStorage.removeItem('token');
            safeLocalStorage.removeItem('user');
          }
        } finally {
          // CRITICAL: Always ensure loading is false
          setLoading(false);
        }
      };

      // Load user in background - completely non-blocking
      // Start immediately, don't wait
      loadUser().catch((error) => {
        logger.error('❌ [AuthContext] Load user promise rejected:', error);
        // Clear everything on rejection
        setToken(null);
        setUser(null);
        setVerifyingToken(false);
        safeLocalStorage.removeItem('token');
        safeLocalStorage.removeItem('user');
        setLoading(false);
      });
    } else {
      // No token - ensure loading is false and user is null
      setUser(null);
      setVerifyingToken(false);
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    try {
      logger.log('🔐 [AuthContext] Login attempt started');
      const response = await authAPI.login({ email, password });
      logger.log('✅ [AuthContext] Login API call successful');

      // Handle different response structures
      const responseData = response.data?.data || response.data;
      if (!responseData || !responseData.token) {
        throw new Error('Invalid login response: token not found');
      }

      const { token: newToken, user: userObj } = responseData;

      // Handle both nested user object and flattened response
      // If userObj exists (nested), use it. Otherwise use the rest of responseData (flattened)
      const userInfo = userObj || (() => {
        const { token, ...rest } = responseData;
        return rest;
      })();

      logger.log('🔐 [AuthContext] Setting token and user:', { hasToken: !!newToken, hasUser: !!userInfo });

      setToken(newToken);
      setUser(userInfo);
      safeLocalStorage.setItem('token', newToken);
      safeLocalStorage.setItem('user', JSON.stringify(userInfo));

      logger.log('✅ [AuthContext] Login successful, token and user set');
      return { success: true };
    } catch (error) {
      logger.error('❌ [AuthContext] Login error:', error);
      // Provide more specific error messages
      let errorMessage = 'Login failed';

      if (error.response?.status === 503) {
        errorMessage = error.response.data?.message || 'Database connection unavailable. Please try again in a moment.';
      } else if (error.response?.status === 504 || error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. The server may be slow. Please try again.';
      } else if (error.code === 'ERR_NETWORK' || !error.response) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);

      // Handle different response structures
      const responseData = response.data?.data || response.data;

      if (!responseData || !responseData.token) {
        throw new Error('Invalid registration response: token not found');
      }

      const { token: newToken, user: userObj } = responseData;

      // Handle both nested user object and flattened response
      const userInfo = userObj || (() => {
        const { token, ...rest } = responseData;
        return rest;
      })();

      setToken(newToken);
      setUser(userInfo);
      safeLocalStorage.setItem('token', newToken);
      safeLocalStorage.setItem('user', JSON.stringify(userInfo));
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  // isAuthenticated should be true only if we have both token AND user
  // AND we're not currently verifying the token
  // This prevents trying to load data with an invalid token
  // CRITICAL: user must exist with an ID - if we have token but no user, we're not authenticated
  // Use useMemo to ensure consistent calculation and prevent race conditions
  // ABSOLUTE RULE: If user is null/undefined, isAuthenticated MUST be false
  const isAuthenticated = useMemo(() => {
    // CRITICAL: Check user FIRST - if no user, immediately return false
    // This prevents any possibility of isAuthenticated being true without a user
    if (!user || user === null || user === undefined) {
      return false;
    }

    // Now check if user is an object with required fields
    if (typeof user !== 'object') {
      return false;
    }

    // Check if user has an ID
    if (!user._id && !user.id) {
      return false;
    }

    // Check other conditions
    if (!token) return false;
    if (verifyingToken) return false;

    // All conditions met - user exists, has ID, has token, not verifying
    return true;
  }, [token, user, verifyingToken]);

  // CRITICAL: Double-check - if user is null, force isAuthenticated to false
  // This is a safety net in case useMemo has any issues
  const finalIsAuthenticated = user ? isAuthenticated : false;

  // DEBUG: Always log the calculation to see what's happening (even in production for debugging)
  console.log('🔍 [AuthContext] isAuthenticated calculation:', {
    hasToken: !!token,
    hasUser: !!user,
    userType: typeof user,
    userIsNull: user === null,
    userIsUndefined: user === undefined,
    hasUserId: !!(user?._id || user?.id),
    verifyingToken,
    useMemoResult: isAuthenticated,
    finalResult: finalIsAuthenticated,
    timestamp: new Date().toISOString()
  });

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: finalIsAuthenticated, // Use the final checked value
    isAdmin: user?.role === 'admin',
    verifyingToken, // Expose this so components can wait for verification
  };

  console.log('🔐 [AuthProvider] Rendering with:', {
    hasToken: !!token,
    hasUser: !!user,
    userIsNull: user === null,
    userIsUndefined: user === undefined,
    loading,
    verifyingToken,
    isAuthenticated: finalIsAuthenticated, // Log the final value
    tokenValue: token ? `${token.substring(0, 20)}...` : 'null'
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

