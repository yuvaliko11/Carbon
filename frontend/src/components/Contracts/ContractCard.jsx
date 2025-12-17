import React, { useState } from 'react';
import { Box, Typography, Card, CardMedia, CardContent, Chip, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CircleIcon from '@mui/icons-material/Circle';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// --- Styled Components ---

const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: '12px',
    boxShadow: 'none', // Flat start, like Airbnb
    backgroundColor: 'transparent', // Let parent handle background
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        // Airbnb doesn't typically raise significantly, but maybe just a subtle change or image carousel arrows appearing
    },
}));

const ImageContainer = styled(Box)({
    position: 'relative',
    aspectRatio: '1 / 0.95', // Slightly taller than square, typical for listings
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '10px',
    backgroundColor: '#f0f0f0', // Placeholder gray
});

const CardImage = styled('img')({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.5s ease',
    '&:hover': {
        transform: 'scale(1.05)', // Subtle zoom on hover
    }
});

const HeartButton = styled(IconButton)({
    position: 'absolute',
    top: '8px',
    right: '8px',
    color: 'white',
    padding: '6px',
    zIndex: 2,
    '& svg': {
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))', // improved visibility against images
    }
});

const DescriptionRow = styled(Box)({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '2px',
});

const TitleText = styled(Typography)({
    fontWeight: 600,
    fontSize: '15px',
    color: '#222222',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const SubtitleText = styled(Typography)({
    fontSize: '15px',
    color: '#717171',
    marginBottom: '2px',
});

const PriceText = styled(Typography)({
    fontWeight: 600,
    fontSize: '15px',
    color: '#222222',
    marginTop: '6px',
});

const StatusBadge = styled(Box)(({ status }) => {
    let color = '#717171';
    if (status === 'Active') color = '#00A86B'; // Green
    if (status === 'Draft') color = '#F59E0B'; // Orange
    if (status === 'Expired') color = '#EF4444'; // Red

    return {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '14px',
        color: '#222222',
        '& svg': {
            width: '10px',
            height: '10px',
            color: color,
        }
    };
});

// --- Component ---

const ContractCard = ({ contract, onClick, onMouseEnter, onMouseLeave }) => {
    const [liked, setLiked] = useState(false);

    // Fallback image logic
    const imageUrl = contract.documents && contract.documents.length > 0
        ? 'https://source.unsplash.com/random/400x400/?nature,forest,fiji' // Placeholder for demo, replace with real doc preview if avail
        : 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'; // Generic jungle

    const annualRent = contract.annualRent?.amount
        ? `$${contract.annualRent.amount.toLocaleString()} ${contract.annualRent.currency || 'FJD'}`
        : 'No Rent Data';

    return (
        <StyledCard
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <ImageContainer>
                <CardImage src={imageUrl} alt={contract.leaseNumber} />
                <HeartButton onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}>
                    {liked ? <FavoriteIcon sx={{ color: '#FF385C' }} /> : <FavoriteBorderIcon />}
                </HeartButton>
                {/* Status Overlay could go here similar to 'Guest favorite' badge */}
                <Box sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'rgba(255,255,255,0.9)', px: 1, py: 0.5, borderRadius: 1, fontSize: '12px', fontWeight: 600 }}>
                    {contract.status || 'Draft'}
                </Box>
            </ImageContainer>

            <Box>
                <DescriptionRow>
                    <TitleText variant="body1">{contract.lessorLandUnit?.name || 'Unknown Land Unit'}</TitleText>
                    <StatusBadge status={contract.status}>
                        <CircleIcon />
                        <Typography variant="caption">{contract.greenScore ? `${contract.greenScore} Score` : 'New'}</Typography>
                    </StatusBadge>
                </DescriptionRow>

                <SubtitleText>{contract.leaseNumber}</SubtitleText>
                <SubtitleText>{contract.details || `${contract.termYears || 50} Year Term`}</SubtitleText>

                <PriceText>
                    {annualRent} <Typography component="span" variant="body2" color="text.secondary"> year</Typography>
                </PriceText>
            </Box>
        </StyledCard>
    );
};

export default ContractCard;
