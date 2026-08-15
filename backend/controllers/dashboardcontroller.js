const Dashboard = require('../models/dashboard');

async function getStats(req, res) {
    try {
        const [
            totalUsers,totalOrders,totalRevenue, recentOrders, ordersPerDay,
            deliveryStats,deliveredOrders,pendingOrders,assignedOrders,cancelledOrders
        ] = await Promise.all([
            Dashboard.getTotalUsers(),Dashboard.getTotalOrders(),
            Dashboard.getTotalRevenue(),Dashboard.getRecentOrders(),
            Dashboard.getOrdersPerDay(),Dashboard.getDeliveryStats(),
            Dashboard.getDeliveredOrders(),Dashboard.getPendingOrders(),
            Dashboard.getAssignedOrders(),Dashboard.getCancelledOrders()
        ]);

        res.json({
            stats: { 
                totalUsers, totalOrders, totalRevenue,
                deliveredOrders, pendingOrders, assignedOrders, cancelledOrders
            },
            recentOrders, ordersPerDay,deliveryStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getStats };
