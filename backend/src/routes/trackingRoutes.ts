import { Router } from 'express';
import * as TrackingController from '../controllers/trackingcontroller';
import { authenticateUser, requireAdmin } from '../middleware/auth';

const router = Router();

// Public / Customer Tracking Endpoint (Accessible by Customers or Admins)
router.get('/public/:trackingNumber', TrackingController.getShipmentByNumber);

// Admin Tracking Endpoints
router.get('/statistics', authenticateUser, requireAdmin, TrackingController.getStatistics);
router.get('/live-locations', authenticateUser, requireAdmin, TrackingController.getLiveLocations);
router.get('/:trackingNumber', authenticateUser, requireAdmin, TrackingController.getShipmentByNumber);
router.post('/:trackingNumber/status', authenticateUser, requireAdmin, TrackingController.updateShipmentStatus);

// Driver GPS reporting endpoint
router.post('/location', authenticateUser, TrackingController.reportDriverLocation);
router.post('/start', authenticateUser, TrackingController.reportDriverLocation);
router.get('/active', authenticateUser, requireAdmin, TrackingController.getLiveLocations);
router.get('/:trackingNumber/history', TrackingController.getShipmentByNumber);
router.get('/:trackingNumber/route', TrackingController.getShipmentByNumber);
router.patch('/:trackingNumber/status', authenticateUser, requireAdmin, TrackingController.updateShipmentStatus);
router.post('/:trackingNumber/complete', authenticateUser, requireAdmin, TrackingController.updateShipmentStatus);

export default router;

