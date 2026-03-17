import express, { Router } from 'express';
import * as inviteController from '../controllers/inviteController';
import { validateRequest } from '../middleware/validateRequest';
import { validateInviteParamsSchema } from '../schemas';

const router: Router = express.Router();

// GET /api/invites/:code - Публичная валидация invite (без авторизации)
router.get('/:code', validateRequest(validateInviteParamsSchema), inviteController.validateInvite);

export default router;
