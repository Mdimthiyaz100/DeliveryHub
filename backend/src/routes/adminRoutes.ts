import { Router } from 'express';
import * as adminController from '../controllers/admincontroller';
import { authenticateUser, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticateUser);

router.get('/overview', requireSuperAdmin, adminController.getOverview);
router.post('/invite', requireSuperAdmin, adminController.inviteAdmin);
router.patch('/status/:id', requireSuperAdmin, adminController.toggleAdminStatus);
router.delete('/:id', requireSuperAdmin, adminController.removeAdmin);
router.delete('/invitation/:id', requireSuperAdmin, adminController.revokeInvitation);

export default router;

