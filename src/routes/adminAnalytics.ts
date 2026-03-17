import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import * as adminAnalyticsController from '../controllers/adminAnalyticsController';
import { UserRole } from '../types';

const router: Router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([UserRole.ADMIN]));

router.get('/summary', adminAnalyticsController.getSummary);
router.get('/funnel', adminAnalyticsController.getFunnel);

export default router;
