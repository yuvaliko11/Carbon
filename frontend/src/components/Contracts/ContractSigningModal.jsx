import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import DigitalSignature from './DigitalSignature';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Paper,
    Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreateIcon from '@mui/icons-material/Create';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const ContractSigningModal = ({ leaseData, onClose, onSigned }) => {
    const [step, setStep] = useState('review'); // review, sign, complete
    const [signedPdfUrl, setSignedPdfUrl] = useState(null);

    const generatePDF = (signatureDataUrl) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);

        // Header
        doc.setFontSize(20);
        doc.text('AGREEMENT FOR LEASE', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text('(Special Conservation Purpose)', pageWidth / 2, 30, { align: 'center' });

        // Lease Details
        doc.setFontSize(10);
        let y = 50;
        doc.text(`Lease Number: ${leaseData.leaseNumber}`, margin, y); y += 10;
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, y); y += 10;
        doc.text(`Term: ${leaseData.termYears} Years`, margin, y); y += 10;
        doc.text(`Annual Rent: $${leaseData.annualRent.amount} ${leaseData.annualRent.currency}`, margin, y); y += 15;

        // Parties
        doc.setFontSize(12);
        doc.text('BETWEEN:', margin, y); y += 10;
        doc.setFontSize(10);
        doc.text('The iTaukei Land Trust Board (The Lessor)', margin + 10, y); y += 10;
        doc.text('AND', margin, y); y += 10;
        doc.text(`${leaseData.lesseeOrganization?.name || 'The Lessee'} (The Lessee)`, margin + 10, y); y += 15;

        // Special Conditions (Lease 4159)
        doc.setFontSize(12);
        doc.text('SPECIAL CONDITIONS:', margin, y); y += 10;
        doc.setFontSize(10);

        const conditions = [
            '1. The Lessee shall use the land solely for Special Conservation Purposes.',
            '2. Transfer Fees: Upon any transfer, a fee of 20-25% of the sale price is payable to the Lessor.',
            '3. Carbon Participation: The Lessee agrees to engage with landowners regarding carbon projects.',
            '4. Benefit Sharing: 5% of all carbon unit sale proceeds from demarcated areas shall be paid to the secondary landowning unit.'
        ];

        conditions.forEach(condition => {
            const splitText = doc.splitTextToSize(condition, contentWidth);
            doc.text(splitText, margin, y);
            y += (splitText.length * 7);
        });

        y += 20;

        // Signature Area
        doc.text('Signed by the Lessee:', margin, y);
        if (signatureDataUrl) {
            doc.addImage(signatureDataUrl, 'PNG', margin, y + 5, 60, 30);
            doc.text('_______________________', margin, y + 40);
            doc.text('Authorized Signatory', margin, y + 45);
        }

        return doc;
    };

    const handleSignatureSave = (signatureDataUrl) => {
        const doc = generatePDF(signatureDataUrl);
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);

        setSignedPdfUrl(pdfUrl);
        setStep('complete');

        if (onSigned) {
            onSigned(pdfBlob);
        }
    };

    return (
        <Dialog
            open={true}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: '12px', padding: 2 }
            }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box>
                    <Typography variant="h5" fontWeight="bold">Sign Lease Agreement</Typography>
                    <Typography variant="body2" color="text.secondary">Lease #{leaseData.leaseNumber}</Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                {step === 'review' && (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Paper variant="outlined" sx={{ p: 4, flexGrow: 1, overflowY: 'auto', maxHeight: '50vh', bgcolor: '#fafafa', fontFamily: 'serif' }}>
                            <Typography variant="h6" align="center" gutterBottom sx={{ fontFamily: 'serif', fontWeight: 'bold' }}>
                                AGREEMENT FOR LEASE
                            </Typography>
                            <Typography paragraph sx={{ fontFamily: 'serif' }}>
                                <strong>THIS LEASE</strong> is made on {new Date().toLocaleDateString()} between the iTaukei Land Trust Board (Lessor) and {leaseData.lesseeOrganization?.name || '[Lessee Name]'} (Lessee).
                            </Typography>
                            <Typography paragraph sx={{ fontFamily: 'serif' }}>
                                <strong>WHEREAS</strong> the Lessor agrees to lease the land known as {leaseData.lessorLandUnit?.name || '[Land Unit]'} for a term of {leaseData.termYears} years.
                            </Typography>

                            <Typography variant="subtitle1" sx={{ fontFamily: 'serif', fontWeight: 'bold', mt: 3, mb: 1 }}>
                                SPECIAL CONDITIONS
                            </Typography>
                            <List dense>
                                {[
                                    'The Lessee shall use the land solely for Special Conservation Purposes.',
                                    'Transfer Fees: Upon any transfer, a fee of 20-25% of the sale price is payable to the Lessor.',
                                    'Carbon Participation: The Lessee agrees to engage with landowners regarding carbon projects.',
                                    'Benefit Sharing: 5% of all carbon unit sale proceeds from demarcated areas shall be paid to the secondary landowning unit.'
                                ].map((text, index) => (
                                    <ListItem key={index} alignItems="flex-start" sx={{ pl: 0 }}>
                                        <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                                            <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                                        </ListItemIcon>
                                        <ListItemText primary={text} primaryTypographyProps={{ fontFamily: 'serif' }} />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<CreateIcon />}
                                onClick={() => setStep('sign')}
                                sx={{ borderRadius: '8px', px: 4 }}
                            >
                                Proceed to Sign
                            </Button>
                        </Box>
                    </Box>
                )}

                {step === 'sign' && (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6">Please sign below to accept the terms</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Your signature will be embedded into the final PDF contract.
                            </Typography>
                        </Box>
                        <DigitalSignature onSave={handleSignatureSave} onCancel={() => setStep('review')} />
                    </Box>
                )}

                {step === 'complete' && (
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, py: 4 }}>
                        <Box sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            bgcolor: 'success.light',
                            color: 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <CheckCircleIcon sx={{ fontSize: 48, color: 'white' }} />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>Contract Signed Successfully!</Typography>
                            <Typography color="text.secondary">The digital contract has been generated and secured.</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                href={signedPdfUrl}
                                download={`Lease_${leaseData.leaseNumber}_Signed.pdf`}
                                size="large"
                                sx={{ bgcolor: 'text.primary', '&:hover': { bgcolor: 'text.secondary' } }}
                            >
                                Download PDF
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={onClose}
                                size="large"
                            >
                                Close
                            </Button>
                        </Box>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ContractSigningModal;
