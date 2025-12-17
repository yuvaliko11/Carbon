const Transaction = require('../models/Transaction');
const Payout = require('../models/Payout');
const Lease = require('../models/Lease');
const LeaseEvent = require('../models/LeaseEvent');

// Record Rent Payment
exports.recordRentPayment = async (req, res) => {
    try {
        const { leaseId, amount, paymentReference } = req.body;
        const lease = await Lease.findById(leaseId).populate('lessorLandUnit');

        if (!lease) {
            return res.status(404).json({ success: false, error: 'Lease not found' });
        }

        // Create Transaction
        const transaction = await Transaction.create({
            type: 'RentPayment',
            amount,
            currency: lease.annualRent.currency,
            payer: req.user.id, // Assuming logged in user is payer
            payee: lease.lessorLandUnit._id,
            lease: lease._id,
            status: 'Completed', // Assuming direct recording
            reference: paymentReference,
            completedAt: Date.now()
        });

        // Create Payout to Land Unit (100% of rent usually goes to TLTB/LandUnit)
        await Payout.create({
            transaction: transaction._id,
            beneficiary: lease.lessorLandUnit._id,
            amount: amount,
            currency: lease.annualRent.currency,
            status: 'Scheduled',
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Payout in 7 days
        });

        // Log Event
        await LeaseEvent.create({
            lease: lease._id,
            type: 'AnnualRentPaid',
            payload: { amount, transactionId: transaction._id },
            createdBy: req.user.id
        });

        res.status(201).json({ success: true, data: transaction });

    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// Record Transfer Fee Payment
exports.recordTransferFee = async (req, res) => {
    try {
        const { leaseId, salePrice, improvementsFlag } = req.body;
        const lease = await Lease.findById(leaseId).populate('lessorLandUnit');

        if (!lease) {
            return res.status(404).json({ success: false, error: 'Lease not found' });
        }

        // Calculate Fee (Reuse logic or call internal helper)
        const now = new Date();
        const start = new Date(lease.startDate);
        const yearsSinceStart = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 365));

        let feePercent = 0;
        const rules = lease.transferFeeRules;

        if (improvementsFlag === 'WithImprovements') {
            feePercent = yearsSinceStart <= rules.withImprovements.firstNYears
                ? rules.withImprovements.percentFirstPeriod
                : rules.withImprovements.percentAfter;
        } else {
            feePercent = yearsSinceStart <= rules.withoutImprovements.firstNYears
                ? rules.withoutImprovements.percentFirstPeriod
                : rules.withoutImprovements.percentAfter;
        }

        const feeAmount = (salePrice * feePercent) / 100;

        // Create Transaction
        const transaction = await Transaction.create({
            type: 'TransferFee',
            amount: feeAmount,
            currency: lease.annualRent.currency,
            payer: req.user.id,
            payee: lease.lessorLandUnit._id,
            lease: lease._id,
            status: 'Pending',
            metadata: { salePrice: salePrice.toString(), feePercent: feePercent.toString() }
        });

        res.status(201).json({ success: true, data: transaction });

    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// Distribute Carbon Revenue (Benefit Sharing)
exports.distributeCarbonRevenue = async (req, res) => {
    try {
        const { leaseId, totalRevenue } = req.body;
        const lease = await Lease.findById(leaseId)
            .populate('lessorLandUnit')
            .populate('carbonParticipation.beneficiaryLandUnit');

        if (!lease) {
            return res.status(404).json({ success: false, error: 'Lease not found' });
        }

        // 1. Create Main Transaction (Sale)
        const transaction = await Transaction.create({
            type: 'CarbonSale',
            amount: totalRevenue,
            currency: 'USD', // Carbon usually USD
            payer: req.user.id, // Buyer
            payee: lease.lessorLandUnit._id, // Primary
            lease: lease._id,
            status: 'Completed',
            completedAt: Date.now()
        });

        // 2. Calculate Shares
        const secondarySharePercent = lease.carbonParticipation.mandatorySharePercentToOtherLandUnit || 0;
        const secondaryAmount = (totalRevenue * secondarySharePercent) / 100;
        const primaryAmount = totalRevenue - secondaryAmount;

        // 3. Create Payouts
        // Primary Payout
        await Payout.create({
            transaction: transaction._id,
            beneficiary: lease.lessorLandUnit._id,
            amount: primaryAmount,
            currency: 'USD',
            status: 'Scheduled',
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Net 30
        });

        // Secondary Payout (if applicable)
        if (secondaryAmount > 0 && lease.carbonParticipation.beneficiaryLandUnit) {
            await Payout.create({
                transaction: transaction._id,
                beneficiary: lease.carbonParticipation.beneficiaryLandUnit._id,
                amount: secondaryAmount,
                currency: 'USD',
                status: 'Scheduled',
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                notes: `Benefit Sharing: ${secondarySharePercent}% of Carbon Sale`
            });
        }

        // Log Event
        await LeaseEvent.create({
            lease: lease._id,
            type: 'CarbonSaleRecorded',
            payload: { totalRevenue, primaryAmount, secondaryAmount },
            createdBy: req.user.id
        });

        res.status(201).json({
            success: true,
            data: { transaction, primaryAmount, secondaryAmount }
        });

    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};

// Get Transactions for Lease
exports.getLeaseTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ lease: req.params.leaseId }).sort('-createdAt');
        res.status(200).json({ success: true, data: transactions });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
};
