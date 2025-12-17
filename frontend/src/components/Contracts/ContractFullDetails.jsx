import React, { useState } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Grid,
    Paper,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Button
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

// Tab Panel Component
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`contract-tabpanel-${index}`}
            aria-labelledby={`contract-tab-${index}`}
            {...other}
            style={{ height: '100%', overflowY: 'auto' }}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const ContractFullDetails = ({ contract }) => {
    const [tabIndex, setTabIndex] = useState(0);

    if (!contract) return null;

    const handleTabChange = (event, newValue) => {
        setTabIndex(newValue);
    };

    // Helper for data rows
    const DataRow = ({ label, value, isCurrency = false }) => (
        <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
            <TableCell component="th" scope="row" sx={{ fontWeight: 600, width: '40%', color: 'text.secondary', borderBottom: '1px solid #f0f0f0', py: 2 }}>
                {label}
            </TableCell>
            <TableCell sx={{ borderBottom: '1px solid #f0f0f0', fontWeight: 500, color: '#222', py: 2 }}>
                {isCurrency && value ? `$${value?.toLocaleString() || '0'}` : (value || '-')}
            </TableCell>
        </TableRow>
    );

    // Normalize file URL
    const getPublicFileUrl = (pathOrUrl) => {
        if (!pathOrUrl) return null;
        if (pathOrUrl.startsWith('http')) return pathOrUrl;
        const filename = pathOrUrl.split(/[/\\]/).pop();
        return `/uploads/${filename}`;
    };

    const rawFileUrl = contract.fileUrl || contract.file_url || contract.url || contract.path;
    const fileUrl = getPublicFileUrl(rawFileUrl);
    const data = contract.extractedData || {};

    const getStatusColor = (status) => {
        const lowerStatus = (status || '').toLowerCase();
        if (lowerStatus === 'compliant' || lowerStatus === 'active') return 'success';
        if (lowerStatus === 'warning') return 'warning';
        if (lowerStatus === 'breach' || lowerStatus === 'error') return 'error';
        return 'default';
    };

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: '1px solid #f2f2f2', bgcolor: 'white', px: 2 }}>
                <Tabs
                    value={tabIndex}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            minHeight: 56,
                            color: '#717171',
                            '&.Mui-selected': {
                                color: '#222',
                            }
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#222',
                            height: 3
                        }
                    }}
                >
                    <Tab label="Overview" />
                    <Tab label="Financials" />
                    <Tab label="Land & Location" />
                    <Tab label="Dates & Terms" />
                    <Tab label="Covenants" />
                    <Tab label="Documents" />
                </Tabs>
            </Box>

            {/* Content Content - Flexible logic */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>

                {/* 1. OVERVIEW */}
                <TabPanel value={tabIndex} index={0}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={7}>
                            <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>General Information</Typography>
                            <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 4, borderRadius: 3 }}>
                                <Table size="small">
                                    <TableBody>
                                        <DataRow label="Lease Number" value={data.general?.leaseNumber || contract.leaseNumber} />
                                        <DataRow label="File Reference" value={data.general?.fileReference || contract.tltbFileRef} />
                                        <DataRow label="Lease Type" value={data.general?.leaseType || contract.type} />
                                        <DataRow label="Regulation" value={data.general?.regulation} />
                                        <DataRow label="Date of Approval" value={data.general?.approvalDate} />
                                        <DataRow label="Registration Date" value={data.general?.registrationDate} />
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>Key Parties</Typography>

                            <Box sx={{ mb: 4 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: '0.5px' }}>TENANT (LESSEE)</Typography>
                                <Typography variant="h6" fontWeight="600" sx={{ mt: 1 }}>{data.parties?.lessee || contract.tenant_name || 'N/A'}</Typography>
                                <Typography variant="body2" color="text.secondary">Registered Office: {data.parties?.lesseeOffice || '-'}</Typography>
                                <Typography variant="body2" color="text.secondary">Signatory: {data.parties?.lesseeSignatory || '-'}</Typography>
                            </Box>

                            <Divider sx={{ mb: 4 }} />

                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ letterSpacing: '0.5px' }}>LANDOWNER (LESSOR)</Typography>
                                <Typography variant="h6" fontWeight="600" sx={{ mt: 1 }}>{data.parties?.lessor || contract.owner_name || 'iTaukei Land Trust Board'}</Typography>
                                <Typography variant="body2" color="text.secondary">Address: {data.parties?.lessorAddress || '431 Victoria Parade, Suva'}</Typography>
                            </Box>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Paper sx={{
                                p: 3,
                                borderRadius: 3,
                                border: '1px solid #dddddd',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
                                bgcolor: '#ffffff'
                            }} elevation={0}>
                                <Typography variant="subtitle1" fontWeight="700" gutterBottom>Analysis</Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    AI-generated insights for this contract layout and compliance.
                                </Typography>

                                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                    <Box sx={{ flex: 1, p: 2, bgcolor: '#f7f7f7', borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary" display="block">Green Score</Typography>
                                        <Typography variant="h4" fontWeight="800" color={getStatusColor(contract.complianceStatus || contract.status || 'Active') + ".main"}>
                                            {contract.greenScore || '-'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1, p: 2, bgcolor: '#f7f7f7', borderRadius: 2, textAlign: 'center' }}>
                                        <Typography variant="caption" color="text.secondary" display="block">Compliance</Typography>
                                        <Typography variant="body1" fontWeight="700" sx={{ mt: 1, textTransform: 'capitalize' }}>
                                            {contract.complianceStatus || contract.status || 'N/A'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {(() => {
                                            const analysis = contract.extractedData?.analysis || contract.aiAnalysis;
                                            if (!analysis) return "No text analysis available.";
                                            if (typeof analysis === 'string') {
                                                if (analysis.trim().startsWith('{')) {
                                                    try {
                                                        const parsed = JSON.parse(analysis);
                                                        return parsed.summary || parsed.text || "Analysis complete.";
                                                    } catch (e) { return analysis; }
                                                }
                                                return analysis;
                                            }
                                            if (typeof analysis === 'object') {
                                                return analysis.summary || analysis.text || "No critical issues detected.";
                                            }
                                            return "";
                                        })()}
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </TabPanel>

                {/* 2. FINANCIALS */}
                <TabPanel value={tabIndex} index={1}>
                    <Box sx={{ maxWidth: 800 }}>
                        <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>Financial Details</Typography>
                        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                            <TableContainer>
                                <Table>
                                    <TableBody>
                                        <DataRow label="Initial Consideration" value={data.financial?.initialConsideration} isCurrency />
                                        <DataRow label="Annual Rent Amount" value={data.financial?.annualRent || contract.annualRent?.amount} isCurrency />
                                        <DataRow label="Rent Due Date" value={data.financial?.rentDueDate} />
                                        <DataRow label="Rent Reassessment" value={data.financial?.rentReassessment} />
                                        <DataRow label="Administration Fee" value={data.financial?.adminFee} isCurrency />
                                        <DataRow label="Fee Adjustment" value={data.financial?.feeAdjustment} />
                                        <DataRow label="Currency" value={contract.annualRent?.currency || 'FJD'} />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                </TabPanel>

                {/* 3. LAND & LOCATION */}
                <TabPanel value={tabIndex} index={2}>
                    <Box sx={{ maxWidth: 800 }}>
                        <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>Property Details</Typography>
                        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 4, border: '1px solid #e0e0e0' }}>
                            <TableContainer>
                                <Table>
                                    <TableBody>
                                        <DataRow label="Land Name" value={data.land?.name || contract.land_type} />
                                        <DataRow label="Owner (LOU)" value={data.land?.owner || contract.mataqaliName} />
                                        <DataRow label="Province" value={data.land?.province || contract.parcels?.[0]?.parcel?.province || 'Ba'} />
                                        <DataRow label="Tikina" value={data.land?.tikina || contract.parcels?.[0]?.parcel?.tikina || 'Vuda'} />
                                        <DataRow label="Total Area" value={data.land?.totalArea || contract.parcels?.[0]?.parcel?.areaHa || 100} />
                                        <DataRow label="Tokatoka Number" value={data.land?.tokatoka} />
                                        <DataRow label="TLC Lot" value={data.land?.tlcLot} />
                                        <DataRow label="Sheet Reference" value={data.land?.sheetRef} />
                                        <DataRow label="Final Report" value={data.land?.finalReport} />
                                        <DataRow label="Map Identification" value={data.land?.['map identification']} />
                                        <DataRow label="Infrastructure" value={data.land?.infrastructure} />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        <Typography variant="subtitle1" fontWeight="700" gutterBottom>Geospatial & Map Data</Typography>
                        <Paper sx={{ p: 3, bgcolor: '#f7f7f7', fontFamily: 'monospace', borderRadius: 3, maxHeight: 200, overflow: 'auto', fontSize: '0.85rem' }}>
                            {contract.location?.coordinates ? JSON.stringify(contract.location.coordinates, null, 2) : 'No geospatial data found.'}
                        </Paper>
                    </Box>
                </TabPanel>

                {/* 4. DATES & TERMS */}
                <TabPanel value={tabIndex} index={3}>
                    <Box sx={{ maxWidth: 800 }}>
                        <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>Terms & Timelines</Typography>
                        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 4, border: '1px solid #e0e0e0' }}>
                            <TableContainer>
                                <Table>
                                    <TableBody>
                                        <DataRow label="Lease Duration" value={data.term?.durationYears ? `${data.term.durationYears} Years` : `${contract.termYears || 50} Years`} />
                                        <DataRow label="Start Date" value={data.term?.startDate || (contract.startDate ? new Date(contract.startDate).toLocaleDateString() : null)} />
                                        <DataRow label="Expiry Date" value={contract.expiryDate ? new Date(contract.expiryDate).toLocaleDateString() : 'Calculated automatically'} />
                                        <DataRow label="Uploaded On" value={contract.createdAt ? new Date(contract.createdAt).toLocaleString() : null} />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>Special Conditions</Typography>
                        <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
                            <TableContainer>
                                <Table>
                                    <TableBody>
                                        <DataRow label="Sales (With Improvements)" value={data.specialConditions?.salesWithImprovements} />
                                        <DataRow label="Sales (No Improvements)" value={data.specialConditions?.salesNoImprovements} />
                                        <DataRow label="Mortgagee Sale Exception" value={data.specialConditions?.mortgageeSale} />
                                        <DataRow label="Carbon Trading" value={data.specialConditions?.carbonTrading} />
                                        <DataRow label="Revenue Sharing" value={data.specialConditions?.revenueSharing} />
                                        <DataRow label="Dispute Resolution" value={data.specialConditions?.disputeResolution} />
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Box>
                </TabPanel>

                {/* 5. COVENANTS */}
                <TabPanel value={tabIndex} index={4}>
                    <Box sx={{ maxWidth: 800 }}>
                        <Typography variant="h6" fontWeight="700" sx={{ mb: 3 }}>Lessee Covenants & Obligations</Typography>
                        {data.covenants && data.covenants.length > 0 ? (
                            <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, p: 3, border: '1px solid #e0e0e0' }}>
                                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                    {data.covenants.map((cov, idx) => (
                                        <Box component="li" key={idx} sx={{ mb: 2, '&:last-child': { mb: 0 } }}>
                                            <Typography variant="body1">{cov}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Paper>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No specific covenants extracted.</Typography>
                        )}
                    </Box>
                </TabPanel>

                {/* 6. DOCUMENTS */}
                <TabPanel value={tabIndex} index={5}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Paper
                                sx={{
                                    p: 3,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderRadius: 3,
                                    border: '1px solid #e0e0e0',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        borderColor: '#222',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }
                                }}
                                elevation={0}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Box sx={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 2,
                                        bgcolor: '#fff0f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#d32f2f'
                                    }}>
                                        <DescriptionIcon />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="700">Main Contract File</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {fileUrl ? 'PDF Document • Ready to view' : 'Missing File'}
                                        </Typography>
                                    </Box>
                                </Box>
                                {fileUrl && (
                                    <Button
                                        variant="outlined"
                                        onClick={() => window.open(fileUrl, '_blank')}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: 2,
                                            color: '#222',
                                            borderColor: '#222',
                                            fontWeight: 600,
                                            '&:hover': {
                                                borderColor: '#000',
                                                bgcolor: '#f7f7f7'
                                            }
                                        }}
                                    >
                                        View
                                    </Button>
                                )}
                            </Paper>
                        </Grid>
                        {/* PDF Preview Frame - Added for "Full Report Card" Feel */}
                        {fileUrl && (
                            <Grid item xs={12}>
                                <Paper elevation={0} sx={{ height: 600, border: '1px solid #ddd', borderRadius: 2, overflow: 'hidden' }}>
                                    <iframe src={fileUrl} width="100%" height="100%" title="PDF Preview" style={{ border: 0 }} />
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </TabPanel>

            </Box>
        </Box>
    );
};

export default ContractFullDetails;
