import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { UserRole } from '../types';
import * as adminRecommendationsController from '../controllers/adminRecommendationsController';
import {
  adminRecommendationIdParamsSchema,
  createAdminRecommendationSchema,
  updateAdminRecommendationSchema,
} from '../schemas';

const router: Router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([UserRole.ADMIN]));

// GET /api/admin/recommendations
router.get('/', adminRecommendationsController.listRecommendations);

// GET /api/admin/recommendations/:id
router.get(
  '/:id',
  validateRequest(adminRecommendationIdParamsSchema),
  adminRecommendationsController.getRecommendationById
);

// POST /api/admin/recommendations
router.post(
  '/',
  validateRequest(createAdminRecommendationSchema),
  adminRecommendationsController.createRecommendation
);

// PATCH /api/admin/recommendations/:id
router.patch(
  '/:id',
  validateRequest(updateAdminRecommendationSchema),
  adminRecommendationsController.updateRecommendation
);

// DELETE /api/admin/recommendations/:id
router.delete(
  '/:id',
  validateRequest(adminRecommendationIdParamsSchema),
  adminRecommendationsController.deleteRecommendation
);

export default router;

