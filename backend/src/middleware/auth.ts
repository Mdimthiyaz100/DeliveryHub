import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as User from '../models/user';

export const JWT_SECRET = process.env.JWT_SECRET || 'deliveryhub_default_secret_key_123';

export interface AuthUser {
    userId: number;
    email: string;
    role: string;
    name?: string;
    picture?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
}

/**
 * authenticateUser / verifyToken
 * Validates JWT from Authorization header and verifies user exists in database and is active.
 */
export async function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'No authorization token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Always verify real-time user existence & status from database
        const user = await User.getUserById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'Account no longer exists' });
        }
        if (user.status === 'inactive') {
            return res.status(403).json({ message: 'Account has been deactivated' });
        }

        // Attach verified user with latest database role
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role || 'user',
            name: user.name,
            picture: user.picture
        };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

export const verifyToken = authenticateUser;

/**
 * requireSuperAdmin
 * Guarantees requester is authenticated and has SUPER_ADMIN role.
 */
export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({ 
            message: 'Access denied. Only the Main Administrator (SUPER_ADMIN) has permission to perform this action.' 
        });
    }
    next();
}

/**
 * requireAdmin
 * Allows access to SUPER_ADMIN or standard ADMIN users. Blocks normal USER.
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
        return res.status(403).json({ 
            message: 'Access denied. Administrative privileges required.' 
        });
    }
    next();
}

/**
 * requireAuthenticatedUser
 * Requires any valid, active authenticated account.
 */
export function requireAuthenticatedUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    next();
}

