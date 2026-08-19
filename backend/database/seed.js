const { query } = require('./db');

async function seed() {
    try {
        console.log("Starting database initialization and seeding...");

        // === 1. Create users table ===
        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // === 2. Create delivery_persons table ===
        await query(`
            CREATE TABLE IF NOT EXISTS delivery_persons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                phone VARCHAR(30),
                email VARCHAR(255),
                vehicle_type VARCHAR(50),
                vehicle_number VARCHAR(50),
                status VARCHAR(20) DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // === 3. Create orders table ===
        await query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                item VARCHAR(255) NOT NULL,
                quantity INT DEFAULT 1,
                amount DECIMAL(10, 2) NOT NULL,
                recipient_name VARCHAR(255),
                customer_phone VARCHAR(30),
                delivery_address TEXT,
                payment_method VARCHAR(50),
                delivery_person_id INT NULL,
                delivery_status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // === 4. Ensure extra order columns exist if table was created previously ===
        const orderColumns = [
            ['quantity', 'INT DEFAULT 1'],
            ['recipient_name', 'VARCHAR(255)'],
            ['customer_phone', 'VARCHAR(30)'],
            ['delivery_address', 'TEXT'],
            ['payment_method', 'VARCHAR(50)']
        ];
        for (const [column, definition] of orderColumns) {
            try {
                await query(`ALTER TABLE orders ADD COLUMN ${column} ${definition}`);
            } catch (e) {
                if (e.code !== 'ER_DUP_FIELDNAME') throw e;
            }
        }

        // === 5. Create products table ===
        await query(`
            CREATE TABLE IF NOT EXISTS products (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price DECIMAL(10, 2) NOT NULL,
                image_url VARCHAR(500),
                category VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // === 6. Seed admin user & ensure admin roles ===
        const users = await query('SELECT COUNT(*) as count FROM users');
        let adminId;
        if (users[0].count === 0) {
            const res = await query(
                "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@deliveryhub.com', 'password123', 'admin')"
            );
            adminId = res.insertId;
            console.log("✅ Seeded default admin user (admin@deliveryhub.com / password123).");
        } else {
            const rows = await query("SELECT id, password, role FROM users WHERE email = 'admin@deliveryhub.com'");
            if (rows.length > 0) {
                adminId = rows[0].id;
                if (rows[0].password && rows[0].password.startsWith('$2')) {
                    await query("UPDATE users SET password = 'password123' WHERE id = ?", [adminId]);
                }
                if (rows[0].role !== 'admin') {
                    await query("UPDATE users SET role = 'admin' WHERE id = ?", [adminId]);
                }
            }
        }
        // Promote creator account if it exists
        await query("UPDATE users SET role = 'admin' WHERE email = 'deliveryadmin@gmail.com'");

        // === 7. Seed delivery persons ===
        const dps = await query('SELECT COUNT(*) as count FROM delivery_persons');
        if (dps[0].count === 0) {
            await query(`
                INSERT INTO delivery_persons (name, phone, email, vehicle_type, vehicle_number, status) VALUES 
                ('Vikram', '+91 9852624558', 'vikram@deliveryhub.com', 'Bike', 'MH-12-AB-1234', 'available'),
                ('Rajesh', '+91 5236987412', 'rajesh@deliveryhub.com', 'Scooter', 'DL-3C-CD-5678', 'busy'),
                ('Sunil', '+91 1002506268', 'sunil@deliveryhub.com', 'Bike', 'KA-03-EF-9012', 'offline'),
                ('Kumar', '+91 779754552', 'kumar@deliveryhub.com', 'Bicycle', 'TN-07-GH-3456', 'available')
            `);
            console.log("✅ Seeded default delivery persons.");
        }

        // === 8. Seed orders ===
        const orders = await query('SELECT COUNT(*) as count FROM orders');
        if (orders[0].count === 0 && adminId) {
            const dpRows = await query('SELECT id FROM delivery_persons');
            const dp1 = dpRows[0]?.id;
            const dp2 = dpRows[1]?.id;

            await query(`
                INSERT INTO orders (user_id, item, amount, delivery_person_id, delivery_status, created_at) VALUES 
                (?, 'Smartphone', 15000.00, ?, 'delivered', DATE_SUB(NOW(), INTERVAL 3 DAY)),
                (?, 'Laptop', 45000.00, NULL, 'pending', DATE_SUB(NOW(), INTERVAL 2 DAY)),
                (?, 'Headphones', 2500.00, ?, 'assigned', DATE_SUB(NOW(), INTERVAL 1 DAY))
            `, [
                adminId, dp1, adminId, adminId, dp2
            ]);
            console.log("✅ Seeded default orders.");
        }

        // === 9. Seed products ===
        const products = await query('SELECT COUNT(*) as count FROM products');
        if (products[0].count === 0) {
            await query(`
                INSERT INTO products (name, description, price, image_url, category) VALUES
                ('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver, 1600 DPI optical sensor, and long battery life.', 599.00, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400', 'Electronics'),
                ('Bluetooth Headphones', 'Over-ear noise cancelling headphones with 30-hour battery and premium sound quality.', 2499.00, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 'Electronics'),
                ('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, SD card reader, and PD charging support.', 1899.00, 'https://images.unsplash.com/photo-1625842268584-8f3296236c38?w=400', 'Electronics'),
                ('Laptop Stand', 'Adjustable aluminum laptop stand with heat ventilation for 10-17 inch laptops.', 1299.00, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400', 'Accessories'),
                ('Mechanical Keyboard', 'RGB mechanical gaming keyboard with blue switches and aluminum frame.', 3499.00, 'https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400', 'Electronics'),
                ('Smartphone Case', 'Shockproof transparent case with raised edges for camera and screen protection.', 399.00, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400', 'Accessories'),
                ('Power Bank', '20000mAh power bank with fast charging, dual USB output and LED display.', 1599.00, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400', 'Electronics'),
                ('Wireless Charger', 'Qi-compatible 15W fast wireless charging pad with LED indicator.', 899.00, 'https://images.unsplash.com/photo-1591290619315-4772c9b3684b?w=400', 'Electronics')
            `);
            console.log("✅ Seeded default products.");
        }

        console.log("✅ Database initialized and seeded successfully.");
    } catch (e) {
        console.error("❌ Database seeding error:", e);
    }
}

module.exports = seed;
