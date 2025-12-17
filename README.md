# BI System for Site and Asset Management

A complete BI system for managing sites and assets with Google Maps visualization, CRM at the asset and site level, and detailed reports.

## Main Features

### Site Management
- Create, edit, delete, and view sites
- Search and filter sites by name and address
- Manage total area for sites
- View assets associated with a site
- Create assets directly from a site

### Asset Management
- Create, edit, delete, and associate assets with sites
- Detailed address information (city, street, number, block, parcel, plot)
- Construction data: construction year, construction type, roof type, foundation method
- Technical specifications: number of floors, areas, elevators, stairwells
- Fire protection systems
- Renovation and repair tracking
- Image and asset uploads
- Engineering report uploads (PDF, DOCX, XLSX)
- GeoJSON support for displaying complex shapes on the map

### Interactive Maps
- Display sites and assets on Google Maps
- GeoJSON layer support for displaying polygons and complex shapes
- Filter by type (sites/properties/all)
- Address search with Google Geocoding API
- Display details by clicking on markers
- Advanced Markers support for Google Maps

### Reports and Statistics
- Site summary: total sites, sites with assets, average assets per site
- Asset summary: distribution by type, total areas, average areas
- Visual charts (Bar Charts, Pie Charts) with Recharts
- Export GeoJSON of all data

### Earthquake Data Management
- Upload and manage earthquake history GeoJSON files
- **Unified View**: View both uploaded Danger Maps and Earthquake data in one list
- Support for Point, LineString, and MultiLineString geometries
- Magnitude-based visualization:
  - **Point geometries**: Displayed as circles with size and color based on magnitude
  - **LineString/MultiLineString geometries**: Displayed as polylines with color and stroke width based on magnitude
- Color-coding by magnitude:
  - Low (0-3): Green
  - Medium (3-5): Yellow/Orange
  - High (5-7): Orange/Red
  - Very High (7+): Red/Dark Red
- Toggle visibility of datasets on the map
- All data stored in MongoDB (cloud storage only, no local files)
- Visibility state persists across page navigation using localStorage

### AI Map Generation
- Generate seismic hazard maps, infrastructure maps, and distribution maps using AI
- Natural language prompts to create custom maps
- Powered by OpenAI API
- Generated maps are automatically saved and displayed in the "Generated" tab and Earthquakes page

### User Management
- User registration and login
- User management (admin only): create, edit, delete, change password
- Role system: Admin and User
- Route protection by role

### File Uploads
- Image uploads (JPEG, PNG, GIF, WebP) - up to 10MB
- Engineering report uploads (PDF, DOCX, XLSX) - up to 50MB
- File management associated with properties

## GeoJSON Format for Earthquakes

Earthquake GeoJSON files should follow this structure:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [longitude, latitude]
      },
      "properties": {
        "mag": 4.5,
        "time": 1234567890000,
        "place": "Location name"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [[lng1, lat1], [lng2, lat2], ...]
      },
      "properties": {
        "mag": 5.2,
        "time": 1234567890000,
        "place": "Fault line"
      }
    }
  ]
}
```

**Supported Geometry Types:**
- `Point`: Single earthquake location (rendered as circle)
- `LineString`: Fault line or earthquake path (rendered as polyline)
- `MultiLineString`: Multiple connected fault lines (rendered as multiple polylines)

**Magnitude Property:**
The system looks for magnitude in these property names (case-insensitive):
- `mag`
- `magnitude`
- `Magnitude`
- `MAG`
- `magValue`
- `magnitudeValue`

**Visualization:**
- **Point geometries**: Circles with radius = magnitude × 5000 meters (minimum 1000m)
- **LineString geometries**: Polylines with stroke width = magnitude × 2 pixels (minimum 2px)
- **Color coding**: Based on magnitude ranges (Green → Yellow → Orange → Red)

## Technologies

### Backend
- **Node.js** v18 + **Express** - REST API server
- **MongoDB Atlas** + **Mongoose** - Database
- **JWT (jsonwebtoken)** - User authentication
- **bcryptjs** - Password encryption
- **multer** - File uploads
- **express-validator** + **validator** - Input validation
- **cors** - CORS support
- **dotenv** - Environment variable management
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-mongo-sanitize** - NoSQL injection prevention
- **hpp** - HTTP Parameter Pollution prevention
- **openai** - AI map generation

### Frontend
- **React** 18 - UI library
- **Material-UI (MUI)** 5 - Design and components
- **@react-google-maps/api** - Google Maps integration
- **Recharts** - Charts and reports
- **React Router** 6 - Navigation
- **Axios** - API calls
- **@emotion/react** & **@emotion/styled** - Styling

### Deployment
- **Azure Virtual Machine** - Backend & Frontend (Ubuntu 22.04 LTS)
- **MongoDB Atlas** - Database (Cloud)

## Installation and Setup

### Prerequisites
- **Node.js** v18 or higher
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB)
- **Google Maps API key** (with Maps JavaScript API, Places API, and Geocoding API enabled)
  - **Current Production Key**: `AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74`
  - **Google Cloud Console**: https://console.cloud.google.com/apis/credentials?project=helical-cascade-389820
- **Google Maps Map ID** (required for Advanced Markers)
  - **Current Map ID**: `9c1b93f309da8cdacf21f981`
- **OpenAI API Key** (required for AI map generation)

### MongoDB Atlas Configuration

**Connection String:**
```
mongodb+srv://bi_map_user:GNKVfBppbsTL7nH5@cluster0.ini32ht.mongodb.net/bi_map_db?retryWrites=true&w=majority&appName=Cluster0
```

**Database User:**
- **Username**: `bi_map_user`
- **Password**: `GNKVfBppbsTL7nH5`
- **Database**: `bi_map_db`
- **Privileges**: `atlasAdmin@admin`

**Network Access:**
- Add Azure VM IP address to MongoDB Atlas Network Access:
  - Current VM IP: `20.217.208.150/32` (specific IP)
  - Or add Azure IP ranges for flexibility:
    - `20.0.0.0/8` (Azure main range)
    - `40.0.0.0/8` (Azure additional range)

**Important**: Make sure the user `bi_map_user` exists in MongoDB Atlas with the password `GNKVfBppbsTL7nH5`. If the password is different, update it in MongoDB Atlas or update the connection string in all configuration files.

### Backend

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```env
PORT=5001
MONGODB_URI=mongodb+srv://bi_map_user:GNKVfBppbsTL7nH5@cluster0.ini32ht.mongodb.net/bi_map_db?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
OPENAI_API_KEY=sk-your-openai-api-key
```

**Notes:**
- `PORT`: Server port (default: 5001 for development, 8080 for Azure VM production)
- `MONGODB_URI`: Connection String from MongoDB Atlas
  - **Username**: `bi_map_user`
  - **Password**: `GNKVfBppbsTL7nH5`
  - **Database**: `bi_map_db`
  - **Full format**: `mongodb+srv://bi_map_user:GNKVfBppbsTL7nH5@cluster0.ini32ht.mongodb.net/bi_map_db?retryWrites=true&w=majority&appName=Cluster0`
- `JWT_SECRET`: Strong random key (minimum 32 characters in production, can be generated with: `openssl rand -base64 32`)
- `FRONTEND_URL`: Frontend URL (required for CORS in production)
- `OPENAI_API_KEY`: Required for generating maps with AI
- **Important**: Default port is 5001 (if 5000 is in use)

3. Start the server:
```bash
npm start
# Or for development with auto-reload:
npm run dev
```

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74
REACT_APP_GOOGLE_MAPS_MAP_ID=9c1b93f309da8cdacf21f981
```

**Notes:**
- `REACT_APP_API_URL`: Backend API URL (default is 5001 for development, production uses `https://gis.chocoinsurance.com/api`)
- `REACT_APP_GOOGLE_MAPS_API_KEY`: Google Maps API key (production key: `AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74`)
- `REACT_APP_GOOGLE_MAPS_MAP_ID`: Map ID for Advanced Markers (required, current: `9c1b93f309da8cdacf21f981`)
- **Important**: The frontend `package.json` has a proxy set to `http://localhost:5001`, so if your backend runs on 5000, either:
  - Remove/update the proxy in `package.json`, OR
  - Set `REACT_APP_API_URL` explicitly to match your backend port

3. Start the application:
```bash
npm start
```

The application will start at http://localhost:3000

## Usage

### Creating First User

**Via UI:**
1. Open the application in your browser (http://localhost:3000)
2. Click "Sign Up" to create a new user
3. Fill in details: name, email, password

**Via API (for creating Admin):**
```bash
# Development (local)
POST http://localhost:5001/api/auth/register
Content-Type: application/json

# Production (Azure VM)
POST https://gis.chocoinsurance.com/api/auth/register
Content-Type: application/json

{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "password123",
  "role": "admin"
}
```

**Or using Script:**
```bash
cd backend
node scripts/createAdmin.js
```

### Site Management

1. Log in to the system
2. Go to the **"Sites"** page
3. Click **"Add Site"** to create a new site
4. Fill in the details:
   - Site name
   - Address (can use automatic address search)
   - Coordinates (auto-filled from address search)
   - Description (optional)
   - Total area (optional)
5. Click **"Save"**
6. You can edit or delete sites (deletion - admin only)
7. You can create properties directly from a site

### Property Management

1. Go to the **"Assets"** (Properties) page
2. Click **"Add Property"** to create a new property
3. Fill in the details:
   - **Basic Information**: name, associated site, address, coordinates, property type, area
   - **Address Details**: city, street, number, block, parcel, plot
   - **Construction Data**: construction year, construction type, roof type, foundation method
   - **Technical Specifications**: floors above/below ground, areas, elevators, stairwells
   - **Fire Protection Systems**: sprinklers, fire suppression systems, fire doors, hydrants
   - **Renovations**: whether major renovation was performed, description
   - **Files**: upload images and engineering reports
   - **GeoJSON**: add GeoJSON to display complex shapes on the map (optional)
4. Click **"Save"**
5. You can edit or delete properties (deletion - admin only)

### Map Display

1. Go to the **"Dashboard"** page
2. The map will display all sites and properties
3. **Filter**: Use filter to show only sites, only properties, or all
4. **Details**: Click on marker to display detailed information
5. **GeoJSON**: Properties with GeoJSON will be displayed as polygons/shapes on the map
6. **Search**: Use search for quick location

### Reports

1. Go to the **"Reports"** page
2. View statistics:
   - **Site Summary**: total sites, sites with properties, average properties per site
   - **Property Summary**: distribution by type, total areas, average areas
   - **Charts**: Visual Bar Charts and Pie Charts

### Earthquake Data Management

1. Go to the **"Earthquakes"** page
2. **Upload GeoJSON**: Click "Upload GeoJSON" button
   - Select a GeoJSON file (.geojson or .json)
   - Optionally provide a dataset name and description
   - Supported geometry types: Point, LineString, MultiLineString
   - File size limit: 20MB
3. **Manage Datasets**: View all uploaded datasets with metadata
   - Feature count
   - Upload date
   - Geometry types in the dataset
   - **Type**: EARTHQUAKE or DANGER MAP
4. **Toggle Visibility**: Use the switch to show/hide datasets on the map
   - Visibility state persists across page navigation
5. **Delete Dataset**: Click delete icon to remove a dataset
6. **View on Map**: Toggled datasets appear on the Dashboard map:
   - **Point geometries**: Displayed as circles sized and colored by magnitude
   - **LineString/MultiLineString geometries**: Displayed as polylines colored and sized by magnitude
   - Click on features to see earthquake details (magnitude, location, time)

### AI Map Generation

1. Go to the **"Earthquakes"** page
2. **Use Suggestions**: Click on one of the suggested map types (Hazard, Infrastructure, Distribution)
3. **Custom Prompt**: Or type your own description in the chat input
4. **Generate**: Click "Send" to generate the map
5. **View**: The generated map will be automatically added to your list and displayed on the Dashboard

### User Management (Admin Only)

1. Go to the **"Users"** page
2. **Create User**: Click "Add User"
3. **Edit User**: Click edit icon
4. **Change Password**: Click lock icon
5. **Delete User**: Click delete icon (cannot delete yourself)

## API Structure

### Authentication
- `POST /api/auth/register` - Register new user (Public)
- `POST /api/auth/login` - Login (Public)
- `GET /api/auth/me` - Current user (Private)

### Users (Admin Only)
- `GET /api/users` - List all users
- `GET /api/users/me` - Current user (all logged-in users)
- `GET /api/users/:id` - User details
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Update user password
- `DELETE /api/users/:id` - Delete user

### Sites
- `GET /api/sites` - List sites (with search: `?name=...&address=...`)
- `GET /api/sites/:id` - Site details
- `POST /api/sites` - Create site (Private)
- `PUT /api/sites/:id` - Update site (Private - creator or admin only)
- `DELETE /api/sites/:id` - Delete site (Admin only)
- `GET /api/sites/:id/properties` - Site properties

### Assets
- `GET /api/assets` - List assets (with search: `?name=...&propertyType=...&siteId=...`)
- `GET /api/assets/:id` - Asset details
- `POST /api/assets` - Create asset (Private)
- `PUT /api/assets/:id` - Update asset (Private - creator or admin only)
- `DELETE /api/assets/:id` - Delete asset (Admin only)

### Reports
- `GET /api/reports/sites-summary` - Site summary
- `GET /api/reports/properties-summary` - Asset summary
- `GET /api/reports/geojson` - GeoJSON of all data (with filter: `?type=sites|properties|all`)

### Earthquakes
- `POST /api/earthquakes/upload` - Upload GeoJSON file (Private, multipart/form-data)
  - Body: `geojson` (file), `name` (optional), `description` (optional)
  - Returns: Created dataset (without full GeoJSON)
- `GET /api/earthquakes` - List all earthquake datasets (Private)
  - Returns: Array of datasets (without full GeoJSON)
- `GET /api/earthquakes/:id` - Get dataset details (Private)
  - Returns: Dataset metadata (without full GeoJSON)
- `GET /api/earthquakes/:id/geojson` - Get GeoJSON data for map rendering (Private)
  - Returns: Full GeoJSON FeatureCollection
- `DELETE /api/earthquakes/:id` - Delete dataset (Private)
  - Returns: Success message
- `POST /api/earthquakes/generate` - Generate map with AI (Private)
  - Body: `prompt`, `name`, `description`

### Danger Maps
- `POST /api/danger-maps/upload` - Upload Danger Map file (Private, multipart/form-data)
- `GET /api/danger-maps` - List all danger maps (Private)
- `GET /api/danger-maps/:id` - Get danger map details (Private)
- `GET /api/danger-maps/:id/geojson` - Get GeoJSON data (Private)
- `DELETE /api/danger-maps/:id` - Delete danger map (Private)
- `POST /api/danger-maps/generate` - Generate map with AI (Private)

### Upload
- `POST /api/upload/image` - Upload image (Private, multipart/form-data)
- `POST /api/upload/report` - Upload engineering report (Private, multipart/form-data)

### Health Check
- `GET /api/health` - Overall system health (status, database, memory, uptime)
- `GET /api/ready` - Readiness probe (for load balancers)
- `GET /api/live` - Liveness probe (process monitoring)

## Permissions

### User (Regular User)
- ✅ Login and logout
- ✅ View all sites and properties
- ✅ Create new sites and properties
- ✅ Edit sites and properties they created
- ❌ Delete sites and properties
- ❌ User management

### Admin (Administrator)
- ✅ All User actions
- ✅ Delete sites and properties (including those not created by them)
- ✅ Edit sites and properties of all users
- ✅ User management: create, edit, delete, change password
- ✅ Access to user management page

## ⚠️ IMPORTANT: Local vs Production

**Your laptop (localhost) is for TESTING ONLY!**
- Backend on `localhost:5001` = Testing/Development
- Frontend on `localhost:3000` = Testing/Development
- **Never let customers access your laptop!**

**Azure VM is for REAL CUSTOMERS!**
- Backend on Azure VM = Production
- Frontend on Azure VM = Production
- **This is what customers access!**

See `LOCAL_VS_PRODUCTION.md` for details.

## 🚀 Production Mode & Monitoring

### Local Testing (Your Laptop)

The application is configured for **production-ready** testing locally with:
- ✅ **Auto-restart** on crashes (PM2)
- ✅ **Memory protection** (auto-restart if > 1GB)
- ✅ **Database auto-reconnection**
- ✅ **Graceful shutdown** handling
- ✅ **Health monitoring** endpoints
- ✅ **Error recovery** mechanisms

### Starting Production Backend (Local Testing)

```bash
# Quick start (LOCAL TESTING ONLY)
./START_PRODUCTION.sh

# Or manually
pm2 start ecosystem.config.production.js --env production
pm2 save
```

**⚠️ This runs on your laptop for testing. For real customers, deploy to Azure!**

### Deploying to Azure (For Real Customers)

We use an Azure Virtual Machine (VM) for production. The deployment is automated via the `deploy-vm.sh` script.

**CRITICAL**: Always use `deploy-vm.sh` to deploy. This script handles:
-   **Nginx Configuration**: Sets up Nginx to serve the frontend and proxy API requests.
-   **Uploads Handling**: Configures Nginx to serve uploaded files directly from disk (fixing 502 errors).
-   **Persistence**: Mounts the uploads directory to the backend container.

```bash
cd azure-deployment

# Deploy to Azure VM (Frontend + Backend + Nginx)
./deploy-vm.sh
```

See `azure-deployment/README.md` for detailed Azure deployment guide.

### Monitoring

**PM2 Web Dashboard** (Recommended - Free):
```bash
pm2 web
# Access at: http://localhost:9615
```

**PM2 Plus** (Cloud Monitoring - Optional):
- Sign up at: https://app.pm2.io/
- Monitor from anywhere in the world
- Mobile apps available

**System Monitoring** (macOS):
- **iStat Menus** (Best - Paid): https://bjango.com/mac/istatmenus/
- **MenuMeters** (Free): https://github.com/yujitach/MenuMeters
- **Activity Monitor** (Built-in): Applications > Utilities

See `MONITORING_SETUP.md` for complete monitoring guide.

### Health Endpoints

- `GET /api/health` - Overall system health
- `GET /api/ready` - Readiness probe (for load balancers)
- `GET /api/live` - Liveness probe (process monitoring)

### Production Testing

```bash
# Run automated tests
./test-production.sh

# Follow comprehensive checklist
# See: PRODUCTION_TESTING_CHECKLIST.md
```

**Production Documentation:**
- `PRODUCTION_READY.md` - Complete production guide
- `PRODUCTION_TESTING_CHECKLIST.md` - Testing checklist
- `PRODUCTION_STABILITY_GUIDE.md` - Stability features
- `MONITORING_SETUP.md` - Monitoring setup

## Deployment

The system is deployed on **Azure Virtual Machine**:

### Backend - Azure VM
- **VM Name**: `choco-gis-backend-vm`
- **IP Address**: `20.217.208.150`
- **Location**: `israelcentral` (Israel Central)
- **Resource Group**: `choco-gis`
- **OS**: Ubuntu 22.04 LTS
- **Reverse Proxy**: Nginx with HTTPS (Let's Encrypt)
- **Process Manager**: PM2 (Production Mode)
- **Security**: UFW firewall, fail2ban, security hardening
- **Production API URL**: `https://gis.chocoinsurance.com/api`
- **Health Check**: `https://gis.chocoinsurance.com/api/health`
- Environment variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `FRONTEND_URL`

### Frontend - Azure VM (Nginx)
- Served from same Azure VM as backend
- Static files location: `/var/www/frontend`
- Served via Nginx reverse proxy with HTTPS
- **Production URL**: `https://gis.chocoinsurance.com`
- **IP Access**: `http://20.217.208.150` (redirects to HTTPS)
- **Domain**: `gis.chocoinsurance.com`

**Production URLs:**
- **Frontend**: `https://gis.chocoinsurance.com`
- **Backend API**: `https://gis.chocoinsurance.com/api`
- **Health Check**: `https://gis.chocoinsurance.com/api/health`

**Deployment Guides:**
- See `azure-deployment/README.md` for detailed Azure deployment guide
- See `azure-deployment/QUICK_START.md` for quick deployment steps
- See `PRODUCTION_READY.md` for production setup

### Google Maps API Configuration

**Current Production Settings:**
- **API Key**: `AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74`
- **Map ID**: `9c1b93f309da8cdacf21f981`
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials?project=helical-cascade-389820

**API Restrictions (in Google Cloud Console):**
- Application restrictions: HTTP referrers with `gis.chocoinsurance.com/*`, `https://gis.chocoinsurance.com/*`, `http://gis.chocoinsurance.com/*`
- API restrictions: Only Maps JavaScript API, Places API, and Geocoding API enabled

**Important Notes:**
- The `/*` wildcard in HTTP referrers is required to allow all paths on the domain
- API restrictions must be set to "Restrict key" (not "Don't restrict key")
- Changes to API key restrictions take up to 5 minutes to propagate
- See `GOOGLE_MAPS_API_SETUP.md` for detailed setup instructions

## Project Structure

```
Choco GIS CRM/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Request-response logic
│   ├── middleware/      # Middleware (auth, role, dbCheck)
│   ├── models/          # Mongoose models
│   ├── routes/          # Route definitions
│   ├── scripts/         # Utility scripts (user creation, etc.)
│   ├── utils/           # Helper functions
│   ├── uploads/         # Uploaded files (images, reports)
│   ├── server.js        # Entry point
│   └── Dockerfile       # Docker image (optional, for containerization)
│
├── frontend/
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # React components
│   │   │   ├── Auth/    # Login and registration
│   │   │   ├── Layout/  # General layout
│   │   │   └── Map/     # Map components
│   │   ├── context/     # React Context (AuthContext)
│   │   ├── pages/       # Application pages
│   │   ├── services/    # API calls
│   │   └── utils/       # Helper functions
│   ├── build/           # Build output (for Azure VM deployment)
│   └── package.json
│
└── docs/                # Additional documentation
```

## Security Features

### Backend Security
- **Helmet.js**: Security headers to protect against common vulnerabilities
- **Rate Limiting**: API rate limiting to prevent abuse (different limits for auth vs general API)
- **Data Sanitization**: 
  - NoSQL injection prevention via `express-mongo-sanitize`
  - XSS prevention through input sanitization
  - HTTP Parameter Pollution (HPP) prevention
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **CORS Protection**: Configurable CORS for production environments
- **Input Validation**: express-validator for request validation

### Frontend Security
- **Token Storage**: JWT tokens stored in localStorage
- **Automatic Token Refresh**: Token validation on API calls
- **Protected Routes**: Route protection based on authentication and roles
- **Input Sanitization**: Client-side validation before API calls

## Advanced Features

### GeoJSON Support
- Full GeoJSON support for displaying complex shapes on the map
- Point, Polygon, LineString, and other complex shapes
- Export GeoJSON of all data via API

### Address Autocomplete
- Integration with Google Geocoding API
- Automatic address search
- Automatic coordinate filling

### File Management
- Image uploads (JPEG, PNG, GIF, WebP) - up to 10MB
- Engineering report uploads (PDF, DOCX, XLSX) - up to 50MB
- File management associated with properties
- Support for local files and URLs
- Filename sanitization to prevent path traversal attacks

### Responsive Design
- Full responsive design
- Mobile and tablet support
- UI adapted for small screens

## Future Preparation

The system is ready for future integration with:
- **OpenQuake** - Earthquake modeling
- **HAZUS** - Earthquake modeling
- `additionalData` field in Property model available for additional data
- Detailed construction and technical fields ready for integration

## 📊 Quick Commands

### Production Management
```bash
# Start production backend
./START_PRODUCTION.sh

# Check status
pm2 status

# View logs
pm2 logs gis-crm-backend

# Monitor resources
pm2 monit

# Restart
pm2 restart gis-crm-backend

# Run tests
./test-production.sh
```

### Monitoring
```bash
# Start PM2 Web Dashboard
pm2 web
# Then open: http://localhost:9615

# Check health
curl http://localhost:5001/api/health

# Check readiness
curl http://localhost:5001/api/ready
```

## Troubleshooting

### MongoDB Connection Issues
- Check `MONGODB_URI` in `.env`
- Ensure IP is whitelisted in MongoDB Atlas
- Check username and password
- Verify connection string format: `mongodb+srv://user:password@cluster.mongodb.net/dbname`

### Port Conflicts
- If port 5000 is in use, change `PORT` in backend `.env` to 5001
- Update `REACT_APP_API_URL` in frontend `.env` to match backend port
- Frontend proxy defaults to 5001, so if backend uses 5000, either:
  - Change backend to 5001, OR
  - Update frontend `.env` to use `http://localhost:5000/api`

### CORS Issues
- Ensure `FRONTEND_URL` is set correctly in Backend `.env`
- Check CORS settings in `backend/server.js`
- In development, CORS allows all origins by default
- In production, ensure Azure VM frontend URL is correctly configured

### Google Maps Issues
- **API Key**: Current production key is `AIzaSyDwta7WtfbS6Zae4lnpeBwOwVZHhHftU74`
- **Required APIs**: Must enable in Google Cloud Console:
  - Maps JavaScript API
  - Places API
  - Geocoding API
- **API Restrictions**: In Google Cloud Console → APIs & Services → Credentials:
  - Select "Restrict key" and enable only: Maps JavaScript API, Places API, Geocoding API
- **HTTP Referrers**: Application restrictions must include:
  - `gis.chocoinsurance.com/*`
  - `https://gis.chocoinsurance.com/*`
  - `http://gis.chocoinsurance.com/*`
  - Note: The `/*` wildcard is required to allow all paths
- **Map ID**: Required for Advanced Markers (current: `9c1b93f309da8cdacf21f981`)
- **Billing**: Google Maps requires billing to be enabled (even for free tier)
- **Changes Propagation**: API key restriction changes take up to 5 minutes to take effect

### Authentication Issues
- Check JWT_SECRET is set and at least 32 characters (production)
- Verify token is being sent in Authorization header
- Check token expiration in browser localStorage
- Ensure backend and frontend are using same JWT_SECRET

## License

ISC
