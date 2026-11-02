import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

let ioInstance: SocketIOServer | null = null;

export function initializeSocket(httpServer: HttpServer, allowedOrigins: string[]): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: function (origin, callback) {
                if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
                    return callback(null, true);
                }
                return callback(null, true);
            },
            credentials: true,
            methods: ['GET', 'POST']
        }
    });

    // Authentication middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) {
            // Allow unauthenticated connection but flag it as public (e.g. for customer tracking page)
            (socket as any).user = null;
            return next();
        }

        try {
            const secret = process.env.JWT_SECRET || 'deliveryhub_default_secret_key_123';
            const decoded = jwt.verify(token, secret);
            (socket as any).user = decoded;
            next();
        } catch (err) {
            // Invalid token, treat as unauthenticated public client
            (socket as any).user = null;
            next();
        }
    });

    io.on('connection', (socket) => {
        const user = (socket as any).user;

        // Auto join admin room if admin or super_admin
        if (user && (user.role === 'admin' || user.role === 'super_admin')) {
            socket.join('admin-tracking');
        }

        // Delivery person / customer joins specific order/tracking room
        socket.on('join-tracking', (trackingNumber: string) => {
            if (trackingNumber) {
                socket.join(`tracking:${trackingNumber.toUpperCase()}`);
            }
        });

        socket.on('leave-tracking', (trackingNumber: string) => {
            if (trackingNumber) {
                socket.leave(`tracking:${trackingNumber.toUpperCase()}`);
            }
        });

        // Delivery person sends live GPS location via Socket.IO
        socket.on('delivery-gps-update', (payload: {
            trackingNumber?: string;
            deliveryPersonId?: number;
            latitude: number;
            longitude: number;
            accuracy?: number;
            speed?: number;
            heading?: number;
        }) => {
            if (!payload || !payload.latitude || !payload.longitude) return;

            const updateData = {
                ...payload,
                timestamp: new Date().toISOString()
            };

            // Broadcast to admin room
            io.to('admin-tracking').emit('live-location-update', updateData);

            // Broadcast to specific tracking room
            if (payload.trackingNumber) {
                io.to(`tracking:${payload.trackingNumber.toUpperCase()}`).emit('tracking-gps-update', updateData);
            }
        });

        socket.on('disconnect', () => {
            // Handled
        });
    });

    ioInstance = io;
    return io;
}

export function getIO(): SocketIOServer | null {
    return ioInstance;
}

/**
 * Broadcast GPS location update to all listening clients (admin room + tracking room)
 */
export function broadcastLocationUpdate(data: {
    orderId?: number;
    trackingNumber?: string;
    deliveryPartnerId: number | string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    locationName?: string;
    distanceRemainingKm?: number;
    estimatedDeliveryMins?: number;
    status?: string;
}) {
    if (!ioInstance) return;

    const payload = {
        ...data,
        recordedAt: new Date().toISOString()
    };

    ioInstance.to('admin-tracking').emit('live-location-update', payload);

    if (data.trackingNumber) {
        ioInstance.to(`tracking:${data.trackingNumber.toUpperCase()}`).emit('tracking-gps-update', payload);
    }
}

/**
 * Broadcast status transition event
 */
export function broadcastStatusUpdate(data: {
    trackingNumber: string;
    orderId: number;
    status: string;
    description: string;
    updatedAt: string;
}) {
    if (!ioInstance) return;

    ioInstance.to('admin-tracking').emit('shipment-status-changed', data);
    ioInstance.to(`tracking:${data.trackingNumber.toUpperCase()}`).emit('shipment-status-changed', data);
}

