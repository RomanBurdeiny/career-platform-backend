import CareerTrigger from '../models/CareerTrigger';
import { IProfile } from '../types';
import { CareerGoal, EmploymentType, Level } from '../types/profileEnums';
import {
  CareerTriggerSpecialCase,
  ICareerTrigger,
  CareerTriggerMatchReason,
} from '../types/careerTrigger';

export type ResolvedCareerTrigger = {
  doc: ICareerTrigger;
  matchReason: CareerTriggerMatchReason;
};

async function findActiveSpecialTrigger(
  specialCase: CareerTriggerSpecialCase
): Promise<ICareerTrigger | null> {
  return CareerTrigger.findOne({ isActive: true, specialCase }).sort({ sortOrder: 1 });
}

/**
 * Приоритет условий (ТЗ блок 2): переквалификация по занятости → смена карьеры → грейд+стаж.
 */
export async function resolveCareerTrigger(
  profile: IProfile,
  yearsInCurrentRole: number | null
): Promise<ResolvedCareerTrigger | null> {
  if (profile.employmentType === EmploymentType.RESKILLING) {
    const doc = await findActiveSpecialTrigger(CareerTriggerSpecialCase.RESKILLING_TRACK_40);
    if (doc) return { doc, matchReason: 'reskilling_employment' };
  }

  if (profile.careerGoal === CareerGoal.CAREER_CHANGE) {
    const doc = await findActiveSpecialTrigger(CareerTriggerSpecialCase.CAREER_CHANGE_RETRAINING);
    if (doc) return { doc, matchReason: 'career_change_goal' };
  }

  if (yearsInCurrentRole == null || Number.isNaN(yearsInCurrentRole)) {
    return null;
  }

  const level = profile.level;
  if (level === Level.LEAD) {
    return null;
  }

  const dir = profile.direction;
  const doc = await CareerTrigger.findOne({
    isActive: true,
    specialCase: { $exists: false },
    currentLevel: level,
    minYears: { $lte: yearsInCurrentRole },
    $or: [{ direction: null }, { direction: dir }],
  }).sort({ minYears: -1, sortOrder: 1 });

  if (!doc) {
    return null;
  }
  return { doc, matchReason: 'level_and_tenure' };
}
