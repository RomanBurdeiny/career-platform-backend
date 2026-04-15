import { Response } from 'express';
import { AuthRequest, Direction, Level, RoadmapBranchType } from '../types';
import CareerScenario from '../models/CareerScenario';
import CareerRoadmap from '../models/CareerRoadmap';
import LearningResource from '../models/LearningResource';
import Profile from '../models/Profile';
import { getErrorMessage } from '../utils/errorHandlers';
import { computeYearsInCurrentRole } from '../utils/profileYears';
import { resolveCareerTrigger } from '../services/careerTriggerResolve';
import { toCareerTriggerCardDto } from '../services/careerTriggerDto';
import { loadActiveLearningResourcesLean } from '../services/matchLearningResourcesForRoadmap';
import { buildCareerRoadmapDtos } from '../services/careerRoadmapDto';

/**
 * GET /api/career/roadmap
 *
 * FRONTEND:
 * - Подбор карт по текущему профилю: profileContext.direction + profileContext.fromLevel (грейд из профиля).
 * - roadmaps — массив вариантов (например, разные branchType: technical / management / entrepreneurship).
 *   Если пусто — для этой пары направление+грейд карт в БД нет.
 * - У каждой карты: skillsToDevelop — навыки «точки А→Б»; learningResources подобраны по пересечению тегов
 *   ресурсов с этими навыками (normalize: trim, lower case, один пробел между словами).
 * - matchedSkills у ресурса — какие строки из skillsToDevelop совпали; показывайте связку навык→материал.
 * - estimatedTimeMonths + estimatedTimeMonthsMax: если max null — отображайте одно число месяцев; иначе диапазон.
 * - branchType и careerBranches: ветвление после целевой роли (careerBranches может быть []).
 */
export const getCareerRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Необходима авторизация' });
      return;
    }

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(400).json({
        error: 'Профиль не найден. Создайте профиль, чтобы видеть карту развития',
      });
      return;
    }

    const roadmaps = await CareerRoadmap.find({
      direction: profile.direction,
      fromLevel: profile.level,
      isActive: true,
    }).sort({ sortOrder: 1, createdAt: 1 });

    const resourcePool = await loadActiveLearningResourcesLean();
    const roadmapsDto = buildCareerRoadmapDtos(roadmaps, resourcePool);

    res.status(200).json({
      profileContext: {
        direction: profile.direction,
        fromLevel: profile.level,
      },
      roadmaps: roadmapsDto,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

/**
 * GET /api/career/trigger
 *
 * FRONTEND:
 * - При успехе: 200 и поля yearsInCurrentRole, trigger.
 * - Если trigger === null — карточку «Пора расти» не показывать (нет подходящего правила:
 *   нет даты careerStartDate для грейдовых триггеров, грейд Lead, или стаж ниже порогов).
 * - Если trigger !== null — используйте triggerTitle, triggerDescription, nextSteps (3 пункта),
 *   ctaButtons (3 кнопки), primaryCta — какой CTA подсветить в первую очередь.
 */
export const getCareerTrigger = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Необходима авторизация' });
      return;
    }

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(400).json({
        error: 'Профиль не найден. Создайте профиль, чтобы получать карьерные триггеры',
      });
      return;
    }

    const yearsInCurrentRole = computeYearsInCurrentRole(profile.careerStartDate);
    const resolved = await resolveCareerTrigger(profile, yearsInCurrentRole);

    res.status(200).json({
      yearsInCurrentRole,
      trigger: resolved ? toCareerTriggerCardDto(resolved.doc, resolved.matchReason) : null,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Получение персональных карьерных рекомендаций для пользователя
export const getRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Необходима авторизация' });
      return;
    }

    // Получаем профиль пользователя
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(400).json({ error: 'Профиль пользователя не найден. Создайте профиль для получения рекомендаций' });
      return;
    }

    // Ищем подходящие сценарии по direction и level
    const scenarios = await CareerScenario.find({
      direction: profile.direction,
      level: profile.level,
      isActive: true,
    }).select('-createdBy -__v');

    if (scenarios.length === 0) {
      res.status(404).json({ error: 'Рекомендации не найдены для вашего профиля' });
      return;
    }

    res.status(200).json({
      profile: {
        direction: profile.direction,
        level: profile.level,
        careerGoal: profile.careerGoal,
        careerStartDate: profile.careerStartDate ?? null,
        yearsInCurrentRole: computeYearsInCurrentRole(profile.careerStartDate),
      },
      recommendations: scenarios,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Получение одного сценария по ID (для просмотра, только если подходит по профилю)
export const getRecommendationById = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Необходима авторизация' });
      return;
    }

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(400).json({ error: 'Профиль пользователя не найден' });
      return;
    }

    const scenario = await CareerScenario.findOne({
      _id: req.params.id,
      direction: profile.direction,
      level: profile.level,
      isActive: true,
    }).select('-createdBy -__v');

    if (!scenario) {
      res.status(404).json({ error: 'Рекомендация не найдена' });
      return;
    }

    res.status(200).json(scenario);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Создание нового карьерного сценария
export const createScenario = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const {
      direction,
      level,
      title,
      description,
      actions,
      careerBranches,
      transitionSkills,
      sortOrder,
      isActive,
    }: any = req.body;

    const scenario = await CareerScenario.create({
      direction,
      level,
      title,
      description,
      actions,
      careerBranches: careerBranches ?? [],
      transitionSkills: transitionSkills ?? [],
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
      createdBy: userId,
    });

    res.status(201).json(scenario);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Получение всех карьерных сценариев
export const getScenarios = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { direction, level, isActive } = req.query;

    const filter: any = {};
    if (direction) filter.direction = direction;
    if (level) filter.level = level;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const scenarios = await CareerScenario.find(filter)
      .populate('createdBy', 'email role')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json(scenarios);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Получение карьерного сценария по ID
export const getScenarioById = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const scenario = await CareerScenario.findById(id).populate('createdBy', 'email role');

    if (!scenario) {
      res.status(404).json({ error: 'Карьерный сценарий не найден' });
      return;
    }

    res.status(200).json(scenario);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Обновление карьерного сценария
export const updateScenario = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const scenario = await CareerScenario.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!scenario) {
      res.status(404).json({ error: 'Карьерный сценарий не найден' });
      return;
    }

    res.status(200).json(scenario);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Удаление карьерного сценария
export const deleteScenario = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const scenario = await CareerScenario.findByIdAndDelete(id);

    if (!scenario) {
      res.status(404).json({ error: 'Карьерный сценарий не найден' });
      return;
    }

    res.status(200).json({ message: 'Карьерный сценарий успешно удален' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// --- [ADMIN] Карты развития (career_roadmaps) — для панели без ML ---

export const createRoadmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      direction,
      fromLevel,
      toLevel,
      toRole,
      skillsToDevelop,
      estimatedTimeMonths,
      estimatedTimeMonthsMax,
      branchType,
      careerBranches,
      sortOrder,
      isActive,
    } = req.body as {
      direction: Direction;
      fromLevel: Level;
      toLevel: Level;
      toRole: string;
      skillsToDevelop: string[];
      estimatedTimeMonths: number;
      estimatedTimeMonthsMax?: number | null;
      branchType: RoadmapBranchType;
      careerBranches?: string[];
      sortOrder?: number;
      isActive?: boolean;
    };

    const roadmap = await CareerRoadmap.create({
      direction,
      fromLevel,
      toLevel,
      toRole,
      skillsToDevelop,
      estimatedTimeMonths,
      estimatedTimeMonthsMax: estimatedTimeMonthsMax ?? null,
      branchType,
      careerBranches: careerBranches ?? [],
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    });

    res.status(201).json(roadmap);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getRoadmaps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { direction, fromLevel, isActive, branchType } = req.query;

    const filter: {
      direction?: Direction;
      fromLevel?: Level;
      branchType?: RoadmapBranchType;
      isActive?: boolean;
    } = {};
    if (typeof direction === 'string' && direction) filter.direction = direction as Direction;
    if (typeof fromLevel === 'string' && fromLevel) filter.fromLevel = fromLevel as Level;
    if (typeof branchType === 'string' && branchType) filter.branchType = branchType as RoadmapBranchType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const list = await CareerRoadmap.find(filter).sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json(list);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getRoadmapById = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roadmap = await CareerRoadmap.findById(id);
    if (!roadmap) {
      res.status(404).json({ error: 'Карта развития не найдена' });
      return;
    }
    res.status(200).json(roadmap);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const updateRoadmap = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roadmap = await CareerRoadmap.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!roadmap) {
      res.status(404).json({ error: 'Карта развития не найдена' });
      return;
    }
    res.status(200).json(roadmap);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const deleteRoadmap = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const roadmap = await CareerRoadmap.findByIdAndDelete(id);
    if (!roadmap) {
      res.status(404).json({ error: 'Карта развития не найдена' });
      return;
    }
    res.status(200).json({ message: 'Карта развития удалена' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// --- [ADMIN] Обучающие ресурсы (learning_resources), связь с картами через tags ↔ skillsToDevelop ---

export const createLearningResource = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, url, tags, sortOrder, isActive } = req.body as {
      title: string;
      description?: string | null;
      url?: string | null;
      tags: string[];
      sortOrder?: number;
      isActive?: boolean;
    };

    const doc = await LearningResource.create({
      title,
      description: description ?? null,
      url: url || null,
      tags,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    });

    res.status(201).json(doc);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getLearningResources = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isActive, tag } = req.query;
    const filter: { isActive?: boolean; tags?: string } = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (typeof tag === 'string' && tag.trim()) {
      filter.tags = tag.trim();
    }

    const list = await LearningResource.find(filter).sort({ sortOrder: 1, title: 1 });
    res.status(200).json(list);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getLearningResourceById = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const doc = await LearningResource.findById(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Ресурс не найден' });
      return;
    }
    res.status(200).json(doc);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const updateLearningResource = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const doc = await LearningResource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      res.status(404).json({ error: 'Ресурс не найден' });
      return;
    }
    res.status(200).json(doc);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const deleteLearningResource = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const doc = await LearningResource.findByIdAndDelete(req.params.id);
    if (!doc) {
      res.status(404).json({ error: 'Ресурс не найден' });
      return;
    }
    res.status(200).json({ message: 'Ресурс удалён' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
