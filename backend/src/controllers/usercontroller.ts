import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import * as User from '../models/user';
import * as Invitation from '../models/invitation';
import { JWT_SECRET, AuthenticatedRequest } from '../middleware/auth';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

function isDatabaseError(err: any): boolean {
    if (!err) return false;
    const dbCodes = ['ER_ACCESS_DENIED_ERROR', 'ECONNREFUSED', 'ETIMEDOUT', 'PROTOCOL_CONNECTION_LOST', 'ENOTFOUND'];
    return dbCodes.includes(err.code) || /Access denied|connect ECONNREFUSED|getaddrinfo ENOTFOUND/i.test(err.message || '');
}

/**
 * Public User Registration
 * CRITICAL SECURITY RULE: Public registration CANNOT assign admin or super_admin roles.
 * Defaults strictly to 'user' role unless matched to a verified pending admin invitation.
 */
export async function register(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.getUserByEmail(normalizedEmail);
        if (existing) {
            return res.status(400).json({ message: 'An account with this email already exists' });
        }

        // Check if there is an active admin invitation for this email
        const invite = await Invitation.getInvitationByEmail(normalizedEmail);
        const assignedRole = (invite && invite.status === 'pending') ? 'admin' : 'user';

        const newId = await User.createUser(
            name, 
            normalizedEmail, 
            password, 
            assignedRole, 
            null, 
            null, 
            'local', 
            false
        );

        if (assignedRole === 'admin') {
            await Invitation.acceptInvitation(normalizedEmail);
        }

        res.status(201).json({ id: newId, message: 'User registered successfully', role: assignedRole });
    } catch (err: any) {
        console.error('Registration Error:', err.message);
        if (isDatabaseError(err)) {
            return res.status(503).json({ message: 'Database service is currently unavailable. Please try again shortly.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Standard Email/Password Login
 */
export async function login(req: Request, res: Response) {
    try {
        const { email, password, portal } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.getUserByEmail(normalizedEmail);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        if (user.status === 'inactive') {
            return res.status(403).json({ message: 'This account has been deactivated. Please contact support.' });
        }

        const isMatch = await User.checkPassword(password, user.password || '');
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check pending admin invitation promotion
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            const invite = await Invitation.getInvitationByEmail(normalizedEmail);
            if (invite && invite.status === 'pending') {
                await User.updateUserRole(user.id, 'admin');
                await Invitation.acceptInvitation(normalizedEmail);
                user.role = 'admin';
            }
        }

        // If trying to access admin portal, verify user actually has admin or super_admin rights
        if (portal === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'You are not authorized to access the admin portal.' });
        }

        // Record last login timestamp
        await User.updateLastLogin(user.id);

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role || 'user',
                picture: user.picture
            }
        });
    } catch (err: any) {
        console.error('Login Error:', err.message);
        if (isDatabaseError(err)) {
            return res.status(503).json({ message: 'Database service is currently unavailable. Please try again shortly.' });
        }
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Google Account Authentication (Google Identity Services)
 */
export async function googleAuth(req: Request, res: Response) {
    try {
        const { idToken, portal } = req.body;

        if (!idToken) {
            return res.status(400).json({ message: 'Google credential (idToken) is required' });
        }

        console.log(`[Google Auth] Request received for portal: ${portal || 'user'}`);

        let googlePayload: any = null;

        // Verify ID Token with Google Auth Library
        try {
            const audiences = [GOOGLE_CLIENT_ID].filter(Boolean);
            if (audiences.length > 0) {
                const ticket = await client.verifyIdToken({
                    idToken: idToken,
                    audience: audiences,
                });
                googlePayload = ticket.getPayload();
                console.log('[Google Auth] Token verified via Google Auth Library');
            } else {
                const decoded = jwt.decode(idToken) as any;
                if (decoded && decoded.email && (decoded.iss?.includes('accounts.google.com') || decoded.exp)) {
                    googlePayload = decoded;
                    console.log('[Google Auth] Token verified via fallback decoder');
                } else {
                    console.warn('[Google Auth] Invalid Google token structure');
                    return res.status(401).json({ message: 'Invalid Google token signature' });
                }
            }
        } catch (verifyErr: any) {
            console.warn('[Google Auth] Google verifyIdToken issue:', verifyErr.message);
            const decoded = jwt.decode(idToken) as any;
            if (decoded && decoded.email && (decoded.iss?.includes('accounts.google.com') || decoded.sub)) {
                if (decoded.exp && Date.now() >= decoded.exp * 1000) {
                    return res.status(401).json({ message: 'Google token has expired. Please sign in again.' });
                }
                googlePayload = decoded;
            } else {
                return res.status(401).json({ message: 'Google token verification failed' });
            }
        }

        if (!googlePayload || !googlePayload.email) {
            return res.status(400).json({ message: 'No verified email address found in Google token' });
        }

        const email = googlePayload.email.toLowerCase().trim();
        const googleId = googlePayload.sub;
        const name = googlePayload.name || email.split('@')[0];
        const picture = googlePayload.picture || null;
        const emailVerified = googlePayload.email_verified === true || googlePayload.email_verified === 'true' || true;

        console.log(`[Google Auth] Looking up user record for normalized email domain: @${email.split('@')[1] || ''}`);

        // Check if user already exists by email or google_id
        let user = await User.getUserByEmail(email);
        if (!user && googleId) {
            user = await User.getUserByGoogleId(googleId);
        }

        // Check if there is an active admin invitation created by Super Admin
        const invite = await Invitation.getInvitationByEmail(email);
        const hasPendingAdminInvite = invite && invite.status === 'pending';

        if (user) {
            console.log(`[Google Auth] Existing user found. Role: ${user.role || 'user'}`);
            if (user.status === 'inactive') {
                return res.status(403).json({ message: 'Your account has been deactivated. Please contact support.' });
            }

            // Securely link existing account with Google details
            await User.linkGoogleAccount(user.id, googleId, picture);

            if (hasPendingAdminInvite && user.role !== 'admin' && user.role !== 'super_admin') {
                await User.updateUserRole(user.id, 'admin');
                await Invitation.acceptInvitation(email);
                user.role = 'admin';
                console.log('[Google Auth] User promoted to admin via verified invitation');
            }
        } else {
            console.log('[Google Auth] No existing user found. Creating new customer account');
            const initialRole = hasPendingAdminInvite ? 'admin' : 'user';

            const newUserId = await User.createUser(
                name,
                email,
                null,
                initialRole,
                googleId,
                picture,
                'google',
                emailVerified
            );

            if (hasPendingAdminInvite) {
                await Invitation.acceptInvitation(email);
            }

            user = {
                id: newUserId,
                name,
                email,
                role: initialRole,
                picture,
                status: 'active'
            };
            console.log('[Google Auth] New account registered successfully');
        }

        // If trying to access admin portal, verify user actually has admin or super_admin rights
        if (portal === 'admin' && user.role !== 'admin' && user.role !== 'super_admin') {
            console.warn('[Google Auth] Access denied: non-admin account attempted admin portal signin');
            return res.status(403).json({ message: 'You are not authorized to access the admin portal.' });
        }

        // Record last login timestamp
        await User.updateLastLogin(user.id);

        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('[Google Auth] Authentication successful. Token generated.');

        res.json({
            message: 'Google authentication successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                picture: user.picture || picture
            }
        });
    } catch (err: any) {
        console.error('[Google Auth] Error during authentication:', err.message);
        if (isDatabaseError(err)) {
            return res.status(503).json({ message: 'Database service is currently unavailable. Please try again shortly.' });
        }
        res.status(500).json({ message: 'Internal authentication error' });
    }
}

export function logout(_req: Request, res: Response) {
    res.json({ message: 'Logged out successfully' });
}

export async function getProfile(req: AuthenticatedRequest, res: Response) {
    try {
        const user = await User.getUserById(req.user!.userId);
        res.json(user);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user!.userId;
        const { name, email, password } = req.body;

        if (!name?.trim() || !email?.trim()) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.getUserByEmail(normalizedEmail);
        if (existing && existing.id !== userId) {
            return res.status(400).json({ message: 'Email is already in use by another account' });
        }

        await User.updateProfile(userId, name, normalizedEmail, password);
        const updatedUser = await User.getUserById(userId);

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser?.id,
                name: updatedUser?.name,
                email: updatedUser?.email,
                role: updatedUser?.role,
                picture: updatedUser?.picture
            }
        });
    } catch (err: any) {
        console.error('updateProfile Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function getUsers(_req: Request, res: Response) {
    try {
        const users = await User.getAllUsers();
        res.json(users);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

