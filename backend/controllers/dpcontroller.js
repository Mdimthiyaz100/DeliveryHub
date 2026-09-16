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
        if (!req.file) return res.status(400).json({ message: 'A driving license PDF or JPEG is required.' });
        const id = await DP.createDP(name, phone, email, vehicleType, vehicleNumber, req.file);
        res.status(201).json({ id, message: 'Delivery person added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function editDeliveryPerson(req, res) {
    try {
        const { name, phone, email, vehicleType, vehicleNumber } = req.body;
        await DP.updateDP(req.params.id, name, phone, email, vehicleType, vehicleNumber, req.file);
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function downloadLicense(req, res) {
    try {
        const license = await DP.getLicenseById(req.params.id);
        if (!license?.license_data) return res.status(404).json({ message: 'Driving license not found' });
        res.type(license.license_mime_type || 'application/octet-stream');
        res.attachment(license.license_original_name || 'driving-license');
        res.send(license.license_data);
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
    addDeliveryPerson,editDeliveryPerson,downloadLicense,changeStatus,
    removeDeliveryPerson,getDPOrderHistory,assignDelivery,
    updateOrderDeliveryStatus
};