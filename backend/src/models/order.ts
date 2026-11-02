import { query } from '../database/db';

export interface OrderFilters {
    search?: string;
    status?: string;
    paymentStatus?: string;
}

export async function getAllOrders(filters: OrderFilters = {}) {
    let sql = `
        SELECT o.*, 
            COALESCE(o.recipient_name, u.name) as customer_name,
            u.email as customer_email,
            COALESCE(o.customer_phone, 'Not Provided') as customer_phone_number,
            dp.name as delivery_person_name,
            dp.phone as delivery_person_phone,
            dp.vehicle_type as delivery_person_vehicle,
            p.image_url as product_image,
            p.category as product_category
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN delivery_persons dp ON o.delivery_person_id = dp.id
        LEFT JOIN products p ON o.product_id = p.id
        WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.search) {
        sql += ` AND (
            o.id LIKE ? OR 
            o.item LIKE ? OR 
            COALESCE(o.recipient_name, u.name) LIKE ? OR 
            u.email LIKE ? OR
            o.customer_phone LIKE ?
        )`;
        const q = `%${filters.search}%`;
        params.push(q, q, q, q, q);
    }

    if (filters.status && filters.status !== 'all') {
        sql += ` AND o.delivery_status = ?`;
        params.push(filters.status);
    }

    if (filters.paymentStatus && filters.paymentStatus !== 'all') {
        sql += ` AND o.payment_status = ?`;
        params.push(filters.paymentStatus);
    }

    sql += ` ORDER BY o.created_at DESC, o.id DESC`;

    return await query<any[]>(sql, params);
}

export async function getOrderById(id: number | string) {
    const sql = `
        SELECT o.*, 
            COALESCE(o.recipient_name, u.name) as customer_name,
            u.email as customer_email,
            COALESCE(o.customer_phone, 'Not Provided') as customer_phone_number,
            dp.name as delivery_person_name,
            dp.phone as delivery_person_phone,
            dp.vehicle_type as delivery_person_vehicle,
            dp.vehicle_number as delivery_person_vehicle_number,
            p.image_url as product_image,
            p.category as product_category
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN delivery_persons dp ON o.delivery_person_id = dp.id
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.id = ?
    `;
    const rows = await query<any[]>(sql, [id]);
    return rows[0];
}

export async function getOrdersByUserId(userId: number | string) {
    const sql = `
        SELECT o.*, 
            COALESCE(o.recipient_name, u.name) as customer_name,
            dp.name as delivery_person_name,
            p.image_url as product_image
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN delivery_persons dp ON o.delivery_person_id = dp.id
        LEFT JOIN products p ON o.product_id = p.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `;
    return await query<any[]>(sql, [userId]);
}

export async function createOrder(data: any) {
    const {
        userId, item, amount, recipientName, customerPhone, deliveryAddress,
        city, state, pincode, deliveryInstructions, paymentMethod, paymentStatus = 'pending',
        quantity = 1, productId = null, discount = 0, deliveryFee = 0, tax = 0
    } = data;

    const result: any = await query(
        `INSERT INTO orders (
            user_id, item, product_id, quantity, amount, discount, delivery_fee, tax,
            recipient_name, customer_phone, delivery_address, city, state, pincode,
            delivery_instructions, payment_method, payment_status, delivery_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
            userId, item, productId, quantity, amount, discount, deliveryFee, tax,
            recipientName || null, customerPhone || null, deliveryAddress || null,
            city || null, state || null, pincode || null, deliveryInstructions || null,
            paymentMethod || 'Cash on Delivery', paymentStatus
        ]
    );
    return result.insertId;
}

export async function updateOrderStatus(orderId: number | string, status: string) {
    await query('UPDATE orders SET delivery_status = ? WHERE id = ?', [status, orderId]);
    
    // Automatically update payment status if marked delivered on COD
    if (status === 'delivered') {
        await query("UPDATE orders SET payment_status = 'paid' WHERE id = ? AND payment_status = 'pending'", [orderId]);
    } else if (status === 'cancelled') {
        // Free up assigned delivery partner if cancelled
        const rows = await query<any[]>('SELECT delivery_person_id FROM orders WHERE id = ?', [orderId]);
        if (rows[0]?.delivery_person_id) {
            await query("UPDATE delivery_persons SET status = 'available' WHERE id = ?", [rows[0].delivery_person_id]);
        }
    }
    return true;
}

export async function updatePaymentStatus(orderId: number | string, paymentStatus: string) {
    await query('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, orderId]);
    return true;
}

export async function deleteOrder(id: number | string) {
    await query('DELETE FROM orders WHERE id = ?', [id]);
    return true;
}

export async function getUnassignedOrders() {
    const sql = `
        SELECT o.*, COALESCE(o.recipient_name, u.name) as customer_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.delivery_person_id IS NULL OR o.delivery_status = 'pending'
        ORDER BY o.created_at DESC
    `;
    return await query<any[]>(sql);
}

