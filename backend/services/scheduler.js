const cron = require('node-cron');
const Lease = require('../models/Lease');
const LeaseEvent = require('../models/LeaseEvent');

const initScheduler = () => {
    console.log('⏰ Scheduler initialized');

    // Run every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('🔄 Running daily lease checks...');
        await checkRentDue();
        await checkLeaseExpiry();
    });
};

const checkRentDue = async () => {
    try {
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        // Find leases starting or having anniversary in 30 days
        // This is a simplified check. Real logic needs to track "nextRentDate" on the Lease model.
        // For now, we'll just log.
        console.log('   Checking rent due...');

        // In a real implementation, we would query:
        // const leases = await Lease.find({ nextRentDueDate: { $lte: thirtyDaysFromNow, $gte: today } });
        // leases.forEach(lease => createNotification(lease));

    } catch (err) {
        console.error('❌ Error checking rent:', err);
    }
};

const checkLeaseExpiry = async () => {
    try {
        const today = new Date();
        const ninetyDaysFromNow = new Date();
        ninetyDaysFromNow.setDate(today.getDate() + 90);

        const expiringLeases = await Lease.find({
            expiryDate: { $lte: ninetyDaysFromNow, $gte: today },
            status: 'Active'
        });

        for (const lease of expiringLeases) {
            // Check if we already notified recently to avoid spam
            // For now, just log
            console.log(`⚠️  Lease ${lease.leaseNumber} is expiring on ${lease.expiryDate}`);

            await LeaseEvent.create({
                lease: lease._id,
                type: 'Other', // Should be 'LeaseExpiringSoon'
                payload: { message: `Lease expiring in < 90 days` }
            });
        }

    } catch (err) {
        console.error('❌ Error checking expiry:', err);
    }
};

module.exports = initScheduler;
