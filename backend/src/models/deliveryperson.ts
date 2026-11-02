import { query } from '../database/db';

export async function getAllDPs() {
    const sql = `
        SELECT dp.*, 
            COUNT(CASE WHEN o.delivery_status IN ('assigned', 'picked_up', 'on_the_way') THEN 1 END) as active_orders_count,
            COUNT(CASE WHEN o.delivery_status = 'delivered' THEN 1 END) as total_deliveries,
            COUNT(CASE WHEN o.delivery_status = 'cancelled' THEN 1 END) as cancelled_deliveries
        FROM delivery_persons dp
        LEFT JOIN orders o ON dp.id = o.delivery_person_id
        GROUP BY dp.id
        ORDER BY dp.created_at DESC
    `;
    const rows = await query<any[]>(sql);
    return rows.map(dp => {
        let computedStatus = dp.status;
        if (dp.status !== 'offline' && dp.status !== 'suspended') {
            computedStatus = Number(dp.active_orders_count) > 0 ? 'busy' : 'available';
        }
        return {
            ...dp,
            status: computedStatus,
            rating: dp.rating || 4.9
        };
    });
}

export async function getAvailableDPs() {
    const sql = `
        SELECT dp.*,
            COUNT(CASE WHEN o.delivery_status IN ('assigned', 'picked_up', 'on_the_way') THEN 1 END) as active_orders_count
        FROM delivery_persons dp
        LEFT JOIN orders o ON dp.id = o.delivery_person_id
        WHERE dp.status NOT IN ('offline', 'suspended')
        GROUP BY dp.id
        HAVING active_orders_count = 0
        ORDER BY dp.name ASC
    `;
    return await query<any[]>(sql);
}

export async function getDPById(id: number | string) {
    const sql = `
        SELECT dp.*, 
            COUNT(CASE WHEN o.delivery_status IN ('assigned', 'picked_up', 'on_the_way') THEN 1 END) as active_orders_count,
            COUNT(CASE WHEN o.delivery_status = 'delivered' THEN 1 END) as total_deliveries
        FROM delivery_persons dp
        LEFT JOIN orders o ON dp.id = o.delivery_person_id
        WHERE dp.id = ?
        GROUP BY dp.id
    `;
    const rows = await query<any[]>(sql, [id]);
    return rows[0];
}

export async function createDP(name: string, phone: string, email: string | null, vehicleType: string, vehicleNumber: string) {
    const result: any = await query(
        `INSERT INTO delivery_persons (name, phone, email, vehicle_type, vehicle_number, status, rating) 
         VALUES (?, ?, ?, ?, ?, 'available', 4.9)`,
        [name, phone, email || null, vehicleType, vehicleNumber]
    );
    return result.insertId;
}

export async function updateDP(id: number | string, name: string, phone: string, email: string | null, vehicleType: string, vehicleNumber: string) {
    await query(
        `UPDATE delivery_persons 
         SET name = ?, phone = ?, email = ?, vehicle_type = ?, vehicle_number = ? 
         WHERE id = ?`,
        [name, phone, email || null, vehicleType, vehicleNumber, id]
    );
    return true;
}

export async function updateDPStatus(id: number | string, status: string) {
    await query('UPDATE delivery_persons SET status = ? WHERE id = ?', [status, id]);
    return true;
}

export async function deleteDP(id: number | string) {
    const [ordersCount] = await query<any[]>('SELECT COUNT(*) as count FROM orders WHERE delivery_person_id = ?', [id]);
    if (ordersCount && ordersCount.count > 0) {
        await query("UPDATE delivery_persons SET status = 'suspended' WHERE id = ?", [id]);
        return { action: 'suspended', message: 'Partner has order history; status set to suspended to protect records.' };
    }
    await query('DELETE FROM delivery_persons WHERE id = ?', [id]);
    return { action: 'deleted', message: 'Delivery partner permanently removed.' };
}

export async function getDPOrders(dpId: number | string) {
    const sql = `
        SELECT o.*, u.name as customer_name, u.email as customer_email
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.delivery_person_id = ?
        ORDER BY o.created_at DESC
    `;
    return await query<any[]>(sql, [dpId]);
}

export async function assignOrderToDP(orderId: number | string, dpId: number | string | null) {
    if (!dpId) {
        await query("UPDATE orders SET delivery_person_id = NULL, delivery_status = 'pending' WHERE id = ?", [orderId]);
        return true;
    }

    await query(
        'UPDATE orders SET delivery_person_id = ?, delivery_status = ? WHERE id = ?',
        [dpId, 'assigned', orderId]
    );
    await updateDPStatus(dpId, 'busy');
    return true;
}

export async function updateDeliveryStatus(orderId: number | string, status: string) {
    await query('UPDATE orders SET delivery_status = ? WHERE id = ?', [status, orderId]);
    if (status === 'delivered') {
        await query("UPDATE orders SET payment_status = 'paid' WHERE id = ? AND payment_status = 'pending'", [orderId]);
        const rows = await query<any[]>('SELECT delivery_person_id FROM orders WHERE id = ?', [orderId]);
        if (rows[0]?.delivery_person_id) {
            const [active] = await query<any[]>(
                "SELECT COUNT(*) as count FROM orders WHERE delivery_person_id = ? AND delivery_status IN ('assigned', 'picked_up', 'on_the_way')",
                [rows[0].delivery_person_id]
            );
            if (active.count === 0) {
                await updateDPStatus(rows[0].delivery_person_id, 'available');
            }
        }
    }
    return true;
}

export async function getDPOverviewStats() {
    const [total] = await query<any[]>('SELECT COUNT(*) as count FROM delivery_persons');
    const [offline] = await query<any[]>("SELECT COUNT(*) as count FROM delivery_persons WHERE status = 'offline'");
    const [suspended] = await query<any[]>("SELECT COUNT(*) as count FROM delivery_persons WHERE status = 'suspended'");
    
    const [active] = await query<any[]>(`
        SELECT COUNT(DISTINCT dp.id) as count
        FROM delivery_persons dp
        JOIN orders o ON dp.id = o.delivery_person_id
        WHERE o.delivery_status IN ('assigned', 'picked_up', 'on_the_way')
    `);

    const [available] = await query<any[]>(`
        SELECT COUNT(*) as count FROM delivery_persons dp
        WHERE dp.status = 'available' 
          AND dp.id NOT IN (
            SELECT DISTINCT delivery_person_id FROM orders 
            WHERE delivery_status IN ('assigned', 'picked_up', 'on_the_way') AND delivery_person_id IS NOT NULL
          )
    `);

    const [completed] = await query<any[]>("SELECT COUNT(*) as count FROM orders WHERE delivery_status = 'delivered'");

    return {
        totalPartners: total?.count || 0,
        availablePartners: available?.count || 0,
        activeOnDelivery: active?.count || 0,
        offlinePartners: offline?.count || 0,
        suspendedPartners: suspended?.count || 0,
        totalCompletedDeliveries: completed?.count || 0
    };
}

