# Google Maps API Setup Guide

## Required APIs

To ensure the map works properly on mobile devices with full zoom functionality, you need to enable the following APIs in your Google Cloud Console:

### 1. **Maps JavaScript API** (Required - Main API)
- **Status**: Should already be enabled
- **Purpose**: Displays the interactive map
- **Enable at**: https://console.cloud.google.com/apis/library/maps-backend.googleapis.com

### 2. **Places API** (Required - For address autocomplete)
- **Status**: Should already be enabled (used in Sites.jsx and Assets.jsx)
- **Purpose**: Provides address autocomplete and place details
- **Enable at**: https://console.cloud.google.com/apis/library/places-backend.googleapis.com

### 3. **Geocoding API** (Required - For address to coordinates)
- **Status**: Should already be enabled (used in Sites.jsx and Assets.jsx)
- **Purpose**: Converts addresses to latitude/longitude coordinates
- **Enable at**: https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com

### 4. **Maps Embed API** (Optional - Not currently used)
- **Status**: Not required for this project
- **Purpose**: Embedded maps (we use JavaScript API instead)

## Current Configuration

**Production API Key**: `AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74`  
**Production Map ID**: `9c1b93f309da8cdacf21f981`

Your `.env` file should contain:
```
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74
REACT_APP_GOOGLE_MAPS_MAP_ID=9c1b93f309da8cdacf21f981
```

**Google Cloud Console**: https://console.cloud.google.com/apis/credentials?project=helical-cascade-389820

## Map ID Setup

The Map ID is required for AdvancedMarkerElement (the custom pin markers). To create one:

1. Go to Google Cloud Console → Maps → Map Management
2. Click "Create Map ID"
3. Choose "Vector" map type
4. Copy the Map ID and add it to your `.env` file

## API Key Restrictions (Recommended)

For security, restrict your API key:

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Click on your API key
3. Under "Application restrictions":
   - Choose "HTTP referrers (web sites)"
   - Add these referrers (the `/*` wildcard is required):
     - `gis.chocoinsurance.com/*`
     - `https://gis.chocoinsurance.com/*`
     - `http://gis.chocoinsurance.com/*`
     - `localhost:*` (for development)
     - `127.0.0.1:*` (for development)
4. Under "API restrictions":
   - Select "Restrict key"
   - Enable only these APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - **Important**: Remove all Firebase/Cloud APIs if they're selected
5. Click "Save"
6. Wait up to 5 minutes for changes to take effect

## Testing

After enabling APIs, test:
1. Map displays correctly
2. Can zoom in/out (pinch gesture on mobile, buttons on desktop)
3. Can pan/drag the map
4. Markers appear correctly
5. Address autocomplete works in Sites/Assets forms

## Troubleshooting

If the map doesn't work:
1. Check browser console for errors
2. Verify API key is correct in `.env` file
3. Verify all required APIs are enabled
4. Check API key restrictions allow your domain
5. Verify Map ID is set correctly

