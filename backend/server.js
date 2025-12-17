const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.json());
app.use(cors({
    origin: ['https://ctrade.facio.io', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:5002'],
    credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiji_carbon_hub';
        console.log('🔗 Connecting to MongoDB...');
        console.log('📝 URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password in logs

        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('✅ Connected to MongoDB');
        await seedAdminUser();
    } catch (err) {
        console.error('❌ MongoDB connection error:', err.message);

        // In production, don't fall back to in-memory DB
        if (process.env.NODE_ENV === 'production') {
            console.error('❌ Cannot start server without database in production');
            process.exit(1);
        }

        // Only use in-memory DB in development
        console.log('⚠️  Falling back to In-Memory MongoDB (development only)...');
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const uri = mongod.getUri();
            await mongoose.connect(uri);
            console.log('✅ Connected to In-Memory MongoDB');
            console.log(`📝 DB URI: ${uri}`);
            await seedAdminUser();
        } catch (memErr) {
            console.error('❌ In-Memory DB failed:', memErr);
            process.exit(1);
        }
    }
};

const seedAdminUser = async () => {
    try {
        const User = require('./models/User'); // Ensure this model exists
        const bcrypt = require('bcryptjs');

        const email = 'yo301107@gmail.com';
        const password = 'Admin123';

        let user = await User.findOne({ email });

        if (!user) {
            console.log('✨ Auto-seeding Admin User...');
            const hashedPassword = await bcrypt.hash(password, 10);
            user = new User({
                name: 'Yuval Admin',
                email: email,
                password: hashedPassword,
                role: 'admin'
            });
            await user.save();
            console.log('✅ Admin User Created: ' + email);
        } else {
            console.log('👤 Admin User already exists.');
        }

    } catch (error) {
        console.error('⚠️ Could not seed admin user:', error.message);
        // Don't crash server for this, just warn
    }
};

connectDB();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/land-units', require('./routes/landUnits'));
app.use('/api/parcels', require('./routes/parcels'));
app.use('/api/leases', require('./routes/leases'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/sites', require('./routes/sites'));
app.use('/api/danger-maps', require('./routes/dangerMaps'));
app.use('/api/earthquakes', require('./routes/earthquakes'));
app.use('/api/carbon-contracts', require('./routes/carbonContracts'));
app.use('/api/users', require('./routes/users'));
app.use('/api/contract-templates', require('./routes/contractTemplates'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/carbon', require('./routes/carbon'));
app.use('/api/organizations', require('./routes/organizations'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/debug', require('./routes/debug'));

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Fiji Carbon Hub API', version: '1.0.0' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Error Handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start Server
// Start Server
const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Init Scheduler
    const initScheduler = require('./services/scheduler');
    initScheduler();
});
