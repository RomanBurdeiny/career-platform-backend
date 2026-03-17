import express, { Router } from 'express';
import * as authController from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import {
  registerSchema,
  loginSchema,
  googleAuthSchema,
  telegramAuthSchema,
} from '../schemas';
import { authRateLimiter } from '../middleware/rateLimiter';

const router: Router = express.Router();

// Применяем строгий rate limiter ко всем auth эндпоинтам (защита от brute force)
router.use(authRateLimiter);

// POST /api/auth/register - Регистрация (email + пароль)
router.post('/register', validateRequest(registerSchema), authController.register);

// POST /api/auth/login - Вход по email + пароль
router.post('/login', validateRequest(loginSchema), authController.login);

// POST /api/auth/google - Вход через Google (id_token от Google Sign-In)
router.post('/google', validateRequest(googleAuthSchema), authController.googleAuth);

// POST /api/auth/telegram - Вход через Telegram (данные от Telegram Login Widget)
router.post('/telegram', validateRequest(telegramAuthSchema), authController.telegramAuth);

// POST /api/auth/refresh - Обновление access token через refresh token (читает из cookie)
router.post('/refresh', authController.refresh);

// POST /api/auth/logout - Выход из системы (удаляет refresh token и cookie)
router.post('/logout', authController.logout);

export default router;
