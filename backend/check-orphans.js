const mongoose = require('mongoose');
const Lease = require('./models/Lease');
const Parcel = require('./models/Parcel');
const CarbonContract = require('./models/CarbonContract');
require('dotenv').config();

const checkOrphans = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://fiji-mongodb:27017/fiji-carbon');
        console.log('Connected to MongoDB');

        const leases = await Lease.find({});
        const parcels = await Parcel.find({});
        const contracts = await CarbonContract.find({});

        console.log(`Total Leases: ${leases.length}`);
        console.log(`Total Parcels: ${parcels.length}`);
        console.log(`Total CarbonContracts: ${contracts.length}`);

        // Check for orphaned Parcels (not linked to any Lease)
        const leasedParcelIds = new Set();
        leases.forEach(lease => {
            if (lease.parcels) {
                lease.parcels.forEach(p => {
                    if (p.parcel) leasedParcelIds.add(p.parcel.toString());
                });
            }
        });

        const orphanedParcels = parcels.filter(p => !leasedParcelIds.has(p._id.toString()));
        console.log(`\nOrphaned Parcels (${orphanedParcels.length}):`);
        orphanedParcels.forEach(p => {
            console.log(`- ID: ${p._id}, Name: ${p.name}, LeaseRef: ${p.currentLeases}`);
        });

        // Check for orphaned CarbonContracts (no matching Lease)
        const leaseNumbers = new Set(leases.map(l => l.leaseNumber.toLowerCase().trim()));
        const orphanedContracts = contracts.filter(c => !leaseNumbers.has(c.leaseNumber.toLowerCase().trim()));

        console.log(`\nOrphaned CarbonContracts (${orphanedContracts.length}):`);
        orphanedContracts.forEach(c => {
            console.log(`- ID: ${c._id}, LeaseNumber: ${c.leaseNumber}, Name: ${c.name}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkOrphans();
