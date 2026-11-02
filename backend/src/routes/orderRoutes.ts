import { Router } from 'express';
import * as orderController from '../controllers/ordercontroller';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/my-orders', authenticateUser, orderController.getMyOrders);
router.patch('/:id/cancel', authenticateUser, orderController.cancelMyOrder);
router.get('/unassigned/list', authenticateUser, requireAdmin, orderController.getUnassigned);
router.patch('/:id/assign', authenticateUser, requireAdmin, orderController.assignCourier);

router.get('/', authenticateUser, requireAdmin, orderController.getOrders);
router.post('/', authenticateUser, orderController.createOrder);
router.get('/:id', authenticateUser, orderController.getOrder);
router.patch('/:id', authenticateUser, requireAdmin, orderController.updateStatus);
router.delete('/:id', authenticateUser, requireAdmin, orderController.deleteOrder);

export default router;

