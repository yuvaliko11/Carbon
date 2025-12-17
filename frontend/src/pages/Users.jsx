import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  DialogContentText,
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

import LockIcon from '@mui/icons-material/Lock';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/Loading';
import logger from '../utils/logger';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();

      // Handle different response structures and 404s
      if (response.status === 200) {
        const usersData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setUsers(usersData);
      } else {
        logger.error('Error loading users: Status', response.status);
        setError('Failed to load users');
      }
    } catch (error) {
      logger.error('Error loading users:', error);
      setError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'user',
      });
    }
    setError('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
    });
    setError('');
  };

  const handleOpenPassword = (user) => {
    setEditingUser(user);
    setPasswordData({
      password: '',
      confirmPassword: '',
    });
    setError('');
    setOpenPassword(true);
  };

  const handleClosePassword = () => {
    setOpenPassword(false);
    setEditingUser(null);
    setPasswordData({
      password: '',
      confirmPassword: '',
    });
    setError('');
  };

  const handleOpenDelete = (user) => {
    setDeletingUser(user);
    setError('');
    setOpenDelete(true);
  };

  const handleCloseDelete = () => {
    setOpenDelete(false);
    setDeletingUser(null);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!formData.name || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    if (!editingUser && !formData.password) {
      setError('Please enter a password');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const updateData = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await usersAPI.update(editingUser._id, updateData);
      } else {
        // Create user
        await usersAPI.create(formData);
      }
      handleClose();
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving user');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordData.password || !passwordData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (passwordData.password.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await usersAPI.updatePassword(editingUser._id, passwordData.password);
      handleClosePassword();
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Error updating password');
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.delete(deletingUser._id);
      handleCloseDelete();
      loadUsers();
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting user');
    }
  };

  if (loading) {
    return (
      <Box
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
          backgroundColor: '#ffffff',
          zIndex: 1,
        }}
      >
        <LoadingSpinner message="Loading users..." fullScreen={true} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '1200px', mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: 4,
        gap: 2
      }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            sx={{
              color: '#6B7280',
              textTransform: 'none',
              fontWeight: 500,
              mb: 1,
              pl: 0,
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#111827',
              }
            }}
          >
            Back to Dashboard
          </Button>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              color: '#222222',
              fontSize: { xs: '1.5rem', md: '2rem' },
              letterSpacing: '-0.02em'
            }}
          >
            User management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
          fullWidth={isMobile}
          sx={{
            backgroundColor: '#222222',
            color: '#ffffff',
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: '14px',
            fontWeight: 600,
            padding: '8px 16px',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#000000',
              boxShadow: 'none',
            }
          }}
        >
          Add user
        </Button>
      </Box>

      {error && !open && !openPassword && !openDelete && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {isMobile ? (
        <Grid container spacing={2}>
          {Array.isArray(users) && users.map((user) => (
            <Grid item xs={12} key={user._id}>
              <Card sx={{
                borderRadius: '12px',
                border: '1px solid #DDDDDD',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#222222' }} gutterBottom>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#717171', mb: 0.5 }}>
                    {user.email}
                  </Typography>
                  <Box sx={{ mb: 2, mt: 1 }}>
                    <Chip
                      label={user.role === 'admin' ? 'Admin' : 'User'}
                      sx={{
                        backgroundColor: user.role === 'admin' ? '#222222' : '#F7F7F7',
                        color: user.role === 'admin' ? '#ffffff' : '#222222',
                        fontWeight: 600,
                        fontSize: '12px',
                        height: '24px'
                      }}
                      size="small"
                    />
                  </Box>
                </CardContent>
                <CardActions sx={{ borderTop: '1px solid #F0F0F0', px: 2, py: 1 }}>
                  <IconButton onClick={() => handleOpen(user)} sx={{ color: '#222222' }} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleOpenPassword(user)} sx={{ color: '#222222' }} size="small">
                    <LockIcon fontSize="small" />
                  </IconButton>
                  {user._id !== currentUser?._id && (
                    <IconButton onClick={() => handleOpenDelete(user)} sx={{ color: '#E12C60' }} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid #DDDDDD',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#F7F7F7' }}>
                <TableCell sx={{
                  fontWeight: 600,
                  color: '#222222',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  py: 2
                }}>Name</TableCell>
                <TableCell sx={{
                  fontWeight: 600,
                  color: '#222222',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  py: 2
                }}>Email</TableCell>
                <TableCell sx={{
                  fontWeight: 600,
                  color: '#222222',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  py: 2
                }}>Role</TableCell>
                <TableCell sx={{
                  fontWeight: 600,
                  color: '#222222',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  py: 2
                }}>Date Joined</TableCell>
                <TableCell align="right" sx={{
                  fontWeight: 600,
                  color: '#222222',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  py: 2
                }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(users) && users.map((user) => (
                <TableRow
                  key={user._id}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    '&:hover': { backgroundColor: '#F7F7F7' },
                    transition: 'background-color 0.1s'
                  }}
                >
                  <TableCell sx={{ color: '#222222', fontWeight: 500, py: 2.5 }}>
                    {user.name}
                  </TableCell>
                  <TableCell sx={{ color: '#717171', py: 2.5 }}>
                    {user.email}
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Chip
                      label={user.role === 'admin' ? 'Admin' : 'User'}
                      sx={{
                        backgroundColor: user.role === 'admin' ? '#222222' : '#F7F7F7',
                        color: user.role === 'admin' ? '#ffffff' : '#222222',
                        fontWeight: 600,
                        fontSize: '12px',
                        height: '24px',
                        border: user.role === 'admin' ? 'none' : '1px solid #DDDDDD'
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ color: '#717171', py: 2.5 }}>
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpen(user)}
                        sx={{
                          color: '#222222',
                          '&:hover': { backgroundColor: '#F0F0F0' }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenPassword(user)}
                        sx={{
                          color: '#222222',
                          '&:hover': { backgroundColor: '#F0F0F0' }
                        }}
                      >
                        <LockIcon fontSize="small" />
                      </IconButton>
                      {user._id !== currentUser?._id && (
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDelete(user)}
                          sx={{
                            color: '#E12C60',
                            '&:hover': { backgroundColor: '#FFE6EB' }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit User Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #DDDDDD' }}>
            {editingUser ? 'Edit user' : 'Add new user'}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                {error}
              </Alert>
            )}
            <InputLabel shrink sx={{ color: '#222222', fontWeight: 600, mt: 2, mb: 0.5 }}>Name</InputLabel>
            <TextField
              fullWidth
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              variant="outlined"
              size="small"
            />

            <InputLabel shrink sx={{ color: '#222222', fontWeight: 600, mt: 2, mb: 0.5 }}>Email</InputLabel>
            <TextField
              fullWidth
              placeholder="e.g. john@example.com"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              variant="outlined"
              size="small"
            />

            <InputLabel shrink sx={{ color: '#222222', fontWeight: 600, mt: 2, mb: 0.5 }}>
              {editingUser ? 'New password (optional)' : 'Password'}
            </InputLabel>
            <TextField
              fullWidth
              placeholder={editingUser ? "Leave empty to keep current" : "Create a password"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              helperText={editingUser ? "" : 'Minimum 6 characters'}
              variant="outlined"
              size="small"
            />

            <InputLabel shrink sx={{ color: '#222222', fontWeight: 600, mt: 2, mb: 0.5 }}>Role</InputLabel>
            <Select
              fullWidth
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              size="small"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid #DDDDDD', justifyContent: 'space-between' }}>
            <Button
              onClick={handleClose}
              sx={{ color: '#222222', fontWeight: 600, textTransform: 'none', textDecoration: 'underline' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: '#222222',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                '&:hover': { backgroundColor: '#000000' }
              }}
            >
              {editingUser ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={openPassword}
        onClose={handleClosePassword}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }
        }}
      >
        <form onSubmit={handlePasswordSubmit}>
          <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #DDDDDD' }}>
            Change password: {editingUser?.name}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
                {error}
              </Alert>
            )}

            <InputLabel shrink sx={{ color: '#222222', fontWeight: 600, mt: 2, mb: 0.5 }}>New password</InputLabel>
            <TextField
              fullWidth
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              required
              helperText="Minimum 6 characters"
              size="small"
            />

            <InputLabel shrink sx={{ color: '#222222', fontWeight: 600, mt: 2, mb: 0.5 }}>Confirm password</InputLabel>
            <TextField
              fullWidth
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2.5, borderTop: '1px solid #DDDDDD', justifyContent: 'space-between' }}>
            <Button
              onClick={handleClosePassword}
              sx={{ color: '#222222', fontWeight: 600, textTransform: 'none', textDecoration: 'underline' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: '#222222',
                color: '#ffffff',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '8px',
                px: 3,
                '&:hover': { backgroundColor: '#000000' }
              }}
            >
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDelete}
        onClose={handleCloseDelete}
        fullScreen={isMobile}
        PaperProps={{
          sx: { borderRadius: '12px', boxShadow: '0 8px 28px rgba(0,0,0,0.12)' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: '#222222' }}>
            Are you sure you want to delete <strong>{deletingUser?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleCloseDelete}
            sx={{ color: '#222222', fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              backgroundColor: '#E12C60',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { backgroundColor: '#C91B4B' }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;

