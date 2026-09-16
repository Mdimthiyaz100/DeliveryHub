const express = require('express');
const router = express.Router();
const dpController = require('../controllers/dpcontroller');
const { verifyToken } = require('../middleware/auth');
const licenseUpload = require('../middleware/licenseUpload');

router.get('/', verifyToken, dpController.getAllDeliveryPersons);
router.get('/available', verifyToken, dpController.getAvailable);
router.get('/:id/license', verifyToken, dpController.downloadLicense);
router.get('/:id', verifyToken, dpController.getDeliveryPerson);
router.post('/', verifyToken, licenseUpload.single('drivingLicense'), dpController.addDeliveryPerson);
router.put('/:id', verifyToken, licenseUpload.single('drivingLicense'), dpController.editDeliveryPerson);
router.patch('/:id/status', verifyToken, dpController.changeStatus);
router.delete('/:id', verifyToken, dpController.removeDeliveryPerson);
router.get('/:id/orders', verifyToken, dpController.getDPOrderHistory);
router.post('/assign', verifyToken, dpController.assignDelivery);
router.patch('/order/:id/status', verifyToken, dpController.updateOrderDeliveryStatus);

module.exports = router;
