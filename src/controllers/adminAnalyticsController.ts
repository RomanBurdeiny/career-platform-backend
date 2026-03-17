import { Response } from 'express';
import AnalyticsEvent from '../models/AnalyticsEvent';
import User from '../models/User';
import Invite from '../models/Invite';
import InviteUsage from '../models/InviteUsage';
import Profile from '../models/Profile';
import { AuthRequest } from '../types';
import { getErrorMessage } from '../utils/errorHandlers';

/** GET /api/admin/analytics/summary */
export const getSummary = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [usersTotal, invitesCreated, invitesActive, invitesActivated, profilesCompleted, jobsViewed] =
      await Promise.all([
        User.countDocuments({ isDeleted: false }),
        Invite.countDocuments(),
        Invite.countDocuments({ isActive: true }),
        InviteUsage.countDocuments(),
        Profile.countDocuments(),
        AnalyticsEvent.countDocuments({ eventName: 'job_viewed' }),
      ]);

    res.status(200).json({
      usersTotal,
      invitesCreated,
      invitesActive,
      invitesActivated,
      profilesCompleted,
      jobsViewed,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

/** GET /api/admin/analytics/funnel */
export const getFunnel = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const [invitesCreated, invitesOpened, registrationsCompleted, profilesCompleted] =
      await Promise.all([
        Invite.countDocuments(),
        AnalyticsEvent.countDocuments({ eventName: 'invite_opened' }),
        InviteUsage.countDocuments(),
        Profile.countDocuments(),
      ]);

    res.status(200).json({
      invitesCreated,
      invitesOpened,
      registrationsCompleted,
      profilesCompleted,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
