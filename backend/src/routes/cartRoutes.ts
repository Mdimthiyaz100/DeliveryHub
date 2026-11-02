import { Router } from 'express';
import * as cartController from '../controllers/cartcontroller';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// All cart endpoints require an authenticated customer session
router.get('/', authenticateUser, cartController.getCart);
router.post('/add', authenticateUser, cartController.addToCart);
router.put('/quantity', authenticateUser, cartController.updateQuantity);
router.delete('/item/:productId', authenticateUser, cartController.removeFromCart);
router.delete('/clear', authenticateUser, cartController.clearCustomerCart);
router.post('/merge', authenticateUser, cartController.mergeCart);

export default router;

