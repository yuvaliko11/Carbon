import React from 'react';

/**
 * Minimal App component for testing
 * If this works, the problem is in the full App component
 */
function AppMinimal() {
  return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      fontFamily: 'system-ui',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff'
    }}>
      <h1 style={{ 
        color: '#FF385C', 
        marginBottom: '20px',
        fontSize: '28px',
        fontWeight: 600
      }}>
        ✅ Minimal App Works!
      </h1>
      <p style={{ 
        color: '#717171',
        fontSize: '16px',
        marginBottom: '10px',
        maxWidth: '400px'
      }}>
        If you see this, React is working correctly.
      </p>
      <p style={{ 
        color: '#999',
        fontSize: '14px',
        maxWidth: '400px'
      }}>
        The problem is likely in the full App component (Material-UI, Router, AuthProvider, etc.)
      </p>
    </div>
  );
}

export default AppMinimal;



