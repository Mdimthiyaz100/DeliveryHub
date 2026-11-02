import { Router } from 'express';
import * as dashboardController from '../controllers/dashboardcontroller';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticateUser, requireAdmin, dashboardController.getStats);

export default router;

