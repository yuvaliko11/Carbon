import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  IconButton,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import UploadIcon from '@mui/icons-material/Upload';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import { earthquakesAPI } from '../../services/api';
import logger from '../../utils/logger';

const EarthquakePanel = ({ open, onClose, onDatasetsChange, visibleDatasets, onToggleDataset }) => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');

  useEffect(() => {
    if (open) {
      loadDatasets();
    }
  }, [open]);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await earthquakesAPI.getAll();
      setDatasets(response.data.data || []);
      if (onDatasetsChange) {
        onDatasetsChange(response.data.data || []);
      }
    } catch (err) {
      logger.error('Error loading earthquake datasets:', err);
      setError(err.response?.data?.message || 'Failed to load earthquake datasets');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.geojson') && !fileName.endsWith('.json')) {
        setError('Please select a GeoJSON file (.geojson or .json)');
        return;
      }
      setUploadFile(file);
      // Auto-fill name from filename if not set
      if (!uploadName) {
        setUploadName(file.name.replace(/\.(geojson|json)$/i, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const response = await earthquakesAPI.upload(uploadFile, uploadName || undefined, uploadDescription || undefined);
      
      logger.log('Upload response:', response.data);
      
      // Reload datasets
      await loadDatasets();
      
      // Auto-enable the uploaded dataset
      if (response.data.data._id) {
        onToggleDataset(response.data.data._id, true);
      }
      
      // Close upload dialog and reset form
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadName('');
      setUploadDescription('');
    } catch (err) {
      logger.error('Error uploading earthquake data:', err);
      setError(err.response?.data?.message || 'Failed to upload earthquake data');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this earthquake dataset?')) {
      return;
    }

    try {
      await earthquakesAPI.delete(id);
      // Reload datasets
      await loadDatasets();
      // Remove from visible datasets if it was visible
      if (visibleDatasets.includes(id)) {
        onToggleDataset(id, false);
      }
    } catch (err) {
      logger.error('Error deleting earthquake dataset:', err);
      setError(err.response?.data?.message || 'Failed to delete earthquake dataset');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 400 },
            padding: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Earthquake Datasets</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
          fullWidth
          sx={{ mb: 2 }}
        >
          Upload GeoJSON
        </Button>

        <Divider sx={{ my: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : datasets.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', p: 3 }}>
            No earthquake datasets uploaded yet. Click "Upload GeoJSON" to add one.
          </Typography>
        ) : (
          <List>
            {datasets.map((dataset) => (
              <ListItem key={dataset._id} divider>
                <ListItemText
                  primary={dataset.name}
                  secondary={
                    <Box>
                      <Typography variant="caption" display="block">
                        {dataset.featureCount} features
                      </Typography>
                      <Typography variant="caption" display="block" color="text.secondary">
                        Uploaded: {formatDate(dataset.createdAt)}
                      </Typography>
                      {dataset.description && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          {dataset.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={visibleDatasets.includes(dataset._id)}
                      onChange={(e) => onToggleDataset(dataset._id, e.target.checked)}
                      size="small"
                    />
                    <IconButton
                      edge="end"
                      onClick={() => handleDelete(dataset._id)}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        )}
      </Drawer>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Earthquake GeoJSON</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Dataset Name"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            margin="normal"
            helperText="Optional - will use filename if not provided"
          />
          <TextField
            fullWidth
            label="Description"
            value={uploadDescription}
            onChange={(e) => setUploadDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            helperText="Optional description for this dataset"
          />
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />}>
              Select GeoJSON File
              <input
                type="file"
                hidden
                accept=".geojson,.json"
                onChange={handleFileSelect}
              />
            </Button>
            {uploadFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!uploadFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EarthquakePanel;

