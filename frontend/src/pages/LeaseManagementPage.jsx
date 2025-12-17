import React, { useState, useEffect } from 'react';
import { leasesAPI, landUnitsAPI, authAPI, parcelsAPI } from '../services/api';
import ContractSigningModal from '../components/Contracts/ContractSigningModal';
import ParcelPolygonDrawer from '../components/Map/ParcelPolygonDrawer';
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
    useTheme,
    FormControlLabel,
    Checkbox,
    Divider
} from '@mui/material';
import {
    Add as AddIcon,
    Description as FileTextIcon,
    AttachMoney as DollarSignIcon,
    Security as ShieldIcon,
    Create as PenToolIcon,
    Close as CloseIcon,
    Spa as LeafIcon
} from '@mui/icons-material';

const LeaseManagementPage = () => {
    const theme = useTheme();
    const [leases, setLeases] = useState([]);
    const [landUnits, setLandUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSigningModal, setShowSigningModal] = useState(false);
    const [showParcelDrawer, setShowParcelDrawer] = useState(false);
    const [selectedLease, setSelectedLease] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [createdParcels, setCreatedParcels] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        leaseNumber: '',
        type: 'Conservation',
        purpose: 'Special Conservation Purpose',
        lessorLandUnit: '',
        lesseeOrganization: '', // Will be auto-filled or selected
        termYears: 50,
        startDate: '',
        annualRent: { amount: 2000, currency: 'FJD' },
        carbonParticipation: { enabled: true, mandatorySharePercentToOtherLandUnit: 5 }
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leasesRes, landUnitsRes, userRes] = await Promise.all([
                leasesAPI.getAll(),
                landUnitsAPI.getAll(),
                authAPI.getMe()
            ]);
            setLeases(leasesRes.data.data);
            setLandUnits(landUnitsRes.data.data);
            setCurrentUser(userRes.data);

            // Auto-set lessee if user has an organization
            if (userRes.data.organization) {
                setFormData(prev => ({ ...prev, lesseeOrganization: userRes.data.organization }));
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Create lease with parcels
            const leaseDataWithParcels = {
                ...formData,
                parcels: createdParcels.map(p => ({
                    parcel: p._id,
                    areaHaAtGrant: p.areaHa,
                    isDemarcatedForCarbon: true
                }))
            };
            await leasesAPI.create(leaseDataWithParcels);
            setShowModal(false);
            setCreatedParcels([]);
            fetchData();
            // Reset form (simplified)
            setFormData({ ...formData, leaseNumber: '', startDate: '' });
        } catch (error) {
            console.error('Error creating lease:', error);
            alert('Failed to create lease. See console for details.');
        }
    };

    const handleSaveParcel = async (parcelData) => {
        try {
            // Add land unit reference
            const parcelWithLandUnit = {
                ...parcelData,
                landUnit: formData.lessorLandUnit,
                ownershipType: 'iTaukei'
            };
            const response = await parcelsAPI.create(parcelWithLandUnit);
            setCreatedParcels(prev => [...prev, response.data.data]);
            console.log('Parcel created:', response.data.data);
        } catch (error) {
            console.error('Error creating parcel:', error);
            alert('Failed to create parcel. See console for details.');
        }
    };

    const handleSignClick = (lease) => {
        setSelectedLease(lease);
        setShowSigningModal(true);
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
                        Lease Management
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage conservation leases (e.g., Lease 4159) and obligations.
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
                    New Lease
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: theme.palette.primary.main }} />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {leases.map((lease) => (
                        <Grid item xs={12} lg={6} key={lease._id}>
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
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <FileTextIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                    Lease #{lease.leaseNumber}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {lease.type} • {lease.termYears} Years
                                            </Typography>
                                        </Box>
                                        <Chip
                                            label={lease.status}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                backgroundColor: lease.status === 'Active' ? '#DCFCE7' : '#FEF3C7',
                                                color: lease.status === 'Active' ? '#166534' : '#92400E',
                                                borderRadius: '6px'
                                            }}
                                        />
                                    </Box>

                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                Lessor (Landowner)
                                            </Typography>
                                            <Typography variant="body2" fontWeight={500}>
                                                {lease.lessorLandUnit?.name || 'Unknown'}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                                Lessee
                                            </Typography>
                                            <Typography variant="body2" fontWeight={500}>
                                                {lease.lesseeOrganization?.name || 'Unknown'}
                                            </Typography>
                                        </Grid>
                                    </Grid>

                                    <Divider sx={{ my: 2 }} />

                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <DollarSignIcon sx={{ fontSize: 18 }} />
                                                <Typography variant="body2">Annual Rent</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                ${lease.annualRent?.amount} {lease.annualRent?.currency}
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                                <ShieldIcon sx={{ fontSize: 18 }} />
                                                <Typography variant="body2">Transfer Fee</Typography>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                20-25% (Standard)
                                            </Typography>
                                        </Box>

                                        {lease.carbonParticipation?.enabled && (
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: theme.palette.primary.main }}>
                                                    <LeafIcon sx={{ fontSize: 18 }} />
                                                    <Typography variant="body2" fontWeight={500}>Carbon Share</Typography>
                                                </Box>
                                                <Typography variant="body2" fontWeight={600}>
                                                    {lease.carbonParticipation.mandatorySharePercentToOtherLandUnit}% to Secondary Unit
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>

                                    <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            startIcon={<PenToolIcon />}
                                            onClick={() => handleSignClick(lease)}
                                            sx={{
                                                color: '#2563EB', // Blue-600
                                                backgroundColor: '#EFF6FF', // Blue-50
                                                '&:hover': { backgroundColor: '#DBEAFE' }, // Blue-100
                                                textTransform: 'none',
                                                fontWeight: 600,
                                                borderRadius: '8px'
                                            }}
                                        >
                                            Sign Contract
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {showSigningModal && selectedLease && (
                <ContractSigningModal
                    leaseData={selectedLease}
                    onClose={() => setShowSigningModal(false)}
                    onSigned={(pdfBlob) => {
                        console.log('Signed PDF Blob:', pdfBlob);
                        // Here you would typically upload the blob to the backend
                    }}
                />
            )}

            <Dialog
                open={showModal}
                onClose={() => setShowModal(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>Create New Lease</Typography>
                    <IconButton onClick={() => setShowModal(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Lease Number"
                                    placeholder="e.g. 4159"
                                    value={formData.leaseNumber}
                                    onChange={(e) => setFormData({ ...formData, leaseNumber: e.target.value })}
                                    required
                                    InputProps={{ sx: { borderRadius: '8px' } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Lessor (Land Unit)</InputLabel>
                                    <Select
                                        value={formData.lessorLandUnit}
                                        label="Lessor (Land Unit)"
                                        onChange={(e) => setFormData({ ...formData, lessorLandUnit: e.target.value })}
                                        required
                                        sx={{ borderRadius: '8px' }}
                                    >
                                        <MenuItem value="">
                                            <em>Select Land Unit...</em>
                                        </MenuItem>
                                        {landUnits.map(lu => (
                                            <MenuItem key={lu._id} value={lu._id}>{lu.name} ({lu.type})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Start Date"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    required
                                    InputProps={{ sx: { borderRadius: '8px' } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Term (Years)"
                                    type="number"
                                    value={formData.termYears}
                                    onChange={(e) => setFormData({ ...formData, termYears: parseInt(e.target.value) })}
                                    required
                                    InputProps={{ sx: { borderRadius: '8px' } }}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ p: 3, backgroundColor: '#F9FAFB', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                                Financial Obligations
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                                    <TextField
                                        fullWidth
                                        label="Annual Rent Amount"
                                        type="number"
                                        value={formData.annualRent.amount}
                                        onChange={(e) => setFormData({ ...formData, annualRent: { ...formData.annualRent, amount: parseInt(e.target.value) } })}
                                        required
                                        InputProps={{ sx: { borderRadius: '8px', backgroundColor: '#fff' } }}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Currency</InputLabel>
                                        <Select
                                            value={formData.annualRent.currency}
                                            label="Currency"
                                            onChange={(e) => setFormData({ ...formData, annualRent: { ...formData.annualRent, currency: e.target.value } })}
                                            sx={{ borderRadius: '8px', backgroundColor: '#fff' }}
                                        >
                                            <MenuItem value="FJD">FJD</MenuItem>
                                            <MenuItem value="USD">USD</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>

                        <Box sx={{ p: 3, backgroundColor: 'rgba(0, 168, 107, 0.05)', borderRadius: '12px', border: '1px solid', borderColor: 'rgba(0, 168, 107, 0.2)' }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: theme.palette.primary.dark }}>
                                Carbon Participation (Clause 4)
                            </Typography>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={formData.carbonParticipation.enabled}
                                        onChange={(e) => setFormData({ ...formData, carbonParticipation: { ...formData.carbonParticipation, enabled: e.target.checked } })}
                                        sx={{
                                            color: theme.palette.primary.main,
                                            '&.Mui-checked': {
                                                color: theme.palette.primary.main,
                                            },
                                        }}
                                    />
                                }
                                label={<Typography variant="body2">Enable Carbon Trading Participation</Typography>}
                            />
                            {formData.carbonParticipation.enabled && (
                                <Box sx={{ mt: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Mandatory Share to Secondary Unit (%)"
                                        type="number"
                                        value={formData.carbonParticipation.mandatorySharePercentToOtherLandUnit}
                                        onChange={(e) => setFormData({ ...formData, carbonParticipation: { ...formData.carbonParticipation, mandatorySharePercentToOtherLandUnit: parseInt(e.target.value) } })}
                                        helperText="Per Clause 4(b) - typically 5%"
                                        InputProps={{ sx: { borderRadius: '8px', backgroundColor: '#fff' } }}
                                    />
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ p: 3, backgroundColor: '#F3F4F6', borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                    Parcels & Polygons
                                </Typography>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setShowParcelDrawer(true)}
                                    disabled={!formData.lessorLandUnit}
                                    sx={{ textTransform: 'none' }}
                                >
                                    + Add Parcel Polygon
                                </Button>
                            </Box>
                            {!formData.lessorLandUnit && (
                                <Typography variant="caption" color="text.secondary">
                                    Please select a Land Unit first
                                </Typography>
                            )}
                            {createdParcels.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {createdParcels.map((parcel, index) => (
                                        <Box key={index} sx={{ p: 2, backgroundColor: '#fff', borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="body2" fontWeight={600}>{parcel.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {parcel.tikina}, {parcel.province} • {parcel.areaHa} Ha
                                            </Typography>
                                        </Box>
                                    ))}
                                </Box>
                            )}
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
                        Create Lease
                    </Button>
                </DialogActions>
            </Dialog>

            <ParcelPolygonDrawer
                open={showParcelDrawer}
                onClose={() => setShowParcelDrawer(false)}
                onSave={handleSaveParcel}
            />
        </Container>
    );
};

export default LeaseManagementPage;
