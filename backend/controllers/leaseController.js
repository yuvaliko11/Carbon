const Lease = require('../models/Lease');
const CarbonContract = require('../models/CarbonContract');
const Parcel = require('../models/Parcel');

// Create Lease
exports.createLease = async (req, res) => {
    try {
        const lease = await Lease.create(req.body);
        res.status(201).json({
            success: true,
            data: lease
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get all Leases
exports.getLeases = async (req, res) => {
    try {
        const leases = await Lease.find()
            .populate('lessorLandUnit')
            .populate('lesseeOrganization')
            .populate('parcels.parcel');
        res.status(200).json({
            success: true,
            count: leases.length,
            data: leases
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Get single Lease
exports.getLease = async (req, res) => {
    try {
        const lease = await Lease.findById(req.params.id)
            .populate('lessorLandUnit')
            .populate('lesseeOrganization')
            .populate('parcels.parcel');
        if (!lease) {
            return res.status(404).json({
                success: false,
                error: 'Lease not found'
            });
        }
        res.status(200).json({
            success: true,
            data: lease
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Update Lease
exports.updateLease = async (req, res) => {
    try {
        const lease = await Lease.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!lease) {
            return res.status(404).json({
                success: false,
                error: 'Lease not found'
            });
        }
        res.status(200).json({
            success: true,
            data: lease
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Calculate Transfer Fee (Lease 4159 Logic)
exports.calculateTransferFee = async (req, res) => {
    try {
        const { salePrice, improvementsFlag } = req.body;
        const lease = await Lease.findById(req.params.id);

        if (!lease) {
            return res.status(404).json({ success: false, error: 'Lease not found' });
        }

        // Calculate years since start
        const now = new Date();
        const start = new Date(lease.startDate);
        const yearsSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 365));

        let feePercent = 0;
        const rules = lease.transferFeeRules;

        // Logic from Lease 4159 Special Conditions
        if (improvementsFlag === 'WithImprovements') {
            if (yearsSinceStart <= rules.withImprovements.firstNYears) {
                feePercent = rules.withImprovements.percentFirstPeriod; // 20%
            } else {
                feePercent = rules.withImprovements.percentAfter; // 10%
            }
        } else if (improvementsFlag === 'NoImprovements') {
            if (yearsSinceStart <= rules.withoutImprovements.firstNYears) {
                feePercent = rules.withoutImprovements.percentFirstPeriod; // 25%
            } else {
                feePercent = rules.withoutImprovements.percentAfter; // 10%
            }
        }

        const feeAmount = (salePrice * feePercent) / 100;

        res.status(200).json({
            success: true,
            data: {
                leaseId: lease._id,
                yearsSinceStart,
                improvementsFlag,
                salePrice,
                feePercent,
                feeAmount,
                currency: lease.annualRent.currency
            }
        });

    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Delete Lease
exports.delete = async (req, res) => {
    try {
        const lease = await Lease.findById(req.params.id);

        if (!lease) {
            return res.status(404).json({
                success: false,
                error: 'Lease not found'
            });
        }

        // Reverse Cascade Delete: Delete associated CarbonContract (File) if it exists
        if (lease.leaseNumber) {
            const leaseNumberClean = lease.leaseNumber.trim();
            const contract = await CarbonContract.findOneAndDelete({
                leaseNumber: { $regex: new RegExp(`^${leaseNumberClean}$`, 'i') }
            });
            if (contract) {
                console.log(`Reverse cascade deleted contract file for lease ${lease.leaseNumber}`);
            }
        }

        // Delete associated Parcels
        if (lease.parcels && lease.parcels.length > 0) {
            const parcelIds = lease.parcels
                .filter(p => p.parcel)
                .map(p => p.parcel);

            if (parcelIds.length > 0) {
                const deleteResult = await Parcel.deleteMany({ _id: { $in: parcelIds } });
                console.log(`Deleted ${deleteResult.deletedCount} associated parcels for lease ${lease.leaseNumber}`);
            }
        }

        await lease.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            error: err.message
        });
    }
};

// Cleanup Orphaned Parcels
exports.cleanupOrphans = async (req, res) => {
    try {
        const leases = await Lease.find({});
        const allParcels = await Parcel.find({});
        const allContracts = await CarbonContract.find({});

        // 1. Identify Orphaned Parcels
        const activeParcelIds = new Set();
        leases.forEach(lease => {
            if (lease.parcels) {
                lease.parcels.forEach(p => {
                    if (p.parcel) activeParcelIds.add(p.parcel.toString());
                });
            }
        });

        const orphanedParcels = allParcels.filter(p => !activeParcelIds.has(p._id.toString()));
        const orphanedParcelIds = orphanedParcels.map(p => p._id);

        // 2. Identify Orphaned Contracts
        const activeLeaseNumbers = new Set(leases.map(l => l.leaseNumber.trim().toLowerCase()));
        const orphanedContracts = allContracts.filter(c =>
            !c.leaseNumber || !activeLeaseNumbers.has(c.leaseNumber.trim().toLowerCase())
        );
        const orphanedContractIds = orphanedContracts.map(c => c._id);

        // 3. Delete
        let parcelResult = { deletedCount: 0 };
        let contractResult = { deletedCount: 0 };

        if (orphanedParcelIds.length > 0) {
            parcelResult = await Parcel.deleteMany({ _id: { $in: orphanedParcelIds } });
            console.log(`🗑️ Deleted ${parcelResult.deletedCount} orphaned parcels.`);
        }

        if (orphanedContractIds.length > 0) {
            contractResult = await CarbonContract.deleteMany({ _id: { $in: orphanedContractIds } });
            console.log(`🗑️ Deleted ${contractResult.deletedCount} orphaned contracts.`);
        }

        if (parcelResult.deletedCount > 0 || contractResult.deletedCount > 0) {
            return res.status(200).json({
                success: true,
                message: `Cleanup complete. Deleted ${parcelResult.deletedCount} parcels and ${contractResult.deletedCount} contracts.`,
                count: parcelResult.deletedCount + contractResult.deletedCount,
                details: {
                    parcels: parcelResult.deletedCount,
                    contracts: contractResult.deletedCount
                }
            });
        } else {
            return res.status(200).json({
                success: true,
                message: 'No orphaned items found.',
                count: 0
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
// Sync Carbon Contracts (Create missing ones for existing leases)
exports.syncCarbonContracts = async (req, res) => {
    try {
        const leases = await Lease.find().populate('parcels.parcel');
        let createdCount = 0;
        let errors = [];

        for (const lease of leases) {
            // Check if CarbonContract exists
            const existingContract = await CarbonContract.findOne({ leaseNumber: lease.leaseNumber });

            if (!existingContract) {
                try {
                    // Get geometry from first parcel
                    let geometry = null;
                    if (lease.parcels && lease.parcels.length > 0 && lease.parcels[0].parcel) {
                        // Handle both populated object and raw ID (though we populated it)
                        const parcel = lease.parcels[0].parcel;
                        if (parcel.geometry) {
                            geometry = parcel.geometry;
                        } else if (parcel.boundary) {
                            geometry = parcel.boundary;
                        }
                    }

                    if (geometry) {
                        await CarbonContract.create({
                            leaseNumber: lease.leaseNumber,
                            name: `Lease-${lease.leaseNumber} (Synced)`,
                            status: 'compliant', // Default to compliant
                            greenScore: 85, // Default score
                            location: geometry,
                            termYears: lease.termYears,
                            annualRent: lease.annualRent,
                            mataqaliName: lease.lessorLandUnit ? lease.lessorLandUnit.toString() : 'Unknown' // Ideally populate this too
                        });
                        createdCount++;
                    } else {
                        errors.push(`Lease ${lease.leaseNumber}: No geometry found`);
                    }
                } catch (err) {
                    errors.push(`Lease ${lease.leaseNumber}: ${err.message}`);
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Synced Carbon Contracts. Created ${createdCount} new contracts.`,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
