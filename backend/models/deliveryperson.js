const { query } = require('../database/db');

async function getAllDPs() {
    const sql = `
        SELECT dp.id, dp.name, dp.phone, dp.email, dp.vehicle_type, dp.vehicle_number, dp.status, dp.created_at,
            IF(dp.license_data IS NULL, 0, 1) AS has_license,
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

async function createDP(name, phone, email, vehicleType, vehicleNumber, licenseFile) {
    const result = await query(
        `INSERT INTO delivery_persons (name, phone, email, vehicle_type, vehicle_number, license_data, license_original_name, license_mime_type, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
        [name, phone, email, vehicleType, vehicleNumber, licenseFile.buffer, licenseFile.originalname, licenseFile.mimetype]
    );
    return result.insertId;
}

async function updateDP(id, name, phone, email, vehicleType, vehicleNumber, licenseFile) {
    const licenseFields = licenseFile
        ? ', license_data = ?, license_original_name = ?, license_mime_type = ?'
        : '';
    const params = [name, phone, email, vehicleType, vehicleNumber];
    if (licenseFile) params.push(licenseFile.buffer, licenseFile.originalname, licenseFile.mimetype);
    params.push(id);
    await query(
        `UPDATE delivery_persons 
         SET name = ?, phone = ?, email = ?, vehicle_type = ?, vehicle_number = ?${licenseFields}
         WHERE id = ?`,
        params
    );
    return true;
}

async function getLicenseById(id) {
    const rows = await query(
        'SELECT license_data, license_original_name, license_mime_type FROM delivery_persons WHERE id = ?',
        [id]
    );
    return rows[0];
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
    getAllDPs, getAvailableDPs, getDPById, createDP, updateDP, getLicenseById,
    updateDPStatus, deleteDP, getDPOrders, assignOrderToDP,
    updateDeliveryStatus
};
