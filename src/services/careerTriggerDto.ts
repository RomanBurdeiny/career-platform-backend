import { ICareerTrigger, CareerTriggerCta, CareerTriggerCardDto } from '../types/careerTrigger';

/**
 * FRONTEND: фиксированный набор CTA на карточке «Пора расти».
 * Рендерите три кнопки; primaryCta в ответе указывает акцент по ТЗ (поле ctaType в БД).
 * Для локализации EN подставьте свои строки, ключ — значение type.
 */
const CTA_BUTTONS_RU: Array<{ type: CareerTriggerCta; label: string }> = [
  {
    type: CareerTriggerCta.CONSULTATION,
    label: 'Записаться на карьерную консультацию',
  },
  {
    type: CareerTriggerCta.ROADMAP,
    label: 'Посмотреть карту развития',
  },
  {
    type: CareerTriggerCta.COURSES,
    label: 'Посмотреть курсы для перехода',
  },
];

/** Собирает DTO карточки для GET /api/career/trigger */
export function toCareerTriggerCardDto(
  doc: ICareerTrigger,
  matchReason: CareerTriggerCardDto['matchReason']
): CareerTriggerCardDto {
  // FRONTEND: nextSteps — всегда 3 элемента { title, description? }; порядок = варианты веток, не ранжирование.
  return {
    id: String(doc._id),
    triggerTitle: doc.triggerTitle,
    triggerDescription: doc.triggerDescription,
    nextSteps: doc.nextSteps,
    primaryCta: doc.ctaType,
    ctaButtons: CTA_BUTTONS_RU.map((b) => ({ ...b })),
    matchReason,
  };
}
