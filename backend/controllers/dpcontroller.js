const DP = require('../models/deliveryperson');

async function getAllDeliveryPersons(req, res) {
    try {
        const dps = await DP.getAllDPs();
        res.json(dps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getAvailable(req, res) {
    try {
        const dps = await DP.getAvailableDPs();
        res.json(dps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getDeliveryPerson(req, res) {
    try {
        const dp = await DP.getDPById(req.params.id);
        if (!dp) return res.status(404).json({ message: 'Not found' });
        res.json(dp);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function addDeliveryPerson(req, res) {
    try {
        const { name, phone, email, vehicleType, vehicleNumber } = req.body;
        const id = await DP.createDP(name, phone, email, vehicleType, vehicleNumber);
        res.status(201).json({ id, message: 'Delivery person added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function editDeliveryPerson(req, res) {
    try {
        const { name, phone, email, vehicleType, vehicleNumber } = req.body;
        await DP.updateDP(req.params.id, name, phone, email, vehicleType, vehicleNumber);
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function changeStatus(req, res) {
    try {
        const { status } = req.body;
        await DP.updateDPStatus(req.params.id, status);
        res.json({ message: `Status changed to ${status}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function removeDeliveryPerson(req, res) {
    try {
        await DP.deleteDP(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function getDPOrderHistory(req, res) {
    try {
        const orders = await DP.getDPOrders(req.params.id);
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function assignDelivery(req, res) {
    try {
        const { orderId, dpId } = req.body;
        await DP.assignOrderToDP(orderId, dpId);
        res.json({ message: 'Assigned successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updateOrderDeliveryStatus(req, res) {
    try {
        const { status } = req.body;
        await DP.updateDeliveryStatus(req.params.id, status);
        res.json({ message: 'Delivery status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = {
    getAllDeliveryPersons,getAvailable,getDeliveryPerson,
    addDeliveryPerson,editDeliveryPerson,changeStatus,
    removeDeliveryPerson,getDPOrderHistory,assignDelivery,
    updateOrderDeliveryStatus
};