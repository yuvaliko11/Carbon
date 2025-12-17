const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path if needed
require('dotenv').config();

const seedUser = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const email = 'demo@carbonmonitoring.com';
        const password = 'demo1234';

        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists. Updating password...');
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            console.log('Password updated.');
        } else {
            console.log('Creating new user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            user = new User({
                name: 'Demo User',
                email,
                password: hashedPassword,
                role: 'admin',
                organization: null
            });
            await user.save();
            console.log('User created.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedUser();
