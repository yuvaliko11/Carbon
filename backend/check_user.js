const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const checkUser = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiji_carbon_hub';
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'yo301107@gmail.com';
        const user = await User.findOne({ email });

        if (user) {
            console.log(`User found: ${user.email}, Role: ${user.role}`);
        } else {
            console.log(`User NOT found: ${email}`);
        }

        mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUser();
