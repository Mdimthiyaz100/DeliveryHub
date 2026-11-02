import { Router, Response } from 'express';
import { query } from '../database/db';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';

const router = Router();

// GET /api/users/addresses
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const addresses = await query<any[]>(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        res.json(addresses);
    } catch (err: any) {
        console.error('getAddresses Error:', err);
        res.status(500).json({ message: 'Failed to retrieve addresses', error: err.message });
    }
});

// POST /api/users/addresses
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { type = 'Home', recipientName, phone, street, city, state, pincode, isDefault = false } = req.body;

        if (!recipientName?.trim() || !phone?.trim() || !street?.trim()) {
            return res.status(400).json({ message: 'Recipient name, phone, and street address are required' });
        }

        if (isDefault) {
            await query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        const result: any = await query(
            `INSERT INTO user_addresses (user_id, type, recipient_name, phone, street, city, state, pincode, is_default)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, type, recipientName.trim(), phone.trim(), street.trim(), city || 'Bengaluru', state || 'Karnataka', pincode || '560001', isDefault ? 1 : 0]
        );

        const addresses = await query<any[]>(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        res.status(201).json({ message: 'Address saved successfully', id: result.insertId, addresses });
    } catch (err: any) {
        console.error('addAddress Error:', err);
        res.status(500).json({ message: 'Failed to add address', error: err.message });
    }
});

// PUT /api/users/addresses/:id
router.put('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id;
        const { type, recipientName, phone, street, city, state, pincode, isDefault } = req.body;

        if (isDefault) {
            await query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        const fields: string[] = [];
        const values: any[] = [];

        if (type !== undefined) { fields.push('type = ?'); values.push(type); }
        if (recipientName !== undefined) { fields.push('recipient_name = ?'); values.push(recipientName); }
        if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
        if (street !== undefined) { fields.push('street = ?'); values.push(street); }
        if (city !== undefined) { fields.push('city = ?'); values.push(city); }
        if (state !== undefined) { fields.push('state = ?'); values.push(state); }
        if (pincode !== undefined) { fields.push('pincode = ?'); values.push(pincode); }
        if (isDefault !== undefined) { fields.push('is_default = ?'); values.push(isDefault ? 1 : 0); }

        if (fields.length > 0) {
            values.push(id, userId);
            await query(
                `UPDATE user_addresses SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
                values
            );
        }

        const addresses = await query<any[]>(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        res.json({ message: 'Address updated successfully', addresses });
    } catch (err: any) {
        console.error('updateAddress Error:', err);
        res.status(500).json({ message: 'Failed to update address', error: err.message });
    }
});

// DELETE /api/users/addresses/:id
router.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const id = req.params.id;
        await query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', [id, userId]);
        const addresses = await query<any[]>(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
            [userId]
        );
        res.json({ message: 'Address deleted successfully', addresses });
    } catch (err: any) {
        console.error('deleteAddress Error:', err);
        res.status(500).json({ message: 'Failed to delete address', error: err.message });
    }
});

export default router;

