# How to Rename MongoDB Collection from 'properties' to 'assets'

## Option 1: Using MongoDB Atlas Web Interface (EASIEST)

1. Go to https://cloud.mongodb.com
2. Navigate to your cluster → Data Explorer
3. Select the `bi_map_db` database
4. Find the `properties` collection
5. Click on the collection name
6. Click the "..." menu (three dots)
7. Select "Rename Collection"
8. Enter new name: `assets`
9. Click "Rename"

**That's it!** The collection will be renamed immediately.

## Option 2: Run Migration Script on Azure VM

If you prefer to use a script, SSH into your Azure VM and run:

```bash
# SSH into Azure VM
cd "/Users/yuvaliko/Desktop/Choco GIS CRM"
./azure-deployment/ssh-vm.sh

# Once on the VM:
cd /opt/choco-gis-backend
node scripts/renameCollectionToAssets.js
```

## Option 3: Using MongoDB Shell (mongosh)

If you have MongoDB shell installed:

```bash
mongosh "YOUR_MONGODB_CONNECTION_STRING"
use bi_map_db
db.properties.renameCollection("assets")
```

## After Migration

1. Restart the backend server (it's already configured to use 'assets' collection)
2. Refresh your browser - the data should appear!

## Verify Migration

After renaming, check in MongoDB Atlas:
- The `properties` collection should be gone
- The `assets` collection should exist with all your data



