import { query } from '../database/db';

export async function getLiveDashboardMetrics(range: string = '30d') {
    // 1. Total Customers (role = 'user')
    const [custRows] = await query<any[]>("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
    const totalCustomers = custRows?.count || 0;

    // 2. Total Delivery Partners
    const [dpRows] = await query<any[]>("SELECT COUNT(*) as count FROM delivery_persons WHERE status != 'suspended'");
    const totalDeliveryPartners = dpRows?.count || 0;

    // 3. Order status breakdowns
    const [orderCounts] = await query<any[]>(`
        SELECT 
            COUNT(*) as totalOrders,
            COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pendingOrders,
            COUNT(CASE WHEN delivery_status IN ('assigned', 'picked_up', 'on_the_way') THEN 1 END) as activeDeliveries,
            COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as deliveredOrders,
            COUNT(CASE WHEN delivery_status = 'cancelled' THEN 1 END) as cancelledOrders
        FROM orders
    `);

    // 4. Clean Revenue Calculation
    const [revRows] = await query<any[]>(`
        SELECT 
            COALESCE(SUM(CASE WHEN payment_status = 'paid' OR delivery_status = 'delivered' THEN amount ELSE 0 END), 0) as totalCollectedRevenue,
            COALESCE(SUM(CASE WHEN delivery_status != 'cancelled' THEN amount ELSE 0 END), 0) as totalGrossOrderValue
        FROM orders
    `);

    // 5. Delivery Partner status roster
    const [dpStats] = await query<any[]>(`
        SELECT 
            COUNT(CASE WHEN status = 'available' THEN 1 END) as available,
            COUNT(CASE WHEN status = 'busy' THEN 1 END) as busy,
            COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline
        FROM delivery_persons
    `);

    // 6. Recent Real Transactions
    const recentOrders = await query<any[]>(`
        SELECT o.id, o.item, o.amount, o.quantity, o.delivery_status, o.payment_status, o.payment_method, o.created_at,
               COALESCE(o.recipient_name, u.name) as customer_name,
               u.email as customer_email,
               dp.name as delivery_person_name
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN delivery_persons dp ON o.delivery_person_id = dp.id
        ORDER BY o.created_at DESC, o.id DESC
        LIMIT 6
    `);

    // 7. Time-series Sales & Revenue Analytics based on range ('7d', '30d', '90d', '1y')
    let intervalDays = 30;
    if (range === '7d') intervalDays = 7;
    else if (range === '90d') intervalDays = 90;
    else if (range === '1y') intervalDays = 365;

    const salesTimeline = await query<any[]>(`
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as ordersCount,
            COUNT(CASE WHEN delivery_status = 'delivered' THEN 1 END) as deliveredCount,
            COUNT(CASE WHEN delivery_status = 'pending' THEN 1 END) as pendingCount,
            COALESCE(SUM(CASE WHEN payment_status = 'paid' OR delivery_status = 'delivered' THEN amount ELSE 0 END), 0) as revenue
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
    `, [intervalDays]);

    return {
        stats: {
            totalOrders: orderCounts?.totalOrders || 0,
            pendingOrders: orderCounts?.pendingOrders || 0,
            activeDeliveries: orderCounts?.activeDeliveries || 0,
            deliveredOrders: orderCounts?.deliveredOrders || 0,
            cancelledOrders: orderCounts?.cancelledOrders || 0,
            totalCollectedRevenue: Number(revRows?.totalCollectedRevenue || 0),
            totalGrossOrderValue: Number(revRows?.totalGrossOrderValue || 0),
            totalCustomers,
            totalDeliveryPartners
        },
        deliveryStats: {
            available: dpStats?.available || 0,
            busy: dpStats?.busy || 0,
            offline: dpStats?.offline || 0
        },
        salesTimeline,
        recentOrders
    };
}

