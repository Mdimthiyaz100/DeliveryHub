const express = require('express');
const router = express.Router();
const orderController = require('../controllers/ordercontroller');
const { verifyToken } = require('../middleware/auth');

router.get('/my', verifyToken, orderController.getMyOrders);
router.get('/', verifyToken, orderController.getOrders);
router.get('/unassigned/list', verifyToken, orderController.getUnassigned);
router.get('/:id', verifyToken, orderController.getOrder);
router.post('/', verifyToken, orderController.createOrder);
router.patch('/:id/status', verifyToken, orderController.updateStatus);
router.delete('/:id', verifyToken, orderController.deleteOrder);

module.exports = router;