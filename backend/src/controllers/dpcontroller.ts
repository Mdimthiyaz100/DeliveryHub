import { Request, Response } from 'express';
import * as DP from '../models/deliveryperson';

export async function getAllDeliveryPersons(_req: Request, res: Response) {
    try {
        const dps = await DP.getAllDPs();
        res.json(dps);
    } catch (err: any) {
        console.error('getAllDeliveryPersons Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function getOverviewStats(_req: Request, res: Response) {
    try {
        const stats = await DP.getDPOverviewStats();
        res.json(stats);
    } catch (err: any) {
        console.error('getOverviewStats Error:', err);
        res.status(500).json({ error: err.message });
    }
}

export async function getAvailable(_req: Request, res: Response) {
    try {
        const dps = await DP.getAvailableDPs();
        res.json(dps);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getDeliveryPerson(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const dp = await DP.getDPById(id);
        if (!dp) return res.status(404).json({ message: 'Delivery partner not found' });
        res.json(dp);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function addDeliveryPerson(req: Request, res: Response) {
    try {
        const { name, phone, email, vehicleType, vehicleNumber } = req.body;
        if (!name?.trim() || !phone?.trim() || !vehicleNumber?.trim()) {
            return res.status(400).json({ message: 'Name, phone number and vehicle registration are required.' });
        }
        const id = await DP.createDP(name, phone, email, vehicleType || 'Bike', vehicleNumber);
        res.status(201).json({ id, message: 'Delivery partner registered successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function editDeliveryPerson(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { name, phone, email, vehicleType, vehicleNumber } = req.body;
        await DP.updateDP(id, name, phone, email, vehicleType, vehicleNumber);
        res.json({ message: 'Partner details updated successfully' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function changeStatus(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { status } = req.body;
        if (!['available', 'busy', 'offline', 'suspended'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }
        await DP.updateDPStatus(id, status);
        res.json({ message: `Status updated to ${status}` });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function removeDeliveryPerson(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const result = await DP.deleteDP(id);
        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function getDPOrderHistory(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const orders = await DP.getDPOrders(id);
        res.json(orders);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function assignDelivery(req: Request, res: Response) {
    try {
        const { orderId, deliveryPersonId, dpId } = req.body;
        await DP.assignOrderToDP(orderId, deliveryPersonId || dpId);
        res.json({ message: 'Order successfully assigned to delivery partner' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export async function updateOrderDeliveryStatus(req: Request, res: Response) {
    try {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const { status } = req.body;
        await DP.updateDeliveryStatus(id, status);
        res.json({ message: 'Delivery status updated' });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}
