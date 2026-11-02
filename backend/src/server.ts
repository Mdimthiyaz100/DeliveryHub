import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { initializeSocket } from './socket';

import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import orderRoutes from './routes/orderRoutes';
import dpRoutes from './routes/dproutes';
import dashboardRoutes from './routes/dashboardRoutes';
import productRoutes from './routes/productRoutes';
import cartRoutes from './routes/cartRoutes';
import addressRoutes from './routes/addressRoutes';
import wishlistRoutes from './routes/wishlistRoutes';
import trackingRoutes from './routes/trackingRoutes';

const app = express();

const allowedOrigins = [
    'https://deliveryhub-feh3.onrender.com',
    'https://deliveryhub-server.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(express.json());

// Security headers with GIS popup and FedCM compatibility
app.use((_req: Request, res: Response, next) => {
    // Allows Google One Tap / popup window.postMessage communication
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    next();
});

// Health check
app.get('/', (_req: Request, res: Response) => {
    res.json({ 
        status: 'ok', 
        message: 'DeliveryHub API is running (TypeScript)', 
        environment: process.env.NODE_ENV || 'development' 
    });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', dpRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users/addresses', addressRoutes);
app.use('/api/users/wishlist', wishlistRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/admin/tracking', trackingRoutes);

const PORT = process.env.PORT || 5000;
export const httpServer = http.createServer(app);
initializeSocket(httpServer, allowedOrigins);

if (process.env.NODE_ENV !== 'test') {
    httpServer.listen(PORT, () => {
        console.log(`Server running with Socket.IO on port ${PORT}`);
    });
}

export default app;

