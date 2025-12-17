import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    ToggleButton,
    ToggleButtonGroup,
    Paper,
    Button,
    Grid,
    CircularProgress,
    Container,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton
} from '@mui/material';
import ViewListIcon from '@mui/icons-material/ViewList'; // Now represents Table
import ViewModuleIcon from '@mui/icons-material/ViewModule'; // Represents Grid/Gallery
import ViewQuiltIcon from '@mui/icons-material/ViewQuilt'; // Represents Split View
import MapIcon from '@mui/icons-material/Map';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import InputBase from '@mui/material/InputBase';
import SearchIcon from '@mui/icons-material/Search';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ContractDetailView from '../components/Contracts/ContractDetailView';
import { GoogleMap, Polygon } from '@react-google-maps/api';
import { useGoogleMaps } from '../context/GoogleMapsContext';
import ContractCard from '../components/Contracts/ContractCard'; // Keep for Gallery View
import { leasesAPI, carbonContractsAPI } from '../services/api';

// --- Configuration ---

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: -18.1416, // Suva, Fiji
    lng: 178.4419
};

// Custom Map Styles
const mapOptions = {
    disableDefaultUI: false,
    mapTypeControl: true,
    mapTypeControlOptions: {
        style: 1, // HORIZONTAL_BAR
        position: 3, // TOP_RIGHT (approximate, usually numbers in google maps api)
    },
    streetViewControl: false,
    fullscreenControl: true,
    mapTypeId: 'satellite',
    styles: [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        }
    ]
};

const ContractRegistryPage = () => {
    const navigate = useNavigate();
    // Default to 'split' view (Table + Map)
    const [viewMode, setViewMode] = useState('split');
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredContractId, setHoveredContractId] = useState(null);

    // Interactivity State
    const [selectedContract, setSelectedContract] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusAnchor, setStatusAnchor] = useState(null);
    const [statusFilter, setStatusFilter] = useState('All');

    // Delete State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contractToDelete, setContractToDelete] = useState(null);

    // Map Ref
    const mapRef = useRef(null);
    const { isLoaded } = useGoogleMaps();

    // Update bounds when contracts load
    useEffect(() => {
        if (isLoaded && mapRef.current && contracts.length > 0) {
            fitBoundsToContracts(contracts);
        }
    }, [contracts, isLoaded]);

    const onLoad = React.useCallback(function callback(map) {
        mapRef.current = map;
    }, []);

    const onUnmount = React.useCallback(function callback(map) {
        mapRef.current = null;
    }, []);

    const fitBoundsToContracts = (contractsList) => {
        if (!mapRef.current) return;
        const bounds = new window.google.maps.LatLngBounds();
        let hasPoints = false;

        contractsList.forEach(c => {
            const coords = c.coordinates?.[0];
            if (coords && Array.isArray(coords)) {
                coords.forEach(([lng, lat]) => {
                    bounds.extend({ lat, lng });
                    hasPoints = true;
                });
            }
        });

        if (hasPoints) {
            mapRef.current.fitBounds(bounds);
        } else {
            mapRef.current.setCenter(defaultCenter);
            mapRef.current.setZoom(10);
        }
    };

    // Load Data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const contractsRes = await carbonContractsAPI.getAll();
            const contractsData = contractsRes.data.data || [];

            const enrichedContracts = contractsData.map(c => ({
                id: c._id || c.lease_id, // ensure ID
                ...c,
                // Mappings for ContractDetailModal
                tenant_name: c.lesseeOrganization?.name || c.tenant_name || (c.extractedData?.parties?.lessee) || 'Unknown',
                owner_name: c.lessorLandUnit?.name || c.mataqaliName || c.owner_name,
                land_type: c.type || (c.extractedData?.general?.leaseType),
                lease_term_years: c.termYears,
                annual_rent: c.annualRent?.amount,
                start_date: c.startDate,
                file_url: c.fileUrl,

                coordinates: c.location?.coordinates || c.geometry?.coordinates || c.parcels?.[0]?.parcel?.geometry?.coordinates || null
            }));

            setContracts(enrichedContracts);
        } catch (error) {
            console.error("Error loading registry data:", error);
        } finally {
            setLoading(false);
            console.log("Registry Data Loaded:", contracts);
        }
    };

    // Filter Logic
    const filteredContracts = contracts.filter(c => {
        const matchesSearch = (
            (c.lease_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.parcels?.[0]?.parcel?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.parcels?.[0]?.parcel?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.tenant_name || c.lesseeOrganization?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Handlers
    const handleStatusClick = (event) => {
        setStatusAnchor(event.currentTarget);
    };

    const handleStatusClose = (status) => {
        if (status) setStatusFilter(status);
        setStatusAnchor(null);
    };

    const handleSaveContract = async (id, updates) => {
        try {
            console.log(`Saving contract ${id} with updates:`, updates);
            const payload = {};

            if (updates.term) payload.termYears = parseInt(updates.term);
            if (updates.type) payload.type = updates.type;
            if (updates.status) payload.complianceStatus = updates.status;
            if (updates.rent) {
                payload.annualRent = {
                    amount: parseFloat(updates.rent),
                    currency: 'FJD'
                };
            }

            const response = await leasesAPI.update(id, payload);

            if (response.data && response.data.success) {
                console.log("Contract saved successfully!");
                await loadData();
                setSelectedContract(prev => ({
                    ...prev,
                    lease_term_years: payload.termYears || prev.lease_term_years,
                    land_type: payload.type || prev.land_type,
                    status: payload.complianceStatus || prev.status,
                    annual_rent: payload.annualRent?.amount || prev.annual_rent
                }));
            }
        } catch (error) {
            console.error("Failed to save contract:", error);
        }
    };

    // Delete Handlers
    const handleDeleteClick = (contract) => {
        setContractToDelete(contract);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!contractToDelete) return;

        try {
            await carbonContractsAPI.delete(contractToDelete.id);
            // Update local state
            setContracts(prev => prev.filter(c => c.id !== contractToDelete.id));
            if (selectedContract?.id === contractToDelete.id) {
                setSelectedContract(null);
            }
        } catch (error) {
            console.error("Error deleting contract:", error);
            alert("Failed to delete contract. Please try again.");
        } finally {
            setDeleteDialogOpen(false);
            setContractToDelete(null);
        }
    };

    // --- Sub-Components ---

    const ContractsTable = () => (
        <TableContainer component={Paper} elevation={0} sx={{ height: '100%', overflowX: 'hidden' }}>
            <Table stickyHeader size="small" sx={{ tableLayout: 'fixed', minWidth: 600 }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '15%' }}>Lease #</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '20%' }}>Land Unit</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '20%' }}>Lessee</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '15%' }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Term</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, width: '10%' }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredContracts.map((contract) => (
                        <TableRow
                            key={contract.id}
                            hover
                            onMouseEnter={() => setHoveredContractId(contract.id)}
                            onMouseLeave={() => setHoveredContractId(null)}
                            selected={hoveredContractId === contract.id}
                            sx={{ cursor: 'pointer' }}
                            onClick={() => setSelectedContract(contract)}
                        >
                            <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contract.lease_number}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contract.parcels?.[0]?.parcel?.name || 'N/A'}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contract.tenant_name || 'Fiji Carbon Hub'}</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contract.land_type || 'General'}</TableCell>
                            <TableCell>{contract.lease_term_years} yrs</TableCell>
                            <TableCell>
                                <Chip
                                    label={contract.status || 'Active'}
                                    size="small"
                                    color={contract.status === 'Draft' ? 'default' : 'success'}
                                    variant="outlined"
                                    sx={{ height: 24, fontSize: '0.75rem' }}
                                />
                            </TableCell>
                            <TableCell align="right">
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <IconButton size="small" onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedContract(contract);
                                    }}>
                                        <EditIcon fontSize="small" sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(contract);
                                    }}>
                                        <DeleteIcon fontSize="small" sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                    {!loading && contracts.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                                <Typography color="text.secondary">No contracts found.</Typography>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const ContractsGrid = () => (
        <Grid container spacing={3} sx={{ p: 2 }}>
            {contracts.map(contract => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={contract.id}>
                    <ContractCard
                        contract={contract}
                        onClick={() => setSelectedContract(contract)}
                        onMouseEnter={() => setHoveredContractId(contract.id)}
                        onMouseLeave={() => setHoveredContractId(null)}
                    />
                </Grid>
            ))}
        </Grid>
    );



    return (
        <Box sx={{
            height: 'calc(100vh - 64px)',
            marginTop: '64px', // Fix: Push content below fixed AppBar
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header / Filter Bar */}
            <Paper
                elevation={0}
                sx={{
                    px: 3,
                    py: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f0f0f0',
                    columnGap: 2,
                    zIndex: 2,
                    borderRadius: 0
                }}
            >
                {/* Search Bar - Airbnb Style */}
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
                    borderRadius: '40px',
                    border: '1px solid #DDDDDD',
                    px: 2,
                    py: 1,
                    minWidth: '350px',
                    '&:hover': { boxShadow: '0 2px 4px rgba(0,0,0,0.12)' }
                }}>
                    <SearchIcon fontSize="small" sx={{ color: '#222', mr: 1 }} />
                    <InputBase
                        placeholder="Search Contracts"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ ml: 1, flex: 1, fontWeight: 600, fontSize: '14px' }}
                    />

                    <Divider orientation="vertical" flexItem sx={{ height: 16, mx: 1, my: 'auto' }} />

                    <Box
                        onClick={handleStatusClick}
                        sx={{
                            cursor: 'pointer',
                            px: 1,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#222', whiteSpace: 'nowrap' }}>
                            {statusFilter === 'All' ? 'Any Status' : statusFilter}
                        </Typography>
                    </Box>
                    <Menu
                        anchorEl={statusAnchor}
                        open={Boolean(statusAnchor)}
                        onClose={() => handleStatusClose(null)}
                        PaperProps={{
                            elevation: 3,
                            sx: { borderRadius: '12px', mt: 1, minWidth: '150px' }
                        }}
                    >
                        <MenuItem onClick={() => handleStatusClose('All')}>Any Status</MenuItem>
                        <MenuItem onClick={() => handleStatusClose('Active')}>Active</MenuItem>
                        <MenuItem onClick={() => handleStatusClose('Draft')}>Draft</MenuItem>
                        <MenuItem onClick={() => handleStatusClose('Breach')}>Breach</MenuItem>
                    </Menu>

                    <Box sx={{
                        ml: 2,
                        bgcolor: '#00A86B', // Fiji Carbon Green
                        color: 'white',
                        borderRadius: '50%',
                        p: 1,
                        display: 'flex',
                        cursor: 'pointer'
                    }}>
                        <FilterListIcon fontSize="small" />
                    </Box>
                </Box>

                {/* View Switcher */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, mr: 3, display: { xs: 'none', md: 'block' } }}>
                        {contracts.length} contracts
                    </Typography>

                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, val) => val && setViewMode(val)}
                        size="small"
                        aria-label="view mode"
                        sx={{
                            bgcolor: '#f7f7f7',
                            p: 0.5,
                            borderRadius: '12px',
                            '& .MuiToggleButton-root': {
                                border: 'none',
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontWeight: 600,
                                color: '#717171',
                                px: 2,
                                '&.Mui-selected': {
                                    bgcolor: 'white',
                                    color: '#222',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }
                            }
                        }}
                    >
                        <ToggleButton value="list" aria-label="list only">
                            <ViewListIcon fontSize="small" sx={{ mr: 1 }} /> List
                        </ToggleButton>
                        <ToggleButton value="split" aria-label="split view">
                            <ViewQuiltIcon fontSize="small" sx={{ mr: 1 }} /> Map & List
                        </ToggleButton>
                        <ToggleButton value="map" aria-label="map only">
                            <MapIcon fontSize="small" sx={{ mr: 1 }} /> Map
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* New Contract Button */}
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/upload')}
                    sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 'none',
                        bgcolor: '#222',
                        '&:hover': { bgcolor: 'black' }
                    }}
                >
                    New
                </Button>
            </Paper>

            {/* Content Area */}
            <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
                {selectedContract ? (
                    // FULL SCREEN DETAIL VIEW (Replaces List & Map)
                    <Box sx={{ width: '100%', height: '100%', overflow: 'hidden', bgcolor: '#f5f5f5', p: 2 }}>
                        <Container maxWidth="xl" sx={{ height: '100%' }}>
                            <ContractDetailView
                                contract={selectedContract}
                                onBack={() => setSelectedContract(null)}
                                onSave={handleSaveContract}
                            />
                        </Container>
                    </Box>
                ) : (
                    // NORMAL SPLIT VIEW (List + Map)
                    viewMode === 'split' ? (
                        <>
                            {/* Table Side (Left) */}
                            <Box sx={{ width: '55%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
                                <ContractsTable />
                            </Box>

                            {/* Map Side (Right) */}
                            <Box sx={{ width: '45%', height: '100%', overflowY: 'auto', bgcolor: '#fff', position: 'relative' }}>
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={mapContainerStyle}
                                        center={defaultCenter}
                                        zoom={10}
                                        onLoad={onLoad}
                                        onUnmount={onUnmount}
                                        options={mapOptions}
                                    >
                                        {contracts.map(contract => {
                                            const rawCoords = contract.coordinates?.[0];
                                            if (!rawCoords || !Array.isArray(rawCoords)) return null;
                                            const path = rawCoords.map(([lng, lat]) => ({ lat, lng }));
                                            const isHovered = hoveredContractId === contract.id;

                                            // Since we can't see details on map click in this mode (it opens full screen),
                                            // clicking a polygon should probably also open the full screen view.

                                            return (
                                                <Polygon
                                                    key={contract.id}
                                                    paths={path}
                                                    options={{
                                                        fillColor: isHovered ? '#00A86B' : '#10B981',
                                                        fillOpacity: isHovered ? 0.6 : 0.35,
                                                        strokeColor: '#004D40',
                                                        strokeOpacity: 0.8,
                                                        strokeWeight: isHovered ? 2 : 1,
                                                    }}
                                                    onMouseOver={() => setHoveredContractId(contract.id)}
                                                    onMouseOut={() => setHoveredContractId(null)}
                                                    onClick={() => setSelectedContract(contract)}
                                                />
                                            );
                                        })}
                                    </GoogleMap>
                                ) : <CircularProgress />}
                            </Box>
                        </>
                    ) : (
                        // OTHER MODES (List Only, Map Only, etc.)
                        <>
                            {/* List Only View */}
                            {viewMode === 'list' && (
                                <Box sx={{ width: '100%', overflowY: 'auto' }}>
                                    <Container maxWidth="xl" sx={{ py: 3 }}>
                                        <ContractsTable />
                                    </Container>
                                </Box>
                            )}

                            {/* Gallery View */}
                            {viewMode === 'gallery' && (
                                <Box sx={{ width: '100%', overflowY: 'auto' }}>
                                    <Container maxWidth="xl" sx={{ py: 3 }}>
                                        <ContractsGrid />
                                    </Container>
                                </Box>
                            )}

                            {/* Map Only View */}
                            {viewMode === 'map' && (
                                <Box sx={{ width: '100%', height: '100%' }}>
                                    {isLoaded ? (
                                        <GoogleMap
                                            mapContainerStyle={mapContainerStyle}
                                            center={defaultCenter}
                                            zoom={10}
                                            onLoad={onLoad}
                                            onUnmount={onUnmount}
                                            options={mapOptions}
                                        >
                                            {contracts.map(contract => {
                                                const rawCoords = contract.coordinates?.[0];
                                                if (!rawCoords || !Array.isArray(rawCoords)) return null;
                                                const path = rawCoords.map(([lng, lat]) => ({ lat, lng }));
                                                return (
                                                    <Polygon
                                                        key={contract.id}
                                                        paths={path}
                                                        options={{ fillColor: '#10B981', fillOpacity: 0.35 }}
                                                        onClick={() => setSelectedContract(contract)}
                                                    />
                                                );
                                            })}
                                        </GoogleMap>
                                    ) : <CircularProgress />}
                                </Box>
                            )}
                        </>
                    )
                )}
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Contract?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete contract <strong>{contractToDelete?.lease_number}</strong>?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
                        Cancel
                    </Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ContractRegistryPage;
