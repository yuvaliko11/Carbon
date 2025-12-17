import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  List,
  ListItem,
  ListItemText,
  Switch,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Typography,
  Paper,
  Chip,
  Tabs,
  Tab,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardMedia,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import MapIcon from '@mui/icons-material/Map';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { dangerMapsAPI, earthquakesAPI } from '../../services/api';
import logger from '../../utils/logger';

// Placeholder images for map types
const MAP_PLACEHOLDERS = {
  hazard: 'https://maps.googleapis.com/maps/api/staticmap?center=31.5,35.0&zoom=7&size=600x300&maptype=terrain&key=' + (process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''),
  flood: 'https://maps.googleapis.com/maps/api/staticmap?center=32.0853,34.7818&zoom=12&size=600x300&maptype=roadmap&key=' + (process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''),
  wildfire: 'https://maps.googleapis.com/maps/api/staticmap?center=32.7940,34.9896&zoom=11&size=600x300&maptype=satellite&key=' + (process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''),
};

const DangerMapDialog = ({ open, onClose, visibleMaps, onToggleMap, onMapsChange, visibleEarthquakeDatasets = [], onToggleEarthquake }) => {
  const [maps, setMaps] = useState([]);
  const [earthquakes, setEarthquakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mapToDelete, setMapToDelete] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // AI Chat State
  const [chatMessage, setChatMessage] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  const suggestedMaps = [
    {
      id: 'hazard',
      title: 'Seismic Hazard Map',
      description: 'Show areas with high probability of ground shaking.',
      prompt: 'Generate a seismic hazard map showing peak ground acceleration (PGA) zones for the selected region. Highlight high-risk areas in red and low-risk in green.',
      image: MAP_PLACEHOLDERS.hazard
    },
    {
      id: 'flood',
      title: 'Flood Risk Analysis',
      description: 'Identify flood-prone areas based on topography and rainfall.',
      prompt: 'Identify flood-prone areas based on topography and historical rainfall data. Mark low-lying areas near water bodies as high risk.',
      image: MAP_PLACEHOLDERS.flood
    },
    {
      id: 'wildfire',
      title: 'Wildfire Danger Zones',
      description: 'Map wildfire risk zones considering vegetation and dry seasons.',
      prompt: 'Map wildfire risk zones considering vegetation density and dry seasons. Highlight areas near forests and urban interfaces.',
      image: MAP_PLACEHOLDERS.wildfire
    }
  ];

  useEffect(() => {
    if (open) {
      loadMaps();
    }
  }, [open]);



  const loadMaps = async () => {
    try {
      setLoading(true);
      setError('');

      const [dangerMapsResponse, earthquakesResponse] = await Promise.all([
        dangerMapsAPI.getAll(),
        earthquakesAPI.getAll()
      ]);

      setMaps(dangerMapsResponse.data.data || []);
      setEarthquakes(earthquakesResponse.data.data || []);

      if (onMapsChange) {
        onMapsChange(dangerMapsResponse.data.data || []);
      }
    } catch (err) {
      logger.error('Error loading maps:', err);
      setError('Failed to load maps');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.geojson') ||
        fileName.endsWith('.json') ||
        fileName.endsWith('.kmz') ||
        fileName.endsWith('.kml')) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid file(s): ${invalidFiles.join(', ')}. Only GeoJSON, KMZ, or KML files are allowed.`);
      if (validFiles.length === 0) {
        return;
      }
    }

    if (validFiles.length > 0) {
      setUploadFiles(validFiles);
      setError('');
      if (!uploadName && validFiles.length === 1) {
        setUploadName(validFiles[0].name.replace(/\.(geojson|json|kmz|kml)$/i, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      const response = await dangerMapsAPI.upload(uploadFiles, uploadName || undefined, uploadDescription || undefined);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Upload failed');
      }

      await loadMaps();
      setSuccess('Hazard map uploaded successfully!');
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadName('');
      setUploadDescription('');
    } catch (err) {
      logger.error('Error uploading danger map:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload hazard map');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleMap = (mapId) => {
    if (onToggleMap) {
      onToggleMap(mapId);
    }
  };

  const handleDeleteClick = (map) => {
    setMapToDelete(map);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mapToDelete) return;

    try {
      setError('');
      if (mapToDelete.type === 'earthquake') {
        await earthquakesAPI.delete(mapToDelete._id);
      } else {
        await dangerMapsAPI.delete(mapToDelete._id);
      }
      await loadMaps();
      setDeleteConfirmOpen(false);
      setMapToDelete(null);
      setSuccess('Map deleted successfully');
    } catch (err) {
      logger.error('Error deleting map:', err);
      setError(err.response?.data?.message || 'Failed to delete map');
    }
  };

  const handleSuggestionClick = (prompt) => {
    setChatMessage(prompt);
    // Focus the input
    const input = document.querySelector('input[placeholder="Describe the hazard map you want to generate..."]');
    if (input) input.focus();
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await dangerMapsAPI.generate(
        userMsg,
        `AI Generated: ${userMsg.substring(0, 30)}...`,
        `Generated from prompt: ${userMsg}`
      );

      if (response.data && response.data.success && response.data.data) {
        const generatedMap = response.data.data;

        // Reload maps
        await loadMaps();

        // Automatically toggle the new map on
        if (onToggleMap) {
          // Check if not already visible
          const normalizedId = String(generatedMap._id);
          const isVisible = visibleMaps.some(id => String(id) === normalizedId);
          if (!isVisible) {
            onToggleMap(generatedMap._id);
          }
        }

        setSuccess('Map generated and added to dashboard!');
      } else {
        throw new Error(response.data?.message || 'Failed to generate map');
      }
    } catch (error) {
      logger.error('Error generating map:', error);
      setError(error.response?.data?.message || error.message || 'Failed to generate map');
    } finally {
      setIsGenerating(false);
    }
  };

  const normalizeId = (id) => {
    if (!id) return null;
    return String(id);
  };

  const uploadedMaps = maps.filter(m => !m.isAiGenerated).map(m => ({ ...m, type: 'dangerMap' }));

  // Combine generated DangerMaps and generated Earthquakes
  const generatedDangerMaps = maps.filter(m => m.isAiGenerated).map(m => ({ ...m, type: 'dangerMap' }));
  const generatedEarthquakes = earthquakes.filter(e => e.isAiGenerated).map(e => ({ ...e, type: 'earthquake', fileType: 'geojson' }));

  const aiGeneratedMaps = [...generatedDangerMaps, ...generatedEarthquakes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const renderMapList = (mapList, emptyMessage) => (
    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {mapList === uploadedMaps ? `Uploaded Maps (${mapList.length})` : `Generated Maps (${mapList.length})`}
        </Typography>
        {mapList === uploadedMaps && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={() => setUploadDialogOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 'none',
              borderRadius: '8px',
              backgroundColor: '#FF385C',
              '&:hover': {
                backgroundColor: '#D90B3E',
                boxShadow: 'none',
              },
            }}
          >
            Upload New
          </Button>
        )}
      </Box>

      {mapList.length === 0 ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          color: '#717171',
          bgcolor: '#f7f7f7',
          borderRadius: 2,
          border: '1px dashed #dddddd'
        }}>
          <MapIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
          <Typography variant="body1">{emptyMessage}</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {mapList.map((map) => {
            const normalizedId = String(map._id);
            const isVisible = map.type === 'earthquake'
              ? visibleEarthquakeDatasets.some(id => String(id) === normalizedId)
              : visibleMaps.some(id => String(id) === normalizedId);

            return (
              <ListItem
                key={`${map.type}-${map._id}`}
                sx={{
                  mb: 2,
                  bgcolor: '#ffffff',
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: '#b0b0b0',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {map.name}
                        </Typography>
                        <Chip
                          label={(map.fileType || 'GEOJSON').toUpperCase()}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            bgcolor: '#f1f1f1',
                            color: '#717171'
                          }}
                        />
                        {map.type === 'earthquake' && (
                          <Chip
                            label="EARTHQUAKE"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              bgcolor: '#e3f2fd',
                              color: '#1976d2'
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {new Date(map.createdAt).toLocaleDateString()} • {map.featureCount} features
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        checked={isVisible}
                        onChange={() => {
                          if (map.type === 'earthquake') {
                            if (onToggleEarthquake) onToggleEarthquake(map._id);
                          } else {
                            if (onToggleMap) onToggleMap(map._id);
                          }
                        }}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#ff4081',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 64, 129, 0.08)',
                            },
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#ff4081',
                          },
                          '& .MuiSwitch-track': {
                            backgroundColor: '#9e9e9e',
                          },
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(map)}
                        sx={{ color: '#717171', '&:hover': { color: '#d32f2f', bgcolor: '#ffebee' } }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  {map.description && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: '0.85rem'
                    }}>
                      {map.description}
                    </Typography>
                  )}
                </Box>
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            onClose();
          } else {
            onClose();
          }
        }}
        maxWidth="md"
        fullWidth
        sx={{ zIndex: 1400 }}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
            height: '600px',
            display: 'flex',
            flexDirection: 'column',
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '1px solid #ebebeb',
          pb: 0,
          pt: 2.5,
          px: 3,
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem' }}>Danger Maps</Typography>
            <IconButton
              onClick={onClose}
              size="small"
              sx={{
                color: '#222222',
                '&:hover': { backgroundColor: '#f7f7f7' }
              }}
            >
              <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="presentation" focusable="false" style={{ display: 'block', fill: 'none', height: '16px', width: '16px', stroke: 'currentcolor', strokeWidth: 3, overflow: 'visible' }}>
                <path d="m6 6 20 20"></path>
                <path d="m26 6-20 20"></path>
              </svg>
            </IconButton>
          </Box>
          <Tabs
            value={tabValue}
            onChange={(e, v) => setTabValue(v)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                minHeight: '48px',
                color: '#717171',
                '&.Mui-selected': {
                  color: '#222222',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#222222',
                height: '2px',
              },
            }}
          >
            <Tab label="My Maps" icon={<MapIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" />
            <Tab label="Generated" icon={<AutoAwesomeIcon sx={{ fontSize: 18, mr: 1 }} />} iconPosition="start" />
          </Tabs>
        </DialogTitle>

        <DialogContent sx={{ p: 0, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {error && (
            <Alert severity="error" sx={{ m: 2, borderRadius: '8px' }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ m: 2, borderRadius: '8px' }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* Tab 0: My Maps */}
          {tabValue === 0 && renderMapList(uploadedMaps, "No maps uploaded yet.")}

          {/* Tab 1: AI Generated */}
          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {renderMapList(aiGeneratedMaps, "No AI generated maps yet. Go to the Earthquakes page to generate new maps.")}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: 1500 }}
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Upload Hazard Map File(s)</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Map Name (optional)"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              margin="normal"
              disabled={uploading}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              disabled={uploading}
              variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            />
            <input
              type="file"
              accept=".geojson,.json,.kmz,.kml"
              onChange={handleFileSelect}
              multiple
              style={{ display: 'none' }}
              id="danger-map-upload-input"
              disabled={uploading}
            />
            <label htmlFor="danger-map-upload-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadFileIcon />}
                fullWidth
                sx={{
                  mt: 2,
                  height: '56px',
                  borderRadius: '8px',
                  borderStyle: 'dashed',
                  borderWidth: '2px',
                  textTransform: 'none',
                  fontWeight: 600
                }}
                disabled={uploading}
              >
                {uploadFiles.length === 0
                  ? 'Choose File(s) (GeoJSON, KMZ, KML)'
                  : uploadFiles.length === 1
                    ? uploadFiles[0].name
                    : `${uploadFiles.length} files selected`}
              </Button>
            </label>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => setUploadDialogOpen(false)}
            disabled={uploading}
            sx={{ color: '#222222', fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploadFiles.length === 0 || uploading}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              backgroundColor: '#FF385C',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              '&:hover': { backgroundColor: '#D90B3E' }
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            zIndex: 1400 // Higher than main dialog (1300)
          }
        }}
        sx={{ zIndex: 1400 }} // Ensure backdrop is also higher
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the hazard map "{mapToDelete?.name}"?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ color: '#222222', fontWeight: 600, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DangerMapDialog;

// Force rebuild: v2.3 - Title Update


