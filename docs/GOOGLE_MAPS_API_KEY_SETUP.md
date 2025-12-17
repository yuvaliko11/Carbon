# Google Maps API Key Setup - CORRECT INSTRUCTIONS

## ⚠️ IMPORTANT: You selected "IP addresses" - that's WRONG!

You need to select **"HTTP referrers (web sites)"** NOT "IP addresses"

## ✅ CORRECT STEPS:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key: `8d00a1f6-b71d-4ebe-ab22-ff589025886b`
3. Under **"Application restrictions"**:
   - Select **"HTTP referrers (web sites)"** (NOT "IP addresses")
   - Click "Add an item"
   - Add these one by one:
     ```
     localhost:*
     127.0.0.1:*
     http://localhost:*
     http://127.0.0.1:*
     ```
4. Click **"Save"**
5. Wait 2-3 minutes for changes to propagate
6. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

## ✅ VERIFICATION:

After setup, check:
- ✅ Maps JavaScript API is enabled
- ✅ API key has HTTP referrer restrictions (not IP addresses)
- ✅ localhost:* is in the allowed referrers list
- ✅ Billing is enabled (even with free trial)

## Current Configuration:

- **API Key**: AIzaSyCkNkX9HHOWspzdIbgls72kEC3liutx4m8
- **Map ID**: 3f443fab2e0d534989ba5380
- **Backend**: http://localhost:5001/api
- **Frontend**: http://localhost:3000

