import { query } from '../database/db';

export interface ShipmentTracking {
    id: number;
    order_id: number;
    tracking_number: string;
    delivery_partner_id: number | null;
    current_status: string;
    pickup_address: string;
    pickup_latitude: number;
    pickup_longitude: number;
    destination_address: string;
    destination_latitude: number;
    destination_longitude: number;
    current_latitude: number | null;
    current_longitude: number | null;
    current_location_name: string | null;
    distance_remaining_km: number;
    estimated_delivery_mins: number;
    estimated_delivery_at: string | null;
    picked_up_at: string | null;
    delivered_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface TrackingEvent {
    id: number;
    tracking_id: number;
    status: string;
    description: string;
    location_name: string;
    latitude?: number | null;
    longitude?: number | null;
    created_at: string;
}

/**
 * Generate a unique tracking number in format: DH<YYYYMMDD><Sequential/Random padded>
 */
export function generateTrackingNumber(orderId: number | string): string {
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const cleanId = String(orderId).slice(-5).padStart(5, '0');
    return `DH${yyyymmdd}${cleanId}`;
}

/**
 * Create a new shipment_tracking record and initial "Order Placed" event
 */
export async function createShipmentTracking(params: {
    orderId: number | string;
    recipientName?: string;
    deliveryAddress?: string;
    city?: string;
    state?: string;
    pincode?: string;
}) {
    const { orderId, recipientName, deliveryAddress, city, state, pincode } = params;
    const trackingNumber = generateTrackingNumber(orderId);

    const fullDest = deliveryAddress
        ? `${recipientName || 'Customer'} - ${deliveryAddress}`
        : `${recipientName || 'Customer'}, ${city || 'Puducherry'}, ${state || 'TN'} - ${pincode || '605008'}`;

    const estDelivery = new Date(Date.now() + 24 * 3600 * 1000);

    // Save tracking_number directly to orders table as well
    await query('UPDATE orders SET tracking_number = ? WHERE id = ?', [trackingNumber, orderId]);

    const result: any = await query(`
        INSERT INTO shipment_tracking (
            order_id, tracking_number, current_status,
            pickup_address, pickup_latitude, pickup_longitude,
            destination_address, destination_latitude, destination_longitude,
            current_latitude, current_longitude, current_location_name,
            distance_remaining_km, estimated_delivery_mins, estimated_delivery_at
        ) VALUES (
            ?, ?, 'Order Placed',
            'Faaz Tech Solutions, Chennai, TN - 600119', 12.9716, 80.2450,
            ?, 11.9416, 79.8083,
            12.9716, 80.2450, 'Chennai Origin Hub',
            145.0, 180, ?
        )
    `, [orderId, trackingNumber, fullDest, estDelivery]);

    const trackingId = result.insertId;

    // Add initial timeline event
    await addTrackingEvent({
        trackingId,
        status: 'Order Placed',
        description: 'Your order has been placed successfully and dispatched to merchant.',
        locationName: 'Faaz Tech Solutions, Chennai',
        latitude: 12.9716,
        longitude: 80.2450
    });

    return { trackingId, trackingNumber };
}

export async function addTrackingEvent(data: {
    trackingId: number | string;
    status: string;
    description: string;
    locationName: string;
    latitude?: number | null;
    longitude?: number | null;
}) {
    const { trackingId, status, description, locationName, latitude = null, longitude = null } = data;
    await query(`
        INSERT INTO shipment_tracking_events (tracking_id, status, description, location_name, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [trackingId, status, description, locationName, latitude, longitude]);
}

/**
 * Retrieve comprehensive tracking record with order, timeline, and delivery partner
 */
export async function getShipmentByTrackingNumber(trackingNumber: string) {
    const cleanNum = trackingNumber.trim().toUpperCase();

    // Support search by either tracking_number or order ID (e.g. #ORD10987 or 10987 or ORD-...)
    let sql = `
        SELECT 
            st.*,
            o.id as order_number,
            o.created_at as order_date,
            o.item as order_item,
            o.amount as order_amount,
            o.recipient_name,
            o.customer_phone,
            o.delivery_status as order_delivery_status,
            u.name as customer_name,
            u.email as customer_email,
            dp.id as dp_id,
            dp.name as dp_name,
            dp.phone as dp_phone,
            dp.email as dp_email,
            dp.vehicle_type as dp_vehicle,
            dp.vehicle_number as dp_vehicle_number,
            COALESCE(dp.rating, 4.8) as dp_rating,
            COALESCE(dp.delivery_count, 1256) as dp_delivery_count,
            dp.avatar as dp_avatar,
            dp.status as dp_status,
            dp.current_lat as dp_live_lat,
            dp.current_lng as dp_live_lng,
            dp.last_location_update as dp_last_updated
        FROM shipment_tracking st
        JOIN orders o ON st.order_id = o.id
        LEFT JOIN users u ON o.user_id = u.id
        LEFT JOIN delivery_persons dp ON st.delivery_partner_id = dp.id OR o.delivery_person_id = dp.id
        WHERE UPPER(st.tracking_number) = ? OR o.id = ? OR UPPER(o.tracking_number) = ?
        LIMIT 1
    `;

    const numericId = cleanNum.replace(/[^0-9]/g, '') || '0';
    const rows = await query<any[]>(sql, [cleanNum, numericId, cleanNum]);

    if (!rows || rows.length === 0) return null;
    const shipment = rows[0];

    // Fetch chronological timeline events
    const events = await query<TrackingEvent[]>(`
        SELECT * FROM shipment_tracking_events
        WHERE tracking_id = ?
        ORDER BY created_at ASC, id ASC
    `, [shipment.id]);

    return { ...shipment, events };
}

/**
 * Update shipment location from driver GPS signal
 */
export async function recordDeliveryLocation(params: {
    deliveryPartnerId: number | string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    locationName?: string;
    orderId?: number | string | null;
    trackingId?: number | string | null;
}) {
    const { deliveryPartnerId, latitude, longitude, accuracy = null, speed = null, heading = null, locationName, orderId = null, trackingId = null } = params;

    // 1. Log to history
    await query(`
        INSERT INTO delivery_partner_locations (delivery_partner_id, order_id, tracking_id, latitude, longitude, accuracy, speed, heading)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [deliveryPartnerId, orderId, trackingId, latitude, longitude, accuracy, speed, heading]);

    // 2. Update delivery partner real-time state
    await query(`
        UPDATE delivery_persons 
        SET current_lat = ?, current_lng = ?, last_location_update = CURRENT_TIMESTAMP, status = 'busy'
        WHERE id = ?
    `, [latitude, longitude, deliveryPartnerId]);

    // 3. If tied to a shipment, update the current tracking coordinates
    if (trackingId || orderId) {
        await query(`
            UPDATE shipment_tracking
            SET current_latitude = ?, current_longitude = ?, 
                current_location_name = COALESCE(?, current_location_name),
                updated_at = CURRENT_TIMESTAMP
            WHERE (id = ? OR order_id = ?)
        `, [latitude, longitude, locationName || null, trackingId || 0, orderId || 0]);
    } else {
        // Automatically sync to any active shipment assigned to this delivery partner
        await query(`
            UPDATE shipment_tracking
            SET current_latitude = ?, current_longitude = ?, 
                current_location_name = COALESCE(?, current_location_name),
                updated_at = CURRENT_TIMESTAMP
            WHERE delivery_partner_id = ? AND current_status NOT IN ('Delivered', 'Cancelled')
        `, [latitude, longitude, locationName || null, deliveryPartnerId]);
    }

    return true;
}

/**
 * Return live active shipments for the Admin dashboard map
 */
export async function getActiveLiveShipments() {
    const sql = `
        SELECT 
            st.id,
            st.order_id,
            st.tracking_number,
            st.current_status,
            st.pickup_address,
            st.pickup_latitude,
            st.pickup_longitude,
            st.destination_address,
            st.destination_latitude,
            st.destination_longitude,
            COALESCE(st.current_latitude, dp.current_lat, 11.9480) as current_latitude,
            COALESCE(st.current_longitude, dp.current_lng, 79.8150) as current_longitude,
            COALESCE(st.current_location_name, 'In Transit') as current_location_name,
            st.distance_remaining_km,
            st.estimated_delivery_mins,
            dp.id as dp_id,
            dp.name as dp_name,
            dp.phone as dp_phone,
            COALESCE(dp.rating, 4.8) as dp_rating,
            COALESCE(dp.delivery_count, 1256) as dp_delivery_count,
            dp.status as dp_status,
            dp.last_location_update
        FROM shipment_tracking st
        LEFT JOIN delivery_persons dp ON st.delivery_partner_id = dp.id
        WHERE st.current_status NOT IN ('Delivered', 'Cancelled')
        ORDER BY st.updated_at DESC
        LIMIT 20
    `;
    return await query<any[]>(sql);
}

/**
 * Tracking statistics for Admin metrics
 */
export async function getTrackingStatistics() {
    const [stats] = await query<any[]>(`
        SELECT 
            COUNT(*) as total_shipments,
            SUM(CASE WHEN current_status IN ('Order Placed', 'Order Confirmed', 'Preparing for Shipment', 'Ready for Pickup') THEN 1 ELSE 0 END) as pending_pickup,
            SUM(CASE WHEN current_status IN ('Picked Up', 'In Transit', 'Reached Destination Hub') THEN 1 ELSE 0 END) as in_transit,
            SUM(CASE WHEN current_status = 'Out for Delivery' THEN 1 ELSE 0 END) as out_for_delivery,
            SUM(CASE WHEN current_status = 'Delivered' THEN 1 ELSE 0 END) as delivered,
            SUM(CASE WHEN current_status = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
        FROM shipment_tracking
    `);
    return stats;
}

