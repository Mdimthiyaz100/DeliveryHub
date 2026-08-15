const { query } = require('../database/db');

async function getAllDPs() {
    const sql = `
        SELECT dp.*, 
            COUNT(CASE WHEN o.delivery_status IN ('assigned', 'pending') THEN 1 END) as active_orders_count,
            COUNT(CASE WHEN o.delivery_status = 'delivered' THEN 1 END) as total_deliveries
        FROM delivery_persons dp
        LEFT JOIN orders o ON dp.id = o.delivery_person_id
        GROUP BY dp.id
        ORDER BY dp.created_at DESC
    `;
    const rows = await query(sql);
    return rows.map(dp => {
        let status = dp.status;
        if (status !== 'offline') {
            status = Number(dp.active_orders_count) > 0 ? 'busy' : 'available';
        }
        return {
            ...dp,status
        };
    });
}

async function getAvailableDPs() {
    return await query("SELECT * FROM delivery_persons WHERE status = 'available'");
}

async function getDPById(id) {
    const rows = await query('SELECT * FROM delivery_persons WHERE id = ?', [id]);
    return rows[0];
}

async function createDP(name, phone, email, vehicleType, vehicleNumber) {
    const result = await query(
        `INSERT INTO delivery_persons (name, phone, email, vehicle_type, vehicle_number, status) 
         VALUES (?, ?, ?, ?, ?, 'available')`,
        [name, phone, email, vehicleType, vehicleNumber]
    );
    return result.insertId;
}

async function updateDP(id, name, phone, email, vehicleType, vehicleNumber) {
    await query(
        `UPDATE delivery_persons 
         SET name = ?, phone = ?, email = ?, vehicle_type = ?, vehicle_number = ? 
         WHERE id = ?`,
        [name, phone, email, vehicleType, vehicleNumber, id]
    );
    return true;
}

async function updateDPStatus(id, status) {
    await query('UPDATE delivery_persons SET status = ? WHERE id = ?', [status, id]);
    return true;
}

async function deleteDP(id) {
    await query('DELETE FROM delivery_persons WHERE id = ?', [id]);
    return true;
}

async function getDPOrders(dpId) {
    const sql = `
        SELECT o.*, u.name as customer_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.delivery_person_id = ?
        ORDER BY o.created_at DESC
    `;
    return await query(sql, [dpId]);
}

async function assignOrderToDP(orderId, dpId) {
    if (!dpId) {
        await query('UPDATE orders SET delivery_person_id = NULL WHERE id = ?', [orderId]);
        return true;
    }
    await query(
        'UPDATE orders SET delivery_person_id = ?, delivery_status = ? WHERE id = ?',
        [dpId, 'assigned', orderId]
    );
    await updateDPStatus(dpId, 'busy');
    return true;
}

async function updateDeliveryStatus(orderId, status) {
    await query('UPDATE orders SET delivery_status = ? WHERE id = ?', [status, orderId]);
    if (status === 'delivered') {
        const rows = await query('SELECT delivery_person_id FROM orders WHERE id = ?', [orderId]);
        if (rows[0]?.delivery_person_id) {
            await updateDPStatus(rows[0].delivery_person_id, 'available');
        }
    }
    return true;
}

module.exports = {
    getAllDPs, getAvailableDPs, getDPById, createDP, updateDP, 
    updateDPStatus, deleteDP, getDPOrders, assignOrderToDP,
    updateDeliveryStatus
};