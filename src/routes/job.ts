import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import * as jobController from '../controllers/jobController';
import * as favoriteController from '../controllers/favoriteController';
import { validateRequest } from '../middleware/validateRequest';
import { createJobSchema, updateJobSchema, jobIdParamsSchema } from '../schemas';
import { UserRole } from '../types';

const router: Router = express.Router();

// Все роуты требуют авторизации
router.use(authMiddleware);

// GET /api/jobs/favorites - Получение избранных вакансий (должен быть ПЕРЕД /:id)
router.get('/favorites', favoriteController.getFavorites);

// GET /api/jobs - Получение списка вакансий (доступно всем авторизованным)
router.get('/', jobController.getJobs);

// GET /api/jobs/:id - Получение одной вакансии (доступно всем авторизованным)
router.get('/:id', validateRequest(jobIdParamsSchema), jobController.getJobById);

// POST /api/jobs/:id/favorite - Добавить вакансию в избранное
router.post('/:id/favorite', validateRequest(jobIdParamsSchema), favoriteController.addToFavorites);

// DELETE /api/jobs/:id/favorite - Удалить вакансию из избранного
router.delete('/:id/favorite', validateRequest(jobIdParamsSchema), favoriteController.removeFromFavorites);

// POST /api/jobs - Создание вакансии (только ADMIN)
router.post(
  '/',
  roleMiddleware([UserRole.ADMIN]),
  validateRequest(createJobSchema),
  jobController.createJob
);

// PUT /api/jobs/:id - Обновление вакансии (только ADMIN)
router.put(
  '/:id',
  roleMiddleware([UserRole.ADMIN]),
  validateRequest(updateJobSchema),
  jobController.updateJob
);

// DELETE /api/jobs/:id - Деактивация вакансии (только ADMIN)
router.delete(
  '/:id',
  roleMiddleware([UserRole.ADMIN]),
  validateRequest(jobIdParamsSchema),
  jobController.deleteJob
);

export default router;
