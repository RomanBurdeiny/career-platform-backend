import { z } from 'zod';
import { objectIdSchema } from './common.schema';
import { UserRole } from '../types/auth';

const accessTypeSchema = z.enum(['INVITE_ONLY', 'TRIAL']);
const roleSchema = z.enum([UserRole.SPECIALIST, UserRole.ADMIN]);

export const createInviteSchema = z.object({
  body: z.object({
    role: roleSchema,
    accessType: accessTypeSchema.default('INVITE_ONLY'),
    maxUses: z.number().int().min(1).default(1),
    expiresAt: z
      .union([z.string(), z.date()])
      .nullable()
      .optional(),
  }),
});

export const validateInviteParamsSchema = z.object({
  params: z.object({
    code: z.string().min(1, 'Код приглашения обязателен').max(32).trim(),
  }),
});

export const deactivateInviteParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type DeactivateInviteParamsInput = z.infer<typeof deactivateInviteParamsSchema>;
