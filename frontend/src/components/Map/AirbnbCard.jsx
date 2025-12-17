import React, { useState, useEffect } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HomeIcon from '@mui/icons-material/Home';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import BusinessIcon from '@mui/icons-material/Business';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { styled } from '@mui/material/styles';

const CardContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '362px',
  maxWidth: '90vw',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)',
  cursor: 'pointer',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  [theme.breakpoints.down('sm')]: {
    width: '90vw',
    maxWidth: '90vw',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
  },
}));

const ImageContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '200px',
  backgroundColor: '#DDDDDD',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
});

const ImageWrapper = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
});

const ImageSlide = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease-in-out',
  '&.entering-left': {
    transform: 'translateX(100%)',
    opacity: 0,
  },
  '&.entering-right': {
    transform: 'translateX(-100%)',
    opacity: 0,
  },
  '&.active': {
    transform: 'translateX(0)',
    opacity: 1,
  },
  '&.exiting-left': {
    transform: 'translateX(-100%)',
    opacity: 0,
  },
  '&.exiting-right': {
    transform: 'translateX(100%)',
    opacity: 0,
  },
});

const ImagePlaceholder = styled(Box)({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: '48px',
  opacity: 0.8,
});

const ImageOverlay = styled(Box)({
  position: 'absolute',
  bottom: '12px',
  left: '12px',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  color: 'white',
  padding: '6px 12px',
  borderRadius: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  fontWeight: 600,
  backdropFilter: 'blur(10px)',
  zIndex: 3,
  pointerEvents: 'none',
});


const NavButton = styled(IconButton)({
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  width: '32px',
  height: '32px',
  minWidth: '44px',
  minHeight: '44px',
  padding: 0,
  backdropFilter: 'blur(10px)',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  pointerEvents: 'auto',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    transform: 'translateY(-50%) scale(1.1)',
  },
  '&:active': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    transform: 'translateY(-50%) scale(0.95)',
  },
  zIndex: 10,
  transition: 'all 0.2s ease',
  '&.left': {
    left: '16px',
  },
  '&.right': {
    right: '16px',
  },
});

const CloseButton = styled(IconButton)({
  position: 'absolute',
  top: '12px',
  left: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  width: '32px',
  height: '32px',
  padding: 0,
  backdropFilter: 'blur(10px)',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    transform: 'scale(1.1)',
  },
  '&:active': {
    backgroundColor: 'rgba(255, 255, 255, 1)',
    transform: 'scale(0.95)',
  },
  zIndex: 10,
  transition: 'all 0.2s ease',
  pointerEvents: 'auto',
});

const ContentContainer = styled(Box)({
  padding: '16px',
  paddingBottom: '20px',
});

const TitleRow = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '8px',
});

const Title = styled(Typography)({
  fontSize: '16px',
  fontWeight: 600,
  color: '#222222',
  lineHeight: 1.375,
  flex: 1,
  marginRight: '8px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
});

const Subtitle = styled(Typography)({
  fontSize: '15px',
  fontWeight: 400,
  color: '#222222',
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

const InfoRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
  flexWrap: 'wrap',
});

const AddressText = styled(Typography)({
  fontSize: '13px',
  color: '#717171',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '6px',
  marginTop: '8px',
  lineHeight: 1.4,
});


const AirbnbCard = ({ site, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('right');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Get site data - handle both direct properties and nested structure
  const siteData = site.properties || site;
  const siteName = siteData.name || 'Site';
  const siteAddress = siteData.address || 'Address not available';
  const siteDescription = siteData.description;
  const propertyCount = siteData.propertyCount || 0;
  const propertyType = siteData.propertyType;
  const area = siteData.area;
  
  // Determine if this is a site, asset, or carbon contract
  const isSite = siteData.type === 'site' || (siteData.type !== 'property' && siteData.type !== 'carbon-contract' && propertyCount !== undefined);
  const isAsset = siteData.type === 'property';
  const isCarbonContract = siteData.type === 'carbon-contract';
  
  // Carbon contract specific fields
  const status = siteData.status;
  const payoutAmount = siteData.payoutAmount;
  const greenScore = siteData.greenScore;
  const mataqaliName = siteData.mataqaliName;
  
  // Get status color for carbon contracts
  const getStatusColor = (status) => {
    switch (status) {
      case 'compliant': return '#4caf50'; // Green
      case 'warning': return '#ff9800'; // Orange
      case 'breach': return '#f44336'; // Red
      default: return '#757575'; // Gray
    }
  };
  
  // Collect all available images with their source asset names
  const allImages = [];
  
  // Add site image if it exists (mark as site image)
  if (siteData.image) {
    allImages.push({
      path: siteData.image,
      assetName: siteName,
      source: 'site'
    });
  }
  
  // Add images from siteData.images array (site-level images)
  if (siteData.images && Array.isArray(siteData.images)) {
    siteData.images.forEach(img => {
      const imagePath = typeof img === 'string' ? img : img.path;
      if (imagePath && !allImages.find(i => i.path === imagePath)) {
        allImages.push({
          path: imagePath,
          assetName: siteName,
          source: 'site'
        });
      }
    });
  }
  
  // Add images from all properties with their asset names
  if (siteData.properties && Array.isArray(siteData.properties)) {
    siteData.properties.forEach(property => {
      if (property.images && Array.isArray(property.images)) {
        property.images.forEach(img => {
          const imagePath = typeof img === 'string' ? img : img.path;
          if (imagePath && !allImages.find(i => i.path === imagePath)) {
            allImages.push({
              path: imagePath,
              assetName: property.name || 'Asset',
              source: 'asset'
            });
          }
        });
      }
    });
  }

  // Reset index when images change
  useEffect(() => {
    setCurrentImageIndex(0);
    setSlideDirection('right');
  }, [allImages.length]);

  const handleClose = (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (onClose) {
      onClose();
    }
  };

  const handlePreviousImage = (e) => {
    e.stopPropagation();
    if (isTransitioning) return;
    setSlideDirection('left');
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (isTransitioning) return;
    setSlideDirection('right');
    setIsTransitioning(true);
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 500);
  };

  // Get current image
  const currentImageData = allImages.length > 0 ? allImages[currentImageIndex] : null;
  const siteImage = currentImageData ? (typeof currentImageData === 'string' ? currentImageData : currentImageData.path) : null;

  return (
    <CardContainer onClick={(e) => e.stopPropagation()}>
      <ImageContainer>
        <ImageWrapper>
          {allImages.map((imageData, index) => {
            const image = typeof imageData === 'string' ? imageData : imageData.path;
            const imageUrl = (() => {
              // If it's already a full URL (starts with http), use it as is
              if (image.startsWith('http://') || image.startsWith('https://')) {
                return image;
              }
              // If it's a relative path (starts with /), prepend the backend base URL
              const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://gis.chocoinsurance.com/api' : 'http://localhost:5001/api');
              const baseUrl = apiUrl.replace(/\/api\/?$/, '');
              return `${baseUrl}${image}`;
            })();

            let slideClass = '';
            if (index === currentImageIndex) {
              slideClass = 'active';
            } else {
              // Determine slide class based on direction and position
              const isBefore = index < currentImageIndex;
              if (slideDirection === 'right') {
                slideClass = isBefore ? 'exiting-left' : 'entering-right';
              } else {
                slideClass = isBefore ? 'entering-left' : 'exiting-right';
              }
            }

            return (
              <ImageSlide
                key={index}
                className={slideClass}
              >
                <Box
                  component="img"
                  src={imageUrl}
                  alt={`${siteName} - Image ${index + 1}`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.target.style.display = 'none';
                  }}
                />
              </ImageSlide>
            );
          })}
        </ImageWrapper>
        
        {/* Image overlay indicator - show asset name for asset images */}
        {siteImage && (() => {
          const currentImgData = allImages[currentImageIndex];
          const currentAssetName = typeof currentImgData === 'object' ? currentImgData.assetName : null;
          const isAssetImage = typeof currentImgData === 'object' ? currentImgData.source === 'asset' : false;
          
          return isAssetImage && currentAssetName ? (
            <ImageOverlay>
              <ApartmentIcon sx={{ fontSize: '16px' }} />
              <Typography component="span" sx={{ fontSize: '13px', fontWeight: 600 }}>
                {currentAssetName}
              </Typography>
            </ImageOverlay>
          ) : null;
        })()}
        
        {!siteImage && (
          <ImagePlaceholder sx={{ display: 'flex', backgroundColor: '#DDDDDD' }}>
            <HomeIcon sx={{ fontSize: '64px', opacity: 0.4, color: '#717171' }} />
          </ImagePlaceholder>
        )}
        
        {/* Navigation arrows - only show if there are multiple images */}
        {allImages.length > 1 && (
          <>
            <NavButton 
              className="left" 
              onClick={handlePreviousImage}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isTransitioning) {
                  handlePreviousImage(e);
                }
              }}
              size="small"
              disabled={isTransitioning}
              sx={{ 
                opacity: 0.8,
                '&:hover': { opacity: 1 }
              }}
            >
              <ArrowBackIosIcon sx={{ 
                fontSize: '16px', 
                color: isSite ? '#1976D2' : '#F57C00' 
              }} />
            </NavButton>
            <NavButton 
              className="right" 
              onClick={handleNextImage}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isTransitioning) {
                  handleNextImage(e);
                }
              }}
              size="small"
              disabled={isTransitioning}
              sx={{ 
                opacity: 0.8,
                '&:hover': { opacity: 1 }
              }}
            >
              <ArrowForwardIosIcon sx={{ 
                fontSize: '16px', 
                color: isSite ? '#1976D2' : '#F57C00' 
              }} />
            </NavButton>
          </>
        )}
        
        <CloseButton 
          onClick={handleClose}
          onTouchEnd={(e) => {
            e.preventDefault();
            handleClose(e);
          }}
          size="small"
        >
          <CloseIcon sx={{ fontSize: '16px', color: '#222222' }} />
        </CloseButton>
      </ImageContainer>

      <ContentContainer>
        <TitleRow>
          <Title>{siteName}</Title>
        </TitleRow>

        <Subtitle>
          <LocationOnIcon sx={{ fontSize: '14px', color: '#717171' }} />
          {siteAddress}
        </Subtitle>

        <InfoRow>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '14px', 
            color: '#222222', 
            fontWeight: 600,
            padding: '4px 12px',
            backgroundColor: isSite ? '#E3F2FD' : '#FFF3E0',
            borderRadius: '12px',
          }}>
            {isSite ? (
              <>
                <BusinessIcon sx={{ fontSize: '16px', color: '#1976D2' }} />
                <Typography component="span">Site</Typography>
              </>
            ) : isCarbonContract ? (
              <>
                <Typography component="span" sx={{ color: getStatusColor(status || 'compliant') }}>
                  ●
                </Typography>
                <Typography component="span">Carbon Contract</Typography>
              </>
            ) : (
              <>
                <ApartmentIcon sx={{ fontSize: '16px', color: '#F57C00' }} />
                <Typography component="span">Asset</Typography>
              </>
            )}
          </Box>
          {isSite && propertyCount !== undefined && propertyCount > 0 && (
            <Typography sx={{ fontSize: '14px', color: '#717171', fontWeight: 400 }}>
              · {propertyCount} {propertyCount === 1 ? 'asset' : 'assets'}
            </Typography>
          )}
        </InfoRow>

        {isCarbonContract && (
          <Box sx={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {status && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(status),
                    border: '2px solid white',
                    boxShadow: 1,
                  }}
                />
                <Typography sx={{ fontSize: '14px', color: '#717171', fontWeight: 500, textTransform: 'capitalize' }}>
                  Status: {status}
                </Typography>
              </Box>
            )}
            {greenScore !== undefined && (
              <Typography sx={{ fontSize: '14px', color: '#717171' }}>
                <strong>Green Score:</strong> {greenScore}/100
              </Typography>
            )}
            {payoutAmount !== undefined && (
              <Typography sx={{ fontSize: '14px', color: '#717171' }}>
                <strong>Payout:</strong> ${payoutAmount.toLocaleString()}
              </Typography>
            )}
            {mataqaliName && (
              <Typography sx={{ fontSize: '14px', color: '#717171' }}>
                <strong>Owner:</strong> {mataqaliName}
              </Typography>
            )}
            {status && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                  <strong>Polygon Color:</strong>
                </Typography>
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: getStatusColor(status),
                    border: '2px solid white',
                    boxShadow: 1,
                  }}
                />
                <Typography sx={{ fontSize: '13px', color: '#717171' }}>
                  {status === 'compliant' ? 'Green' : status === 'warning' ? 'Orange' : 'Red'}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {!isCarbonContract && (propertyType || area) && (
          <Box sx={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {propertyType && (
              <Typography sx={{ fontSize: '14px', color: '#717171', fontWeight: 400 }}>
                {propertyType}
              </Typography>
            )}
            {area && (
              <Typography sx={{ fontSize: '14px', color: '#717171', fontWeight: 400 }}>
                {area} m²
              </Typography>
            )}
          </Box>
        )}

        {siteDescription && (
          <AddressText sx={{ marginTop: '12px', fontStyle: 'italic', color: '#717171' }}>
            {siteDescription}
          </AddressText>
        )}
      </ContentContainer>
    </CardContainer>
  );
};

export default AirbnbCard;

