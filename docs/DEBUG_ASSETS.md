# Debugging Assets Not Showing

## Quick Checks:

### 1. Check Browser Console (F12 → Console)
Look for any red error messages. Common issues:
- `401 Unauthorized` - You're not logged in
- `404 Not Found` - Route not found
- `CORS error` - Cross-origin issue
- `Network error` - Server not reachable

### 2. Check Network Tab (F12 → Network)
1. Refresh the page
2. Look for a request to `/api/assets`
3. Click on it and check:
   - **Status**: Should be 200 (green) or 401 (if not logged in)
   - **Response**: Should show JSON data or error message
   - **Headers**: Check if Authorization header is present

### 3. Test Authentication
Open browser console and run:
```javascript
localStorage.getItem('token')
```
If this returns `null`, you need to log in first.

### 4. Test API Directly
If you have a token, test in browser console:
```javascript
fetch('http://20.217.208.150/api/assets', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

## Most Likely Issues:

1. **Not Logged In** - The `/api/assets` endpoint requires authentication
2. **Token Expired** - Try logging out and back in
3. **CORS Issue** - Check server CORS configuration
4. **Server Not Running** - But we verified it is running

## Next Steps:

Please share:
1. What error message you see in the console
2. What status code you see in the Network tab for `/api/assets`
3. Whether you're logged in



