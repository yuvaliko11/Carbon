const mongoose = require('mongoose');
const Parcel = require('./models/Parcel');
const Lease = require('./models/Lease');
require('dotenv').config();

const cleanupOrphans = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all leases and collect their parcel IDs
        const leases = await Lease.find({});
        const activeParcelIds = new Set();
        leases.forEach(lease => {
            if (lease.parcels) {
                lease.parcels.forEach(p => {
                    if (p.parcel) activeParcelIds.add(p.parcel.toString());
                });
            }
        });

        console.log(`Found ${leases.length} leases with ${activeParcelIds.size} active parcels.`);

        // Find all parcels
        const allParcels = await Parcel.find({});
        console.log(`Found ${allParcels.length} total parcels.`);

        // Identify orphans
        const orphans = allParcels.filter(p => !activeParcelIds.has(p._id.toString()));
        console.log(`Found ${orphans.length} orphaned parcels.`);

        if (orphans.length > 0) {
            const orphanIds = orphans.map(p => p._id);
            await Parcel.deleteMany({ _id: { $in: orphanIds } });
            console.log(`🗑️ Deleted ${orphans.length} orphaned parcels.`);
        } else {
            console.log('No orphans to delete.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

cleanupOrphans();
