import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, Polygon, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../../context/GoogleMapsContext';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    Alert,
    TextField,
    Grid,
    Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';

const containerStyle = {
    width: '100%',
    height: '500px',
};

const defaultCenter = {
    lat: -17.8,
    lng: 178.0,
};



const ParcelPolygonDrawer = ({ open, onClose, onSave, initialParcelData = {} }) => {
    const { isLoaded, loadError } = useGoogleMaps();

    const [mapReady, setMapReady] = useState(false);
    const [parcelData, setParcelData] = useState(initialParcelData);
    const [points, setPoints] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const mapRef = useRef(null);

    const polygonPath = points.map(p => ({ lat: p.lat, lng: p.lng }));

    const handleStartDrawing = () => {
        setIsDrawing(true);
        setPoints([]);
    };

    const handleFinishDrawing = () => {
        setIsDrawing(false);
        // Calculate area using geometry library if available
        if (window.google && window.google.maps && window.google.maps.geometry) {
            const path = points.map(p => new window.google.maps.LatLng(p.lat, p.lng));
            const areaSqMeters = window.google.maps.geometry.spherical.computeArea(path);
            const areaHa = (areaSqMeters / 10000).toFixed(4);
            setParcelData(prev => ({ ...prev, areaHa }));
        }
    };

    const handleUndoPoint = () => {
        setPoints(prev => prev.slice(0, -1));
    };

    const handleMapClick = (e) => {
        if (!isDrawing) return;
        const newPoint = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng()
        };
        setPoints(prev => [...prev, newPoint]);
    };

    const handleClearPolygon = () => {
        setPoints([]);
        setIsDrawing(false);
        setParcelData(prev => ({ ...prev, areaHa: '' }));
    };

    const handleClose = () => {
        onClose();
    };

    const handleSave = () => {
        onSave({ ...parcelData, points });
        onClose();
    };

    useEffect(() => {
        // Check if google is already available
        if (window.google && window.google.maps) {
            setMapReady(true);
            return;
        }

        // If not, wait for it with a polling interval
        // This handles cases where isLoaded is true but the global isn't quite ready
        const interval = setInterval(() => {
            if (window.google && window.google.maps) {
                setMapReady(true);
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [isLoaded]);

    // Debug logging
    console.log('ParcelPolygonDrawer render:', { isLoaded, mapReady, hasGoogle: !!window.google });

    if (loadError) {
        return <Alert severity="error">Error loading Google Maps</Alert>;
    }

    // Ultra-safe check: Ensure both our state AND the global are ready
    if (!isLoaded || !mapReady || typeof window.google === 'undefined' || !window.google.maps) {
        return <Box sx={{ p: 3, textAlign: 'center' }}>Loading Map... (Status: {isLoaded ? 'Loaded' : 'Loading'}, Ready: {mapReady ? 'Yes' : 'No'})</Box>;
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '12px', height: '85vh' }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">Draw Parcel Polygon</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Click on the map to add points, then click "Finish Drawing" to complete the polygon
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Parcel Name *"
                                placeholder="e.g., LumiLumitabua (Part Of)"
                                value={parcelData.name}
                                onChange={(e) => setParcelData({ ...parcelData, name: e.target.value })}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="TLTB Ref"
                                placeholder="e.g., 4/1242466"
                                value={parcelData.tltbRef}
                                onChange={(e) => setParcelData({ ...parcelData, tltbRef: e.target.value })}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="Tikina *"
                                placeholder="e.g., Namosi"
                                value={parcelData.tikina}
                                onChange={(e) => setParcelData({ ...parcelData, tikina: e.target.value })}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="Province *"
                                placeholder="e.g., Namosi"
                                value={parcelData.province}
                                onChange={(e) => setParcelData({ ...parcelData, province: e.target.value })}
                                required
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Area (Ha)"
                                value={parcelData.areaHa}
                                InputProps={{ readOnly: true }}
                                InputLabelProps={{ shrink: true }}
                                size="small"
                                helperText="Auto-calculated"
                            />
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        {!isDrawing && points.length === 0 && (
                            <Button
                                variant="contained"
                                onClick={handleStartDrawing}
                                size="small"
                            >
                                Start Drawing
                            </Button>
                        )}
                        {isDrawing && (
                            <>
                                <Chip
                                    label={`${points.length} points added`}
                                    color="primary"
                                    size="small"
                                />
                                <Button
                                    variant="outlined"
                                    startIcon={<UndoIcon />}
                                    onClick={handleUndoPoint}
                                    disabled={points.length === 0}
                                    size="small"
                                >
                                    Undo Point
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={handleFinishDrawing}
                                    disabled={points.length < 3}
                                    size="small"
                                >
                                    Finish Drawing
                                </Button>
                            </>
                        )}
                        {!isDrawing && points.length >= 3 && (
                            <Alert severity="success" sx={{ flexGrow: 1 }}>
                                Polygon complete! Area: {parcelData.areaHa} hectares ({points.length} points)
                            </Alert>
                        )}
                    </Box>
                </Box>

                <Box sx={{ flexGrow: 1, position: 'relative' }}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={defaultCenter}
                        zoom={10}
                        options={{
                            mapTypeId: 'satellite',
                            mapTypeControl: true,
                            streetViewControl: false,
                        }}
                        onClick={handleMapClick}
                        onLoad={(map) => {
                            mapRef.current = map;
                        }}
                    >
                        {/* Render markers for each point */}
                        {points.map((point, index) => (
                            <Marker
                                key={index}
                                position={point}
                                label={{
                                    text: `${index + 1}`,
                                    color: 'white',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            />
                        ))}

                        {/* Render polygon if we have enough points */}
                        {polygonPath.length >= 3 && (
                            <Polygon
                                paths={polygonPath}
                                options={{
                                    fillColor: '#00A86B',
                                    fillOpacity: 0.3,
                                    strokeWeight: 2,
                                    strokeColor: '#00A86B',
                                    clickable: false,
                                    zIndex: 1,
                                }}
                            />
                        )}
                    </GoogleMap>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
                {points.length > 0 && (
                    <Button
                        startIcon={<DeleteIcon />}
                        onClick={handleClearPolygon}
                        color="error"
                        sx={{ mr: 'auto' }}
                    >
                        Clear Polygon
                    </Button>
                )}
                <Button onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={points.length < 3 || isDrawing}
                >
                    Save Parcel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ParcelPolygonDrawer;
