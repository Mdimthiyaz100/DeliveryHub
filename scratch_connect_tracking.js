const mysql = require('./backend/node_modules/mysql2/promise');
require('./backend/node_modules/dotenv').config({ path: './backend/.env' });

async function run() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  
  // Set real coordinates for Puducherry
  // Origin Hub: Faaz Tech Solutions / Chennai Hub: 13.0827, 80.2707
  // Puducherry Destination: 11.9416, 79.8083 (Mohamed Imthiyaz, Puducherry - 605008)
  // Live Driver: 11.9480, 79.8150 (Lawspet, Puducherry)
  
  await pool.query(`
    UPDATE delivery_persons 
    SET 
      name = 'Rahul Kumar',
      vehicle_type = 'Express Courier',
      rating = 4.8,
      delivery_count = 1256,
      current_lat = 11.9480, 
      current_lng = 79.8150, 
      last_location_update = NOW()
    WHERE id = 5
  `);

  await pool.query(`
    UPDATE shipment_tracking 
    SET 
      pickup_address = 'Faaz Tech Solutions, Chennai, TN - 600119',
      pickup_latitude = 13.0827,
      pickup_longitude = 80.2707,
      destination_address = 'Mohamed Imthiyaz, Puducherry - 605008',
      destination_latitude = 11.9416,
      destination_longitude = 79.8083,
      current_latitude = 11.9480,
      current_longitude = 79.8150,
      current_location_name = 'Lawspet, Puducherry',
      distance_remaining_km = 2.40,
      estimated_delivery_mins = 18,
      delivery_partner_id = 5,
      current_status = 'Out for Delivery'
    WHERE order_id = 5 OR tracking_number = 'DH2026081400005'
  `);

  // Ensure an event exists for Out for Delivery
  await pool.query(`
    INSERT INTO shipment_tracking_events (tracking_id, status, description, location_name, latitude, longitude)
    SELECT id, 'Out for Delivery', 'Your parcel is out for delivery with our partner.', 'Lawspet, Puducherry', 11.9480, 79.8150
    FROM shipment_tracking
    WHERE tracking_number = 'DH2026081400005'
    AND NOT EXISTS (
      SELECT 1 FROM shipment_tracking_events WHERE status = 'Out for Delivery' AND tracking_id = shipment_tracking.id
    )
  `);

  console.log('Successfully updated order #5 tracking and delivery partner #5!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

