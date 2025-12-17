# Fix Google Maps API Key Error

## 🔴 Current Error

**Error:** `InvalidKeyMapError` - Google Maps JavaScript API error

**Cause:** The Google Maps API key is either:
- Invalid or expired
- Not enabled for the required APIs
- Restricted and doesn't allow `gis.chocoinsurance.com`

## ✅ Solution

### Step 1: Check Your Google Maps API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your API key: `AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74`
3. Click on it to edit

### Step 2: Enable Required APIs

Make sure these APIs are enabled:
- ✅ **Maps JavaScript API** - https://console.cloud.google.com/apis/library/maps-backend.googleapis.com
- ✅ **Places API** - https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- ✅ **Geocoding API** - https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com

### Step 3: Update API Key Restrictions

1. In Google Cloud Console → APIs & Services → Credentials
2. Click on your API key
3. Under **"Application restrictions"**:
   - Select: **"HTTP referrers (web sites)"**
   - Add these referrers:
     ```
     gis.chocoinsurance.com/*
     https://gis.chocoinsurance.com/*
     http://gis.chocoinsurance.com/*
     localhost:*
     127.0.0.1:*
     ```
4. Under **"API restrictions"**:
   - Select: **"Restrict key"** (NOT "Don't restrict key")
   - Click on the dropdown to select APIs
   - Enable only these 3 APIs:
     - Maps JavaScript API
     - Places API
     - Geocoding API
   - **Important**: Remove all Firebase/Cloud APIs if they're selected
5. Click **"Save"**
6. Wait up to 5 minutes for changes to take effect

### Step 4: Verify Billing

- Google Maps requires billing to be enabled (even for free tier)
- Check: https://console.cloud.google.com/billing
- Make sure billing is enabled for your project

### Step 5: Redeploy Frontend

After updating the API key restrictions:

```bash
cd azure-deployment
./deploy-frontend.sh
```

## 🧪 Test

1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
2. Visit: `https://gis.chocoinsurance.com`
3. Check browser console for errors
4. Map should load correctly

## 🔍 Quick Check

**Current API Key:** `AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74`

**Check if it's valid:**
- Go to: https://console.cloud.google.com/apis/credentials
- Verify the key exists and is active
- Check if it has the right restrictions

## ⚠️ Common Issues

1. **API Key Restrictions Too Strict**
   - Make sure these referrers are in the allowed list (the `/*` wildcard is required):
     - `gis.chocoinsurance.com/*`
     - `https://gis.chocoinsurance.com/*`
     - `http://gis.chocoinsurance.com/*`
   - Don't forget the `/*` at the end - it's a wildcard that allows all paths
2. **API Restrictions Not Set Correctly**
   - Make sure "Restrict key" is selected (NOT "Don't restrict key")
   - Only Maps JavaScript API, Places API, and Geocoding API should be enabled
   - Remove all Firebase/Cloud APIs from the list

3. **APIs Not Enabled**
   - Maps JavaScript API must be enabled in Google Cloud Console → APIs & Services → Library
   - Places API must be enabled
   - Geocoding API must be enabled
   - After enabling, they will appear in the API restrictions dropdown

4. **Billing Not Enabled**
   - Google Maps requires billing (even for free tier)
   - Enable billing in Google Cloud Console

5. **Wrong API Key**
   - Make sure you're using the correct API key
   - Check the key in `.env.production` matches the one in Google Cloud Console

## 🎯 After Fixing

Once you've updated the API key restrictions in Google Cloud Console:
1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache
3. Refresh: `https://gis.chocoinsurance.com`
4. Map should work!

**The frontend is already deployed with the API key - you just need to update the restrictions in Google Cloud Console!**

