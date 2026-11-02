
 import { Response } from 'express';
import * as User from '../models/user';
import * as Invitation from '../models/invitation';
import crypto from 'crypto';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * GET /api/admin/overview
 * Viewable exclusively by SUPER_ADMIN for Admin Management
 */
export async function getOverview(req: AuthenticatedRequest, res: Response) {
    try {
        const data = await Invitation.getAdminOverview();
        res.json({
            ...data,
            currentUserRole: req.user!.role
        });
    } catch (err: any) {
        console.error('Error fetching admin overview:', err);
        res.status(500).json({ error: err.message });
    }
}

/**
 * POST /api/admin/invite
 * STRICT: Only SUPER_ADMIN can invite or create new administrators
 */
export async function inviteAdmin(req: AuthenticatedRequest, res: Response) {
    try {
        const { email, name } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email address is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check if already an administrator
        const existingUser = await User.getUserByEmail(normalizedEmail);
        if (existingUser && ['admin', 'super_admin'].includes(existingUser.role)) {
            return res.status(400).json({ message: `A user with email ${normalizedEmail} is already an Administrator.` });
        }

        // Generate invitation token
        const rawToken = crypto.randomBytes(24).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await Invitation.createInvitation(
            normalizedEmail,
            name || null,
            req.user!.userId,
            tokenHash,
            expiresAt
        );

        // If user already exists as regular user, upgrade their role immediately
        if (existingUser) {
            await User.updateUserRole(existingUser.id, 'admin');
            await Invitation.acceptInvitation(normalizedEmail);
            return res.status(201).json({
                message: `Existing user account (${normalizedEmail}) has been upgraded to Administrator immediately.`,
                promoted: true
            });
        }

        res.status(201).json({
            message: `Invitation successfully created for ${normalizedEmail}. When they sign in with their matching Google account, they will be granted Administrator access.`,
            invitation: { email: normalizedEmail, name }
        });
    } catch (err: any) {
        console.error('Error inviting admin:', err);
        res.status(500).json({ error: err.message });
    }
}

/**
 * PATCH /api/admin/status/:id
 * STRICT: Only SUPER_ADMIN can activate/deactivate administrators
 */
export async function toggleAdminStatus(req: AuthenticatedRequest, res: Response) {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const targetUserId = parseInt(idParam, 10);
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: "Status must be either 'active' or 'inactive'" });
        }

        const targetUser = await User.getUserById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Guard: Prevent deactivating the only active SUPER_ADMIN
        if (status === 'inactive' && targetUser.role === 'super_admin') {
            const superCount = await User.getActiveSuperAdminCount();
            if (superCount <= 1) {
                return res.status(400).json({
                    message: 'Action blocked: Cannot deactivate the primary/sole active SUPER_ADMIN account.'
                });
            }
        }

        await User.updateUserStatus(targetUserId, status);
        res.json({ message: `Admin account status updated to ${status}` });
    } catch (err: any) {
        console.error('Error updating admin status:', err);
        res.status(500).json({ error: err.message });
    }
}

/**
 * DELETE /api/admin/:id
 * STRICT: Only SUPER_ADMIN can remove/delete an administrator
 */
export async function removeAdmin(req: AuthenticatedRequest, res: Response) {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const targetUserId = parseInt(idParam, 10);

        if (req.user!.userId === targetUserId) {
            return res.status(400).json({ message: 'Security restriction: You cannot remove your own active administrator account.' });
        }

        const targetUser = await User.getUserById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.role === 'super_admin') {
            const superCount = await User.getActiveSuperAdminCount();
            if (superCount <= 1) {
                return res.status(400).json({ message: 'Cannot remove the primary/sole SUPER_ADMIN account.' });
            }
        }

        await User.updateUserRole(targetUserId, 'user');

        res.json({ 
            message: `Administrator privileges removed for ${targetUser.name} (${targetUser.email}). Account safely converted to customer.` 
        });
    } catch (err: any) {
        console.error('Error removing admin:', err);
        res.status(500).json({ error: err.message });
    }
}

/**
 * DELETE /api/admin/invitation/:id
 */
export async function revokeInvitation(req: AuthenticatedRequest, res: Response) {
    try {
        const idParam = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const id = parseInt(idParam, 10);
        await Invitation.revokeInvitation(id);
        res.json({ message: 'Invitation has been revoked' });
    } catch (err: any) {
        console.error('Error revoking invitation:', err);
        res.status(500).json({ error: err.message });
    }
}
