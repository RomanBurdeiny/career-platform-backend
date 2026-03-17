import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import * as usersController from '../controllers/usersController';
import { validateRequest } from '../middleware/validateRequest';
import { UserRole } from '../types';
import {
  getUsersSchema,
  updateUserRoleSchema,
  updateUserBlockSchema,
  updateUserSubscriptionSchema,
  deleteUserSchema,
} from '../schemas';

const router: Router = express.Router();

// Все роуты users доступны только ADMIN
router.use(authMiddleware);
router.use(roleMiddleware([UserRole.ADMIN]));

// GET /api/users - Получение пользователей (пагинация, фильтры, поиск)
router.get('/', validateRequest(getUsersSchema), usersController.getUsers);

// PATCH /api/users/:id/role - Изменение роли пользователя
router.patch('/:id/role', validateRequest(updateUserRoleSchema), usersController.updateUserRole);

// PATCH /api/users/:id/block - Блокировка/разблокировка пользователя
router.patch('/:id/block', validateRequest(updateUserBlockSchema), usersController.updateUserBlock);

// PATCH /api/users/:id/subscription - Включение/выключение подписки (для тестирования)
router.patch('/:id/subscription', validateRequest(updateUserSubscriptionSchema), usersController.updateUserSubscription);

// DELETE /api/users/:id - Soft delete пользователя
router.delete('/:id', validateRequest(deleteUserSchema), usersController.deleteUser);

export default router;
