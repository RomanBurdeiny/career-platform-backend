import { z } from 'zod';

// Общие переиспользуемые схемы

// Email валидация
export const emailSchema = z
  .string()
  .min(1, 'Email обязателен')
  .email('Неверный формат email')
  .transform(val => val.toLowerCase().trim());

// Password валидация (минимум 8 символов, заглавная буква, цифра)
export const passwordSchema = z
  .string()
  .min(1, 'Пароль обязателен')
  .min(8, 'Пароль должен содержать минимум 8 символов')
  .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
  .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру');

// MongoDB ObjectId валидация
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Некорректный ID');

// Refresh Token валидация
export const refreshTokenSchema = z
  .string()
  .min(1, 'Refresh token обязателен');
