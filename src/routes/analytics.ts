import express, { Router } from 'express';
import optionalAuthMiddleware from '../middleware/optionalAuthMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import * as analyticsController from '../controllers/analyticsController';
import { trackEventSchema } from '../schemas';

const router: Router = express.Router();

router.use(optionalAuthMiddleware);

router.post('/events', validateRequest(trackEventSchema), analyticsController.trackEvent);

export default router;
