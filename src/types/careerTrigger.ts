import { Document } from 'mongoose';
import { Direction, Level } from './profileEnums';

/** ТЗ блок 2 — триггер «Пора расти»: коллекция career_triggers, GET /api/career/trigger, ctaType + nextSteps. */

/**
 * FRONTEND / API: тип основной кнопки (CTA) на карточке триггера.
 * Значения совпадают с полем ctaType в БД — используйте для маршрутизации действий.
 */
export enum CareerTriggerCta {
  CONSULTATION = 'consultation',
  ROADMAP = 'roadmap',
  COURSES = 'courses',
}

/**
 * FRONTEND: спец-условия, которые матчятся без пары «грейд + стаж».
 * Обычные триггеры в ответе API не содержат specialCase (см. сериализацию).
 */
export enum CareerTriggerSpecialCase {
  /** Карьерная цель «Смена карьеры» → трек переквалификации */
  CAREER_CHANGE_RETRAINING = 'career_change_retraining',
  /** Тип занятости «Переквалификация» → активация трека 40+ */
  RESKILLING_TRACK_40 = 'reskilling_track_40',
}

/**
 * FRONTEND: структура одного шага в массиве nextSteps.
 * Ожидается ровно 3 элемента — три возможных ветки «что дальше».
 *
 * Пример элемента:
 * { "title": "Углубиться в текущем стеке", "description": "..." }
 *
 * Поля:
 * - title (string, обязательно) — заголовок ветки;
 * - description (string, опционально) — короткий текст под заголовком.
 */
export interface CareerTriggerNextStep {
  title: string;
  description?: string;
}

export interface ICareerTrigger extends Document {
  /** Направление; null — триггер для любого направления */
  direction: Direction | null;
  /**
   * Текущий грейд пользователя (Junior / Middle / Senior).
   * Для спец-триггеров (specialCase) обычно null.
   */
  currentLevel: Level | null;
  /**
   * Минимальный стаж в текущей роли (лет), при котором показывается карточка.
   * Сравнение: yearsInCurrentRole >= minYears. Для спец-триггеров — null.
   */
  minYears: number | null;
  triggerTitle: string;
  triggerDescription: string;
  /**
   * FRONTEND: JSON-массив из ровно 3 объектов CareerTriggerNextStep (см. JSDoc выше).
   */
  nextSteps: CareerTriggerNextStep[];
  ctaType: CareerTriggerCta;
  specialCase?: CareerTriggerSpecialCase;
  isActive: boolean;
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Как было сопоставлено правило (удобно для аналитики на фронте) */
export type CareerTriggerMatchReason =
  | 'reskilling_employment'
  | 'career_change_goal'
  | 'level_and_tenure';

/**
 * FRONTEND: тело ответа GET /api/career/trigger при trigger !== null.
 *
 * - primaryCta — то же значение, что ctaType в документе (главный акцент по ТЗ).
 * - ctaButtons — все три типа действий; рендерите кнопки по массиву или фильтруйте по UX.
 */
export type CareerTriggerCardDto = {
  id: string;
  triggerTitle: string;
  triggerDescription: string;
  nextSteps: CareerTriggerNextStep[];
  primaryCta: CareerTriggerCta;
  ctaButtons: Array<{
    type: CareerTriggerCta;
    /** Подпись по умолчанию (RU); для EN подставьте свои строки по type */
    label: string;
  }>;
  matchReason: CareerTriggerMatchReason;
};
