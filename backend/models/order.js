const { query } = require('../database/db');

async function getAllOrders() {
    const sql = `
        SELECT o.*, COALESCE(o.recipient_name, u.name) as customer_name, dp.name as delivery_person_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN delivery_persons dp ON o.delivery_person_id = dp.id
        ORDER BY o.id ASC
    `;
    return await query(sql);
}

async function getOrderById(id) {
    const rows = await query('SELECT * FROM orders WHERE id = ?', [id]);
    return rows[0];
}

async function getOrdersByUserId(userId) {
    const sql = `
        SELECT o.*, COALESCE(o.recipient_name, u.name) as customer_name, dp.name as delivery_person_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN delivery_persons dp ON o.delivery_person_id = dp.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;
    return await query(sql, [userId]);
}

async function createOrder(userId, item, amount, recipientName, customerPhone, deliveryAddress, paymentMethod, quantity = 1) {
    const result = await query(
        `INSERT INTO orders (user_id, item, quantity, amount, recipient_name, customer_phone, delivery_address, payment_method, delivery_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, item, quantity, amount, recipientName || null, customerPhone || null, deliveryAddress || null, paymentMethod || null, 'pending']
    );
    return result.insertId;
}

async function updateOrderStatus(orderId, status) {
    await query('UPDATE orders SET delivery_status = ? WHERE id = ?', [status, orderId]);
    return true;
}

async function deleteOrder(id) {
    await query('DELETE FROM orders WHERE id = ?', [id]);
    return true;
}

async function getUnassignedOrders() {
    const sql = `
        SELECT o.*, COALESCE(o.recipient_name, u.name) as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.delivery_person_id IS NULL OR o.delivery_status = 'pending'
        ORDER BY o.id ASC
    `;
    return await query(sql);
}

module.exports = {
    getAllOrders, getOrderById, getOrdersByUserId, createOrder,
    updateOrderStatus, deleteOrder, getUnassignedOrders
};
