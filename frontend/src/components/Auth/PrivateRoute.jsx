import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading, token, user, verifyingToken } = useAuth();

  console.log('🔒 [PrivateRoute] Checking access:', {
    isAuthenticated,
    isAdmin,
    loading,
    hasToken: !!token,
    hasUser: !!user,
    verifyingToken,
    adminOnly,
    currentPath: window.location.pathname
  });

  // CRITICAL: If we're verifying token, wait (but don't block rendering)
  // If verification fails, we'll get redirected
  if (verifyingToken) {
    console.log('⏳ [PrivateRoute] Verifying token, waiting...');
    // Still render children to avoid blank screen, but they should check auth state
    return children;
  }

  // CRITICAL: If not authenticated and not loading, redirect to login immediately
  // Don't wait for anything - just redirect
  // Also check if we have token but no user (invalid token)
  if (!loading) {
    // If we have token but no user, we're likely still loading/verifying
    // Don't redirect yet - let AuthContext handle the verification
    // If verification fails, AuthContext will clear the token, and then we'll redirect
    if (token && !user) {
      console.log('⏳ [PrivateRoute] Token exists but no user - waiting for verification...');
      return children;
    }

    if (!isAuthenticated) {
      console.log('🔒 [PrivateRoute] Not authenticated, redirecting to /login');
      // Force redirect - use both Navigate and window.location as fallback
      setTimeout(() => {
        if (window.location.pathname !== '/login' && !window.location.pathname.includes('/login')) {
          console.warn('⚠️ [PrivateRoute] Navigate did not work, using window.location');
          window.location.href = '/login';
        }
      }, 100);
      return <Navigate to="/login" replace />;
    }

    if (adminOnly && !isAdmin) {
      console.log('🔒 [PrivateRoute] Not admin, redirecting to /');
      return <Navigate to="/" replace />;
    }
  }

  console.log('✅ [PrivateRoute] Access granted, rendering children');
  // Always render children immediately - never show loading spinner
  // Even if loading is true (shouldn't happen), render children to avoid blank screen
  return children;
};

export default PrivateRoute;

