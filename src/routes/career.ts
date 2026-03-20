import express, { Router } from 'express';
import * as careerController from '../controllers/careerController';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import { UserRole } from '../types';
import { createCareerScenarioSchema, updateCareerScenarioSchema, scenarioIdParamsSchema } from '../schemas';

const router: Router = express.Router();

// Все роуты защищены authMiddleware
router.use(authMiddleware);

// Получение персональных рекомендаций (для всех авторизованных пользователей)
router.get('/recommendations', careerController.getRecommendations);

// Получение одной рекомендации по ID (для просмотра)
router.get(
  '/recommendations/:id',
  validateRequest(scenarioIdParamsSchema),
  careerController.getRecommendationById
);

// CRUD для карьерных сценариев (только для ADMIN)
router.post(
  '/scenarios',
  roleMiddleware([UserRole.ADMIN]),
  validateRequest(createCareerScenarioSchema),
  careerController.createScenario
);

router.get(
  '/scenarios',
  roleMiddleware([UserRole.ADMIN]),
  careerController.getScenarios
);

router.get(
  '/scenarios/:id',
  roleMiddleware([UserRole.ADMIN]),
  validateRequest(scenarioIdParamsSchema),
  careerController.getScenarioById
);

router.put(
  '/scenarios/:id',
  roleMiddleware([UserRole.ADMIN]),
  validateRequest(updateCareerScenarioSchema),
  careerController.updateScenario
);

router.delete(
  '/scenarios/:id',
  roleMiddleware([UserRole.ADMIN]),
  validateRequest(scenarioIdParamsSchema),
  careerController.deleteScenario
);

export default router;
