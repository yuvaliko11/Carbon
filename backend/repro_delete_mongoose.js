const mongoose = require('mongoose');
require('dotenv').config();

// Import Models
const CarbonContract = require('./models/CarbonContract');
const Lease = require('./models/Lease');
const Parcel = require('./models/Parcel');
const LandUnit = require('./models/LandUnit');
const Organization = require('./models/Organization');

async function runTest() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Create Test Data
        const testLeaseNumber = `TEST-${Date.now()}`;
        console.log(`Creating test data for Lease ${testLeaseNumber}...`);

        // Create Org
        let org = await Organization.findOne({ name: 'Fiji Carbon Hub' });
        if (!org) {
            org = await Organization.create({ name: 'Fiji Carbon Hub', type: 'developer' });
        }

        // Create LandUnit
        const landUnit = await LandUnit.create({ name: `Mataqali Test ${testLeaseNumber}`, type: 'mataqali' });

        // Create Parcel
        const parcel = await Parcel.create({
            name: `Parcel for ${testLeaseNumber}`,
            landUnit: landUnit._id,
            geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
            areaHa: 100
        });

        // Create Lease
        const lease = await Lease.create({
            leaseNumber: testLeaseNumber,
            lessorLandUnit: landUnit._id,
            lesseeOrganization: org._id,
            parcels: [{ parcel: parcel._id }],
            termYears: 99,
            startDate: new Date(),
            status: 'Active',
            type: 'Agriculture',
            purpose: 'Agriculture'
        });

        // Create CarbonContract
        const contract = await CarbonContract.create({
            leaseNumber: testLeaseNumber,
            name: `Test Contract ${testLeaseNumber}`,
            status: 'compliant',
            greenScore: 100,
            location: parcel.geometry,
            uploadedBy: org._id // Mock user ID
        });

        console.log('Test data created.');
        console.log(`Contract: ${contract._id}`);
        console.log(`Lease: ${lease._id}`);
        console.log(`Parcel: ${parcel._id}`);

        // 2. Execute Deletion Logic (Simulating Controller)
        console.log('Executing Deletion Logic...');

        // --- LOGIC FROM CONTROLLER ---
        const contractToDelete = await CarbonContract.findById(contract._id);
        if (contractToDelete) {
            if (contractToDelete.leaseNumber) {
                const leaseToDelete = await Lease.findOne({ leaseNumber: contractToDelete.leaseNumber });
                if (leaseToDelete) {
                    // Delete associated Parcels
                    if (leaseToDelete.parcels && leaseToDelete.parcels.length > 0) {
                        const parcelIds = leaseToDelete.parcels.map(p => p.parcel);
                        await Parcel.deleteMany({ _id: { $in: parcelIds } });
                        console.log(`Cascade deleted ${parcelIds.length} parcels for lease ${leaseToDelete.leaseNumber}`);
                    }

                    await leaseToDelete.deleteOne();
                    console.log(`Cascade deleted lease ${contractToDelete.leaseNumber}`);
                } else {
                    console.log('Lease not found for cascade delete!');
                }
            }
            await contractToDelete.deleteOne();
            console.log('Contract deleted.');
        }
        // -----------------------------

        // 3. Verify
        console.log('Verifying...');
        const checkLease = await Lease.findById(lease._id);
        const checkParcel = await Parcel.findById(parcel._id);

        if (checkLease) console.error('❌ FAILURE: Lease still exists!');
        else console.log('✅ SUCCESS: Lease deleted.');

        if (checkParcel) console.error('❌ FAILURE: Parcel still exists!');
        else console.log('✅ SUCCESS: Parcel deleted.');

        // Cleanup if failed
        if (checkLease) await Lease.findByIdAndDelete(lease._id);
        if (checkParcel) await Parcel.findByIdAndDelete(parcel._id);
        await LandUnit.findByIdAndDelete(landUnit._id);

        process.exit(0);

    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

runTest();
