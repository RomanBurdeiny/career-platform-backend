import { z } from 'zod';
import { objectIdSchema } from './common.schema';
import { Direction, Level, ActionType, RoadmapBranchType } from '../types';

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

const branchTypeValues = Object.values(RoadmapBranchType) as [string, ...string[]];

const skillsToDevelopSchema = z
  .array(z.string().trim().min(1, 'Пустой навык недопустим'))
  .min(1, 'Нужен хотя бы один навык в skillsToDevelop')
  .max(100);

const roadmapCareerBranchesSchema = z
  .array(z.string().trim().min(1))
  .max(50)
  .optional();

export const roadmapIdParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const createCareerRoadmapSchema = z.object({
  body: z
    .object({
      direction: z.enum(directionValues, {
        message: `Направление должно быть одним из: ${directionValues.join(', ')}`,
      }),
      fromLevel: z.enum(levelValues, {
        message: `Уровень должен быть одним из: ${levelValues.join(', ')}`,
      }),
      toLevel: z.enum(levelValues, {
        message: `Целевой уровень должен быть одним из: ${levelValues.join(', ')}`,
      }),
      toRole: z.string().min(1).max(255),
      skillsToDevelop: skillsToDevelopSchema,
      estimatedTimeMonths: z.number().int().min(1),
      estimatedTimeMonthsMax: z.number().int().min(1).optional().nullable(),
      branchType: z.enum(branchTypeValues, {
        message: `branchType: ${branchTypeValues.join(', ')}`,
      }),
      careerBranches: roadmapCareerBranchesSchema,
      sortOrder: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    })
    .refine(
      (b) => b.estimatedTimeMonthsMax == null || b.estimatedTimeMonthsMax >= b.estimatedTimeMonths,
      { message: 'estimatedTimeMonthsMax должен быть ≥ estimatedTimeMonths', path: ['estimatedTimeMonthsMax'] }
    ),
});

export const updateCareerRoadmapSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      direction: z.enum(directionValues).optional(),
      fromLevel: z.enum(levelValues).optional(),
      toLevel: z.enum(levelValues).optional(),
      toRole: z.string().min(1).max(255).optional(),
      skillsToDevelop: skillsToDevelopSchema.optional(),
      estimatedTimeMonths: z.number().int().min(1).optional(),
      estimatedTimeMonthsMax: z.number().int().min(1).optional().nullable(),
      branchType: z.enum(branchTypeValues).optional(),
      careerBranches: roadmapCareerBranchesSchema,
      sortOrder: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Укажите хотя бы одно поле' })
    .refine(
      (b) =>
        b.estimatedTimeMonthsMax == null ||
        b.estimatedTimeMonths == null ||
        b.estimatedTimeMonthsMax >= b.estimatedTimeMonths,
      { message: 'estimatedTimeMonthsMax должен быть ≥ estimatedTimeMonths', path: ['estimatedTimeMonthsMax'] }
    ),
});

const learningTagsSchema = z
  .array(z.string().trim().min(1, 'Пустой тег недопустим'))
  .min(1, 'Нужен хотя бы один тег')
  .max(50);

export const learningResourceIdParamsSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
});

export const createLearningResourceSchema = z.object({
  body: z.object({
    title: z.string().min(1).trim(),
    description: z.string().trim().optional().nullable(),
    url: z.union([z.literal(''), z.string().url()]).optional().nullable(),
    tags: learningTagsSchema,
    sortOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateLearningResourceSchema = z.object({
  params: z.object({
    id: objectIdSchema,
  }),
  body: z
    .object({
      title: z.string().min(1).trim().optional(),
      description: z.string().trim().optional().nullable(),
      url: z.union([z.literal(''), z.string().url()]).optional().nullable(),
      tags: learningTagsSchema.optional(),
      sortOrder: z.number().int().min(0).optional(),
      isActive: z.boolean().optional(),
    })
    .refine((b) => Object.keys(b).length > 0, { message: 'Укажите хотя бы одно поле' }),
});
