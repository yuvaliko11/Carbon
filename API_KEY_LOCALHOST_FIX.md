# Fix: Invalid Website Domain Error

## ❌ WRONG Format:
```
http://localhost:*
```
This doesn't work - Google doesn't accept wildcard ports with `localhost`

## ✅ CORRECT Format:

Add these entries **one by one** (click "Add website" for each):

1. `http://localhost:3000`
2. `http://localhost:5001`
3. `http://127.0.0.1:3000`
4. `http://127.0.0.1:5001`

**OR** if you want to allow all ports (less secure but easier for development):

Try these formats:
- `http://localhost` (without port - might work)
- `http://127.0.0.1` (without port - might work)

## 📝 Step-by-Step:

1. In the "Website restrictions" section
2. Click "Add website"
3. Enter: `http://localhost:3000`
4. Click "Done"
5. Click "Add website" again
6. Enter: `http://localhost:5001`
7. Click "Done"
8. Repeat for `127.0.0.1:3000` and `127.0.0.1:5001`
9. Click "Save" at the bottom

## 🔍 Alternative (if above doesn't work):

For development, you can temporarily:
1. Select "None" under Application restrictions
2. This allows the API key from anywhere (less secure, but works for local dev)
3. Remember to add restrictions before deploying to production!

