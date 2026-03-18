import { z } from 'zod';
import { objectIdSchema } from './common.schema';
import { Direction, Level, ActionType } from '../types';

export const scenarioIdParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

// Массивы значений для валидации
const directionValues = Object.values(Direction) as [string, ...string[]];
const levelValues = Object.values(Level) as [string, ...string[]];
const actionTypeValues = Object.values(ActionType) as [string, ...string[]];

// Схема для действия (action)
const careerActionSchema = z.object({
  type: z.enum(actionTypeValues, {
    message: `Тип действия должен быть одним из: ${actionTypeValues.join(', ')}`,
  }),
  title: z.string().min(3, 'Название действия должно содержать минимум 3 символа'),
  description: z.string().min(10, 'Описание действия должно содержать минимум 10 символов'),
  link: z.union([z.literal(''), z.string().url('Некорректный URL')]).optional(),
});

const stringListSchema = z
  .array(z.string().trim().min(1, 'Пустое значение недопустимо'))
  .max(50, 'Слишком много элементов')
  .optional();

// Схема для создания карьерного сценария
export const createCareerScenarioSchema = z.object({
  body: z.object({
    direction: z.enum(directionValues, {
      message: `Направление должно быть одним из: ${directionValues.join(', ')}`,
    }),
    level: z.enum(levelValues, {
      message: `Уровень должен быть одним из: ${levelValues.join(', ')}`,
    }),
    title: z.string().min(5, 'Заголовок должен содержать минимум 5 символов'),
    description: z.string().min(20, 'Описание должно содержать минимум 20 символов'),
    actions: z.array(careerActionSchema).min(1, 'Необходимо добавить хотя бы одно действие'),
    careerBranches: stringListSchema,
    transitionSkills: stringListSchema,
    sortOrder: z.number().int().min(0, 'sortOrder не может быть отрицательным').optional(),
    isActive: z.boolean().optional(),
  }),
});

// Схема для обновления карьерного сценария
export const updateCareerScenarioSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z.object({
    direction: z.enum(directionValues).optional(),
    level: z.enum(levelValues).optional(),
    title: z.string().min(5, 'Заголовок должен содержать минимум 5 символов').optional(),
    description: z.string().min(20, 'Описание должно содержать минимум 20 символов').optional(),
    actions: z.array(careerActionSchema).min(1, 'Необходимо добавить хотя бы одно действие').optional(),
    careerBranches: stringListSchema,
    transitionSkills: stringListSchema,
    sortOrder: z.number().int().min(0, 'sortOrder не может быть отрицательным').optional(),
    isActive: z.boolean().optional(),
  }),
});

// Экспорт типов
export type CreateCareerScenarioInput = z.infer<typeof createCareerScenarioSchema>;
export type UpdateCareerScenarioInput = z.infer<typeof updateCareerScenarioSchema>;
