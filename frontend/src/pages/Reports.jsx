import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Alert,
  Button,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { reportsAPI } from '../services/api';
import { LoadingSpinner } from '../components/Loading';
import logger from '../utils/logger';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports = () => {
  const [sitesSummary, setSitesSummary] = useState(null);
  const [propertiesSummary, setPropertiesSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Start loading immediately but don't block the UI
    loadReports();
    
    // Aggressive timeout - stop loading after 3 seconds to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn('⚠️ [Reports] Loading timeout - stopping loading state');
      setLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to API calls
      const controller = new AbortController();
      const apiTimeout = setTimeout(() => controller.abort(), 5000);
      
      try {
        const [sitesRes, propertiesRes] = await Promise.all([
          reportsAPI.getSitesSummary(),
          reportsAPI.getPropertiesSummary(),
        ]);
        clearTimeout(apiTimeout);
        setSitesSummary(sitesRes.data.data);
        setPropertiesSummary(propertiesRes.data.data);
      } catch (apiError) {
        clearTimeout(apiTimeout);
        throw apiError;
      }
    } catch (error) {
      logger.error('Error loading reports:', error);
      // Don't set error state - just show empty data
      setSitesSummary({ totalSites: 0, sitesWithProperties: 0, averagePropertiesPerSite: 0 });
      setPropertiesSummary({ totalProperties: 0, totalArea: 0, averageArea: 0, propertiesByType: [] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      overflow: 'auto', 
      maxWidth: '100%',
      height: '100%',
      padding: isMobile ? '16px' : '24px',
      paddingTop: isMobile ? '16px' : '24px',
    }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom
        sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' } }}
      >
        Reports & Statistics
      </Typography>
      
      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Loading reports data...
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={loadReports} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      <Grid container spacing={isMobile ? 2 : 3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sites Summary
              </Typography>
              <Typography variant="h4">
                {sitesSummary?.totalSites || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Sites
              </Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                {sitesSummary?.sitesWithProperties || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sites with Properties
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Average Properties per Site: {sitesSummary?.averagePropertiesPerSite?.toFixed(1) || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Properties Summary
              </Typography>
              <Typography variant="h4">
                {propertiesSummary?.totalProperties || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Properties
              </Typography>
              <Typography variant="h6" sx={{ mt: 2 }}>
                {propertiesSummary?.totalArea?.toFixed(2) || 0} m²
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Area
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Average Area per Property: {propertiesSummary?.averageArea?.toFixed(2) || 0} m²
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Distribution by Property Type
              </Typography>
              {propertiesSummary?.propertiesByType?.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={propertiesSummary.propertiesByType}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      label
                    >
                      {propertiesSummary.propertiesByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No data
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Properties Distribution by Type
            </Typography>
            {propertiesSummary?.propertiesByType?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={propertiesSummary.propertiesByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="Number of Properties" />
                  <Bar dataKey="totalArea" fill="#82ca9d" name='Total Area (m²)' />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No data
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;

