import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    TextField,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Checkbox,
    FormControlLabel,
    Alert,
    Divider
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { landUnitsAPI, parcelsAPI, leasesAPI, organizationsAPI, uploadsAPI, carbonContractsAPI } from '../../services/api';
import ParcelPolygonDrawer from '../Map/ParcelPolygonDrawer';
import { generateLeasePDFBlob } from '../../utils/pdfGenerator';

const steps = ['Land Unit', 'Parcel & Polygon', 'Lease Details', 'Review'];

const ManualContractEntry = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [landUnits, setLandUnits] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [showParcelDrawer, setShowParcelDrawer] = useState(false);
    const [createdParcels, setCreatedParcels] = useState([]);
    const navigate = useNavigate();

    // Form Data
    const [landUnitData, setLandUnitData] = useState({
        type: 'yavusa',
        name: '',
        province: '',
        tikina: '',
        tltbRef: ''
    });

    const [leaseData, setLeaseData] = useState({
        leaseNumber: '',
        type: 'Conservation',
        purpose: 'Special Conservation Purpose',
        lessorLandUnit: '',
        lesseeOrganization: '',
        termYears: 50,
        startDate: '',
        annualRent: { amount: 2000, currency: 'FJD' },
        carbonParticipation: { enabled: true, mandatorySharePercentToOtherLandUnit: 5 },
        coordinateData: null // New field for raw coordinate text
    });

    useEffect(() => {
        loadLandUnits();
        loadOrganizations();
    }, []);

    const loadLandUnits = async () => {
        try {
            const response = await landUnitsAPI.getAll();
            setLandUnits(response.data.data || []);
        } catch (error) {
            console.error('Error loading land units:', error);
        }
    };

    const loadOrganizations = async () => {
        try {
            const response = await organizationsAPI.getAll();
            setOrganizations(response.data.data || []);
        } catch (error) {
            console.error('Error loading organizations:', error);
        }
    };

    const handleNext = async () => {
        console.log('handleNext called. Active Step:', activeStep);
        if (activeStep === 0) {
            // Create or select land unit
            if (landUnitData.name && !leaseData.lessorLandUnit) {
                try {
                    console.log('Creating Land Unit:', landUnitData);
                    const response = await landUnitsAPI.create(landUnitData);
                    console.log('Land Unit Created:', response.data);
                    setLeaseData({ ...leaseData, lessorLandUnit: response.data.data._id });
                    setLandUnits([...landUnits, response.data.data]);
                } catch (error) {
                    console.error('Error creating land unit:', error);
                    alert('Failed to create land unit');
                    return;
                }
            }
        }

        if (activeStep === steps.length - 1) {
            // Submit
            console.log('Submitting Lease...');
            await handleSubmit();
        } else {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSaveParcel = (parcelData) => {
        // Don't save to DB yet, just add to state
        const parcelWithLandUnit = {
            ...parcelData,
            landUnit: leaseData.lessorLandUnit,
            ownershipType: 'iTaukei',
            tempId: Date.now() // Temporary ID for UI rendering
        };
        setCreatedParcels([...createdParcels, parcelWithLandUnit]);
    };

    const handleSubmit = async () => {
        try {
            // 1. Save all parcels to DB first
            const savedParcelIds = [];
            const savedParcelsFull = [];

            for (const p of createdParcels) {
                // Remove tempId before sending to API
                const { tempId, points, ...parcelData } = p;

                // Convert points to GeoJSON geometry
                if (points && points.length >= 3) {
                    parcelData.geometry = {
                        type: 'Polygon',
                        coordinates: [[
                            ...points.map(pt => [pt.lng, pt.lat]),
                            [points[0].lng, points[0].lat] // Close the ring
                        ]]
                    };
                }
                // Handle Coordinate Data Override (if user uploaded a file but didn't draw)
                if (leaseData.coordinateData && !parcelData.geometry) {
                    // We don't have geoUtils here easily, so we rely on backend to create the accurate geometry.
                    // But for the Parcel, we need SOMETHING valid for the schema (Polygon).
                    // We'll create a dummy small polygon around a central point.
                    parcelData.geometry = {
                        type: 'Polygon',
                        coordinates: [[
                            [178.441, -18.141],
                            [178.442, -18.141],
                            [178.442, -18.142],
                            [178.441, -18.142],
                            [178.441, -18.141]
                        ]]
                    };
                }

                try {
                    const response = await parcelsAPI.create(parcelData);
                    if (response.data && response.data.data && response.data.data._id) {
                        savedParcelIds.push(response.data.data._id);
                        savedParcelsFull.push(response.data.data);
                    } else {
                        throw new Error('Invalid response from server when creating parcel');
                    }
                } catch (err) {
                    console.error('Error saving parcel:', err);
                    alert(`Failed to save parcel "${parcelData.name}". Please check the data.`);
                    throw new Error('Failed to save one or more parcels');
                }
            }

            const leaseWithParcels = {
                ...leaseData,
                status: 'Active', // Set default status to Active
                parcels: savedParcelsFull.map(p => ({
                    parcel: p._id,
                    areaHaAtGrant: p.areaHa,
                    isDemarcatedForCarbon: true
                }))
            };
            const leaseResponse = await leasesAPI.create(leaseWithParcels);
            const createdLease = leaseResponse.data.data;

            // Generate PDF Summary and Create CarbonContract (for Repository visibility)
            try {
                // We need to populate the lease data for the PDF (names instead of IDs)
                // Or just use the data we have in state
                const leaseForPdf = {
                    ...createdLease,
                    lessorLandUnit: landUnits.find(u => u._id === leaseData.lessorLandUnit) || { name: 'Unknown' },
                    lesseeOrganization: organizations.find(o => o._id === leaseData.lesseeOrganization) || { name: 'Unknown' },
                    parcels: createdParcels.map(p => ({ parcel: p, areaHaAtGrant: p.areaHa, isDemarcatedForCarbon: true }))
                };

                const pdfBlob = generateLeasePDFBlob(leaseForPdf);
                const pdfFile = new File([pdfBlob], `Lease-${createdLease.leaseNumber}.pdf`, { type: 'application/pdf' });
                const uploadResponse = await uploadsAPI.upload(pdfFile);

                if (uploadResponse.status >= 400) {
                    console.error('Upload failed:', uploadResponse.data);
                    throw new Error('Failed to upload lease PDF');
                }

                const fileUrl = uploadResponse.data.url;

                await carbonContractsAPI.create({
                    leaseNumber: createdLease.leaseNumber,
                    name: `Lease-${createdLease.leaseNumber}.pdf (Manual)`,
                    fileUrl: fileUrl,
                    // status: 'Active', // Let backend determine status via AI
                    // greenScore: 85, // Let backend determine score via AI
                    location: savedParcelsFull[0]?.geometry, // Use geometry from saved parcel
                    // Pass manual details for AI Analysis
                    type: leaseData.type,
                    purpose: leaseData.purpose,
                    termYears: leaseData.termYears,
                    startDate: leaseData.startDate,
                    annualRentAmount: leaseData.annualRent.amount,
                    lesseeOrganization: leaseData.lesseeOrganization,
                    coordinateData: leaseData.coordinateData // Pass to backend
                });
                console.log('CarbonContract created for manual entry');

            } catch (err) {
                console.error('Error creating CarbonContract for manual entry:', err);
                // Don't block success if this fails, but log it
            }

            alert('Contract created successfully!');
            // Redirect to map (Dashboard)
            navigate('/');
            // Reset form
            // ...
            // Reset form
            setActiveStep(0);
            setCreatedParcels([]);
            setLandUnitData({ type: 'yavusa', name: '', province: '', tikina: '', tltbRef: '' });
            setLeaseData({
                leaseNumber: '',
                type: 'Conservation',
                purpose: 'Special Conservation Purpose',
                lessorLandUnit: '',
                lesseeOrganization: '',
                termYears: 50,
                startDate: '',
                annualRent: { amount: 2000, currency: 'FJD' },
                carbonParticipation: { enabled: true, mandatorySharePercentToOtherLandUnit: 5 }
            });
        } catch (error) {
            console.error('Error creating lease:', error);
            alert('Failed to create contract');
        }
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="h6" gutterBottom>Land Unit Information</Typography>

                        <Box sx={{ mb: 3, width: '100%' }}>
                            <FormControl fullWidth>
                                <InputLabel>Select Existing or Create New</InputLabel>
                                <Select
                                    value={leaseData.lessorLandUnit}
                                    label="Select Existing or Create New"
                                    onChange={(e) => setLeaseData({ ...leaseData, lessorLandUnit: e.target.value })}
                                    sx={{ width: '100%' }}
                                >
                                    <MenuItem value=""><em>Create New Land Unit</em></MenuItem>
                                    {landUnits.map(lu => (
                                        <MenuItem key={lu._id} value={lu._id}>{lu.name} ({lu.type})</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>

                        <Grid container spacing={3} sx={{ width: '100%' }}>
                            {!leaseData.lessorLandUnit && (
                                <>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Land Unit Name"
                                            value={landUnitData.name}
                                            onChange={(e) => setLandUnitData({ ...landUnitData, name: e.target.value })}
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Type</InputLabel>
                                            <Select
                                                value={landUnitData.type}
                                                label="Type"
                                                onChange={(e) => setLandUnitData({ ...landUnitData, type: e.target.value })}
                                                sx={{ width: '100%' }}
                                            >
                                                <MenuItem value="yavusa">Yavusa</MenuItem>
                                                <MenuItem value="mataqali">Mataqali</MenuItem>
                                                <MenuItem value="other">Other</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Province"
                                            value={landUnitData.province}
                                            onChange={(e) => setLandUnitData({ ...landUnitData, province: e.target.value })}
                                        />
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            fullWidth
                                            label="Tikina"
                                            value={landUnitData.tikina}
                                            onChange={(e) => setLandUnitData({ ...landUnitData, tikina: e.target.value })}
                                        />
                                    </Grid>
                                </>
                            )}
                        </Grid>
                    </Box>
                );

            case 1:
                return (
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="h6" gutterBottom>Parcel & Polygon</Typography>
                        <Button
                            variant="contained"
                            onClick={() => setShowParcelDrawer(true)}
                            disabled={!leaseData.lessorLandUnit}
                            sx={{ mb: 2 }}
                        >
                            + Draw Parcel Polygon
                        </Button>
                        {!leaseData.lessorLandUnit && (
                            <Alert severity="warning" sx={{ mb: 2 }}>
                                Please select or create a Land Unit first
                            </Alert>
                        )}
                        {createdParcels.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Created Parcels:</Typography>
                                {createdParcels.map((parcel, index) => (
                                    <Paper key={index} sx={{ p: 2, mb: 1 }}>
                                        <Typography variant="body2" fontWeight={600}>{parcel.name}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {parcel.tikina}, {parcel.province} • {parcel.areaHa} Ha
                                        </Typography>
                                    </Paper>
                                ))}
                            </Box>
                        )}
                        {showParcelDrawer && (
                            <ParcelPolygonDrawer
                                open={showParcelDrawer}
                                onClose={() => setShowParcelDrawer(false)}
                                onSave={handleSaveParcel}
                            />
                        )}
                        {showParcelDrawer && (
                            <ParcelPolygonDrawer
                                open={showParcelDrawer}
                                onClose={() => setShowParcelDrawer(false)}
                                onSave={handleSaveParcel}
                            />
                        )}

                        <Divider sx={{ my: 3 }} />
                        <Typography variant="subtitle2" gutterBottom>Or Upload Coordinates File</Typography>
                        <Alert severity="info" sx={{ mb: 2 }}>
                            If you have a CSV or TXT file with Fiji Map Grid coordinates, upload it here to improve location accuracy.
                        </Alert>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUploadIcon />}
                        >
                            Upload Coordinate File (.csv, .txt)
                            <input
                                type="file"
                                hidden
                                accept=".csv,.txt"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (ev) => {
                                            setLeaseData({ ...leaseData, coordinateData: ev.target.result });
                                            // Auto-add a "parcel" if none exists, so user can proceed
                                            if (createdParcels.length === 0) {
                                                handleSaveParcel({
                                                    name: 'Parcel from File',
                                                    areaHa: 0, // Unknown
                                                    province: 'Unknown',
                                                    tikina: 'Unknown',
                                                    points: [] // No points for drawer
                                                });
                                            }
                                        };
                                        reader.readAsText(file);
                                    }
                                }}
                            />
                        </Button>
                        {leaseData.coordinateData && (
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'success.main' }}>
                                ✅ Coordinate file loaded.
                            </Typography>
                        )}
                    </Box>
                );

            case 2:
                return (
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="h6" gutterBottom>Lease Details</Typography>
                        <Grid container spacing={3} sx={{ width: '100%' }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Lease Number"
                                    value={leaseData.leaseNumber}
                                    onChange={(e) => setLeaseData({ ...leaseData, leaseNumber: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Lessee Organization</InputLabel>
                                    <Select
                                        value={leaseData.lesseeOrganization}
                                        label="Lessee Organization"
                                        onChange={(e) => {
                                            if (e.target.value === 'create_new') {
                                                const name = prompt('Enter new organization name:');
                                                if (name) {
                                                    // Create on the fly
                                                    organizationsAPI.create({
                                                        name,
                                                        type: 'lessee',
                                                        description: 'Manually created',
                                                        verificationStatus: 'unverified'
                                                    }).then(res => {
                                                        if (res.status >= 400) {
                                                            throw new Error(res.data?.message || 'Failed to create organization');
                                                        }
                                                        setOrganizations([...organizations, res.data.data]);
                                                        setLeaseData({ ...leaseData, lesseeOrganization: res.data.data._id });
                                                    }).catch(err => {
                                                        console.error('Failed to create org:', err);
                                                        alert(`Failed to create organization: ${err.message || 'Unknown error'}`);
                                                    });
                                                }
                                            } else {
                                                setLeaseData({ ...leaseData, lesseeOrganization: e.target.value });
                                            }
                                        }}
                                        sx={{ width: '100%' }}
                                    >
                                        <MenuItem value="create_new" sx={{ fontWeight: 'bold', color: 'primary.main' }}>+ Create New Organization</MenuItem>
                                        {organizations.map(org => (
                                            <MenuItem key={org._id} value={org._id}>{org.name} ({org.type})</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Type</InputLabel>
                                    <Select
                                        value={leaseData.type}
                                        label="Type"
                                        onChange={(e) => setLeaseData({ ...leaseData, type: e.target.value })}
                                        sx={{ width: '100%' }}
                                    >
                                        <MenuItem value="Conservation">Conservation</MenuItem>
                                        <MenuItem value="Agriculture">Agriculture</MenuItem>
                                        <MenuItem value="Residential">Residential</MenuItem>
                                        <MenuItem value="Commercial">Commercial</MenuItem>
                                        <MenuItem value="Industrial">Industrial</MenuItem>
                                        <MenuItem value="Tourism">Tourism</MenuItem>
                                        <MenuItem value="Religious">Religious</MenuItem>
                                        <MenuItem value="Educational">Educational</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Start Date"
                                    type="date"
                                    InputLabelProps={{ shrink: true }}
                                    value={leaseData.startDate}
                                    onChange={(e) => setLeaseData({ ...leaseData, startDate: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Term (Years)"
                                    type="number"
                                    value={leaseData.termYears}
                                    onChange={(e) => setLeaseData({ ...leaseData, termYears: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Annual Rent Amount"
                                    type="number"
                                    value={leaseData.annualRent.amount}
                                    onChange={(e) => setLeaseData({ ...leaseData, annualRent: { ...leaseData.annualRent, amount: e.target.value === '' ? '' : parseInt(e.target.value) } })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Currency</InputLabel>
                                    <Select
                                        value={leaseData.annualRent.currency}
                                        label="Currency"
                                        onChange={(e) => setLeaseData({ ...leaseData, annualRent: { ...leaseData.annualRent, currency: e.target.value } })}
                                        sx={{ width: '100%' }}
                                    >
                                        <MenuItem value="FJD">FJD</MenuItem>
                                        <MenuItem value="USD">USD</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={leaseData.carbonParticipation.enabled}
                                            onChange={(e) => setLeaseData({ ...leaseData, carbonParticipation: { ...leaseData.carbonParticipation, enabled: e.target.checked } })}
                                        />
                                    }
                                    label="Enable Carbon Trading Participation"
                                />
                            </Grid>
                        </Grid>
                    </Box >
                );

            case 3:
                return (
                    <Box sx={{ width: '100%' }}>
                        <Typography variant="h6" gutterBottom>Review & Submit</Typography>
                        <Paper sx={{ p: 3, mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Land Unit</Typography>
                            <Typography variant="body2">
                                {landUnits.find(lu => lu._id === leaseData.lessorLandUnit)?.name || landUnitData.name}
                            </Typography>
                        </Paper>
                        <Paper sx={{ p: 3, mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>Parcels ({createdParcels.length})</Typography>
                            {createdParcels.map((parcel, index) => (
                                <Typography key={index} variant="body2">
                                    {parcel.name} - {parcel.areaHa} Ha
                                </Typography>
                            ))}
                        </Paper>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="subtitle2" gutterBottom>Lease Details</Typography>
                            <Typography variant="body2">Lease #{leaseData.leaseNumber}</Typography>
                            <Typography variant="body2">{leaseData.type} • {leaseData.termYears} Years</Typography>
                            <Typography variant="body2">Annual Rent: ${leaseData.annualRent.amount} {leaseData.annualRent.currency}</Typography>
                        </Paper>
                    </Box>
                );

            default:
                return 'Unknown step';
        }
    };

    return (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4, flexShrink: 0 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            <Box sx={{ flex: 1, width: '100%', overflowY: 'auto', mb: 2 }}>
                {renderStepContent(activeStep)}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 'auto', pt: 2, borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                >
                    Back
                </Button>
                <Button
                    variant="contained"
                    onClick={handleNext}
                >
                    {activeStep === steps.length - 1 ? 'Submit' : 'Next'}
                </Button>
            </Box>
        </Box>
    );
};

export default ManualContractEntry;
