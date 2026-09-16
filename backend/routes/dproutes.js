const express = require('express');
const router = express.Router();
const dpController = require('../controllers/dpcontroller');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, dpController.getAllDeliveryPersons);
router.get('/available', verifyToken, dpController.getAvailable);
router.get('/:id', verifyToken, dpController.getDeliveryPerson);
router.post('/', verifyToken, dpController.addDeliveryPerson);
router.put('/:id', verifyToken, dpController.editDeliveryPerson);
router.patch('/:id/status', verifyToken, dpController.changeStatus);
router.delete('/:id', verifyToken, dpController.removeDeliveryPerson);
router.get('/:id/orders', verifyToken, dpController.getDPOrderHistory);
router.post('/assign', verifyToken, dpController.assignDelivery);
router.patch('/order/:id/status', verifyToken, dpController.updateOrderDeliveryStatus);

module.exports = router;