import { z } from 'zod';
import { objectIdSchema } from './common.schema';
import { Direction, Level, WorkFormat } from '../types';

export const jobIdParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Массивы значений enum для валидации
const directionValues = Object.values(Direction) as [string, ...string[]];
const levelValues = Object.values(Level) as [string, ...string[]];
const workFormatValues = Object.values(WorkFormat) as [string, ...string[]];

// Схема зарплаты
const salarySchema = z.object({
  min: z.number().min(0, 'Минимальная зарплата не может быть отрицательной').optional(),
  max: z.number().min(0, 'Максимальная зарплата не может быть отрицательной').optional(),
  currency: z.enum(['USD', 'EUR', 'RUB'], {
    message: 'Валюта должна быть USD, EUR или RUB',
  }).default('USD'),
}).optional().refine((data) => {
  if (data && data.min !== undefined && data.max !== undefined) {
    return data.min <= data.max;
  }
  return true;
}, {
  message: 'Минимальная зарплата не может быть больше максимальной',
});

// Схема создания вакансии
export const createJobSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Название вакансии обязательно')
      .trim(),
    description: z
      .string()
      .min(1, 'Описание обязательно')
      .min(20, 'Описание должно содержать минимум 20 символов'),
    company: z
      .string()
      .min(1, 'Название компании обязательно')
      .trim(),
    direction: z.enum(directionValues, {
      message: `Неверное направление. Допустимые значения: ${directionValues.join(', ')}`,
    }),
    level: z.enum(levelValues, {
      message: `Неверный уровень. Допустимые значения: ${levelValues.join(', ')}`,
    }),
    workFormat: z.enum(workFormatValues, {
      message: `Неверный формат работы. Допустимые значения: ${workFormatValues.join(', ')}`,
    }),
    location: z
      .string()
      .min(1, 'Локация обязательна')
      .trim(),
    salary: salarySchema,
    requirements: z
      .array(z.string().min(1, 'Требование не может быть пустым'))
      .min(1, 'Должно быть хотя бы одно требование'),
    responsibilities: z
      .array(z.string().min(1, 'Обязанность не может быть пустой'))
      .min(1, 'Должна быть хотя бы одна обязанность'),
  }),
});

// Схема обновления вакансии
export const updateJobSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Название вакансии не может быть пустым')
      .trim()
      .optional(),
    description: z
      .string()
      .min(20, 'Описание должно содержать минимум 20 символов')
      .optional(),
    company: z
      .string()
      .min(1, 'Название компании не может быть пустым')
      .trim()
      .optional(),
    direction: z.enum(directionValues, {
      message: `Неверное направление. Допустимые значения: ${directionValues.join(', ')}`,
    }).optional(),
    level: z.enum(levelValues, {
      message: `Неверный уровень. Допустимые значения: ${levelValues.join(', ')}`,
    }).optional(),
    workFormat: z.enum(workFormatValues, {
      message: `Неверный формат работы. Допустимые значения: ${workFormatValues.join(', ')}`,
    }).optional(),
    location: z
      .string()
      .min(1, 'Локация не может быть пустой')
      .trim()
      .optional(),
    salary: salarySchema,
    requirements: z
      .array(z.string().min(1, 'Требование не может быть пустым'))
      .min(1, 'Должно быть хотя бы одно требование')
      .optional(),
    responsibilities: z
      .array(z.string().min(1, 'Обязанность не может быть пустой'))
      .min(1, 'Должна быть хотя бы одна обязанность')
      .optional(),
    isActive: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, {
    message: 'Необходимо указать хотя бы одно поле для обновления',
  }),
});

// Экспорт типов из схем
export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
