require('dotenv').config();
const express = require('express');
const cors = require('cors');
const seed = require('./database/seed');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'DeliveryHub API is running' });
});

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/delivery', require('./routes/dproutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/products', require('./routes/productRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    // Run database seeder
    await seed();
});