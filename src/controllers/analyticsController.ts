import { Response } from 'express';
import AnalyticsEvent from '../models/AnalyticsEvent';
import { AuthRequest } from '../types';
import { getErrorMessage } from '../utils/errorHandlers';

interface TrackEventBody {
  eventName: string;
  entityType?: string | null;
  entityId?: string | null;
  properties?: Record<string, unknown>;
}

/** POST /api/analytics/events — трекинг события (опциональная авторизация) */
export const trackEvent = async (
  req: AuthRequest<Record<string, never>, unknown, TrackEventBody>,
  res: Response
): Promise<void> => {
  try {
    const { eventName, entityType = null, entityId = null, properties = {} } = req.body;
    const userId = req.user?.userId ?? null;

    await AnalyticsEvent.create({
      userId,
      eventName,
      entityType,
      entityId,
      properties,
    });

    res.status(201).json({ ok: true });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
