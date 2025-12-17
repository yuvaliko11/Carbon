const mongoose = require('mongoose');
const CarbonContract = require('./models/CarbonContract');
const Lease = require('./models/Lease');
const Parcel = require('./models/Parcel');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://bi_map_user:GNKVfBppbsTL7nH5@cluster0.ini32ht.mongodb.net/fiji_carbon_db?retryWrites=true&w=majority&appName=Cluster0')
    .then(async () => {
        console.log('Connected to DB');

        const contracts = await CarbonContract.find({});
        console.log(`Found ${contracts.length} Carbon Contracts:`);
        contracts.forEach(c => {
            console.log(`- ID: ${c._id}, Lease#: ${c.leaseNumber}, Name: ${c.name}, Score: ${c.greenScore}, Status: ${c.status}`);
        });

        const leases = await Lease.find({});
        console.log(`\nFound ${leases.length} Leases:`);
        leases.forEach(l => {
            console.log(`- ID: ${l._id}, Lease#: ${l.leaseNumber}, Parcels: ${l.parcels.length}`);
        });

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
