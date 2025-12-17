import React, { useState, useEffect } from 'react';
import { parcelsAPI, landUnitsAPI } from '../services/api';
import {
    Box,
    Container,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    IconButton,
    useTheme
} from '@mui/material';
import {
    Add as AddIcon,
    Map as MapIcon,
    Straighten as RulerIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const ParcelsPage = () => {
    const theme = useTheme();
    const [parcels, setParcels] = useState([]);
    const [landUnits, setLandUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        parcelId: '',
        landUnit: '',
        areaHectares: '',
        status: 'Active',
        boundary: '', // Text input for GeoJSON string for now, or file upload later
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [parcelsRes, landUnitsRes] = await Promise.all([
                parcelsAPI.getAll(),
                landUnitsAPI.getAll()
            ]);
            setParcels(parcelsRes.data.data);
            setLandUnits(landUnitsRes.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Parse boundary if provided as string
            let payload = { ...formData };
            if (typeof payload.boundary === 'string' && payload.boundary.trim()) {
                try {
                    payload.boundary = JSON.parse(payload.boundary);
                } catch (e) {
                    alert('Invalid GeoJSON format for boundary');
                    return;
                }
            }

            await parcelsAPI.create(payload);
            setShowModal(false);
            fetchData();
            setFormData({ parcelId: '', landUnit: '', areaHectares: '', status: 'Active', boundary: '', notes: '' });
        } catch (error) {
            console.error('Error creating parcel:', error);
            alert('Failed to create parcel. See console for details.');
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                        Parcel Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage land parcels and their boundaries.
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowModal(true)}
                    sx={{
                        backgroundColor: theme.palette.primary.main,
                        '&:hover': { backgroundColor: theme.palette.primary.dark },
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                >
                    New Parcel
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: theme.palette.primary.main }} />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {parcels.map((parcel) => (
                        <Grid item xs={12} md={6} lg={4} key={parcel._id}>
                            <Card
                                sx={{
                                    height: '100%',
                                    borderRadius: '16px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                                    transition: 'all 0.2s ease-in-out',
                                    '&:hover': {
                                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Box
                                                sx={{
                                                    p: 1,
                                                    borderRadius: '8px',
                                                    backgroundColor: '#F3E8FF', // Purple-100
                                                    color: '#9333EA', // Purple-600
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <MapIcon />
                                            </Box>
                                            <Box>
                                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                                                    Parcel {parcel.parcelId}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {parcel.landUnit?.name || 'Unassigned'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            label={parcel.status}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                backgroundColor: parcel.status === 'Active' ? '#DCFCE7' : '#F3F4F6',
                                                color: parcel.status === 'Active' ? '#166534' : '#374151',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </Box>

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <RulerIcon sx={{ fontSize: 18 }} />
                                                <Typography variant="body2">Area</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {parcel.areaHectares} ha
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                {parcel.boundary ? (
                                                    <CheckCircleIcon sx={{ fontSize: 18, color: theme.palette.primary.main }} />
                                                ) : (
                                                    <WarningIcon sx={{ fontSize: 18, color: '#EAB308' }} />
                                                )}
                                                <Typography variant="body2">Boundary Data</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                {parcel.boundary ? 'Available' : 'Missing'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Register New Parcel</Typography>
                    <IconButton onClick={() => setShowModal(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            fullWidth
                            label="Parcel ID"
                            placeholder="e.g. P-101"
                            value={formData.parcelId}
                            onChange={(e) => setFormData({ ...formData, parcelId: e.target.value })}
                            required
                            InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Land Unit</InputLabel>
                            <Select
                                value={formData.landUnit}
                                label="Land Unit"
                                onChange={(e) => setFormData({ ...formData, landUnit: e.target.value })}
                                required
                                sx={{ borderRadius: '8px' }}
                            >
                                <MenuItem value="">
                                    <em>Select Land Unit...</em>
                                </MenuItem>
                                {landUnits.map(lu => (
                                    <MenuItem key={lu._id} value={lu._id}>{lu.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Area (Hectares)"
                            type="number"
                            value={formData.areaHectares}
                            onChange={(e) => setFormData({ ...formData, areaHectares: e.target.value })}
                            required
                            InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                        <Box>
                            <TextField
                                fullWidth
                                label="Boundary (GeoJSON)"
                                multiline
                                rows={4}
                                value={formData.boundary}
                                onChange={(e) => setFormData({ ...formData, boundary: e.target.value })}
                                placeholder='{"type": "Polygon", "coordinates": [...]}'
                                InputProps={{ sx: { borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' } }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                Paste GeoJSON geometry here (optional)
                            </Typography>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button
                        onClick={() => setShowModal(false)}
                        sx={{
                            color: 'text.secondary',
                            fontWeight: 600,
                            textTransform: 'none',
                            mr: 1
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{
                            backgroundColor: theme.palette.primary.main,
                            '&:hover': { backgroundColor: theme.palette.primary.dark },
                            borderRadius: '8px',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3
                        }}
                    >
                        Create Parcel
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default ParcelsPage;
