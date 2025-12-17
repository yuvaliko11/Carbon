import React, { useState, useEffect } from 'react';
import { landUnitsAPI } from '../services/api';
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
    People as PeopleIcon,
    LocationOn as LocationOnIcon,
    Business as BusinessIcon,
    Close as CloseIcon
} from '@mui/icons-material';

const LandUnitsPage = () => {
    const theme = useTheme();
    const [landUnits, setLandUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        type: 'mataqali',
        name: '',
        province: '',
        tikina: ''
    });

    useEffect(() => {
        fetchLandUnits();
    }, []);

    const fetchLandUnits = async () => {
        try {
            const response = await landUnitsAPI.getAll();
            setLandUnits(response.data.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching land units:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await landUnitsAPI.create(formData);
            setShowModal(false);
            fetchLandUnits();
            setFormData({ type: 'mataqali', name: '', province: '', tikina: '' });
        } catch (error) {
            console.error('Error creating land unit:', error);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                        Land Units
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage Mataqali, Yavusa, and other landowning units.
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
                    Add Land Unit
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: theme.palette.primary.main }} />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {landUnits.map((unit) => (
                        <Grid item xs={12} md={6} lg={4} key={unit._id}>
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
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box
                                            sx={{
                                                p: 1,
                                                borderRadius: '8px',
                                                backgroundColor: 'rgba(0, 168, 107, 0.1)',
                                                color: theme.palette.primary.main,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <PeopleIcon />
                                        </Box>
                                        <Chip
                                            label={unit.type}
                                            size="small"
                                            sx={{
                                                textTransform: 'capitalize',
                                                fontWeight: 600,
                                                backgroundColor: '#F3F4F6',
                                                color: '#374151',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                                        {unit.name}
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                            <LocationOnIcon sx={{ fontSize: 18 }} />
                                            <Typography variant="body2">
                                                {unit.tikina}, {unit.province}
                                            </Typography>
                                        </Box>
                                        {unit.tltbRef && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <BusinessIcon sx={{ fontSize: 18 }} />
                                                <Typography variant="body2">
                                                    TLTB Ref: {unit.tltbRef}
                                                </Typography>
                                            </Box>
                                        )}
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
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Add New Land Unit</Typography>
                    <IconButton onClick={() => setShowModal(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type"
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                sx={{ borderRadius: '8px' }}
                            >
                                <MenuItem value="mataqali">Mataqali</MenuItem>
                                <MenuItem value="yavusa">Yavusa</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Name"
                            placeholder="e.g. Yavusa Nabukebuke"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            InputProps={{ sx: { borderRadius: '8px' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                fullWidth
                                label="Province"
                                value={formData.province}
                                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                                InputProps={{ sx: { borderRadius: '8px' } }}
                            />
                            <TextField
                                fullWidth
                                label="Tikina"
                                value={formData.tikina}
                                onChange={(e) => setFormData({ ...formData, tikina: e.target.value })}
                                InputProps={{ sx: { borderRadius: '8px' } }}
                            />
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
                        Create Land Unit
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default LandUnitsPage;
