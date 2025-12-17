const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    organization: String
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiji_carbon_hub';
        console.log(`🔗 Connecting to: ${MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`);

        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const email = 'yo301107@gmail.com';
        const password = 'Admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            console.log('🔄 User already exists. Updating password...');
            existingUser.password = hashedPassword;
            existingUser.role = 'admin';
            await existingUser.save();
            console.log('✅ User password updated.');
        } else {
            console.log('✨ Creating new admin user...');
            const newUser = new User({
                name: 'Yuval Admin',
                email,
                password: hashedPassword,
                role: 'admin',
                organization: 'Carbon Registry Authority'
            });
            await newUser.save();
            console.log('✅ User created successfully.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
};

createAdmin();
