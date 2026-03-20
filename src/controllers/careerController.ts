import { Response } from 'express';
import { AuthRequest } from '../types';
import CareerScenario from '../models/CareerScenario';
import Profile from '../models/Profile';
import { getErrorMessage } from '../utils/errorHandlers';

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

    res.status(200).json({ 
      profile: {
        direction: profile.direction,
        level: profile.level,
        careerGoal: profile.careerGoal,
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
