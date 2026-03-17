import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import * as inviteController from '../controllers/inviteController';
import { UserRole } from '../types';
import {
  createInviteSchema,
  deactivateInviteParamsSchema,
} from '../schemas';

const router: Router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware([UserRole.ADMIN]));

// POST /api/admin/invites
router.post('/', validateRequest(createInviteSchema), inviteController.createInvite);

// GET /api/admin/invites
router.get('/', inviteController.listInvites);

// PATCH /api/admin/invites/:id/deactivate
router.patch(
  '/:id/deactivate',
  validateRequest(deactivateInviteParamsSchema),
  inviteController.deactivateInvite
);

export default router;
