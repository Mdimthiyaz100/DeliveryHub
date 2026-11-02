import { Request, Response } from 'express';
import * as Order from '../models/order';
import * as DP from '../models/deliveryperson';
import { AuthenticatedRequest } from '../middleware/auth';

export async function getOrders(req: Request, res: Response) {
    try {
        const filters = {
            search: req.query.search as string,
            status: req.query.status as string,
            paymentStatus: req.query.paymentStatus as string
        };
        const orders = await Order.getAllOrders(filters);
        res.json(orders);
    } catch (err: any) {
        console.error('getOrders Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function getOrder(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const order = await Order.getOrderById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getMyOrders(req: AuthenticatedRequest, res: Response) {
    try {
        const orders = await Order.getOrdersByUserId(req.user!.userId);
        res.json(orders);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function createOrder(req: AuthenticatedRequest, res: Response) {
    try {
        const {
            item, amount, name, phone, address, city, state, pincode,
            deliveryInstructions, paymentMethod, quantity, productId,
            discount, deliveryFee, tax
        } = req.body;

        if (!item?.trim() || amount === undefined || Number(amount) < 0) {
            return res.status(400).json({ message: 'Item name and a valid amount are required' });
        }

        const newOrderId = await Order.createOrder({
            userId: req.user!.userId,
            item,
            amount,
            recipientName: name,
            customerPhone: phone,
            deliveryAddress: address,
            city,
            state,
            pincode,
            deliveryInstructions,
            paymentMethod: paymentMethod || 'Cash on Delivery',
            paymentStatus: (paymentMethod === 'Card' || paymentMethod === 'UPI') ? 'paid' : 'pending',
            quantity: Number(quantity) || 1,
            productId: productId || null,
            discount: Number(discount) || 0,
            deliveryFee: Number(deliveryFee) || 0,
            tax: Number(tax) || 0
        });

        res.status(201).json({ id: newOrderId, message: 'Order created successfully' });
    } catch (err: any) {
        console.error('createOrder Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function updateStatus(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { status, paymentStatus } = req.body;
        if (status) {
            await Order.updateOrderStatus(id, status);
        }
        if (paymentStatus) {
            await Order.updatePaymentStatus(id, paymentStatus);
        }
        res.json({ message: 'Order updated successfully' });
    } catch (err: any) {
        console.error('updateStatus Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function assignCourier(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { deliveryPersonId } = req.body;
        await DP.assignOrderToDP(id, deliveryPersonId);
        res.json({ message: 'Courier successfully assigned to order' });
    } catch (err: any) {
        console.error('assignCourier Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function deleteOrder(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const order = await Order.getOrderById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        
        if (['assigned', 'picked_up', 'on_the_way'].includes(order.delivery_status)) {
            return res.status(400).json({ message: 'Cannot delete order while in active transit. Cancel order first.' });
        }

        await Order.deleteOrder(id);
        res.json({ message: 'Order record deleted successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getUnassigned(_req: Request, res: Response) {
    try {
        const orders = await Order.getUnassignedOrders();
        res.json(orders);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
