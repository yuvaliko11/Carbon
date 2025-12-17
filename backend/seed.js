const mongoose = require('mongoose');
const { Lease, Parcel, LandUnit, Organization, CarbonContract } = require('./models/index');
require('dotenv').config();

const seed = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fiji_carbon_hub';
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected.');

        console.log('🧹 Clearing existing data...');
        await Lease.deleteMany({});
        await Parcel.deleteMany({});
        await LandUnit.deleteMany({});
        await Organization.deleteMany({});
        await CarbonContract.deleteMany({});

        console.log('🌱 Seeding Data...');

        // 1. Create Organization (Lessee)
        const lessee = await Organization.create({
            name: "MATAQALI NABUKEBUKE HOLDINGS PTE LIMITED",
            type: "lessee",
            description: "Holding company for Namosi landowners",
            verificationStatus: "verified",
            address: {
                street: "Main Road",
                city: "Namosi",
                country: "Fiji"
            }
        });
        console.log(`   Created Org: ${lessee.name}`);

        // 2. Create Land Unit (Lessor)
        const landUnit = await LandUnit.create({
            name: "LumiLumitabua",
            type: "yavusa",
            province: "Namosi",
            tikina: "Namosi",
            tltbRef: "4/12/42647"
        });
        console.log(`   Created Land Unit: ${landUnit.name}`);

        // 3. Create Parcel
        const parcel = await Parcel.create({
            name: "LUMILUMITABUA (PART OF)",
            tltbRef: "TLTB_REF_12_42647",
            tikina: "NAMOSI",
            province: "Namosi",
            areaHa: 621.486,
            landUnit: landUnit._id,
            geometry: {
                type: "Polygon",
                // Approx Namosi, Fiji coordinates
                coordinates: [[
                    [178.16, -18.02],
                    [178.18, -18.02],
                    [178.18, -18.04],
                    [178.16, -18.04],
                    [178.16, -18.02]
                ]]
            }
        });
        console.log(`   Created Parcel: ${parcel.name}`);

        // 4. Create Lease
        const lease = await Lease.create({
            leaseNumber: "4160",
            tltbFileRef: "4/12/42647",
            type: "Conservation",
            purpose: "Special Conservation Purpose",
            lessorLandUnit: landUnit._id,
            lesseeOrganization: lessee._id,
            termYears: 50,
            startDate: new Date("2024-07-01"),
            annualRent: {
                amount: 2000,
                currency: "FJD"
            },
            parcels: [{
                parcel: parcel._id,
                areaHaAtGrant: parcel.areaHa,
                isDemarcatedForCarbon: true
            }],
            status: "Active",
            carbonParticipation: {
                enabled: true
            }
        });
        console.log(`   Created Lease: ${lease.leaseNumber}`);

        // 5. Create Carbon Contract (for visibility)
        await CarbonContract.create({
            leaseNumber: lease.leaseNumber,
            name: `Lease-${lease.leaseNumber} (Seeded)`,
            status: 'compliant',
            greenScore: 92,
            location: parcel.geometry,
            termYears: lease.termYears,
            annualRent: lease.annualRent
        });
        console.log(`   Created CarbonContract for Lease ${lease.leaseNumber}`);

        console.log('✅ Seeding complete!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected.');
    }
};

seed();
