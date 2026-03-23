import { z } from 'zod';

// Общие переиспользуемые схемы

// Email (тексты согласованы с cp-frontend locales ru/auth validation)
export const emailSchema = z
  .string()
  .min(1, 'Укажите email')
  .email('Введите корректный адрес почты (например, name@example.com)')
  .transform((val) => val.toLowerCase().trim());

// Пароль: как на фронте — 8+, латиница, строчная, заглавная, цифра
export const passwordSchema = z
  .string()
  .min(1, 'Введите пароль')
  .min(8, 'Пароль должен быть не короче 8 символов')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Пароль должен включать строчные и заглавные буквы латиницы и хотя бы одну цифру'
  );

// MongoDB ObjectId валидация
export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Некорректный ID');

// Refresh Token валидация
export const refreshTokenSchema = z
  .string()
  .min(1, 'Refresh token обязателен');
