const { query } = require('../database/db');

async function getTotalUsers() {
    const rows = await query('SELECT COUNT(*) as total FROM users');
    return rows[0].total;
}

async function getTotalOrders() {
    const rows = await query('SELECT COUNT(*) as total FROM orders');
    return rows[0].total;
}

async function getTotalRevenue() {
    const rows = await query('SELECT COALESCE(SUM(amount), 0) as total FROM orders');
    return rows[0].total;
}

async function getRecentOrders() {
    const sql = `
        SELECT o.id, o.item, o.amount, o.delivery_status, o.created_at, u.name as customer_name, dp.name as delivery_person_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN delivery_persons dp ON o.delivery_person_id = dp.id
        ORDER BY o.created_at DESC
        LIMIT 5
    `;
    return await query(sql);
}

async function getOrdersPerDay() {
    const sql = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `;
    return await query(sql);
}

async function getDeliveryStats() {
    const rows = await query(`
        SELECT status, COUNT(*) as count 
        FROM delivery_persons 
        GROUP BY status
    `);
    const stats = { available: 0, busy: 0, offline: 0 };
    rows.forEach(r => stats[r.status] = r.count);
    return stats;
}

async function getDeliveredOrders() {
    const rows = await query("SELECT COUNT(*) as total FROM orders WHERE delivery_status = 'delivered'");
    return rows[0].total;
}

async function getPendingOrders() {
    const rows = await query("SELECT COUNT(*) as total FROM orders WHERE delivery_status = 'pending'");
    return rows[0].total;
}

async function getAssignedOrders() {
    const rows = await query("SELECT COUNT(*) as total FROM orders WHERE delivery_status = 'assigned'");
    return rows[0].total;
}

async function getCancelledOrders() {
    const rows = await query("SELECT COUNT(*) as total FROM orders WHERE delivery_status = 'cancelled'");
    return rows[0].total;
}

module.exports = {
    getTotalUsers, getTotalOrders, getTotalRevenue, getRecentOrders,
    getOrdersPerDay, getDeliveryStats,getDeliveredOrders, getPendingOrders,
    getAssignedOrders, getCancelledOrders
};
