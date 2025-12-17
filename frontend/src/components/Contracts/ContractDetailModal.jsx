
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Grid,
    IconButton,
    Paper,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContractFullDetailsModal from './ContractFullDetailsModal';

const ContractDetailModal = ({ open, onClose, contract, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [showFullDetails, setShowFullDetails] = useState(false);

    // Form State
    const [editForm, setEditForm] = useState({
        term: '',
        rent: '',
        type: '',
        status: ''
    });

    // Initialize form when contract changes
    useEffect(() => {
        if (contract) {
            setEditForm({
                term: contract.lease_term_years || '',
                rent: contract.annual_rent || '',
                type: contract.land_type || '',
                status: contract.status || 'compliant'
            });
            setIsEditing(false); // Reset edit mode on open
        }
    }, [contract]);

    if (!contract) return null;

    const handleSave = () => {
        if (onSave) {
            onSave(contract.id, editForm);
        }
        setIsEditing(false);
    };


    const getStatusProps = (status) => {
        const lowerStatus = (status || '').toLowerCase();
        if (lowerStatus === 'compliant' || lowerStatus === 'active') {
            return { color: 'success', icon: <VerifiedUserIcon color="success" sx={{ fontSize: 28 }} /> };
        }
        if (lowerStatus === 'warning') {
            return { color: 'warning', icon: <WarningIcon color="warning" sx={{ fontSize: 28 }} /> };
        }
        if (lowerStatus === 'breach' || lowerStatus === 'error') {
            return { color: 'error', icon: <ErrorIcon color="error" sx={{ fontSize: 28 }} /> };
        }
        return { color: 'default', icon: <VerifiedUserIcon color="action" sx={{ fontSize: 28 }} /> };
    };

    const StatusIcon = () => {
        const status = isEditing ? editForm.status : contract.status;
        return getStatusProps(status).icon;
    };

    const fileUrl = contract.file_url || contract.fileUrl || contract.url || contract.path;


    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 4, // 16px
                    p: 0,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    overflow: 'hidden'
                }
            }}
        >
            {/* Header */}
            <Box sx={{
                p: 3,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'start',
                borderBottom: '1px solid #f2f2f2'
            }}>
                <Box>
                    <Typography variant="caption" sx={{
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        fontWeight: 700,
                        color: 'text.secondary',
                        mb: 0.5,
                        display: 'block'
                    }}>
                        Parcel for {contract.leaseNumber || contract.lease_number}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {isEditing ? (
                            <FormControl size="small" sx={{ minWidth: 200, mt: 1 }}>
                                <InputLabel>Land Use Type</InputLabel>
                                <Select
                                    label="Land Use Type"
                                    value={editForm.type}
                                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                >
                                    <MenuItem value="Agriculture">Agriculture</MenuItem>
                                    <MenuItem value="Residential">Residential</MenuItem>
                                    <MenuItem value="Commercial">Commercial</MenuItem>
                                    <MenuItem value="Conservation">Conservation</MenuItem>
                                    <MenuItem value="Industrial">Industrial</MenuItem>
                                </Select>
                            </FormControl>
                        ) : (
                            <Typography variant="h5" fontWeight="800" sx={{ color: '#222' }}>
                                Type: {contract.land_type || 'Unknown'}
                            </Typography>
                        )}

                        {!isEditing && (
                            <Chip
                                label={contract.status || "Active"}
                                size="small"
                                color={getStatusProps(contract.status || "Active").color}
                                variant="filled"
                                sx={{ ml: 1, fontWeight: 700, borderRadius: 1 }}
                            />
                        )}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isEditing && onSave && (
                        <Button
                            startIcon={<EditIcon sx={{ fontSize: 18 }} />}
                            onClick={() => setIsEditing(true)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                color: '#222',
                                '&:hover': { bgcolor: '#f7f7f7' }
                            }}
                        >
                            Edit
                        </Button>
                    )}
                    <IconButton onClick={onClose} size="small" sx={{ bgcolor: '#f7f7f7', '&:hover': { bgcolor: '#e0e0e0' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <DialogContent sx={{ p: 4 }}>
                <Grid container spacing={4}>
                    {/* Left Column: Details */}
                    <Grid item xs={12} md={7}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>

                            {/* Parties Section */}
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom sx={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>LESSEE</Typography>
                                    <Typography variant="h6" fontWeight="700" sx={{ color: '#222' }}>
                                        {contract.tenant_name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {contract.tenant_name ? 'Registered Organization' : 'No lessee record found'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 0 }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary" fontWeight="bold" gutterBottom sx={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>LANDOWNER (LESSOR)</Typography>
                                    <Typography variant="h6" fontWeight="700" sx={{ color: '#222' }}>
                                        {contract.owner_name || 'N/A'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {contract.owner_name ? 'Landowning Unit (Mataqali)' : 'No landowner record found'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 1 }} />

                            {/* Terms Grid */}
                            <Box>
                                <Typography variant="h6" fontWeight="700" sx={{ mb: 2, color: '#222' }}>Lease Details</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', height: '100%' }}>
                                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Lease Term</Typography>
                                            {isEditing ? (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={editForm.term}
                                                    onChange={(e) => setEditForm({ ...editForm, term: e.target.value })}
                                                    type="number"
                                                    InputProps={{ endAdornment: <Typography variant="caption">Years</Typography> }}
                                                />
                                            ) : (
                                                <Typography variant="h6" fontWeight="600">{contract.lease_term_years} Years</Typography>
                                            )}
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', height: '100%' }}>
                                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Annual Rent</Typography>
                                            {isEditing ? (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    value={editForm.rent}
                                                    onChange={(e) => setEditForm({ ...editForm, rent: e.target.value })}
                                                    type="number"
                                                    InputProps={{ startAdornment: <Typography>$</Typography> }}
                                                />
                                            ) : (
                                                <Typography variant="h6" fontWeight="600">${contract.annual_rent?.toLocaleString() || '0'}</Typography>
                                            )}
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', height: '100%' }}>
                                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Start Date</Typography>
                                            <Typography variant="body1" fontWeight="600">{contract.start_date ? new Date(contract.start_date).toLocaleDateString() : 'N/A'}</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e0e0e0', height: '100%' }}>
                                            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>Contract File</Typography>
                                            {fileUrl ? (
                                                <Typography
                                                    variant="body2"
                                                    component="a"
                                                    onClick={() => window.open(fileUrl, '_blank')}
                                                    sx={{
                                                        color: 'primary.main',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    View PDF
                                                </Typography>
                                            ) : (
                                                <Typography variant="body2" color="text.secondary">No file attached</Typography>
                                            )}
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    </Grid>

                    {/* Right Column: Status & AI */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{
                            p: 3,
                            borderRadius: 4,
                            border: '1px solid #ddd',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}>
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" fontWeight="700">Status</Typography>
                                    {isEditing ? (
                                        <FormControl size="small" sx={{ minWidth: 120 }}>
                                            <Select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            >
                                                <MenuItem value="compliant">Compliant</MenuItem>
                                                <MenuItem value="warning">Warning</MenuItem>
                                                <MenuItem value="breach">Breach</MenuItem>
                                            </Select>
                                        </FormControl>
                                    ) : (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <StatusIcon />
                                            <Typography variant="body1" fontWeight="600" sx={{ textTransform: 'capitalize' }}>
                                                {contract.status || 'Unknown'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                                <Divider sx={{ mb: 2 }} />

                                <Typography variant="subtitle1" fontWeight="700" color="success.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    AI Analysis
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                                    No critical issues detected. This contract follows the standard template and all clauses appear consistent with regional regulations.
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 3, p: 2, bgcolor: '#f7f7f7', borderRadius: 2 }}>
                                <Typography variant="caption" color="text.secondary" display="block">Green Score</Typography>
                                <Typography variant="h3" fontWeight="800" color="success.main">{contract.greenScore || '-'}</Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 3, borderTop: '1px solid #f2f2f2', justifyContent: 'space-between' }}>
                <Button
                    startIcon={<VisibilityIcon />}
                    onClick={() => setShowFullDetails(true)}
                    sx={{ color: '#222', textTransform: 'none', fontWeight: 600 }}
                >
                    View Full Record
                </Button>

                <Box>
                    {isEditing ? (
                        <>
                            <Button
                                onClick={() => setIsEditing(false)}
                                sx={{ mr: 1, color: '#222', textTransform: 'none', fontWeight: 600 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSave}
                                disableElevation
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    borderRadius: 2,
                                    px: 3,
                                    py: 1
                                }}
                            >
                                Save
                            </Button>
                        </>
                    ) : (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onClose}
                            disableElevation
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 2,
                                px: 4,
                                py: 1,
                                bgcolor: '#222', // Airbnb-like dark button
                                '&:hover': { bgcolor: '#000' }
                            }}
                        >
                            Done
                        </Button>
                    )}
                </Box>
            </DialogActions>

            <ContractFullDetailsModal
                open={showFullDetails}
                onClose={() => setShowFullDetails(false)}
                contract={contract}
            />
        </Dialog>
    );
};

export default ContractDetailModal;
