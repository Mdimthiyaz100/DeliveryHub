import { Router } from 'express';
import * as userController from '../controllers/usercontroller';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/google-login', userController.googleAuth);
router.post('/logout', userController.logout);
router.get('/profile', authenticateUser, userController.getProfile);
router.put('/profile', authenticateUser, userController.updateProfile);
router.get('/', authenticateUser, requireAdmin, userController.getUsers);

export default router;

