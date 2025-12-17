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
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Popper,
  Card,
  CardContent,
  CardActions,
  Grid,
  useMediaQuery,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { sitesAPI, assetsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../components/Loading';
import logger from '../utils/logger';

const Sites = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    description: '',
    totalArea: '',
    elevation: '',
  });
  const [error, setError] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [newlyCreatedSiteId, setNewlyCreatedSiteId] = useState(null);
  const [expandedSites, setExpandedSites] = useState({});
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [currentSiteIdForProperty, setCurrentSiteIdForProperty] = useState(null);
  const [assetFormData, setAssetFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    propertyType: '',
    area: '',
  });
  const [assetError, setAssetError] = useState('');
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);
  const [assetAddressSuggestions, setAssetAddressSuggestions] = useState([]);
  const [isLoadingAssetSuggestions, setIsLoadingAssetSuggestions] = useState(false);
  const [isGeocodingAsset, setIsGeocodingAsset] = useState(false);
  const [assetGeocodingError, setAssetGeocodingError] = useState('');
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const response = await sitesAPI.getAll();
      const sitesWithProperties = await Promise.all(
        response.data.data.map(async (site) => {
          // Use the dedicated endpoint to get all properties for this site
          try {
            const propertiesResponse = await sitesAPI.getProperties(site._id);
            const propertiesData = propertiesResponse.data.data || [];
            logger.log(`Loaded ${propertiesData.length} properties for site ${site.name} (${site._id})`);
            return { ...site, propertiesData };
          } catch (error) {
            logger.error(`Error loading properties for site ${site._id}:`, error);
            // Fallback: try to load properties from the populated array
            if (site.properties && site.properties.length > 0) {
              const propertiesData = await Promise.all(
                site.properties.map(async (propId) => {
                  try {
                    // Handle both ObjectId and populated object
                    const propIdString = typeof propId === 'object' && propId._id ? propId._id : propId;
                    const propResponse = await assetsAPI.getById(propIdString);
                    return propResponse.data.data;
                  } catch (error) {
                    logger.error(`Error loading property ${propId}:`, error);
                    return null;
                  }
                })
              );
              return { ...site, propertiesData: propertiesData.filter(p => p !== null) };
            }
            return { ...site, propertiesData: [] };
          }
        })
      );
      setSites(sitesWithProperties);
      logger.log('Sites loaded:', sitesWithProperties);
    } catch (error) {
      logger.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (site = null) => {
    if (site) {
      logger.log('Opening site for edit:', site);
      setEditingSite(site);
      setCurrentSiteIdForProperty(site._id); // Enable "Add Property" button for existing sites
      setFormData({
        name: site.name,
        address: site.address,
        latitude: site.location.coordinates[1],
        longitude: site.location.coordinates[0],
        description: site.description || '',
        totalArea: site.totalArea || '',
        elevation: site.elevation || '',
      });
    } else {
      setEditingSite(null);
      setCurrentSiteIdForProperty(null); // Disable button for new sites until saved
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        description: '',
        totalArea: '',
        elevation: '',
      });
    }
    setError('');
    setGeocodingError('');
    setIsGeocoding(false);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingSite(null);
    setCurrentSiteIdForProperty(null);
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      description: '',
      totalArea: '',
      elevation: '',
    });
    setGeocodingError('');
    setIsGeocoding(false);
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
        // Try to add commas automatically - after the number if exists
        const withCommas = cleanAddress.replace(/(\d+)\s+/, '$1, ');
        if (withCommas !== cleanAddress) {
          addressVariations.push(`${withCommas}, ישראל`);
        }
      }
      
      // Remove duplicates
      const uniqueVariations = [...new Set(addressVariations)];
      
      logger.log('🔍 Trying address variations:', uniqueVariations);
      
      // Try each variation until we find a result
      for (const searchAddress of uniqueVariations) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&key=${apiKey}&language=he&region=il`;
        logger.log('🔍 Geocoding request:', { searchAddress, url: url.replace(apiKey, 'API_KEY_HIDDEN') });
        
        try {
          const response = await axios.get(url);
          logger.log('📍 Geocoding response:', response.data);
          
          const status = response.data.status;
          
          // Handle all response statuses
          switch (status) {
            case 'OK':
              if (response.data.results && response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                setFormData(prev => ({
                  ...prev,
                  latitude: location.lat.toString(),
                  longitude: location.lng.toString()
                }));
                logger.log('✅ Coordinates found:', { lat: location.lat, lng: location.lng, address: searchAddress });
                // Stop immediately - we found a result!
                return { lat: location.lat, lng: location.lng };
              }
              // If no results despite OK status, continue
              logger.log('⚠️ OK status but no results for:', searchAddress);
              continue;
              
            case 'ZERO_RESULTS':
              // Continue trying other variations
              logger.log('⚠️ No results for:', searchAddress);
              continue;
              
            case 'OVER_QUERY_LIMIT':
              setGeocodingError('Query limit exceeded. Please try again later.');
              return null;
              
            case 'REQUEST_DENIED':
              // If this is not the first request, it's probably a rate limiting issue - continue trying
              // Only if this is the first request, show error
              if (uniqueVariations.indexOf(searchAddress) === 0) {
                setGeocodingError('Request denied. Make sure Geocoding API is enabled in Google Cloud Console and the key is valid.');
                logger.error('❌ Request denied. Check if Geocoding API is enabled in Google Cloud Console.');
                return null;
              }
              // If this is not the first request, just continue (maybe it's a rate limiting issue)
              logger.log('⚠️ Request denied for variation, continuing...');
              continue;
              
            case 'INVALID_REQUEST':
              // Continue trying other variations
              logger.log('⚠️ Invalid request for:', searchAddress);
              continue;
              
            default:
              logger.log('⚠️ Status:', status, 'for:', searchAddress);
              // Continue trying other variations
              continue;
          }
        } catch (requestError) {
          // If this is a REQUEST_DENIED error, continue trying other variations
          if (requestError.response?.data?.status === 'REQUEST_DENIED') {
            logger.log('⚠️ Request denied in catch, continuing...');
            continue;
          }
          logger.error('❌ Request error for:', searchAddress, requestError);
          // Continue trying other variations
          continue;
        }
      }
      
      // If we got here, all variations failed
      setGeocodingError('No coordinates found for this address. You can enter manually.');
      return null;
      
    } catch (error) {
      logger.error('❌ Geocoding exception:', error);
      if (error.response) {
        setGeocodingError(`Error searching for coordinates: ${error.response.status}. Make sure Geocoding API is enabled in Google Cloud Console.`);
      } else if (error.request) {
        setGeocodingError('Unable to connect to server. Check your internet connection.');
      } else {
        setGeocodingError('Error searching for coordinates. You can enter manually.');
      }
      return null;
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleAddressBlur = async () => {
    if (formData.address && formData.address.trim()) {
      await geocodeAddress(formData.address);
    }
    // נקה את ההצעות כשעוזבים את השדה
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
      // Try fallback to Geocoding API if Places API (New) doesn't work
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
      // Use Places API (New) via REST API
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'formattedAddress,location,displayName',
        },
      });

      if (response.data) {
        const place = response.data;
        const address = place.formattedAddress || place.displayName?.text || formData.address;
        const location = place.location;
        
        setFormData(prev => ({
          ...prev,
          address: address,
          latitude: location?.latitude ? location.latitude.toString() : prev.latitude,
          longitude: location?.longitude ? location.longitude.toString() : prev.longitude,
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

  const handleSubmit = async () => {
    if (!formData.name || !formData.address || !formData.latitude || !formData.longitude || !formData.elevation) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const data = {
        name: formData.name,
        address: formData.address,
        location: {
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        },
        description: formData.description,
        totalArea: formData.totalArea ? parseFloat(formData.totalArea) : undefined,
        elevation: parseFloat(formData.elevation),
      };

      let createdSiteId = null;
      if (editingSite) {
        await sitesAPI.update(editingSite._id, data);
        loadSites();
        setError(''); // Clear any errors
        handleClose(); // Close the dialog after saving
      } else {
        const response = await sitesAPI.create(data);
        createdSiteId = response.data.data._id;
        loadSites();
        setError(''); // Clear any errors
        handleClose(); // Close the dialog after saving
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving');
    }
  };

  const handleToggleProperties = (siteId) => {
    setExpandedSites(prev => ({
      ...prev,
      [siteId]: !prev[siteId]
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      try {
        await sitesAPI.delete(id);
        loadSites();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting');
      }
    }
  };

  const handleCreateAsset = async () => {
    if (!assetFormData.name || !assetFormData.address || !assetFormData.latitude || !assetFormData.longitude || !assetFormData.propertyType || !assetFormData.area) {
      setAssetError('Please fill in all required fields');
      return;
    }

    setIsCreatingAsset(true);
    setAssetError('');

    try {
      const data = {
        name: assetFormData.name,
        siteId: currentSiteIdForProperty,
        address: assetFormData.address,
        location: {
          coordinates: [parseFloat(assetFormData.longitude), parseFloat(assetFormData.latitude)],
        },
        propertyType: assetFormData.propertyType,
        area: parseFloat(assetFormData.area),
      };

      await assetsAPI.create(data);
      
      // Reload sites to show the new asset
      loadSites();
      
      // Reset form and close dialog
      setAssetFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        propertyType: '',
        area: '',
      });
      setPropertyDialogOpen(false);
      setCurrentSiteIdForProperty(null);
    } catch (error) {
      setAssetError(error.response?.data?.message || 'Error creating asset');
    } finally {
      setIsCreatingAsset(false);
    }
  };

  const handleOpenAssetDialog = (siteId) => {
    // Load site data to pre-fill address
    const site = sites.find(s => s._id === siteId);
    if (site) {
      setAssetFormData({
        name: '',
        address: site.address,
        latitude: site.location.coordinates[1].toString(),
        longitude: site.location.coordinates[0].toString(),
        propertyType: '',
        area: '',
      });
    } else if (editingSite?._id === siteId) {
      // If site was just created and not yet in the list, use formData
      setAssetFormData({
        name: '',
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        propertyType: '',
        area: '',
      });
    } else {
      setAssetFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        propertyType: '',
        area: '',
      });
    }
    setCurrentSiteIdForProperty(siteId);
    setPropertyDialogOpen(true);
    setAssetError('');
    setAssetAddressSuggestions([]);
    setAssetGeocodingError('');
  };

  const handleAddAssetClick = async () => {
    logger.log('🔵 Add Asset button clicked', { 
      editingSite: editingSite?._id, 
      formData: {
        name: formData.name,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude
      }
    });

    // If editing an existing site, just open the dialog
    if (editingSite?._id) {
      logger.log('✅ Opening asset dialog for existing site:', editingSite._id);
      handleOpenAssetDialog(editingSite._id);
      return;
    }

    // If creating a new site, validate and save it first
    const hasName = formData.name && formData.name.trim();
    const hasAddress = formData.address && formData.address.trim();
    const hasLatitude = formData.latitude && formData.latitude.trim();
    const hasLongitude = formData.longitude && formData.longitude.trim();

    if (!hasName || !hasAddress || !hasLatitude || !hasLongitude || !formData.elevation) {
      logger.warn('❌ Missing required fields', { hasName, hasAddress, hasLatitude, hasLongitude, elevation: formData.elevation });
      setError('Please fill in all required fields (Name, Address, Latitude, Longitude, Elevation) before adding an asset');
      return;
    }

    try {
      logger.log('💾 Saving new site before opening asset dialog...');
        const data = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        location: {
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
        },
        description: formData.description?.trim() || '',
        totalArea: formData.totalArea ? parseFloat(formData.totalArea) : undefined,
        elevation: parseFloat(formData.elevation),
      };

      // Save the new site first
      const response = await sitesAPI.create(data);
      const createdSite = response.data.data;
      const createdSiteId = createdSite._id;
      
      logger.log('✅ Site created successfully:', createdSiteId);
      
      // Update the form state to reflect that we now have a site ID
      setEditingSite(createdSite);
      setCurrentSiteIdForProperty(createdSiteId);
      
      // Reload sites list (don't await - we'll use the response data)
      loadSites();
      
      // Clear any errors
      setError('');
      
      // Now open the asset dialog with the newly created site
      // Use the created site data directly to avoid race conditions
      logger.log('📂 Opening asset dialog with site:', createdSiteId);
      setAssetFormData({
        name: '',
        address: createdSite.address,
        latitude: createdSite.location.coordinates[1].toString(),
        longitude: createdSite.location.coordinates[0].toString(),
        propertyType: '',
        area: '',
      });
      setCurrentSiteIdForProperty(createdSiteId);
      setPropertyDialogOpen(true);
      setAssetError('');
      setAssetAddressSuggestions([]);
      setAssetGeocodingError('');
    } catch (error) {
      logger.error('❌ Error saving site:', error);
      setError(error.response?.data?.message || 'Error saving site. Please try again.');
    }
  };

  const searchAssetAddressSuggestions = async (input) => {
    if (!input || input.length < 3) {
      setAssetAddressSuggestions([]);
      return;
    }

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setAssetAddressSuggestions([]);
      return;
    }

    setIsLoadingAssetSuggestions(true);
    
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
        setAssetAddressSuggestions(predictions.slice(0, 5));
      } else {
        setAssetAddressSuggestions([]);
      }
    } catch (error) {
      logger.error('Error fetching asset autocomplete suggestions:', error);
      setAssetAddressSuggestions([]);
    } finally {
      setIsLoadingAssetSuggestions(false);
    }
  };

  const getAssetPlaceDetails = async (placeId) => {
    if (!placeId) return;

    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      geocodeAssetAddress(assetFormData.address);
      return;
    }

    try {
      // Use Places API (New) via REST API
      const url = `https://places.googleapis.com/v1/places/${placeId}`;
      const response = await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'formattedAddress,location,displayName',
        },
      });

      if (response.data) {
        const place = response.data;
        const address = place.formattedAddress || place.displayName?.text || assetFormData.address;
        const location = place.location;
        
        setAssetFormData(prev => ({
          ...prev,
          address: address,
          latitude: location?.latitude ? location.latitude.toString() : prev.latitude,
          longitude: location?.longitude ? location.longitude.toString() : prev.longitude,
        }));

        if (location) {
          logger.log('✅ Asset place details found:', { 
            address, 
            lat: location.latitude, 
            lng: location.longitude 
          });
        }
      } else {
        // If we couldn't get details, try regular geocoding
        geocodeAssetAddress(assetFormData.address);
      }
    } catch (error) {
      logger.error('Error fetching asset place details:', error);
      geocodeAssetAddress(assetFormData.address);
    }
  };

  const geocodeAssetAddress = async (address) => {
    if (!address || !address.trim()) return null;
    
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setAssetGeocodingError('Google Maps API Key is not configured. Check the .env file');
      return null;
    }
    
    setIsGeocodingAsset(true);
    setAssetGeocodingError('');
    
    try {
      let cleanAddress = address.trim().replace(/,?\s*(ישראל|Israel)$/i, '').trim();
      const addressVariations = [];
      
      if (cleanAddress.includes(',')) {
        addressVariations.push(`${cleanAddress}, ישראל`);
      }
      
      let addressWithoutCommas = cleanAddress.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      if (!addressWithoutCommas.toLowerCase().includes('רחוב') && 
          !addressWithoutCommas.toLowerCase().includes('street') &&
          !addressWithoutCommas.toLowerCase().includes('st.')) {
        const parts = addressWithoutCommas.split(/\s+/);
        if (parts.length >= 2) {
          addressVariations.push(`רחוב ${addressWithoutCommas}, ישראל`);
        }
      }
      addressVariations.push(`${addressWithoutCommas}, ישראל`);
      
      if (!cleanAddress.includes(',')) {
        const withCommas = cleanAddress.replace(/(\d+)\s+/, '$1, ');
        if (withCommas !== cleanAddress) {
          addressVariations.push(`${withCommas}, ישראל`);
        }
      }
      
      const uniqueVariations = [...new Set(addressVariations)];
      
      for (const searchAddress of uniqueVariations) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&key=${apiKey}&language=he&region=il`;
        
        try {
          const response = await axios.get(url);
          const status = response.data.status;
          
          if (status === 'OK' && response.data.results && response.data.results.length > 0) {
            const location = response.data.results[0].geometry.location;
            setAssetFormData(prev => ({
              ...prev,
              latitude: location.lat.toString(),
              longitude: location.lng.toString()
            }));
            return { lat: location.lat, lng: location.lng };
          } else if (status === 'OVER_QUERY_LIMIT') {
            setAssetGeocodingError('Query limit exceeded. Please try again later.');
            return null;
          } else if (status === 'REQUEST_DENIED' && uniqueVariations.indexOf(searchAddress) === 0) {
            setAssetGeocodingError('Request denied. Make sure Geocoding API is enabled in Google Cloud Console.');
            return null;
          }
        } catch (requestError) {
          continue;
        }
      }
      
      setAssetGeocodingError('No coordinates found for this address. You can enter manually.');
      return null;
      
    } catch (error) {
      logger.error('❌ Asset geocoding exception:', error);
      if (error.response) {
        setAssetGeocodingError(`Error searching for coordinates: ${error.response.status}. Make sure Geocoding API is enabled.`);
      } else if (error.request) {
        setAssetGeocodingError('Unable to connect to server. Check your internet connection.');
      } else {
        setAssetGeocodingError('Error searching for coordinates. You can enter manually.');
      }
      return null;
    } finally {
      setIsGeocodingAsset(false);
    }
  };

  const handleAssetAddressBlur = async () => {
    if (assetFormData.address && assetFormData.address.trim()) {
      await geocodeAssetAddress(assetFormData.address);
    }
    setAssetAddressSuggestions([]);
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
        <LoadingSpinner message="Loading sites..." fullScreen={true} />
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
          Sites
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
          Add Site
        </Button>
      </Box>

      {isMobile ? (
        <Grid container spacing={2}>
          {sites.map((site) => (
            <Grid item xs={12} key={site._id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {site.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Address:</strong> {site.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.75rem' }}>
                    <strong>Coordinates:</strong> {site.location.coordinates[1].toFixed(6)}, {site.location.coordinates[0].toFixed(6)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Properties Count:</strong> {site.properties?.length || 0}
                  </Typography>
                  {site.totalArea && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Total Area:</strong> {site.totalArea} m²
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton onClick={() => handleOpen(site)} color="primary">
                    <EditIcon />
                  </IconButton>
                  {isAdmin && (
                    <IconButton onClick={() => handleDelete(site._id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                  <Button
                    size="small"
                    onClick={() => {
                      navigate(`/assets?siteId=${site._id}`);
                    }}
                  >
                    Add Property
                  </Button>
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
              minWidth: 600,
            }
          }}
        >
          <Table sx={{ minWidth: 600 }}>
            <TableHead>
              <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Coordinates</TableCell>
              <TableCell>Elevation (m)</TableCell>
              <TableCell>Properties Count</TableCell>
              <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sites.map((site) => (
                <React.Fragment key={site._id}>
                  <TableRow>
                    <TableCell>{site.name}</TableCell>
                    <TableCell>{site.address}</TableCell>
                    <TableCell>
                      {site.location.coordinates[1].toFixed(6)}, {site.location.coordinates[0].toFixed(6)}
                    </TableCell>
                    <TableCell>{site.elevation}</TableCell>
                    <TableCell>{site.properties?.length || 0}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpen(site)}>
                        <EditIcon />
                      </IconButton>
                      {isAdmin && (
                        <IconButton onClick={() => handleDelete(site._id)}>
                          <DeleteIcon />
                        </IconButton>
                      )}
                      <IconButton onClick={() => handleToggleProperties(site._id)}>
                        <ExpandMoreIcon sx={{ transform: expandedSites[site._id] ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  {expandedSites[site._id] && (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ py: 2 }}>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Properties</Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            navigate(`/assets?siteId=${site._id}`);
                          }}
                          sx={{ mb: 2 }}
                        >
                          Add Property
                        </Button>
                        {site.propertiesData && site.propertiesData.length > 0 ? (
                          <TableContainer 
                            component={Paper} 
                            variant="outlined"
                            sx={{
                              overflowX: 'auto',
                              WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                            }}
                          >
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Name</TableCell>
                                  <TableCell>Address</TableCell>
                                  <TableCell>Type</TableCell>
                                  <TableCell>Area (m²)</TableCell>
                                  <TableCell>Construction Year</TableCell>
                                  <TableCell>Floors Above</TableCell>
                                  <TableCell>Floors Below</TableCell>
                                  <TableCell>Elevators</TableCell>
                                  <TableCell>Stairwells</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {site.propertiesData.map((property) => (
                                  <TableRow key={property._id}>
                                    <TableCell>{property.name}</TableCell>
                                    <TableCell>{property.address}</TableCell>
                                    <TableCell>{property.propertyType}</TableCell>
                                    <TableCell>{property.area}</TableCell>
                                    <TableCell>{property.constructionYear || '-'}</TableCell>
                                    <TableCell>{property.floorsAboveGround || 0}</TableCell>
                                    <TableCell>{property.floorsBelowGround || 0}</TableCell>
                                    <TableCell>{property.elevatorCount || 0}</TableCell>
                                    <TableCell>{property.stairwellCount || 0}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                            No properties yet. Click "Add Property" to create one.
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        disablePortal={false}
        aria-labelledby="site-dialog-title"
        aria-describedby="site-dialog-description"
      >
        <DialogTitle id="site-dialog-title">{editingSite ? 'Edit Site' : 'Add New Site'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Site Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
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
                // User is typing
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
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isGeocoding && <CircularProgress size={20} />}
                      {isLoadingSuggestions && <CircularProgress size={20} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                error={!!geocodingError}
              />
            )}
            renderOption={(props, option) => {
              if (typeof option === 'string') {
                return <li {...props}>{option}</li>;
              }
              const parts = option.structured_formatting?.main_text || option.description || '';
              const secondary = option.structured_formatting?.secondary_text || '';
              return (
                <li {...props} key={option.place_id}>
                  <Box>
                    <Typography variant="body1">{parts}</Typography>
                    {secondary && (
                      <Typography variant="body2" color="text.secondary">
                        {secondary}
                      </Typography>
                    )}
                  </Box>
                </li>
              );
            }}
            PopperComponent={(props) => (
              <Popper {...props} placement="bottom-start" style={{ zIndex: 1300 }} />
            )}
          />
          <TextField
            fullWidth
            label="Latitude"
            type="number"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Longitude"
            type="number"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
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
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            label="Total Area (m²)"
            type="number"
            value={formData.totalArea}
            onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        
        {/* Add Property Button - Full Width Above Action Buttons */}
        <Box 
          sx={{ 
            px: 2, 
            pt: 2, 
            pb: 1, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            backgroundColor: 'rgba(0, 0, 0, 0.02)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {process.env.NODE_ENV === 'development' && (
            <Typography variant="caption" sx={{ mb: 1, display: 'block', fontSize: '0.7rem', color: 'text.secondary' }}>
              Debug: name={formData.name ? '✓' : '✗'}, address={formData.address ? '✓' : '✗'}, lat={formData.latitude ? '✓' : '✗'}, lng={formData.longitude ? '✓' : '✗'}
            </Typography>
          )}
          <Button 
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              logger.log('🔘 Add Asset button clicked', {
                formData: {
                  name: formData.name,
                  address: formData.address,
                  latitude: formData.latitude,
                  longitude: formData.longitude
                },
                isDisabled: !formData.name?.trim() || !formData.address?.trim() || !formData.latitude?.trim() || !formData.longitude?.trim()
              });
              
              // Check if button is disabled
              const isDisabled = !formData.name?.trim() || !formData.address?.trim() || !formData.latitude?.trim() || !formData.longitude?.trim() || !formData.elevation;
              if (isDisabled) {
                logger.warn('⚠️ Button click ignored - form is incomplete');
                setError('Please fill in all required fields (Name, Address, Latitude, Longitude, Elevation) before adding an asset');
                return;
              }
              
              try {
                await handleAddAssetClick();
              } catch (error) {
                logger.error('❌ Error in handleAddAssetClick:', error);
                setError('An error occurred. Please try again.');
              }
            }}
            variant="outlined"
            color="primary"
            startIcon={<AddIcon />}
            disabled={
              !formData.name?.trim() || 
              !formData.address?.trim() || 
              !formData.latitude?.trim() || 
              !formData.longitude?.trim() ||
              !formData.elevation
            }
            fullWidth
            size="large"
            sx={{ 
              py: 2,
              fontSize: '1rem',
              fontWeight: 600,
              textTransform: 'none',
              borderWidth: 2,
              cursor: 'pointer',
              pointerEvents: 'auto',
              '&:disabled': {
                borderWidth: 2,
                opacity: 0.6,
                cursor: 'not-allowed',
                pointerEvents: 'none'
              },
              '&:hover:not(:disabled)': {
                borderWidth: 2,
                transform: 'scale(1.01)',
                boxShadow: 2
              },
              '&:active:not(:disabled)': {
                transform: 'scale(0.99)'
              }
            }}
          >
            Add Asset to This Site
          </Button>
        </Box>
        
        <DialogActions sx={{ px: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Property Dialog - Opens when clicking "Add Asset" from site form */}
      {propertyDialogOpen && currentSiteIdForProperty && (
        <Dialog
          open={propertyDialogOpen}
          onClose={() => {
            setPropertyDialogOpen(false);
            setCurrentSiteIdForProperty(null);
            setAssetFormData({
              name: '',
              address: '',
              latitude: '',
              longitude: '',
              propertyType: '',
              area: '',
            });
            setAssetError('');
            setAssetAddressSuggestions([]);
            setAssetGeocodingError('');
          }}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          disablePortal={false}
        >
          <DialogTitle>Add Asset to Site</DialogTitle>
          <DialogContent>
            {assetError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {assetError}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Asset Name"
              value={assetFormData.name}
              onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
              margin="normal"
              required
            />
            <Autocomplete
              freeSolo
              options={assetAddressSuggestions}
              getOptionLabel={(option) => {
                if (typeof option === 'string') return option;
                return option.description || '';
              }}
              loading={isLoadingAssetSuggestions}
              value={assetFormData.address || null}
              inputValue={assetFormData.address}
              onInputChange={(event, newInputValue, reason) => {
                if (reason === 'input') {
                  setAssetFormData({ ...assetFormData, address: newInputValue });
                  if (newInputValue && newInputValue.length > 2) {
                    searchAssetAddressSuggestions(newInputValue);
                  } else {
                    setAssetAddressSuggestions([]);
                  }
                } else if (reason === 'clear') {
                  setAssetFormData({ 
                    ...assetFormData, 
                    address: '',
                    latitude: '',
                    longitude: ''
                  });
                  setAssetAddressSuggestions([]);
                  setAssetGeocodingError('');
                }
              }}
              onChange={(event, newValue, reason) => {
                if (reason === 'selectOption' && newValue && typeof newValue !== 'string') {
                  const address = newValue.description || '';
                  setAssetFormData({ ...assetFormData, address });
                  getAssetPlaceDetails(newValue.place_id);
                  setAssetAddressSuggestions([]);
                } else if (reason === 'clear') {
                  setAssetFormData({ 
                    ...assetFormData, 
                    address: '',
                    latitude: '',
                    longitude: ''
                  });
                  setAssetAddressSuggestions([]);
                  setAssetGeocodingError('');
                }
              }}
              onBlur={handleAssetAddressBlur}
              filterOptions={(x) => x}
              clearOnEscape
              clearOnBlur={false}
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
                  helperText={assetGeocodingError || (isGeocodingAsset ? 'Searching for coordinates...' : (isLoadingAssetSuggestions ? 'Searching for suggestions...' : 'Start typing an address - autocomplete will suggest options'))}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isGeocodingAsset && <CircularProgress size={20} />}
                        {isLoadingAssetSuggestions && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                  error={!!assetGeocodingError}
                />
              )}
              renderOption={(props, option) => {
                if (typeof option === 'string') {
                  return <li {...props}>{option}</li>;
                }
                const parts = option.structured_formatting?.main_text || option.description || '';
                const secondary = option.structured_formatting?.secondary_text || '';
                return (
                  <li {...props} key={option.place_id}>
                    <Box>
                      <Typography variant="body1">{parts}</Typography>
                      {secondary && (
                        <Typography variant="body2" color="text.secondary">
                          {secondary}
                        </Typography>
                      )}
                    </Box>
                  </li>
                );
              }}
              PopperComponent={(props) => (
                <Popper {...props} placement="bottom-start" style={{ zIndex: 1300 }} />
              )}
            />
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              value={assetFormData.latitude}
              onChange={(e) => setAssetFormData({ ...assetFormData, latitude: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              value={assetFormData.longitude}
              onChange={(e) => setAssetFormData({ ...assetFormData, longitude: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Asset Type"
              value={assetFormData.propertyType}
              onChange={(e) => setAssetFormData({ ...assetFormData, propertyType: e.target.value })}
              margin="normal"
              required
              helperText="e.g., Building, Structure, etc."
            />
            <TextField
              fullWidth
              label="Area (m²)"
              type="number"
              value={assetFormData.area}
              onChange={(e) => setAssetFormData({ ...assetFormData, area: e.target.value })}
              margin="normal"
              required
            />
            <Box sx={{ mt: 2, mb: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  // Save form data to localStorage before navigating
                  const assetData = {
                    name: assetFormData.name,
                    address: assetFormData.address,
                    latitude: assetFormData.latitude,
                    longitude: assetFormData.longitude,
                    propertyType: assetFormData.propertyType,
                    area: assetFormData.area,
                  };
                  localStorage.setItem('assetFormData', JSON.stringify(assetData));
                  setPropertyDialogOpen(false);
                  navigate(`/assets?siteId=${currentSiteIdForProperty}`);
                }}
              >
                Open Full Asset Form for More Details
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setPropertyDialogOpen(false);
              setCurrentSiteIdForProperty(null);
              setAssetFormData({
                name: '',
                address: '',
                latitude: '',
                longitude: '',
                propertyType: '',
                area: '',
              });
              setAssetError('');
              setAssetAddressSuggestions([]);
              setAssetGeocodingError('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAsset} 
              variant="contained"
              disabled={isCreatingAsset}
            >
              {isCreatingAsset ? 'Creating...' : 'Create Asset'}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Sites;


