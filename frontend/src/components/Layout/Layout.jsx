import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../context/AuthContext';
import { styled } from '@mui/material/styles';
import ErrorBoundary from '../ErrorBoundary';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: '#ffffff',
  color: '#111827',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  borderBottom: '1px solid #E5E7EB',
  zIndex: 1100,
  position: 'relative',
}));

const Logo = styled(Typography)({
  fontSize: '20px',
  fontWeight: 700,
  color: '#00A86B', // Fiji Carbon Green
  cursor: 'pointer',
  letterSpacing: '-0.025em',
});

const NavButton = styled(Button)(({ theme, selected }) => ({
  color: selected ? '#111827' : '#6B7280',
  fontWeight: selected ? 600 : 500,
  fontSize: '14px',
  padding: '8px 16px',
  borderRadius: '8px',
  textTransform: 'none',
  backgroundColor: selected ? '#F3F4F6' : 'transparent',
  '&:hover': {
    backgroundColor: '#F9FAFB',
    color: '#111827',
  },
  '&:focus': {
    outline: 'none',
    boxShadow: 'none',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: 'none',
  },
}));

const UserMenuButton = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '5px 5px 5px 12px',
  borderRadius: '8px',
  border: '1px solid #E5E7EB',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
});

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Contract Upload', path: '/contracts/upload' },
    { label: 'Contract Registry', path: '/contracts' },
  ];

  // Add users management for admins only
  if (user?.role === 'admin') {
    navItems.push({ label: 'User Management', path: '/users' });
  }

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  const drawer = (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2, color: '#00A86B', fontWeight: 700 }}>
        Carbon
      </Typography>
      <Divider />
      <List>
        {/* Navigation items removed - single page flow */}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
          {user?.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {user?.role === 'admin' ? 'Administrator' : 'User'}
        </Typography>
        <Button variant="outlined" fullWidth onClick={handleLogout} sx={{ textTransform: 'none' }}>
          Logout
        </Button>
      </Box>
    </Box>
  );

  // Check if we're on the dashboard/map page
  const isMapPage = location.pathname === '/';
  // Check if we're on reports page - hide navigation on mobile
  const isReportsPage = location.pathname === '/reports';
  const shouldHideNavOnMobile = isMobile && isReportsPage;
  const contentBoxRef = useRef(null);

  // Force transparent background on mobile for map pages
  useEffect(() => {
    if (isMapPage && contentBoxRef.current) {
      const box = contentBoxRef.current;
      box.style.setProperty('background-color', 'transparent', 'important');
      box.style.setProperty('background', 'transparent', 'important');
      box.style.backgroundColor = 'transparent';
      box.style.background = 'transparent';

      // Also check parent
      const parent = box.parentElement;
      if (parent) {
        parent.style.setProperty('background-color', 'transparent', 'important');
        parent.style.setProperty('background', 'transparent', 'important');
      }
    }
  }, [isMapPage]);

  return (
    <ErrorBoundary>
      <Box
        className={isMapPage ? 'layout-map-page' : ''}
        sx={{
          backgroundColor: isMapPage ? 'transparent' : undefined,
          background: isMapPage ? 'transparent' : undefined,
          position: 'relative',
          minHeight: isMapPage ? 0 : '100vh',
          height: isMapPage ? '100vh' : 'auto',
          '@supports (height: 100dvh)': {
            height: isMapPage ? '100dvh' : 'auto',
          },
        }}
        style={{
          backgroundColor: isMapPage ? 'transparent' : undefined,
          background: isMapPage ? 'transparent' : undefined,
        }}
      >
        {!shouldHideNavOnMobile && (
          <StyledAppBar position="sticky" sx={{ width: '100%', maxWidth: '100vw', zIndex: 1200, position: 'relative' }}>
            <Toolbar sx={{ width: '100%', overflow: 'hidden', px: { xs: 1, sm: 2, md: 4 }, maxWidth: '1920px', mx: 'auto', position: 'relative', zIndex: 1201, pointerEvents: 'auto' }}>
              {isMobile && (
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="start"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDrawerToggle();
                  }}
                  sx={{
                    ml: { xs: 0, sm: 2 },
                    mr: { xs: 1, sm: 2 },
                    color: '#222222',
                    zIndex: 1001,
                    position: 'relative',
                  }}
                >
                  <MenuIcon />
                </IconButton>
              )}

              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{
                  mr: 2,
                  display: { xs: 'none', md: 'flex' },
                  fontWeight: 700,
                  color: 'primary.main',
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/')}
              >
                Carbon
              </Typography>
              {!isMobile && (
                <>
                  <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, ml: 2, position: 'relative', zIndex: 1202, pointerEvents: 'auto' }}>
                    {/* Navigation items removed as per new flow requirements */}
                  </Box>
                  <UserMenuButton onClick={handleUserMenuOpen}>
                    <MenuIcon sx={{ fontSize: '16px', color: '#717171' }} />
                    <Avatar sx={{ width: '30px', height: '30px', bgcolor: '#717171', fontSize: '14px' }}>
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                  </UserMenuButton>
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        minWidth: '200px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #DDDDDD' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#222222' }}>
                        {user?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#717171' }}>
                        {user?.role === 'admin' ? 'Administrator' : 'User'}
                      </Typography>
                    </Box>
                    {user?.role === 'admin' && (
                      <MenuItem onClick={() => { handleUserMenuClose(); navigate('/users'); }} sx={{ py: 1.5, px: 2 }}>
                        <Typography variant="body2">Manage Accounts</Typography>
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 2 }}>
                      <Typography variant="body2">Logout</Typography>
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Toolbar>
          </StyledAppBar>
        )}
        {!shouldHideNavOnMobile && isMobile && (
          <Box component="nav">
            <Drawer
              variant="temporary"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                onClick: (e) => e.stopPropagation(),
              }}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: 280,
                  zIndex: 1300,
                },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
        )}
        {isMapPage ? (
          // On map pages, render children directly without wrapper to avoid overlay
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 1,
            backgroundColor: 'transparent',
            background: 'transparent',
            '@supports (height: 100dvh)': {
              height: '100dvh',
            },
          }}>
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'auto',
              zIndex: 1,
            }}>
              {children}
            </Box>
          </Box>
        ) : (
          <Box
            ref={contentBoxRef}
            className="layout-content-map-page"
            sx={{
              position: 'relative',
              width: '100%',
              height: shouldHideNavOnMobile ? '100vh' : 'calc(100vh - 64px)',
              minHeight: shouldHideNavOnMobile ? '100vh' : 'calc(100vh - 64px)',
              overflow: 'auto',
              '@supports (height: 100dvh)': {
                height: shouldHideNavOnMobile ? '100dvh' : 'calc(100dvh - 64px)',
                minHeight: shouldHideNavOnMobile ? '100dvh' : 'calc(100dvh - 64px)',
              },
            }}
          >
            {children}
          </Box>
        )}
      </Box>
    </ErrorBoundary>
  );
};

export default Layout;

