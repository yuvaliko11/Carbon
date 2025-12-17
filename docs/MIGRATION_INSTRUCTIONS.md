# Migration Instructions: Delete bi-system & Rename properties to assets

## Step 1: Delete bi-system Database (via MongoDB Atlas UI)

1. Go to https://cloud.mongodb.com
2. Navigate to **Data Explorer**
3. Find the **`bi-system`** database in the left sidebar
4. Click on the **`bi-system`** database name
5. Click the **"..."** (three dots) menu next to the database name
6. Select **"Drop Database"**
7. Confirm the deletion

## Step 2: Rename properties Collection to assets (via MongoDB Atlas UI)

**Option A: If you see "Rename Collection" option:**
1. In **Data Explorer**, select **`bi_map_db`** database
2. Find the **`properties`** collection
3. Click the **"..."** menu next to `properties`
4. Select **"Rename Collection"**
5. Enter: `assets`
6. Click **"Rename"**

**Option B: If "Rename Collection" is not available, use MongoDB Shell:**

Run this on your Azure VM where the server is running:

```bash
# SSH into Azure VM
ssh -i "/Users/yuvaliko/.ssh/azure_vm_key" azureuser@20.217.208.150

# Once connected, run:
cd /opt/choco-gis-backend
node scripts/renameCollectionDirect.js
```

**Option C: Manual MongoDB Shell Command:**

If you have MongoDB shell access:

```bash
mongosh "YOUR_MONGODB_CONNECTION_STRING"
use bi_map_db
db.properties.renameCollection("assets")
```

## Step 3: Restart Backend Server

After renaming the collection, restart the server:

```bash
# SSH into Azure VM
ssh -i "/Users/yuvaliko/.ssh/azure_vm_key" azureuser@20.217.208.150

# Restart the server
sudo systemctl restart choco-gis-backend
# OR if systemctl doesn't work:
pkill -f "node server.js"
cd /opt/choco-gis-backend
sudo -u appuser /usr/bin/node server.js > /tmp/app.log 2>&1 &
```

## Step 4: Verify

1. Refresh your Assets page in the browser
2. Your data should now appear!

## Quick Alternative: Just Use 'properties' Collection Name

If renaming is too complicated, we can also just keep using `properties` collection name. The model is already configured to use `assets`, but we can change it back to `properties` if needed.



