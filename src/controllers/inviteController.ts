import { Request, Response } from 'express';
import crypto from 'crypto';
import Invite from '../models/Invite';
import InviteUsage from '../models/InviteUsage';
import { AuthRequest } from '../types';
import { getErrorMessage } from '../utils/errorHandlers';
import type { AccessType } from '../types/invite';
import { UserRole } from '../types/auth';

function generateInviteCode(): string {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

function isInviteValid(invite: InstanceType<typeof Invite>): boolean {
  if (!invite.isActive) return false;
  if (invite.usedCount >= invite.maxUses) return false;
  if (invite.expiresAt && new Date(invite.expiresAt) <= new Date()) return false;
  return true;
}

/** GET /api/invites/:code - Публичная валидация invite */
export const validateInvite = async (
  req: Request<{ code: string }>,
  res: Response
): Promise<void> => {
  try {
    const code = req.params.code?.toUpperCase().trim();
    if (!code) {
      res.status(400).json({ valid: false, error: 'Код приглашения не указан' });
      return;
    }

    const invite = await Invite.findOne({ code });
    if (!invite) {
      res.status(404).json({ valid: false, error: 'Приглашение не найдено' });
      return;
    }

    const valid = isInviteValid(invite);
    if (!valid) {
      res.status(400).json({
        valid: false,
        error: 'Приглашение недействительно или истекло',
      });
      return;
    }

    res.status(200).json({
      valid: true,
      role: invite.role,
      accessType: invite.accessType as AccessType,
      expiresAt: invite.expiresAt ? invite.expiresAt.toISOString().split('T')[0] : null,
    });
  } catch (error: unknown) {
    res.status(500).json({ valid: false, error: getErrorMessage(error) });
  }
};

interface CreateInviteBody {
  role: UserRole;
  accessType: AccessType;
  maxUses: number;
  expiresAt?: Date | string | null;
}

/** POST /api/admin/invites - Создание invite (только ADMIN) */
export const createInvite = async (
  req: AuthRequest<Record<string, never>, unknown, CreateInviteBody>,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Не авторизован' });
      return;
    }

    const { role, accessType, maxUses, expiresAt: expiresAtRaw } = req.body;
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

    let code = generateInviteCode();
    let exists = await Invite.exists({ code });
    let attempts = 0;
    while (exists && attempts < 10) {
      code = generateInviteCode();
      exists = await Invite.exists({ code });
      attempts++;
    }
    if (exists) {
      res.status(500).json({ error: 'Не удалось сгенерировать уникальный код' });
      return;
    }

    const invite = await Invite.create({
      code,
      createdBy: userId,
      role,
      accessType: accessType ?? 'INVITE_ONLY',
      maxUses: maxUses ?? 1,
      expiresAt: expiresAt ?? null,
    });

    const baseUrl = process.env.CLIENT_URL || process.env.APP_URL || 'https://app.com';
    const link = `${baseUrl.replace(/\/$/, '')}/register?invite=${code}`;

    res.status(201).json({ code, link });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

/** GET /api/admin/invites - Список invite (только ADMIN). По умолчанию только активные. */
export const listInvites = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const filter = includeInactive ? {} : { isActive: true };

    const invites = await Invite.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'email')
      .lean();

    const result = invites.map((inv) => ({
      id: inv._id,
      code: inv.code,
      createdBy: inv.createdBy,
      role: inv.role,
      accessType: inv.accessType,
      maxUses: inv.maxUses,
      usedCount: inv.usedCount,
      expiresAt: inv.expiresAt,
      isActive: inv.isActive,
      createdAt: inv.createdAt,
    }));

    res.status(200).json(result);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

/** PATCH /api/admin/invites/:id/deactivate - Деактивация invite */
export const deactivateInvite = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const invite = await Invite.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!invite) {
      res.status(404).json({ error: 'Приглашение не найдено' });
      return;
    }

    res.status(200).json({
      id: invite._id,
      isActive: invite.isActive,
      message: 'Приглашение деактивировано',
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
