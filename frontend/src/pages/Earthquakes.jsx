import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Switch,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CardMedia,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MapIcon from '@mui/icons-material/Map';
import { earthquakesAPI, dangerMapsAPI } from '../services/api';
import logger from '../utils/logger';
import { useNavigate } from 'react-router-dom';

// Placeholder images for map types
const MAP_PLACEHOLDERS = {
  hazard: '/images/hazard-map.png',
  infrastructure: '/images/infrastructure-map.png',
  distribution: '/images/distribution-map.png',
};

const Earthquakes = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState(null);
  const [visibleDatasets, setVisibleDatasets] = useState([]); // For earthquakes
  const [visibleDangerMaps, setVisibleDangerMaps] = useState([]); // For danger maps
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Chat state
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hello! I can analyze your uploaded earthquake data to create intelligent hazard maps. Upload your GeoJSON data, then ask me to identify high-risk zones, earthquake clusters, or seismic patterns.' }
  ]);
  const chatEndRef = useRef(null);
  const [lastGeneratedMapId, setLastGeneratedMapId] = useState(null);
  const navigate = useNavigate();

  const suggestedMaps = [
    {
      id: 'hazard',
      title: 'Seismic Hazard Map',
      description: 'Analyze my earthquake data to show high-risk zones.',
      prompt: 'Analyze my uploaded earthquake data and create a seismic hazard map showing high-risk zones based on earthquake density and magnitude.',
      image: MAP_PLACEHOLDERS.hazard
    },
    {
      id: 'infrastructure',
      title: 'Critical Infrastructure Risk',
      description: 'Identify areas where my earthquake data shows high seismic activity.',
      prompt: 'Based on my earthquake data, identify and map high-risk zones that could affect critical infrastructure.',
      image: MAP_PLACEHOLDERS.infrastructure
    },
    {
      id: 'distribution',
      title: 'Earthquake Cluster Analysis',
      description: 'Find earthquake clusters and patterns in my uploaded data.',
      prompt: 'Analyze my earthquake data to identify clusters of seismic activity and create hazard zones around high-density areas.',
      image: MAP_PLACEHOLDERS.distribution
    }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Normalize ID to string for consistent comparison
  const normalizeId = (id) => {
    if (!id) return null;
    return String(id);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    // Add a temporary "thinking" message
    setChatHistory(prev => [...prev, { role: 'assistant', content: 'Generating your map... This may take a moment.', isThinking: true }]);

    try {
      // Collect context from visible datasets (with safety checks)
      const visibleEarthquakes = Array.isArray(datasets) ? datasets.filter(d =>
        d && d.type === 'earthquake' && visibleDatasets.map(id => normalizeId(id)).includes(normalizeId(d._id))
      ) : [];
      const visibleDanger = Array.isArray(datasets) ? datasets.filter(d =>
        d && d.type === 'dangerMap' && visibleDangerMaps.map(id => normalizeId(id)).includes(normalizeId(d._id))
      ) : [];

      let contextPrompt = userMsg;
      if (visibleEarthquakes.length > 0 || visibleDanger.length > 0) {
        const contextParts = [];
        if (visibleEarthquakes.length > 0) {
          contextParts.push(`Visible Earthquake Data: ${visibleEarthquakes.map(d => d.name).join(', ')}`);
        }
        if (visibleDanger.length > 0) {
          contextParts.push(`Visible Danger Maps: ${visibleDanger.map(d => d.name).join(', ')}`);
        }
        contextPrompt += `\n\n[Context: The user is currently viewing the following maps: ${contextParts.join('; ')}. Use this context if relevant to the request.]`;
      }

      const response = await dangerMapsAPI.generate(
        contextPrompt,
        `AI Generated: ${userMsg.substring(0, 30)}...`,
        `Generated from prompt: ${userMsg}`
      );

      if (response.data && response.data.success && response.data.data) {
        const generatedDataset = response.data.data;
        const datasetId = generatedDataset._id || generatedDataset.id;

        // Add to visible danger maps automatically
        setVisibleDangerMaps(prevVisible => {
          const normalizedVisible = prevVisible.map(id => normalizeId(id));
          const normalizedId = normalizeId(datasetId);

          if (!normalizedVisible.includes(normalizedId)) {
            const newVisible = [...normalizedVisible, normalizedId];
            try {
              localStorage.setItem('dangerMapVisibleMaps', JSON.stringify(newVisible));
            } catch (err) {
              logger.error('Error saving visibility state:', err);
            }
            return newVisible;
          }
          return prevVisible;
        });

        // Reload datasets to include the new one
        await loadDatasets(true);

        // Store the generated map ID
        setLastGeneratedMapId(datasetId);

        // Update chat with success message from backend
        const backendMessage = response.data?.message || 'Map generated successfully';
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: `✅ ${backendMessage}! It has been added to your dashboard map. Click "View on Dashboard" to see it.`
        }]);

        setSuccess(backendMessage);
      } else {
        throw new Error(response.data?.message || 'Failed to generate map');
      }
    } catch (error) {
      logger.error('Error generating map:', error);
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error generating map: ${error.response?.data?.message || error.message || 'Unknown error'}. Please try again.`
      }]);
      setError(error.response?.data?.message || 'Failed to generate map');
    }
  };

  const handleSuggestionClick = (prompt) => {
    setChatMessage(prompt);
    // Optional: auto-focus the input
    document.getElementById('chat-input')?.focus();
  };

  useEffect(() => {
    // Load visibility state first (synchronous), then datasets (async)
    loadVisibilityState();
    // Load datasets after a small delay to ensure visibility state is set first
    const timer = setTimeout(() => {
      loadDatasets().then(() => {
        // Mark initial load as complete after datasets are loaded
        setIsInitialLoad(false);
      });
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Sync visibility state when datasets change (to ensure IDs match)
  // This only runs AFTER initial load to clean up invalid IDs
  useEffect(() => {
    // Skip on initial load - let loadDatasets handle the initial sync
    if (isInitialLoad) {
      return;
    }

    if (datasets.length > 0) {
      // Only sync if we have datasets
      try {
        // Sync Earthquakes
        const storedEarthquakes = localStorage.getItem('earthquakeVisibleDatasets');
        if (storedEarthquakes) {
          const storedIds = JSON.parse(storedEarthquakes);
          const normalizedStored = storedIds.map(id => normalizeId(id)).filter(id => id !== null);
          const validIds = normalizedStored.filter(storedId =>
            datasets.some(dataset => {
              if (dataset.type !== 'earthquake') return false;
              const datasetId = normalizeId(dataset._id);
              return datasetId === storedId || String(datasetId) === String(storedId);
            })
          );
          if (validIds.length !== normalizedStored.length) {
            const normalizedValidIds = validIds.map(id => normalizeId(id)).filter(id => id !== null);
            setVisibleDatasets(prevVisible => {
              const prevNormalized = prevVisible.map(id => normalizeId(id));
              if (JSON.stringify(normalizedValidIds.sort()) !== JSON.stringify(prevNormalized.sort())) {
                localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(normalizedValidIds));
                return normalizedValidIds;
              }
              return prevVisible;
            });
          }
        }

        // Sync Danger Maps
        const storedDangerMaps = localStorage.getItem('dangerMapVisibleMaps');
        if (storedDangerMaps) {
          const storedIds = JSON.parse(storedDangerMaps);
          const normalizedStored = storedIds.map(id => normalizeId(id)).filter(id => id !== null);
          const validIds = normalizedStored.filter(storedId =>
            datasets.some(dataset => {
              if (dataset.type !== 'dangerMap') return false;
              const datasetId = normalizeId(dataset._id);
              return datasetId === storedId || String(datasetId) === String(storedId);
            })
          );
          if (validIds.length !== normalizedStored.length) {
            const normalizedValidIds = validIds.map(id => normalizeId(id)).filter(id => id !== null);
            setVisibleDangerMaps(prevVisible => {
              const prevNormalized = prevVisible.map(id => normalizeId(id));
              if (JSON.stringify(normalizedValidIds.sort()) !== JSON.stringify(prevNormalized.sort())) {
                localStorage.setItem('dangerMapVisibleMaps', JSON.stringify(normalizedValidIds));
                return normalizedValidIds;
              }
              return prevVisible;
            });
          }
        }

      } catch (err) {
        logger.error('Error syncing visibility state with datasets:', err);
      }
    }
  }, [datasets, isInitialLoad]);



  // Load visibility state from localStorage
  const loadVisibilityState = () => {
    try {
      // Load Earthquakes
      const storedEarthquakes = localStorage.getItem('earthquakeVisibleDatasets');
      if (storedEarthquakes) {
        const ids = JSON.parse(storedEarthquakes);
        const normalizedIds = ids.map(id => normalizeId(id)).filter(id => id !== null);
        setVisibleDatasets(normalizedIds);
      }

      // Load Danger Maps
      const storedDangerMaps = localStorage.getItem('dangerMapVisibleMaps');
      if (storedDangerMaps) {
        const ids = JSON.parse(storedDangerMaps);
        const normalizedIds = ids.map(id => normalizeId(id)).filter(id => id !== null);
        setVisibleDangerMaps(normalizedIds);
      }
    } catch (err) {
      logger.error('Error loading visibility state:', err);
    }
  };

  const loadDatasets = async (skipCache = false) => {
    try {
      setLoading(true);
      setError('');

      // Fetch both Earthquakes and Danger Maps
      const [earthquakesRes, dangerMapsRes] = await Promise.all([
        earthquakesAPI.getAll(undefined, skipCache).catch(err => ({ data: { data: [] } })),
        dangerMapsAPI.getAll(undefined, skipCache).catch(err => ({ data: { data: [] } }))
      ]);

      const earthquakeData = (earthquakesRes.data?.data || []).map(d => ({ ...d, type: 'earthquake' }));
      const dangerMapData = (dangerMapsRes.data?.data || []).map(d => ({ ...d, type: 'dangerMap' }));

      const allDatasets = [...earthquakeData, ...dangerMapData];
      setDatasets(allDatasets);

      // Sync visibility state after loading
      try {
        // Sync Earthquakes
        const storedEarthquakes = localStorage.getItem('earthquakeVisibleDatasets');
        if (storedEarthquakes) {
          const currentVisible = JSON.parse(storedEarthquakes);
          const normalizedStored = currentVisible.map(id => normalizeId(id)).filter(id => id !== null);
          const validIds = normalizedStored.filter(storedId =>
            earthquakeData.some(dataset => {
              const datasetId = normalizeId(dataset._id);
              return datasetId === storedId || String(datasetId) === String(storedId);
            })
          );
          const normalizedValidIds = validIds.map(id => normalizeId(id)).filter(id => id !== null);
          setVisibleDatasets(prevVisible => {
            const prevNormalized = prevVisible.map(id => normalizeId(id));
            if (JSON.stringify(normalizedValidIds.sort()) !== JSON.stringify(prevNormalized.sort())) {
              if (validIds.length !== normalizedStored.length) {
                localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(normalizedValidIds));
              }
              return normalizedValidIds;
            }
            return prevVisible;
          });
        } else {
          setVisibleDatasets([]);
        }

        // Sync Danger Maps
        const storedDangerMaps = localStorage.getItem('dangerMapVisibleMaps');
        if (storedDangerMaps) {
          const currentVisible = JSON.parse(storedDangerMaps);
          const normalizedStored = currentVisible.map(id => normalizeId(id)).filter(id => id !== null);
          const validIds = normalizedStored.filter(storedId =>
            dangerMapData.some(dataset => {
              const datasetId = normalizeId(dataset._id);
              return datasetId === storedId || String(datasetId) === String(storedId);
            })
          );
          const normalizedValidIds = validIds.map(id => normalizeId(id)).filter(id => id !== null);
          setVisibleDangerMaps(prevVisible => {
            const prevNormalized = prevVisible.map(id => normalizeId(id));
            if (JSON.stringify(normalizedValidIds.sort()) !== JSON.stringify(prevNormalized.sort())) {
              if (validIds.length !== normalizedStored.length) {
                localStorage.setItem('dangerMapVisibleMaps', JSON.stringify(normalizedValidIds));
              }
              return normalizedValidIds;
            }
            return prevVisible;
          });
        } else {
          setVisibleDangerMaps([]);
        }

      } catch (storageErr) {
        logger.error('Error syncing visibility state:', storageErr);
      }
    } catch (err) {
      logger.error('Error loading datasets:', err);
      setError(err.response?.data?.message || 'Failed to load datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid file(s): ${invalidFiles.join(', ')}. Only GeoJSON files (.geojson or .json) are allowed.`);
      if (validFiles.length === 0) {
        return;
      }
    }

    if (validFiles.length > 0) {
      setUploadFiles(validFiles);
      setError('');
      // Auto-fill name from first filename if not set and only one file
      if (!uploadName && validFiles.length === 1) {
        setUploadName(validFiles[0].name.replace(/\.(geojson|json)$/i, ''));
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
      // Always upload to Earthquakes API from this page
      const response = await earthquakesAPI.upload(uploadFiles, uploadName || undefined, uploadDescription || undefined);

      logger.log('Upload response:', response.data);

      if (!response.data || !response.data.success || !response.data.data) {
        throw new Error(response.data?.message || 'Upload failed: Invalid response from server');
      }

      let uploadedIds = [];
      if (Array.isArray(response.data.data)) {
        uploadedIds = response.data.data
          .map(d => normalizeId(d._id || d.id))
          .filter(id => id !== null);
      } else if (response.data.data) {
        const id = response.data.data._id || response.data.data.id;
        const normalizedId = normalizeId(id);
        if (normalizedId) {
          uploadedIds = [normalizedId];
        }
      }

      // Add uploaded IDs to visibility state
      setVisibleDatasets(prevVisible => {
        const normalizedVisible = prevVisible.map(id => normalizeId(id));
        const newVisible = [...normalizedVisible, ...uploadedIds.filter(id => id && !normalizedVisible.includes(id))];
        const normalizedNewVisible = newVisible.map(id => normalizeId(id)).filter(id => id !== null);

        try {
          localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(normalizedNewVisible));
        } catch (err) {
          logger.error('Error saving visibility state after upload:', err);
        }

        return normalizedNewVisible;
      });

      await loadDatasets(true);

      const fileCount = uploadFiles.length;
      const successCount = Array.isArray(response.data.data) ? response.data.data.length : 1;
      const errorCount = response.data.errors ? response.data.errors.length : 0;

      if (errorCount > 0) {
        setSuccess(`${successCount} file(s) uploaded successfully. ${errorCount} file(s) failed.`);
      } else {
        setSuccess(fileCount === 1
          ? 'GeoJSON file uploaded successfully!'
          : `${successCount} GeoJSON files uploaded successfully!`);

        // Automatically toggle on the new datasets
        if (response.data.data) {
          const newDatasets = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
          const newIds = newDatasets.map(d => normalizeId(d._id)).filter(id => id !== null);

          setVisibleDatasets(prevVisible => {
            const normalizedVisible = prevVisible.map(id => normalizeId(id));
            // Add new IDs that aren't already visible
            const uniqueNewIds = newIds.filter(id => !normalizedVisible.includes(id));
            if (uniqueNewIds.length === 0) return prevVisible;

            const newVisible = [...normalizedVisible, ...uniqueNewIds];
            try {
              localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(newVisible));
            } catch (err) {
              logger.error('Error saving visibility state after upload:', err);
            }
            return newVisible;
          });
        }
      }

      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadName('');
      setUploadDescription('');
      const fileInput = document.getElementById('geojson-upload-input');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      logger.error('Error uploading GeoJSON:', err);
      setError(err.response?.data?.message || 'Failed to upload GeoJSON file(s)');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleDataset = (dataset) => {
    const datasetId = dataset._id;
    const type = dataset.type;
    const normalizedId = normalizeId(datasetId);

    if (!normalizedId) {
      logger.error('Cannot toggle dataset: invalid ID', datasetId);
      return;
    }

    if (type === 'earthquake') {
      setVisibleDatasets(prevVisible => {
        const normalizedVisible = prevVisible.map(id => normalizeId(id));
        const isCurrentlyVisible = normalizedVisible.includes(normalizedId);
        const newVisible = isCurrentlyVisible
          ? normalizedVisible.filter(id => id !== normalizedId)
          : [...normalizedVisible, normalizedId];

        const normalizedNewVisible = newVisible.map(id => normalizeId(id)).filter(id => id !== null);
        try {
          localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(normalizedNewVisible));
        } catch (err) {
          logger.error('Error saving visibility state:', err);
        }
        return normalizedNewVisible;
      });
    } else if (type === 'dangerMap') {
      setVisibleDangerMaps(prevVisible => {
        const normalizedVisible = prevVisible.map(id => normalizeId(id));
        const isCurrentlyVisible = normalizedVisible.includes(normalizedId);
        const newVisible = isCurrentlyVisible
          ? normalizedVisible.filter(id => id !== normalizedId)
          : [...normalizedVisible, normalizedId];

        const normalizedNewVisible = newVisible.map(id => normalizeId(id)).filter(id => id !== null);
        try {
          localStorage.setItem('dangerMapVisibleMaps', JSON.stringify(normalizedNewVisible));
        } catch (err) {
          logger.error('Error saving visibility state:', err);
        }
        return normalizedNewVisible;
      });
    }
  };

  const handleDeleteClick = (dataset) => {
    setDatasetToDelete(dataset);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!datasetToDelete) return;

    try {
      setError('');
      const deletedId = normalizeId(datasetToDelete._id);
      const type = datasetToDelete.type;

      if (type === 'earthquake') {
        setVisibleDatasets(prevVisible => {
          const normalizedVisible = prevVisible.map(id => normalizeId(id));
          const newVisible = normalizedVisible.filter(id => id !== deletedId);
          const normalizedNewVisible = newVisible.map(id => normalizeId(id)).filter(id => id !== null);
          try {
            localStorage.setItem('earthquakeVisibleDatasets', JSON.stringify(normalizedNewVisible));
          } catch (err) {
            logger.error('Error saving visibility state after delete:', err);
          }
          return normalizedNewVisible;
        });
        await earthquakesAPI.delete(datasetToDelete._id);
      } else if (type === 'dangerMap') {
        setVisibleDangerMaps(prevVisible => {
          const normalizedVisible = prevVisible.map(id => normalizeId(id));
          const newVisible = normalizedVisible.filter(id => id !== deletedId);
          const normalizedNewVisible = newVisible.map(id => normalizeId(id)).filter(id => id !== null);
          try {
            localStorage.setItem('dangerMapVisibleMaps', JSON.stringify(normalizedNewVisible));
          } catch (err) {
            logger.error('Error saving visibility state after delete:', err);
          }
          return normalizedNewVisible;
        });
        await dangerMapsAPI.delete(datasetToDelete._id);
      }

      await loadDatasets(true);

      setDeleteConfirmOpen(false);
      setDatasetToDelete(null);
      setSuccess('Dataset deleted successfully');
    } catch (err) {
      logger.error('Error deleting dataset:', err);
      setError(err.response?.data?.message || 'Failed to delete dataset');
    }
  };

  // Get geometry types from dataset
  const getGeometryTypes = (dataset) => {
    if (!dataset.geojsonData || !dataset.geojsonData.features) return [];
    const types = new Set();
    dataset.geojsonData.features.forEach(feature => {
      if (feature.geometry && feature.geometry.type) {
        types.add(feature.geometry.type);
      }
    });
    return Array.from(types);
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Earthquake Map Assistant
      </Typography>

      {/* Chat Interface */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{
          height: '300px',
          overflowY: 'auto',
          p: 2,
          bgcolor: '#f5f5f5',
          borderRadius: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          {chatHistory.map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                bgcolor: msg.role === 'user' ? 'primary.main' : 'white',
                color: msg.role === 'user' ? 'white' : 'text.primary',
                p: 1.5,
                borderRadius: 2,
                boxShadow: 1
              }}
            >
              <Typography variant="body1">{msg.content}</Typography>
            </Box>
          ))}
          {lastGeneratedMapId && (
            <Box sx={{ alignSelf: 'flex-start', mt: 1 }}>
              <Button
                variant="contained"
                color="success"
                startIcon={<MapIcon />}
                onClick={() => navigate('/')}
                size="small"
              >
                View on Dashboard
              </Button>
            </Box>
          )}
          <div ref={chatEndRef} />
        </Box>

        <Box component="form" onSubmit={handleChatSubmit} sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Upload GeoJSON">
            <IconButton
              onClick={() => setUploadDialogOpen(true)}
              sx={{
                bgcolor: '#f5f5f5',
                borderRadius: 1,
                '&:hover': { bgcolor: '#e0e0e0' }
              }}
            >
              <UploadFileIcon />
            </IconButton>
          </Tooltip>
          <TextField
            id="chat-input"
            fullWidth
            placeholder="e.g., Analyze my earthquake data and show high-risk zones..."
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            variant="outlined"
            size="medium"
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            endIcon={<SendIcon />}
            disabled={!chatMessage.trim()}
          >
            Send
          </Button>
        </Box>
      </Paper>

      {/* Suggested Maps (Accordions) */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Suggested Maps</Typography>
        {suggestedMaps.map((map) => (
          <Accordion key={map.id} disableGutters sx={{ mb: 1, border: '1px solid #e0e0e0', borderRadius: '4px !important', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 'bold' }}>{map.title}</Typography>
            </AccordionSummary>
            <AccordionDetails onClick={() => handleSuggestionClick(map.prompt)} sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f9f9f9' } }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: 'center' }}>
                <CardMedia
                  component="img"
                  sx={{ width: { xs: '100%', md: 300 }, height: 150, borderRadius: 1, objectFit: 'cover' }}
                  image={map.image}
                  alt={map.title}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium' }}>
                    {map.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', bgcolor: '#f0f0f0', p: 1, borderRadius: 1 }}>
                    "{map.prompt}"
                  </Typography>
                  <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 1 }}>
                    Click to use this prompt
                  </Typography>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Uploaded Datasets
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload GeoJSON
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
          </Box>
        ) : datasets.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No datasets uploaded yet. Click "Upload GeoJSON" to get started.
          </Typography>
        ) : (
          <List>
            {datasets.filter(d => !d.isAiGenerated).map((dataset) => {
              const geometryTypes = getGeometryTypes(dataset);
              const isVisible = dataset.type === 'earthquake'
                ? visibleDatasets.map(id => normalizeId(id)).includes(normalizeId(dataset._id))
                : visibleDangerMaps.map(id => normalizeId(id)).includes(normalizeId(dataset._id));

              return (
                <ListItem
                  key={`${dataset.type}-${dataset._id}`}
                  secondaryAction={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Switch
                        edge="end"
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleDataset(dataset);
                        }}
                        checked={isVisible}
                        inputProps={{ 'aria-labelledby': `switch-list-label-${dataset._id}` }}
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
                      <Tooltip title="Delete Dataset">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDeleteClick(dataset)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1">{dataset.name}</Typography>
                        <Chip
                          label={dataset.type === 'earthquake' ? 'EARTHQUAKE' : 'DANGER MAP'}
                          size="small"
                          color={dataset.type === 'earthquake' ? 'primary' : 'error'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                        {geometryTypes.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {geometryTypes.map(type => (
                              <Chip key={type} label={type} size="small" variant="outlined" />
                            ))}
                          </Box>
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Features: {dataset.featureCount} | Uploaded: {new Date(dataset.createdAt).toLocaleDateString()}
                        </Typography>
                        {dataset.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {dataset.description}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          if (!uploading) {
            setUploadDialogOpen(false);
            setUploadFiles([]);
            setUploadName('');
            setUploadDescription('');
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload GeoJSON</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
              fullWidth
              sx={{ height: 100, borderStyle: 'dashed' }}
            >
              {uploadFiles.length > 0
                ? `${uploadFiles.length} file(s) selected`
                : 'Select GeoJSON File(s)'}
              <input
                id="geojson-upload-input"
                type="file"
                hidden
                accept=".geojson,.json"
                multiple
                onChange={handleFileSelect}
              />
            </Button>

            {uploadFiles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>Selected Files:</Typography>
                <List dense>
                  {uploadFiles.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(1)} KB`} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <TextField
              label="Name (Optional)"
              placeholder="e.g., San Andreas Fault"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              fullWidth
              helperText="If uploading multiple files, this will be used as a prefix"
            />

            <TextField
              label="Description (Optional)"
              placeholder="Brief description of the dataset"
              value={uploadDescription}
              onChange={(e) => setUploadDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setUploadFiles([]);
              setUploadName('');
              setUploadDescription('');
            }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={uploadFiles.length === 0 || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Dataset</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{datasetToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Earthquakes;
