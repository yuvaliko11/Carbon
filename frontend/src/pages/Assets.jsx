import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import { assetsAPI, sitesAPI, uploadAPI } from '../services/api';
import logger from '../utils/logger';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { LoadingSpinner } from '../components/Loading';

const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://gis.chocoinsurance.com/api' : 'http://localhost:5001');

const Assets = () => {
  const [properties, setProperties] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    siteId: '',
    address: '',
    latitude: '',
    longitude: '',
    propertyType: '',
    area: '',
    elevation: '',
    geoJson: '',
    // Address details
    city: '',
    street: '',
    streetNumber: '',
    block: '',
    parcel: '',
    plot: '',
    // Construction data
    constructionYear: '',
    constructionType: '',
    constructionTypeOther: '',
    roofType: '',
    roofTypeOther: '',
    foundationMethod: '',
    foundationMethodOther: '',
    // Technical specifications
    floorsAboveGround: '',
    floorsBelowGround: '',
    totalGrossArea: '',
    netBuiltArea: '',
    typicalFloorAreaAbove: '',
    typicalFloorAreaBelow: '',
    elevatorCount: '',
    stairwellCount: '',
    // Fire protection
    fireProtectionSystems: [],
    // Renovations
    hasMajorRenovation: false,
    renovationDescription: '',
    // Files
    images: [],
    engineeringReports: [],
  });
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const { isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadProperties();
    loadSites();
    
    // Check for siteId in URL query params
    const urlParams = new URLSearchParams(window.location.search);
    const siteId = urlParams.get('siteId');
    
    // Check for saved form data from small form
    const savedFormData = localStorage.getItem('assetFormData');
    
    if (siteId) {
      // Load site data and open form with site address pre-filled
      if (savedFormData) {
        // If we have saved form data, use it along with site data
        try {
          const assetData = JSON.parse(savedFormData);
          loadSiteAndOpenFormWithData(siteId, assetData);
          // Clear the saved data after using it
          localStorage.removeItem('assetFormData');
        } catch (error) {
          logger.error('Error parsing saved asset form data:', error);
          loadSiteAndOpenForm(siteId);
        }
      } else {
        loadSiteAndOpenForm(siteId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSiteAndOpenForm = async (siteId) => {
    try {
      const response = await sitesAPI.getById(siteId);
      const site = response.data.data;
      if (site) {
        // Parse address and open form
        const parsedAddress = parseAddress(site.address);
        setTimeout(() => {
          handleOpen(null, siteId, site.address, parsedAddress, site.location);
        }, 100);
      } else {
        // If site not found, just open with siteId
        setTimeout(() => {
        handleOpen(null, siteId);
      }, 100);
    }
  } catch (error) {
    logger.error('Error loading site:', error);
    // If error, just open with siteId
    setTimeout(() => {
      handleOpen(null, siteId);
    }, 100);
  }
  };

  const loadSiteAndOpenFormWithData = async (siteId, assetData) => {
    try {
      const response = await sitesAPI.getById(siteId);
      const site = response.data.data;
      
      // Use asset data if provided, otherwise use site data
      const address = assetData.address || (site ? site.address : '');
      const latitude = assetData.latitude || (site?.location?.coordinates?.[1]?.toString() || '');
      const longitude = assetData.longitude || (site?.location?.coordinates?.[0]?.toString() || '');
      const parsedAddress = parseAddress(address);
      
      setTimeout(() => {
        handleOpenWithData(null, siteId, address, parsedAddress, site?.location, assetData);
      }, 100);
    } catch (error) {
      logger.error('Error loading site with asset data:', error);
      // Fallback: open with just the asset data
      const parsedAddress = parseAddress(assetData.address || '');
      setTimeout(() => {
        handleOpenWithData(null, siteId, assetData.address || '', parsedAddress, null, assetData);
      }, 100);
    }
  };

  const parseAddress = (address) => {
    if (!address) return { city: '', street: '', streetNumber: '' };
    
    // Remove "ישראל" or "Israel" from the end
    let cleanAddress = address.replace(/,?\s*(ישראל|Israel)$/i, '').trim();
    
    // Split by comma to get parts
    const parts = cleanAddress.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    let city = '';
    let street = '';
    let streetNumber = '';
    
    if (parts.length >= 2) {
      // Usually: "רחוב/street name number, city" or "street name number, city, more info"
      // Last part is usually the city
      city = parts[parts.length - 1];
      
      // First part contains street and number
      let firstPart = parts[0];
      
      // Try to extract street number from first part (usually a number at the end or middle)
      // Pattern: "רחוב שם 52" or "שם 52" or "52 שם"
      const numberMatch = firstPart.match(/(\d+)/);
      if (numberMatch) {
        streetNumber = numberMatch[1];
        // Remove the number from the street name
        street = firstPart.replace(new RegExp(`\\s*${streetNumber}\\s*`), '').trim();
      } else {
        street = firstPart;
      }
      
      // Remove common prefixes
      street = street.replace(/^(רחוב|רח'|street|st\.?)\s*/i, '').trim();
    } else {
      // No comma - try to extract from single string like "היובלים 52 בארותיים"
      const words = cleanAddress.split(/\s+/).filter(w => w.length > 0);
      
      // Find the number in the string
      const numberIndex = words.findIndex(w => /^\d+$/.test(w));
      
      if (numberIndex !== -1) {
        // Found a number
        streetNumber = words[numberIndex];
        
        // Everything before the number is street name
        const streetWords = words.slice(0, numberIndex);
        // Everything after the number might be city or part of street
        const afterNumberWords = words.slice(numberIndex + 1);
        
        if (afterNumberWords.length > 0) {
          // Assume last word(s) after number is city if there are multiple words
          // If only one word after number, it might be part of street name or city
          if (afterNumberWords.length === 1 && streetWords.length > 0) {
            // Only one word after number - likely city
            city = afterNumberWords[0];
            street = streetWords.join(' ');
          } else if (afterNumberWords.length > 1) {
            // Multiple words after number - last is likely city
            city = afterNumberWords[afterNumberWords.length - 1];
            street = [...streetWords, ...afterNumberWords.slice(0, -1)].join(' ');
          } else {
            // No words after number
            street = streetWords.join(' ');
          }
        } else {
          // No words after number
          street = streetWords.join(' ');
        }
      } else {
        // No number found
        if (words.length > 1) {
          // Assume last word is city
          city = words[words.length - 1];
          street = words.slice(0, -1).join(' ');
        } else {
          street = cleanAddress;
        }
      }
      
      // Remove common prefixes
      street = street.replace(/^(רחוב|רח'|street|st\.?)\s*/i, '').trim();
    }
    
    return {
      city: city || '',
      street: street || '',
      streetNumber: streetNumber || '',
    };
  };

  const geocodeAddress = async (address) => {
    if (!address || !address.trim()) return null;
    
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setGeocodingError('Google Maps API Key is not configured. Check the .env file');
      return null;
    }
    
    setIsGeocoding(true);
    setGeocodingError('');
    
    try {
      // Clean address - remove "Israel" if exists (we'll add it later)
      let cleanAddress = address.trim().replace(/,?\s*(ישראל|Israel)$/i, '').trim();
      
      // Create address variations for testing
      const addressVariations = [];
      
      // Variation 1: Original address with commas (if exists)
      if (cleanAddress.includes(',')) {
        addressVariations.push(`${cleanAddress}, ישראל`);
      }
      
      // Variation 2: Address without commas, with "street" if not present
      let addressWithoutCommas = cleanAddress.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      if (!addressWithoutCommas.toLowerCase().includes('רחוב') && 
          !addressWithoutCommas.toLowerCase().includes('street') &&
          !addressWithoutCommas.toLowerCase().includes('st.')) {
        // Try to add "street" if it looks like there's a street name
        const parts = addressWithoutCommas.split(/\s+/);
        if (parts.length >= 2) {
          // If there are at least 2 parts, assume the first is the street name
          addressVariations.push(`רחוב ${addressWithoutCommas}, ישראל`);
        }
      }
      addressVariations.push(`${addressWithoutCommas}, ישראל`);
      
      // Variation 3: Original address with commas (if not already added)
      if (!cleanAddress.includes(',')) {
        addressVariations.push(`${cleanAddress}, ישראל`);
      }
      
      // Try each variation
      for (const addressVariation of addressVariations) {
        try {
          const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
              address: addressVariation,
              key: apiKey,
              language: 'he',
              region: 'il',
            },
          });
          
          if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            const location = result.geometry.location;
            
            setFormData(prev => ({
              ...prev,
              latitude: location.lat.toString(),
              longitude: location.lng.toString(),
            }));
            
            setIsGeocoding(false);
            return { lat: location.lat, lng: location.lng };
          }
        } catch (error) {
          logger.error('Error geocoding address variation:', error);
          continue;
        }
      }
      
      // If all variations failed
      setGeocodingError('Could not find coordinates for this address. Please enter them manually.');
      setIsGeocoding(false);
      return null;
    } catch (error) {
      logger.error('Error geocoding address:', error);
      setGeocodingError('Error searching for address. Please try again.');
      setIsGeocoding(false);
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressBlur = async () => {
    if (formData.address && formData.address.trim()) {
      await geocodeAddress(formData.address);
    }
    // Clear suggestions when leaving the field
    setAddressSuggestions([]);
  };

  const searchAddressSuggestions = async (input) => {
    if (!input || input.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setAddressSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    
    // Add "Israel" to query if not present
    let query = input.trim();
    if (!query.toLowerCase().includes('ישראל') && !query.toLowerCase().includes('israel')) {
      query = `${query}, ישראל`;
    }

    try {
      // Use Places API (New) via REST API
      const url = `https://places.googleapis.com/v1/places:autocomplete`;
      const response = await axios.post(
        url,
        {
          input: query,
          languageCode: 'he',
          regionCode: 'IL',
          includedRegionCodes: ['IL'],
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
          },
        }
      );

      if (response.data && response.data.suggestions) {
        const predictions = response.data.suggestions
          .filter(s => s.placePrediction)
          .map(s => ({
            place_id: s.placePrediction.placeId,
            description: s.placePrediction.text.text,
            structured_formatting: {
              main_text: s.placePrediction.text.text.split(',')[0],
              secondary_text: s.placePrediction.text.text.split(',').slice(1).join(',').trim(),
            },
          }));
        // Limit to 5 suggestions
        setAddressSuggestions(predictions.slice(0, 5));
      } else {
        setAddressSuggestions([]);
      }
    } catch (error) {
      logger.error('Error fetching autocomplete suggestions:', error);
      setAddressSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const getPlaceDetails = async (placeId) => {
    if (!placeId) return;

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      geocodeAddress(formData.address);
      return;
    }

    try {
      // Use Places API (New) via REST API - request addressComponents for better parsing
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'formattedAddress,location,displayName,addressComponents',
        },
      });

      if (response.data) {
        const place = response.data;
        const address = place.formattedAddress || place.displayName?.text || formData.address;
        const location = place.location;
        const addressComponents = place.addressComponents || [];
        
        // Try to extract structured data from addressComponents
        let city = '';
        let street = '';
        let streetNumber = '';
        
        if (addressComponents && addressComponents.length > 0) {
          // Extract city (locality or administrative_area_level_2)
          const cityComponent = addressComponents.find(c => 
            c.types.includes('locality') || 
            c.types.includes('administrative_area_level_2') ||
            c.types.includes('sublocality')
          );
          if (cityComponent) {
            city = cityComponent.longText || cityComponent.shortText || '';
          }
          
          // Extract street name (route)
          const streetComponent = addressComponents.find(c => c.types.includes('route'));
          if (streetComponent) {
            street = streetComponent.longText || streetComponent.shortText || '';
            // Remove common prefixes
            street = street.replace(/^(רחוב|רח'|street|st\.?)\s*/i, '').trim();
          }
          
          // Extract street number (street_number)
          const numberComponent = addressComponents.find(c => c.types.includes('street_number'));
          if (numberComponent) {
            streetNumber = numberComponent.longText || numberComponent.shortText || '';
          }
        }
        
        // If addressComponents didn't provide enough info, fall back to parsing
        if (!city || !street) {
          const parsed = parseAddress(address);
          city = city || parsed.city || '';
          street = street || parsed.street || '';
          streetNumber = streetNumber || parsed.streetNumber || '';
        }
        
        logger.log('Place details:', { 
          address, 
          addressComponents,
          parsed: { city, street, streetNumber },
          lat: location?.latitude, 
          lng: location?.longitude 
        });
        
        setFormData(prev => ({
          ...prev,
          address: address,
          latitude: location?.latitude ? location.latitude.toString() : prev.latitude,
          longitude: location?.longitude ? location.longitude.toString() : prev.longitude,
          city: city || '',
          street: street || '',
          streetNumber: streetNumber || '',
        }));

        if (location) {
          logger.log('✅ Place details found:', { 
            address, 
            lat: location.latitude, 
            lng: location.longitude 
          });
        }
      } else {
        // If we couldn't get details, try regular geocoding
        geocodeAddress(formData.address);
      }
    } catch (error) {
      logger.error('Error fetching place details:', error);
      // If Places API (New) doesn't work, try regular geocoding
      geocodeAddress(formData.address);
    }
  };

  const loadProperties = async () => {
    try {
      const response = await assetsAPI.getAll();
      setProperties(response.data.data);
    } catch (error) {
      logger.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    try {
      const response = await sitesAPI.getAll();
      setSites(response.data.data);
    } catch (error) {
      logger.error('Error loading sites:', error);
    }
  };

  const handleOpen = (property = null, initialSiteId = '', initialAddress = '', parsedAddress = null, initialLocation = null) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        name: property.name || '',
        siteId: property.siteId?._id || property.siteId || '',
        address: property.address || '',
        latitude: property.location?.coordinates?.[1] || '',
        longitude: property.location?.coordinates?.[0] || '',
        propertyType: property.propertyType || '',
        area: property.area || '',
        elevation: property.elevation || '',
        geoJson: property.geoJson ? JSON.stringify(property.geoJson, null, 2) : '',
        city: property.addressDetails?.city || '',
        street: property.addressDetails?.street || '',
        streetNumber: property.addressDetails?.streetNumber || '',
        block: property.addressDetails?.block || '',
        parcel: property.addressDetails?.parcel || '',
        plot: property.addressDetails?.plot || '',
        constructionYear: property.constructionYear || '',
        constructionType: property.constructionType || '',
        constructionTypeOther: property.constructionTypeOther || '',
        roofType: property.roofType || '',
        roofTypeOther: property.roofTypeOther || '',
        foundationMethod: property.foundationMethod || '',
        foundationMethodOther: property.foundationMethodOther || '',
        floorsAboveGround: property.floorsAboveGround || '',
        floorsBelowGround: property.floorsBelowGround || '',
        totalGrossArea: property.totalGrossArea || '',
        netBuiltArea: property.netBuiltArea || '',
        typicalFloorAreaAbove: property.typicalFloorAreaAbove || '',
        typicalFloorAreaBelow: property.typicalFloorAreaBelow || '',
        elevatorCount: property.elevatorCount || '',
        stairwellCount: property.stairwellCount || '',
        fireProtectionSystems: property.fireProtectionSystems || [],
        hasMajorRenovation: property.hasMajorRenovation || false,
        renovationDescription: property.renovationDescription || '',
        images: property.images || [],
        engineeringReports: property.engineeringReports || [],
      });
    } else {
      setEditingProperty(null);
      // If we have parsed address from site, use it; otherwise parse from initialAddress
      const addressParts = parsedAddress || (initialAddress ? parseAddress(initialAddress) : { city: '', street: '', streetNumber: '' });
      setFormData({
        name: '',
        siteId: initialSiteId,
        address: initialAddress || '',
        latitude: initialLocation?.coordinates?.[1]?.toString() || '',
        longitude: initialLocation?.coordinates?.[0]?.toString() || '',
        propertyType: '',
        area: '',
        elevation: '',
        geoJson: '',
        city: addressParts.city || '',
        street: addressParts.street || '',
        streetNumber: addressParts.streetNumber || '',
        block: '',
        parcel: '',
        plot: '',
        constructionYear: '',
        constructionType: '',
        constructionTypeOther: '',
        roofType: '',
        roofTypeOther: '',
        foundationMethod: '',
        foundationMethodOther: '',
        floorsAboveGround: '',
        floorsBelowGround: '',
        totalGrossArea: '',
        netBuiltArea: '',
        typicalFloorAreaAbove: '',
        typicalFloorAreaBelow: '',
        elevatorCount: '',
        stairwellCount: '',
        fireProtectionSystems: [],
        hasMajorRenovation: false,
        renovationDescription: '',
        images: [],
        engineeringReports: [],
      });
    }
    setError('');
    setTabValue(0);
    setImageUrl('');
    setOpen(true);
  };

  const handleOpenWithData = (property = null, initialSiteId = '', initialAddress = '', parsedAddress = null, initialLocation = null, assetData = {}) => {
    setEditingProperty(null);
    // Use asset data if provided, otherwise use defaults
    const addressParts = parsedAddress || (initialAddress ? parseAddress(initialAddress) : { city: '', street: '', streetNumber: '' });
    setFormData({
      name: assetData.name || '',
      siteId: initialSiteId,
      address: assetData.address || initialAddress || '',
      latitude: assetData.latitude || initialLocation?.coordinates?.[1]?.toString() || '',
      longitude: assetData.longitude || initialLocation?.coordinates?.[0]?.toString() || '',
      propertyType: assetData.propertyType || '',
      area: assetData.area || '',
      elevation: assetData.elevation || '',
      geoJson: '',
      city: addressParts.city || '',
      street: addressParts.street || '',
      streetNumber: addressParts.streetNumber || '',
      block: '',
      parcel: '',
      plot: '',
      constructionYear: '',
      constructionType: '',
      constructionTypeOther: '',
      roofType: '',
      roofTypeOther: '',
      foundationMethod: '',
      foundationMethodOther: '',
      floorsAboveGround: '',
      floorsBelowGround: '',
      totalGrossArea: '',
      netBuiltArea: '',
      typicalFloorAreaAbove: '',
      typicalFloorAreaBelow: '',
      elevatorCount: '',
      stairwellCount: '',
      fireProtectionSystems: [],
      hasMajorRenovation: false,
      renovationDescription: '',
      images: [],
      engineeringReports: [],
    });
    setError('');
    setTabValue(0);
    setImageUrl('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingProperty(null);
    setFormData({
      name: '',
      siteId: '',
      address: '',
      latitude: '',
      longitude: '',
      propertyType: '',
      area: '',
      elevation: '',
      geoJson: '',
      city: '',
      street: '',
      streetNumber: '',
      block: '',
      parcel: '',
      plot: '',
      constructionYear: '',
      constructionType: '',
      constructionTypeOther: '',
      roofType: '',
      roofTypeOther: '',
      foundationMethod: '',
      foundationMethodOther: '',
      floorsAboveGround: '',
      floorsBelowGround: '',
      totalGrossArea: '',
      netBuiltArea: '',
      typicalFloorAreaAbove: '',
      typicalFloorAreaBelow: '',
      elevatorCount: '',
      stairwellCount: '',
      fireProtectionSystems: [],
      hasMajorRenovation: false,
      renovationDescription: '',
      images: [],
      engineeringReports: [],
    });
    setTabValue(0);
    setImageUrl('');
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.siteId || !formData.address || !formData.latitude || !formData.longitude || !formData.propertyType || !formData.area || !formData.elevation) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      let geoJsonData = null;
      if (formData.geoJson) {
        try {
          geoJsonData = JSON.parse(formData.geoJson);
        } catch (e) {
          setError('Invalid GeoJSON');
          return;
        }
      }

      const data = {
        name: formData.name,
        siteId: formData.siteId,
        address: formData.address,
        location: {
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        },
        propertyType: formData.propertyType,
        area: parseFloat(formData.area),
        elevation: parseFloat(formData.elevation),
        geoJson: geoJsonData,
        addressDetails: {
          city: formData.city || undefined,
          street: formData.street || undefined,
          streetNumber: formData.streetNumber || undefined,
          block: formData.block || undefined,
          parcel: formData.parcel || undefined,
          plot: formData.plot || undefined,
        },
        constructionYear: formData.constructionYear ? parseInt(formData.constructionYear) : undefined,
        constructionType: formData.constructionType || undefined,
        constructionTypeOther: formData.constructionTypeOther || undefined,
        roofType: formData.roofType || undefined,
        roofTypeOther: formData.roofTypeOther || undefined,
        foundationMethod: formData.foundationMethod || undefined,
        foundationMethodOther: formData.foundationMethodOther || undefined,
        floorsAboveGround: formData.floorsAboveGround ? parseInt(formData.floorsAboveGround) : 0,
        floorsBelowGround: formData.floorsBelowGround ? parseInt(formData.floorsBelowGround) : 0,
        totalGrossArea: formData.totalGrossArea ? parseFloat(formData.totalGrossArea) : undefined,
        netBuiltArea: formData.netBuiltArea ? parseFloat(formData.netBuiltArea) : undefined,
        typicalFloorAreaAbove: formData.typicalFloorAreaAbove ? parseFloat(formData.typicalFloorAreaAbove) : undefined,
        typicalFloorAreaBelow: formData.typicalFloorAreaBelow ? parseFloat(formData.typicalFloorAreaBelow) : undefined,
        elevatorCount: formData.elevatorCount ? parseInt(formData.elevatorCount) : 0,
        stairwellCount: formData.stairwellCount ? parseInt(formData.stairwellCount) : 0,
        fireProtectionSystems: formData.fireProtectionSystems || [],
        hasMajorRenovation: formData.hasMajorRenovation || false,
        renovationDescription: formData.renovationDescription || undefined,
        images: formData.images || [],
        engineeringReports: formData.engineeringReports || [],
      };

      if (editingProperty) {
        await assetsAPI.update(editingProperty._id, data);
      } else {
        await assetsAPI.create(data);
      }

      loadProperties();
      handleClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving');
    }
  };

  const handleImageUpload = async (file) => {
    setUploadingImage(true);
    try {
      const response = await uploadAPI.uploadImage(file);
      const newImage = response.data.data;
      setFormData({
        ...formData,
        images: [...formData.images, newImage],
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error uploading image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUrlAdd = () => {
    if (imageUrl.trim()) {
      const newImage = {
        type: 'url',
        path: imageUrl.trim(),
      };
      setFormData({
        ...formData,
        images: [...formData.images, newImage],
      });
      setImageUrl('');
    }
  };

  const handleReportUpload = async (file) => {
    setUploadingReport(true);
    try {
      const response = await uploadAPI.uploadReport(file);
      const newReport = response.data.data;
      setFormData({
        ...formData,
        engineeringReports: [...formData.engineeringReports, newReport],
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Error uploading report');
    } finally {
      setUploadingReport(false);
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleRemoveReport = (index) => {
    setFormData({
      ...formData,
      engineeringReports: formData.engineeringReports.filter((_, i) => i !== index),
    });
  };

  const handleFireProtectionToggle = (system) => {
    const current = formData.fireProtectionSystems || [];
    if (current.includes(system)) {
      setFormData({
        ...formData,
        fireProtectionSystems: current.filter(s => s !== system),
      });
    } else {
      setFormData({
        ...formData,
        fireProtectionSystems: [...current, system],
      });
    }
  };

  const handleSelectAllFireProtection = () => {
    const allSystems = ['sprinklers', 'fire_suppression_systems', 'fire_doors', 'hydrants'];
    const current = formData.fireProtectionSystems || [];
    const allSelected = allSystems.every(system => current.includes(system));
    
    if (allSelected) {
      // Deselect all
      setFormData({
        ...formData,
        fireProtectionSystems: [],
      });
    } else {
      // Select all
      setFormData({
        ...formData,
        fireProtectionSystems: allSystems,
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await assetsAPI.delete(id);
        loadProperties();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting');
      }
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          zIndex: 1,
        }}
      >
        <LoadingSpinner message="Loading assets..." fullScreen={true} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', overflow: 'hidden', maxWidth: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: 3,
        gap: { xs: 2, sm: 0 },
        width: '100%'
      }}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' } }}>
          Assets
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()}
          fullWidth={isMobile}
          sx={{ 
            minWidth: { xs: '100%', sm: 'auto' },
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Add Asset
        </Button>
      </Box>

      {isMobile ? (
        <Grid container spacing={2}>
          {properties.map((property) => (
            <Grid item xs={12} key={property._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {property.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Site:</strong> {property.siteId?.name || 'Not assigned'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Address:</strong> {property.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Asset Type:</strong> {property.propertyType}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Area:</strong> {property.area} m²
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton onClick={() => handleOpen(property)} color="primary">
                    <EditIcon />
                  </IconButton>
                  {isAdmin && (
                    <IconButton onClick={() => handleDelete(property._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer 
          component={Paper}
          sx={{
            overflowX: 'auto',
            maxWidth: '100%',
            '& .MuiTable-root': {
              minWidth: 700,
            }
          }}
        >
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
               <TableCell>Name</TableCell>
               <TableCell>Site</TableCell>
               <TableCell>Address</TableCell>
               <TableCell>Asset Type</TableCell>
               <TableCell>Area</TableCell>
               <TableCell>Elevation (m)</TableCell>
               <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property._id}>
                  <TableCell>{property.name}</TableCell>
                  <TableCell>{property.siteId?.name || 'Not assigned'}</TableCell>
                  <TableCell>{property.address}</TableCell>
                  <TableCell>{property.propertyType}</TableCell>
                  <TableCell>{property.area} m²</TableCell>
                  <TableCell>{property.elevation}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(property)}>
                      <EditIcon />
                    </IconButton>
                    {isAdmin && (
                      <IconButton onClick={() => handleDelete(property._id)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>{editingProperty ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
        <DialogContent sx={{ minHeight: '400px' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              <Tab label="Basic Info" />
              <Tab label="Construction Data" />
              <Tab label="Technical Specs" />
              <Tab label="Fire Protection" />
              <Tab label="Renovations" />
              <Tab label="Files" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Asset Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Site</InputLabel>
                <Select
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  label="Site"
                >
                  {sites.map((site) => (
                    <MenuItem key={site._id} value={site._id}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Autocomplete
                freeSolo
                options={addressSuggestions}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.description || '';
                }}
                loading={isLoadingSuggestions}
                inputValue={formData.address}
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input') {
                    // User is typing - just update address, don't parse yet
                    setFormData({ ...formData, address: newInputValue });
                    if (newInputValue && newInputValue.length > 2) {
                      searchAddressSuggestions(newInputValue);
                    } else {
                      setAddressSuggestions([]);
                    }
                  }
                }}
                onChange={(event, newValue, reason) => {
                  if (reason === 'selectOption' && newValue && typeof newValue !== 'string') {
                    // User selected from list
                    const address = newValue.description || '';
                    setFormData({ ...formData, address });
                    getPlaceDetails(newValue.place_id);
                    setAddressSuggestions([]);
                  } else if (reason === 'clear') {
                    setFormData({ ...formData, address: '' });
                    setAddressSuggestions([]);
                  }
                }}
                onBlur={handleAddressBlur}
                filterOptions={(x) => x} // Don't filter - Google already filters
                ListboxProps={{
                  style: { maxHeight: '300px' },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Address"
                    margin="normal"
                    required
                    helperText={geocodingError || (isGeocoding ? 'Searching for coordinates...' : (isLoadingSuggestions ? 'Searching for suggestions...' : 'Start typing an address - autocomplete will suggest options'))}
                  />
                )}
              />
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                Detailed Address (Optional)
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Street"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    margin="normal"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Street Number"
                    value={formData.streetNumber}
                    onChange={(e) => setFormData({ ...formData, streetNumber: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Block"
                    value={formData.block}
                    onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Parcel"
                    value={formData.parcel}
                    onChange={(e) => setFormData({ ...formData, parcel: e.target.value })}
                    margin="normal"
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Plot"
                value={formData.plot}
                onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
                margin="normal"
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    margin="normal"
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    margin="normal"
                    required
                  />
                </Grid>
              </Grid>
              <TextField
                fullWidth
                label="Asset Type"
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Area (m²)"
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Height Above Sea Level (m)"
                type="number"
                value={formData.elevation}
                onChange={(e) => setFormData({ ...formData, elevation: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="GeoJSON (Optional)"
                value={formData.geoJson}
                onChange={(e) => setFormData({ ...formData, geoJson: e.target.value })}
                margin="normal"
                multiline
                rows={4}
                helperText="Enter GeoJSON in JSON format"
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              <TextField
                fullWidth
                label="Construction Year"
                type="number"
                value={formData.constructionYear}
                onChange={(e) => setFormData({ ...formData, constructionYear: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Construction Type</InputLabel>
                <Select
                  value={formData.constructionType}
                  onChange={(e) => setFormData({ ...formData, constructionType: e.target.value })}
                  label="Construction Type"
                >
                  <MenuItem value="concrete_block">Concrete and Block Skeleton</MenuItem>
                  <MenuItem value="steel">Steel</MenuItem>
                  <MenuItem value="light_construction">Light Construction</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              {formData.constructionType === 'other' && (
                <TextField
                  fullWidth
                  label="Other Construction Type"
                  value={formData.constructionTypeOther}
                  onChange={(e) => setFormData({ ...formData, constructionTypeOther: e.target.value })}
                  margin="normal"
                />
              )}
              <FormControl fullWidth margin="normal">
                <InputLabel>Roof Type</InputLabel>
                <Select
                  value={formData.roofType}
                  onChange={(e) => setFormData({ ...formData, roofType: e.target.value })}
                  label="Roof Type"
                >
                  <MenuItem value="concrete">Concrete</MenuItem>
                  <MenuItem value="tiles">Tiles</MenuItem>
                  <MenuItem value="metal">Metal</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              {formData.roofType === 'other' && (
                <TextField
                  fullWidth
                  label="Other Roof Type"
                  value={formData.roofTypeOther}
                  onChange={(e) => setFormData({ ...formData, roofTypeOther: e.target.value })}
                  margin="normal"
                />
              )}
              <FormControl fullWidth margin="normal">
                <InputLabel>Foundation Method</InputLabel>
                <Select
                  value={formData.foundationMethod}
                  onChange={(e) => setFormData({ ...formData, foundationMethod: e.target.value })}
                  label="Foundation Method"
                >
                  <MenuItem value="piles">Piles</MenuItem>
                  <MenuItem value="raft">Raft</MenuItem>
                  <MenuItem value="individual_foundations">Individual Foundations</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              {formData.foundationMethod === 'other' && (
                <TextField
                  fullWidth
                  label="Other Foundation Method"
                  value={formData.foundationMethodOther}
                  onChange={(e) => setFormData({ ...formData, foundationMethodOther: e.target.value })}
                  margin="normal"
                />
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Floors Above Ground"
                    type="number"
                    value={formData.floorsAboveGround}
                    onChange={(e) => setFormData({ ...formData, floorsAboveGround: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Floors Below Ground"
                    type="number"
                    value={formData.floorsBelowGround}
                    onChange={(e) => setFormData({ ...formData, floorsBelowGround: e.target.value })}
                    margin="normal"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Total Gross Area (m²)"
                    type="number"
                    value={formData.totalGrossArea}
                    onChange={(e) => setFormData({ ...formData, totalGrossArea: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Net Built Area (m²)"
                    type="number"
                    value={formData.netBuiltArea}
                    onChange={(e) => setFormData({ ...formData, netBuiltArea: e.target.value })}
                    margin="normal"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Typical Floor Area Above (m²)"
                    type="number"
                    value={formData.typicalFloorAreaAbove}
                    onChange={(e) => setFormData({ ...formData, typicalFloorAreaAbove: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Typical Floor Area Below (m²)"
                    type="number"
                    value={formData.typicalFloorAreaBelow}
                    onChange={(e) => setFormData({ ...formData, typicalFloorAreaBelow: e.target.value })}
                    margin="normal"
                  />
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Elevator Count"
                    type="number"
                    value={formData.elevatorCount}
                    onChange={(e) => setFormData({ ...formData, elevatorCount: e.target.value })}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Stairwell Count"
                    type="number"
                    value={formData.stairwellCount}
                    onChange={(e) => setFormData({ ...formData, stairwellCount: e.target.value })}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </Box>
          )}

          {tabValue === 3 && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Fire Protection Systems</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                <Chip
                  label="All"
                  onClick={handleSelectAllFireProtection}
                  color={['sprinklers', 'fire_suppression_systems', 'fire_doors', 'hydrants'].every(system => 
                    formData.fireProtectionSystems?.includes(system)
                  ) ? 'primary' : 'default'}
                  variant={['sprinklers', 'fire_suppression_systems', 'fire_doors', 'hydrants'].every(system => 
                    formData.fireProtectionSystems?.includes(system)
                  ) ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 'bold' }}
                />
                {['sprinklers', 'fire_suppression_systems', 'fire_doors', 'hydrants'].map((system) => (
                  <Chip
                    key={system}
                    label={system.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    onClick={() => handleFireProtectionToggle(system)}
                    color={formData.fireProtectionSystems?.includes(system) ? 'primary' : 'default'}
                    variant={formData.fireProtectionSystems?.includes(system) ? 'filled' : 'outlined'}
                  />
                ))}
              </Stack>
            </Box>
          )}

          {tabValue === 4 && (
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hasMajorRenovation}
                    onChange={(e) => setFormData({ ...formData, hasMajorRenovation: e.target.checked })}
                  />
                }
                label="Has Major Renovation Information"
              />
              <TextField
                fullWidth
                label="Renovation Description"
                value={formData.renovationDescription}
                onChange={(e) => setFormData({ ...formData, renovationDescription: e.target.value })}
                margin="normal"
                multiline
                rows={4}
              />
            </Box>
          )}

          {tabValue === 5 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>Images</Typography>
              <Box sx={{ mb: 3 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="image-upload"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageUpload(e.target.files[0]);
                    }
                  }}
                  disabled={uploadingImage}
                />
                <label htmlFor="image-upload">
                  <Button variant="outlined" component="span" disabled={uploadingImage} sx={{ mr: 2 }}>
                    {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  </Button>
                </label>
                <TextField
                  label="Or Enter Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  size="small"
                  sx={{ mr: 1, width: '300px' }}
                />
                <Button variant="outlined" onClick={handleImageUrlAdd}>Add URL</Button>
              </Box>
              {formData.images.length > 0 ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {formData.images.map((image, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Box
                        sx={{
                          position: 'relative',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          overflow: 'hidden',
                          '&:hover .remove-button': {
                            opacity: 1,
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={(() => {
                            // If it's already a full URL (starts with http), use it as is
                            if (image.path.startsWith('http://') || image.path.startsWith('https://')) {
                              return image.path;
                            }
                            // If it's a relative path (starts with /), prepend the backend base URL
                            // API_URL includes /api, so we need to remove it for static file serving
                            const apiUrl = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? 'https://gis.chocoinsurance.com/api' : 'http://localhost:5001/api');
                            const baseUrl = apiUrl.replace(/\/api\/?$/, '');
                            return `${baseUrl}${image.path}`;
                          })()}
                          alt={image.type === 'url' ? 'URL Image' : 'Uploaded Image'}
                          sx={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                          }}
                        />
                        <IconButton
                          className="remove-button"
                          onClick={() => handleRemoveImage(index)}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            opacity: 0.7,
                            transition: 'opacity 0.2s',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                              opacity: 1,
                            },
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            p: 0.5,
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {image.path}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No images added yet.
                </Typography>
              )}

              <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Engineering Reports</Typography>
              <Box sx={{ mb: 3 }}>
                <input
                  accept=".pdf,.docx,.xlsx"
                  style={{ display: 'none' }}
                  id="report-upload"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleReportUpload(e.target.files[0]);
                    }
                  }}
                  disabled={uploadingReport}
                />
                <label htmlFor="report-upload">
                  <Button variant="outlined" component="span" disabled={uploadingReport}>
                    {uploadingReport ? 'Uploading...' : 'Upload Report (PDF/Word/Excel)'}
                  </Button>
                </label>
              </Box>
              <List>
                {formData.engineeringReports.map((report, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={report.filename}
                      secondary={`${report.type.toUpperCase()} - ${report.path}`}
                    />
                    <IconButton onClick={() => handleRemoveReport(index)} size="small">
                      <CloseIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assets;

