
import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    Grid,
    IconButton,
    Paper,
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Divider,
    Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContractFullDetailsModal from './ContractFullDetailsModal';
import ContractFullDetails from './ContractFullDetails';

const ContractDetailView = ({ contract, onBack, onSave }) => {
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

    // Helper to construct public URL from various backend formats
    const getPublicFileUrl = (pathOrUrl) => {
        if (!pathOrUrl) return null;
        if (pathOrUrl.startsWith('http')) return pathOrUrl;

        // Extract filename from path (handles both / and \ separators)
        const filename = pathOrUrl.split(/[/\\]/).pop();

        // Assuming Nginx/Backend serves uploads at /uploads/
        // If running locally, it might be different, but for prod:
        return `/uploads/${filename}`;
    };

    const rawFileUrl = contract.file_url || contract.fileUrl || contract.url || contract.path;
    const fileUrl = getPublicFileUrl(rawFileUrl);

    return (
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'white',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <Box sx={{
                p: 3,
                display: 'flex',
                alignItems: 'start', // changed to start to align with content
                borderBottom: '1px solid #f2f2f2',
                gap: 2
            }}>
                <IconButton
                    onClick={onBack}
                    sx={{
                        mt: 0.5,
                        bgcolor: '#f7f7f7',
                        '&:hover': { bgcolor: '#e0e0e0' }
                    }}
                >
                    <ArrowBackIcon />
                </IconButton>

                <Box sx={{ flexGrow: 1 }}>
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

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
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
                    {/* Edit/Save Actions */}
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
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => window.open(fileUrl, '_blank')}
                            disabled={!fileUrl}
                            sx={{ color: '#222', borderColor: '#e0e0e0', textTransform: 'none', fontWeight: 600 }}
                        >
                            Open PDF
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Scrollable Content - REPLACED WITH FULL DETAILS TABBED VIEW */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: '#fff' }}>
                <ContractFullDetails contract={contract} />
            </Box>

        </Box>
    );
};

export default ContractDetailView;
