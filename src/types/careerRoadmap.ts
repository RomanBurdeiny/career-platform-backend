import { Document } from 'mongoose';
import { Direction, Level } from './profileEnums';

/**
 * ТЗ блок 3 — карта развития: career_roadmaps + learning_resources; подбор ресурсов по пересечению
 * skillsToDevelop с tags (нормализация в utils/skillTagNormalize). GET /api/career/roadmap.
 */

/**
 * FRONTEND / API: тип ветки карты развития (как расти к следующей роли).
 * Используйте для иконок, фильтров или вкладок на UI.
 */
export enum RoadmapBranchType {
  TECHNICAL = 'technical',
  MANAGEMENT = 'management',
  ENTREPRENEURSHIP = 'entrepreneurship',
}

/**
 * FRONTEND: карта развития для пары direction + fromLevel.
 *
 * skillsToDevelop — массив строк-навыков; каждая строка одновременно является «тегом»
 * для подбора материалов из learning_resources (см. GET /api/career/roadmap).
 * Сравнение тегов на бэке: trim + lower case + схлопывание пробелов (см. сервис матчинга).
 *
 * Пример элемента: "UX Research", "Design Systems", "Figma Advanced"
 */
export interface ICareerRoadmap extends Document {
  direction: Direction;
  /** Текущий грейд пользователя (точка «А» на карте) */
  fromLevel: Level;
  /** Целевой грейд (точка «Б») */
  toLevel: Level;
  /** Конкретное название роли на выходе (например, Senior Designer) */
  toRole: string;
  /** Навыки к освоению; же теги для связи с обучающими ресурсами */
  skillsToDevelop: string[];
  /**
   * Оценка срока в месяцах по ТЗ (одно число).
   * Если задано estimatedTimeMonthsMax — фронт может показать диапазон «min–max мес.» (как в примере 12–18).
   */
  estimatedTimeMonths: number;
  estimatedTimeMonthsMax?: number | null;
  branchType: RoadmapBranchType;
  /**
   * FRONTEND: опционально — ветки карьеры после целевой роли (пример: Art Director / Product Designer / UX Lead).
   * Может быть пустым массивом, если в админке не заполняли.
   */
  careerBranches: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * FRONTEND: обучающий ресурс. Поле tags должно пересекаться с skillsToDevelop карты,
 * чтобы ресурс попал в ответ GET /api/career/roadmap (подбор по тегам навыков).
 */
export interface ILearningResource extends Document {
  title: string;
  description?: string | null;
  url?: string | null;
  /** Теги для матчинга с навыками карты (например "ux research", "figma") */
  tags: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** DTO ресурса в ответе пользователю рядом с картой */
export type LearningResourceRoadmapDto = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  tags: string[];
  /**
   * FRONTEND: какие навыки из skillsToDevelop этой карты совпали с тегами ресурса
   * (после нормализации). Удобно подсветить связь «навык → материал».
   */
  matchedSkills: string[];
};

export type CareerRoadmapWithResourcesDto = {
  id: string;
  direction: Direction;
  fromLevel: Level;
  toLevel: Level;
  toRole: string;
  skillsToDevelop: string[];
  estimatedTimeMonths: number;
  estimatedTimeMonthsMax: number | null;
  branchType: RoadmapBranchType;
  careerBranches: string[];
  learningResources: LearningResourceRoadmapDto[];
};
