import { Response } from 'express';
import CareerScenario from '../models/CareerScenario';
import { AuthRequest, CareerAction } from '../types';
import { getErrorMessage } from '../utils/errorHandlers';

export const listRecommendations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { direction, level, isActive } = req.query as {
      direction?: string;
      level?: string;
      isActive?: string;
    };

    const filter: Record<string, unknown> = {};
    if (direction) filter.direction = direction;
    if (level) filter.level = level;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const items = await CareerScenario.find(filter)
      .populate('createdBy', 'email role')
      .sort({ sortOrder: 1, createdAt: -1 });

    res.status(200).json(items);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const getRecommendationById = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await CareerScenario.findById(id).populate(
      'createdBy',
      'email role'
    );

    if (!item) {
      res.status(404).json({ error: 'Рекомендация не найдена' });
      return;
    }

    res.status(200).json(item);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const createRecommendation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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
      isActive,
      sortOrder,
    } =
      req.body as {
        direction: string;
        level: string;
        title: string;
        description: string;
        actions: CareerAction[];
        careerBranches?: string[];
        transitionSkills?: string[];
        isActive?: boolean;
        sortOrder?: number;
      };

    const item = await CareerScenario.create({
      direction,
      level,
      title,
      description,
      actions,
      careerBranches: careerBranches ?? [],
      transitionSkills: transitionSkills ?? [],
      createdBy: userId,
      isActive: isActive ?? true,
      sortOrder: sortOrder ?? 0,
    });

    res.status(201).json(item);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const updateRecommendation = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await CareerScenario.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('createdBy', 'email role');

    if (!item) {
      res.status(404).json({ error: 'Рекомендация не найдена' });
      return;
    }

    res.status(200).json(item);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

export const deleteRecommendation = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const item = await CareerScenario.findByIdAndDelete(id);

    if (!item) {
      res.status(404).json({ error: 'Рекомендация не найдена' });
      return;
    }

    res.status(200).json({ message: 'Рекомендация удалена' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

