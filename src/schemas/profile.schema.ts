import { z } from 'zod';
import { Direction, Level, CareerGoal } from '../types';

// Массивы значений enum для валидации
const directionValues = Object.values(Direction) as [string, ...string[]];
const levelValues = Object.values(Level) as [string, ...string[]];
const careerGoalValues = Object.values(CareerGoal) as [string, ...string[]];

// Схема создания профиля
export const createProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Имя обязательно')
      .trim(),
    avatar: z
      .union([
        z.string().url('Неверный формат URL'),
        z.string().regex(/^\/avatars\/.+/, 'Неверный формат пути аватара'),
      ])
      .optional()
      .nullable(),
    direction: z.enum(directionValues, {
      message: `Неверное направление. Допустимые значения: ${directionValues.join(', ')}`,
    }),
    level: z.enum(levelValues, {
      message: `Неверный уровень. Допустимые значения: ${levelValues.join(', ')}`,
    }),
    skills: z
      .array(z.string())
      .min(1, 'Должен быть хотя бы один навык')
      .refine(skills => skills.every(skill => skill.trim().length > 0), {
        message: 'Все навыки должны быть непустыми строками',
      }),
    experience: z
      .string()
      .min(1, 'Опыт обязателен'),
    careerGoal: z.enum(careerGoalValues, {
      message: `Неверная карьерная цель. Допустимые значения: ${careerGoalValues.join(', ')}`,
    }),
  }),
});

// Схема обновления профиля (все поля опциональны)
export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Имя не может быть пустым')
      .trim()
      .optional(),
    avatar: z
      .union([
        z.string().url('Неверный формат URL'),
        z.string().regex(/^\/avatars\/.+/, 'Неверный формат пути аватара'),
      ])
      .optional()
      .nullable(),
    direction: z.enum(directionValues, {
      message: `Неверное направление. Допустимые значения: ${directionValues.join(', ')}`,
    }).optional(),
    level: z.enum(levelValues, {
      message: `Неверный уровень. Допустимые значения: ${levelValues.join(', ')}`,
    }).optional(),
    skills: z
      .array(z.string())
      .min(1, 'Должен быть хотя бы один навык')
      .refine(skills => skills.every(skill => skill.trim().length > 0), {
        message: 'Все навыки должны быть непустыми строками',
      })
      .optional(),
    experience: z
      .string()
      .min(1, 'Опыт не может быть пустым')
      .optional(),
    careerGoal: z.enum(careerGoalValues, {
      message: `Неверная карьерная цель. Допустимые значения: ${careerGoalValues.join(', ')}`,
    }).optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Необходимо указать хотя бы одно поле для обновления',
  }),
});

// Схема замены аватарки (только avatar, обязательный URL)
export const updateAvatarSchema = z.object({
  body: z.object({
    avatar: z
      .union([
        z.string().url('Неверный формат URL'),
        z.string().regex(/^\/avatars\/.+/, 'Неверный формат пути аватара'),
      ]),
  }),
});

// Экспорт типов из схем
export type CreateProfileInput = z.infer<typeof createProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
