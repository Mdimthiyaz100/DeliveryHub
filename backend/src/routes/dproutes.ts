import { Router } from 'express';
import * as dpController from '../controllers/dpcontroller';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/overview', authenticateUser, requireAdmin, dpController.getOverviewStats);
router.get('/available', authenticateUser, requireAdmin, dpController.getAvailable);
router.post('/assign', authenticateUser, requireAdmin, dpController.assignDelivery);
router.patch('/:id/status', authenticateUser, requireAdmin, dpController.changeStatus);
router.patch('/order/:id/status', authenticateUser, requireAdmin, dpController.updateOrderDeliveryStatus);
router.delete('/:id', authenticateUser, requireAdmin, dpController.removeDeliveryPerson);

router.get('/', authenticateUser, requireAdmin, dpController.getAllDeliveryPersons);
router.post('/', authenticateUser, requireAdmin, dpController.addDeliveryPerson);
router.get('/:id', authenticateUser, requireAdmin, dpController.getDeliveryPerson);
router.put('/:id', authenticateUser, requireAdmin, dpController.editDeliveryPerson);
router.get('/:id/orders', authenticateUser, requireAdmin, dpController.getDPOrderHistory);

export default router;

