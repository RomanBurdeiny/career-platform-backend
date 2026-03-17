import { Response } from 'express';
import Profile from '../models/Profile';
import { AuthRequest, CreateProfileBody, UpdateProfileBody } from '../types';
import { isMongoDuplicateError, isMongooseValidationError, getErrorMessage } from '../utils/errorHandlers';

// Создание профиля специалиста
export const create = async (req: AuthRequest<{}, {}, CreateProfileBody>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    // Валидация выполнена Zod middleware
    const userId = req.user.userId;
    const { name, avatar, direction, level, skills, experience, careerGoal } = req.body;

    const existingProfile = await Profile.findOne({ userId });
    if (existingProfile) {
      res.status(409).json({ error: 'Профиль уже существует. Используйте PUT для обновления' });
      return;
    }

    const profile = await Profile.create({
      userId,
      name,
      avatar,
      direction,
      level,
      skills,
      experience,
      careerGoal,
    });

    res.status(201).json(profile);
  } catch (error: unknown) {
    if (isMongooseValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    if (isMongoDuplicateError(error)) {
      res.status(409).json({ error: 'Профиль уже существует' });
      return;
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Получение профиля текущего авторизованного пользователя
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const userId = req.user.userId;
    const profile = await Profile.findOne({ userId });
    
    if (!profile) {
      res.status(404).json({ error: 'Профиль не найден' });
      return;
    }

    res.status(200).json(profile);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Обновление профиля текущего авторизованного пользователя
export const update = async (req: AuthRequest<{}, {}, UpdateProfileBody>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    // Валидация выполнена Zod middleware
    const userId = req.user.userId;
    const { name, avatar, direction, level, skills, experience, careerGoal } = req.body;

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ error: 'Профиль не найден' });
      return;
    }

    if (name !== undefined) profile.name = name;
    if (avatar !== undefined) profile.avatar = avatar;
    if (direction !== undefined) profile.direction = direction;
    if (level !== undefined) profile.level = level;
    if (skills !== undefined) profile.skills = skills;
    if (experience !== undefined) profile.experience = experience;
    if (careerGoal !== undefined) profile.careerGoal = careerGoal;

    await profile.save();

    res.status(200).json(profile);
  } catch (error: unknown) {
    if (isMongooseValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Удаление аватарки пользователя
export const deleteAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const userId = req.user.userId;
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ error: 'Профиль не найден' });
      return;
    }

    profile.avatar = null;
    await profile.save();

    res.status(200).json(profile);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Замена аватарки пользователя
export const updateAvatar = async (req: AuthRequest<{}, {}, { avatar: string }>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const userId = req.user.userId;
    const { avatar } = req.body;

    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ error: 'Профиль не найден' });
      return;
    }

    profile.avatar = avatar;
    await profile.save();

    res.status(200).json(profile);
  } catch (error: unknown) {
    if (isMongooseValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Удаление профиля текущего авторизованного пользователя
export const deleteProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const userId = req.user.userId;
    const profile = await Profile.findOneAndDelete({ userId });
    
    if (!profile) {
      res.status(404).json({ error: 'Профиль не найден' });
      return;
    }

    res.status(200).json({ 
      message: 'Профиль успешно удалён',
      deletedProfile: {
        id: profile._id,
        name: profile.name,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
