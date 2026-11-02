import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as CartModel from '../models/cart';
import * as ProductModel from '../models/product';

/**
 * Helper to compute trusted order summary on the backend
 */
function calculateSummary(items: CartModel.CartItemRow[]) {
    let subtotal = 0;
    let totalQuantity = 0;

    for (const item of items) {
        const price = Number(item.price) || 0;
        const qty = item.quantity || 1;
        subtotal += price * qty;
        totalQuantity += qty;
    }

    // Free delivery over ₹999, else ₹99
    const deliveryCharge = subtotal >= 999 || subtotal === 0 ? 0 : 99;
    // Standard promotional discount 10%
    const applicableDiscount = Math.round(subtotal * 0.10);
    // 18% GST (already inclusive or broken down)
    const tax = Math.round(subtotal * 0.05);
    const finalAmount = Math.max(0, subtotal - applicableDiscount + deliveryCharge + tax);

    return {
        subtotal,
        totalQuantity,
        deliveryCharge,
        discount: applicableDiscount,
        tax,
        finalAmount
    };
}

export async function getCart(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user!.userId;
        const items = await CartModel.getCartItems(userId);
        const summary = calculateSummary(items);
        res.json({ items, summary });
    } catch (err: any) {
        console.error('getCart Error:', err);
        res.status(500).json({ message: 'Failed to retrieve cart', error: err.message });
    }
}

export async function addToCart(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user!.userId;
        const { productId, quantity = 1, variantId = null } = req.body;

        if (!productId) {
            return res.status(400).json({ message: 'productId is required' });
        }

        const product = await ProductModel.getProductById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found in catalogue' });
        }

        const items = await CartModel.addOrUpdateItem(
            userId,
            productId,
            Math.max(1, Number(quantity) || 1),
            variantId
        );
        const summary = calculateSummary(items);

        res.json({
            message: 'Product added to cart',
            items,
            summary
        });
    } catch (err: any) {
        console.error('addToCart Error:', err);
        res.status(500).json({ message: err.message || 'Failed to add item to cart' });
    }
}

export async function updateQuantity(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user!.userId;
        const { productId, quantity, variantId = null } = req.body;

        if (!productId || quantity === undefined) {
            return res.status(400).json({ message: 'productId and quantity are required' });
        }

        const items = await CartModel.setItemQuantity(
            userId,
            productId,
            Number(quantity),
            variantId
        );
        const summary = calculateSummary(items);

        res.json({
            message: 'Cart quantity updated',
            items,
            summary
        });
    } catch (err: any) {
        console.error('updateQuantity Error:', err);
        res.status(500).json({ message: err.message || 'Failed to update item quantity' });
    }
}

export async function removeFromCart(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user!.userId;
        const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
        const variantId = req.query.variantId ? Number(req.query.variantId) : null;

        if (!productId) {
            return res.status(400).json({ message: 'productId param is required' });
        }

        const items = await CartModel.removeItem(userId, productId, variantId);
        const summary = calculateSummary(items);

        res.json({
            message: 'Item removed from cart',
            items,
            summary
        });
    } catch (err: any) {
        console.error('removeFromCart Error:', err);
        res.status(500).json({ message: err.message || 'Failed to remove item' });
    }
}

export async function clearCustomerCart(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user!.userId;
        const items = await CartModel.clearCart(userId);
        res.json({
            message: 'Cart cleared successfully',
            items,
            summary: calculateSummary(items)
        });
    } catch (err: any) {
        console.error('clearCustomerCart Error:', err);
        res.status(500).json({ message: err.message || 'Failed to clear cart' });
    }
}

export async function mergeCart(req: AuthenticatedRequest, res: Response) {
    try {
        const userId = req.user!.userId;
        const { guestItems } = req.body;

        const items = await CartModel.mergeGuestCart(userId, guestItems || []);
        const summary = calculateSummary(items);

        res.json({
            message: 'Guest cart merged successfully',
            items,
            summary
        });
    } catch (err: any) {
        console.error('mergeCart Error:', err);
        res.status(500).json({ message: err.message || 'Failed to merge cart' });
    }
}
