import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, Button, Typography, Paper } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';

const DigitalSignature = ({ onSave, onCancel }) => {
    const sigCanvas = useRef({});
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigCanvas.current.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (sigCanvas.current.isEmpty()) {
            alert('Please provide a signature first.');
            return;
        }
        const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
        onSave(dataURL);
    };

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Paper
                variant="outlined"
                sx={{
                    width: '100%',
                    mb: 2,
                    position: 'relative',
                    bgcolor: '#fafafa',
                    borderRadius: 2,
                    overflow: 'hidden',
                    borderStyle: 'dashed',
                    borderWidth: 2
                }}
            >
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        className: 'signature-canvas',
                        style: { width: '100%', height: '200px', cursor: 'crosshair', display: 'block' }
                    }}
                    onBegin={() => setIsEmpty(false)}
                />
                {isEmpty && (
                    <Box
                        sx={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                            color: 'text.disabled'
                        }}
                    >
                        <Typography variant="body1">Sign here</Typography>
                    </Box>
                )}
            </Paper>

            <Box sx={{ display: 'flex', gap: 2, width: '100%', justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={clear}
                    startIcon={<ClearIcon />}
                    color="inherit"
                >
                    Clear
                </Button>
                <Button
                    variant="contained"
                    onClick={save}
                    startIcon={<CheckIcon />}
                    color="success"
                    disabled={isEmpty}
                >
                    Confirm Signature
                </Button>
            </Box>
        </Box>
    );
};

export default DigitalSignature;
