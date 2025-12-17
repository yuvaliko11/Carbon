import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
} from '@mui/material';

const ConfirmDialog = ({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    severity = 'error', // 'error' | 'primary' | 'warning'
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            container={document.body}
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
                    minWidth: '300px',
                }
            }}
            sx={{ zIndex: 1500 }}
        >
            <DialogTitle sx={{ fontWeight: 600 }}>{title}</DialogTitle>
            <DialogContent>
                <Typography>
                    {message}
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button
                    onClick={onClose}
                    sx={{ color: '#222222', fontWeight: 600, textTransform: 'none' }}
                >
                    {cancelLabel}
                </Button>
                <Button
                    onClick={onConfirm}
                    color={severity}
                    variant="contained"
                    sx={{ fontWeight: 600, textTransform: 'none', borderRadius: '8px' }}
                >
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;
