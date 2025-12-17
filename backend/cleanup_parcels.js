const mongoose = require('mongoose');
const Lease = require('./models/Lease');
const Parcel = require('./models/Parcel');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('Connected to DB');

        // 1. Get all leased parcel IDs
        const leases = await Lease.find({});
        const leasedParcelIds = new Set();
        leases.forEach(l => {
            if (l.parcels) {
                l.parcels.forEach(p => {
                    if (p.parcel) leasedParcelIds.add(p.parcel.toString());
                });
            }
        });
        console.log('Leased Parcel IDs:', Array.from(leasedParcelIds));

        // 2. Get all parcels
        const parcels = await Parcel.find({});
        console.log('Total Parcels in DB:', parcels.length);

        // 3. Delete orphans
        let deletedCount = 0;
        for (const p of parcels) {
            if (!leasedParcelIds.has(p._id.toString())) {
                console.log('Deleting orphan parcel:', p._id);
                await Parcel.findByIdAndDelete(p._id);
                deletedCount++;
            }
        }

        console.log('Cleanup complete. Deleted ' + deletedCount + ' orphaned parcels.');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
