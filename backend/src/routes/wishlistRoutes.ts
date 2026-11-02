import { Router, Response } from 'express';
import { query } from '../database/db';
import { AuthenticatedRequest, authenticateUser } from '../middleware/auth';

const router = Router();

// GET /api/users/wishlist
router.get('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const sql = `
            SELECT w.id, w.product_id, w.created_at,
                   p.name, p.price, p.image_url, p.category, p.description, p.stock
            FROM user_wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `;
        const items = await query<any[]>(sql, [userId]);
        res.json(items);
    } catch (err: any) {
        console.error('getWishlist Error:', err);
        res.status(500).json({ message: 'Failed to retrieve wishlist', error: err.message });
    }
});

// POST /api/users/wishlist
router.post('/', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'productId is required' });
        }

        await query(
            'INSERT IGNORE INTO user_wishlist (user_id, product_id) VALUES (?, ?)',
            [userId, productId]
        );

        const sql = `
            SELECT w.id, w.product_id, w.created_at,
                   p.name, p.price, p.image_url, p.category, p.description, p.stock
            FROM user_wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `;
        const items = await query<any[]>(sql, [userId]);
        res.status(201).json({ message: 'Item added to wishlist', items });
    } catch (err: any) {
        console.error('addToWishlist Error:', err);
        res.status(500).json({ message: 'Failed to add to wishlist', error: err.message });
    }
});

// DELETE /api/users/wishlist/:productId
router.delete('/:productId', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const productId = req.params.productId;

        await query('DELETE FROM user_wishlist WHERE user_id = ? AND product_id = ?', [userId, productId]);

        const sql = `
            SELECT w.id, w.product_id, w.created_at,
                   p.name, p.price, p.image_url, p.category, p.description, p.stock
            FROM user_wishlist w
            JOIN products p ON w.product_id = p.id
            WHERE w.user_id = ?
            ORDER BY w.created_at DESC
        `;
        const items = await query<any[]>(sql, [userId]);
        res.json({ message: 'Item removed from wishlist', items });
    } catch (err: any) {
        console.error('removeFromWishlist Error:', err);
        res.status(500).json({ message: 'Failed to remove from wishlist', error: err.message });
    }
});

export default router;

