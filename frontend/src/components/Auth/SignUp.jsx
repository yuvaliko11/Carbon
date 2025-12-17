import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('worker');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  console.log('🚀 [SignUp] Component rendering');
  React.useEffect(() => {
    console.log('🚀 [SignUp] Component mounted');
    return () => console.log('🚀 [SignUp] Component unmounted');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register({
      name,
      email,
      password,
      role,
    });

    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message || 'Registration failed');
    }
  };

  return (
    <Box
      component="div"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: { xs: 2, sm: 3 },
        boxSizing: 'border-box',
        zIndex: 1,
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
          position: 'relative',
          overflow: 'visible',
          backgroundColor: '#ffffff',
          borderRadius: 2,
          width: '100%',
          maxWidth: '600px',
          margin: 0,
          flexShrink: 0,
        }}
        style={{
          margin: 0,
          maxWidth: '600px',
        }}
      >
        <Box sx={{ textAlign: 'center', width: '100%' }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
            Sign Up
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 1 }}>
              <TextField
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                margin="normal"
                required
                autoComplete="name"
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
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
                autoComplete="email"
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
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                autoComplete="new-password"
                helperText="Minimum 6 characters"
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
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <FormControl margin="normal" required sx={{ width: '80%', maxWidth: '400px' }}>
                <InputLabel>Role</InputLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="worker">Worker</MenuItem>
                </Select>
              </FormControl>
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
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                disabled={loading}
              >
                Sign Up
              </Button>
            </Box>
            <Box sx={{ textAlign: 'center', mt: 2, mb: 1 }}>
              <Typography variant="body2" align="center">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  Login here
                </Link>
              </Typography>
            </Box>
          </form>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignUp;

