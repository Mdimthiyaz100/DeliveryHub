const Order = require('../models/order');
const User = require('../models/user');

async function getOrders(req, res) {
    try {
        const orders = await Order.getAllOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getOrder(req, res) {
    try {
        const order = await Order.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getMyOrders(req, res) {
    try {
        const orders = await Order.getOrdersByUserId(req.user.userId);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function createOrder(req, res) {
    try {
        const { item, amount, name, phone, address, paymentMethod, quantity } = req.body;
        if (!item?.trim() || amount === undefined || amount === '' || Number(amount) < 0) {
            return res.status(400).json({ message: 'Item and a valid amount are required' });
        }
        const normalizedQuantity = Number(quantity);
        if (!Number.isInteger(normalizedQuantity) || normalizedQuantity < 1) {
            return res.status(400).json({ message: 'Quantity must be a whole number of at least 1' });
        }
        if (name !== undefined || phone !== undefined || address !== undefined || paymentMethod !== undefined) {
            if (!name?.trim() || !phone?.trim() || !address?.trim() || !paymentMethod?.trim()) {
                return res.status(400).json({ message: 'Name, phone number, address, and payment method are required for checkout' });
            }
        }
        const user = await User.getUserById(req.user.userId);
        if (!user) {
            return res.status(401).json({ message: 'Your account no longer exists. Please log out and register or log in again.' });
        }
        const id = await Order.createOrder(
            req.user.userId,
            item.trim(),
            amount,
            name?.trim(),
            phone?.trim(),
            address?.trim(),
            paymentMethod?.trim(),
            normalizedQuantity
        );
        res.status(201).json({ id, message: 'Order created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updateStatus(req, res) {
    try {
        const { status } = req.body;
        await Order.updateOrderStatus(req.params.id, status);
        res.json({ message: 'Status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function deleteOrder(req, res) {
    try {
        const order = await Order.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });
        await Order.deleteOrder(req.params.id);
        res.json({ message: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getUnassigned(req, res) {
    try {
        const orders = await Order.getUnassignedOrders();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { getOrders, getOrder, getMyOrders, createOrder, updateStatus, deleteOrder, getUnassigned };
