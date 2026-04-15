import { mapLearningResourcesBySkillTags, LeanLearningResource } from './matchLearningResourcesForRoadmap';
import {
  CareerRoadmapWithResourcesDto,
  RoadmapBranchType,
} from '../types/careerRoadmap';
import { Direction, Level } from '../types/profileEnums';

/** Поля карты, нужные для пользовательского ответа (без зависимости от HydratedDocument). */
export type RoadmapDocShape = {
  _id: unknown;
  direction: Direction;
  fromLevel: Level;
  toLevel: Level;
  toRole: string;
  skillsToDevelop: string[];
  estimatedTimeMonths: number;
  estimatedTimeMonthsMax?: number | null;
  branchType: RoadmapBranchType;
  careerBranches?: string[] | null;
};

/**
 * Собирает DTO для GET /api/career/roadmap: одна загрузка пула ресурсов, матчинг по тегам для каждой карты.
 */
export function buildCareerRoadmapDtos(
  roadmaps: RoadmapDocShape[],
  resourcePool: LeanLearningResource[]
): CareerRoadmapWithResourcesDto[] {
  return roadmaps.map((rm) => ({
    id: String(rm._id),
    direction: rm.direction,
    fromLevel: rm.fromLevel,
    toLevel: rm.toLevel,
    toRole: rm.toRole,
    skillsToDevelop: rm.skillsToDevelop,
    estimatedTimeMonths: rm.estimatedTimeMonths,
    estimatedTimeMonthsMax: rm.estimatedTimeMonthsMax ?? null,
    branchType: rm.branchType,
    careerBranches: rm.careerBranches ?? [],
    learningResources: mapLearningResourcesBySkillTags(rm.skillsToDevelop, resourcePool),
  }));
}
