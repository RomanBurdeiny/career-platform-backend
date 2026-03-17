import { z } from 'zod';
import { UserRole } from '../types';
import { objectIdSchema } from './common.schema';

const userRoleValues = Object.values(UserRole) as [string, ...string[]];

// Схема получения пользователей (query)
export const getUsersSchema = z.object({
  query: z.object({
    page: z.coerce
      .number()
      .int('page должен быть целым числом')
      .min(1, 'page должен быть не меньше 1')
      .optional(),
    limit: z.coerce
      .number()
      .int('limit должен быть целым числом')
      .min(1, 'limit должен быть не меньше 1')
      .max(100, 'limit не может быть больше 100')
      .optional(),
    role: z.enum(userRoleValues, {
      message: `Неверная роль. Допустимые значения: ${userRoleValues.join(', ')}`,
    }).optional(),
    search: z
      .string()
      .trim()
      .min(1, 'search не может быть пустым')
      .optional(),
  }),
});

// Схема изменения роли пользователя
export const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    role: z.enum(userRoleValues, {
      message: `Неверная роль. Допустимые значения: ${userRoleValues.join(', ')}`,
    }),
  }),
});

// Схема блокировки/разблокировки пользователя
export const updateUserBlockSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    blocked: z.boolean(),
  }),
});

// Схема soft delete пользователя
export const deleteUserSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Схема изменения подписки пользователя (ADMIN)
export const updateUserSubscriptionSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    isSubscribed: z.boolean(),
  }),
});

export type GetUsersInput = z.infer<typeof getUsersSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserBlockInput = z.infer<typeof updateUserBlockSchema>;
export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
export type UpdateUserSubscriptionInput = z.infer<typeof updateUserSubscriptionSchema>;
