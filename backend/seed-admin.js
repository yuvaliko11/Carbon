const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

const seedAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const email = 'admin@fijicarbon.com';
        const password = 'admin';

        let user = await User.findOne({ email });
        if (user) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            name: 'Admin User',
            email,
            password: hashedPassword,
            role: 'admin'
        });

        await user.save();
        console.log('Admin user created successfully');
        console.log('Email:', email);
        console.log('Password:', password);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

seedAdmin();
