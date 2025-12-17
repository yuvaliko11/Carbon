import React, { useState, useEffect } from 'react';
import { Box, Typography, keyframes, useTheme } from '@mui/material';
import { AutoAwesome as SparkleIcon } from '@mui/icons-material';

const pulse = keyframes`
  0% { opacity: 0.4; transform: scale(0.95); }
  50% { opacity: 1; transform: scale(1.05); }
  100% { opacity: 0.4; transform: scale(0.95); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const ThinkingAnimation = ({ mode = 'chat' }) => {
    const theme = useTheme();
    const [phraseIndex, setPhraseIndex] = useState(0);

    // Context-specific phrases
    const uploadPhrases = [
        { primary: "Uploading document...", secondary: "Securely transferring file..." },
        { primary: "Extracting text...", secondary: "Running OCR character recognition..." },
        { primary: "Parsing metadata...", secondary: "Identifying lease number, term, and parties..." },
        { primary: "Georeferencing...", secondary: "Constructing digital map polygon..." },
        { primary: "Analyzing clauses...", secondary: "Extracting legal obligations and covenants..." },
        { primary: "Evaluating carbon eligibility...", secondary: "Calculating Green Score based on term..." },
        { primary: "Verifying data...", secondary: "Cross-checking extracted entities..." },
        { primary: "Structuring data...", secondary: "Formatting deep JSON properties..." },
        { primary: "Finalizing...", secondary: "Saving contract to repository..." }
    ];

    const chatPhrases = [
        { primary: "Reading context...", secondary: "Reviewing selected contract details..." },
        { primary: "Consulting AI model...", secondary: "Interpreting your question..." },
        { primary: "Drafting response...", secondary: "Formulating clear explanation..." }
    ];

    // Pick phrases based on mode
    const phrases = mode === 'upload' ? uploadPhrases : chatPhrases;

    useEffect(() => {
        // Reset index when mode changes
        setPhraseIndex(0);
    }, [mode]);

    useEffect(() => {
        const interval = setInterval(() => {
            setPhraseIndex((prev) => {
                // Don't loop efficiently; stay on last item if we run out of "steps"
                if (prev >= phrases.length - 1) return prev;
                return prev + 1;
            });
        }, 4500); // Progress every 4.5 seconds for slower, deeper feel

        return () => clearInterval(interval);
    }, [phrases.length]);

    return (
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main || '#9c27b0'})`,
                    backgroundSize: '200% 200%',
                    animation: `${pulse} 2s infinite ease-in-out, ${gradientFlow} 3s ease infinite`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    mt: 0.5 // Align with first line of text
                }}
            >
                <SparkleIcon sx={{ fontSize: 14, color: 'white' }} />
            </Box>
            <Box>
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 600,
                        background: `linear-gradient(90deg, ${theme.palette.text.primary}, ${theme.palette.text.secondary})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: `${pulse} 2s infinite ease-in-out`,
                    }}
                >
                    {phrases[phraseIndex].primary}
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: 'text.secondary',
                        display: 'block',
                        mt: 0.5,
                        fontStyle: 'italic',
                        animation: 'fadeIn 0.5s ease-in'
                    }}
                >
                    {phrases[phraseIndex].secondary}
                </Typography>
            </Box>
        </Box>
    );
};

export default ThinkingAnimation;
