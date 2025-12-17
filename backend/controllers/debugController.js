const Lease = require('../models/Lease');
const Parcel = require('../models/Parcel');
const CarbonContract = require('../models/CarbonContract');

// Get Orphans
exports.getOrphans = async (req, res) => {
    try {
        const leases = await Lease.find({});
        const parcels = await Parcel.find({});
        const contracts = await CarbonContract.find({});

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

        // Check for orphaned CarbonContracts (no matching Lease)
        // Use case-insensitive matching
        const leaseNumbers = new Set(leases.map(l => l.leaseNumber.toLowerCase().trim()));
        const orphanedContracts = contracts.filter(c => !leaseNumbers.has(c.leaseNumber.toLowerCase().trim()));

        res.status(200).json({
            success: true,
            counts: {
                orphanedParcels: orphanedParcels.length,
                orphanedContracts: orphanedContracts.length
            },
            data: {
                orphanedParcels: orphanedParcels.map(p => ({ id: p._id, name: p.name })),
                orphanedContracts: orphanedContracts.map(c => ({ id: c._id, leaseNumber: c.leaseNumber, name: c.name }))
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Cleanup Orphans
exports.cleanupOrphans = async (req, res) => {
    try {
        const leases = await Lease.find({});
        const parcels = await Parcel.find({});
        const contracts = await CarbonContract.find({});

        // 1. Identify Orphaned Parcels
        const leasedParcelIds = new Set();
        leases.forEach(lease => {
            if (lease.parcels) {
                lease.parcels.forEach(p => {
                    if (p.parcel) leasedParcelIds.add(p.parcel.toString());
                });
            }
        });

        const orphanedParcels = parcels.filter(p => !leasedParcelIds.has(p._id.toString()));
        const orphanedParcelIds = orphanedParcels.map(p => p._id);

        // 2. Identify Orphaned Contracts
        const leaseNumbers = new Set(leases.map(l => l.leaseNumber.toLowerCase().trim()));
        const orphanedContracts = contracts.filter(c => !leaseNumbers.has(c.leaseNumber.toLowerCase().trim()));
        const orphanedContractIds = orphanedContracts.map(c => c._id);

        // 3. Delete
        let parcelResult = { deletedCount: 0 };
        let contractResult = { deletedCount: 0 };

        if (orphanedParcelIds.length > 0) {
            parcelResult = await Parcel.deleteMany({ _id: { $in: orphanedParcelIds } });
        }

        if (orphanedContractIds.length > 0) {
            contractResult = await CarbonContract.deleteMany({ _id: { $in: orphanedContractIds } });
        }

        res.status(200).json({
            success: true,
            message: `Cleanup complete. Deleted ${parcelResult.deletedCount} parcels and ${contractResult.deletedCount} contracts.`,
            details: {
                parcelsDeleted: parcelResult.deletedCount,
                contractsDeleted: contractResult.deletedCount
            }
        });

    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
