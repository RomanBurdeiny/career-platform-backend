import { Response } from 'express';
import Profile from '../models/Profile';
import { AuthRequest, CreateProfileBody, UpdateProfileBody } from '../types';
import { isMongoDuplicateError, isMongooseValidationError, getErrorMessage } from '../utils/errorHandlers';
import { uploadToYandexDisk, getAvatarPath, downloadFromYandexDisk } from '../services/yandexDisk';

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

// Загрузка аватарки как файла на Яндекс.Диск
export const uploadAvatarFile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file) {
      res.status(400).json({ error: 'Файл avatar обязателен' });
      return;
    }

    const userId = req.user.userId;

    const remotePath = getAvatarPath(userId, file.originalname);

    await uploadToYandexDisk(file.buffer, remotePath, file.mimetype);

    // Профиль может ещё не существовать (первичное заполнение после регистрации).
    // В этом случае просто возвращаем путь; фронт передаст его в POST /api/profile.
    const profile = await Profile.findOne({ userId });
    if (profile) {
      profile.avatar = remotePath;
      await profile.save();
    }

    res.status(200).json({
      message: 'Аватарка загружена на Яндекс.Диск',
      avatar: remotePath,
    });
  } catch (error: unknown) {
    if (isMongooseValidationError(error)) {
      res.status(400).json({ error: (error as Error).message });
      return;
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Получение аватарки текущего пользователя (проксируем с Яндекс.Диска)
export const getAvatarFile = async (req: AuthRequest, res: Response): Promise<void> => {
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

    const avatarPath = profile.avatar;
    if (!avatarPath || typeof avatarPath !== 'string' || avatarPath.trim() === '') {
      res.status(404).json({ error: 'Аватарка не найдена' });
      return;
    }

    // Если в профиле хранится внешний URL (не путь на Диске), просто редиректим
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      res.redirect(302, avatarPath);
      return;
    }

    const { stream, contentType, contentLength } = await downloadFromYandexDisk(avatarPath);

    res.setHeader('Content-Type', contentType);
    // Один и тот же URL у разных пользователей, поэтому обязательно учитываем Authorization в кеше
    // и запрещаем хранение, чтобы не показать чужую аватарку при смене пользователя.
    res.setHeader('Vary', 'Authorization');
    res.setHeader('Cache-Control', 'private, no-store');
    if (typeof contentLength === 'number' && Number.isFinite(contentLength)) {
      res.setHeader('Content-Length', String(contentLength));
    }

    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(502).json({ error: 'Ошибка при скачивании аватарки' });
      } else {
        res.destroy();
      }
    });

    stream.pipe(res);
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    const isNotFound =
      msg.includes('404') ||
      msg.toLowerCase().includes('not found') ||
      msg.toLowerCase().includes('не найден');
    res.status(isNotFound ? 404 : 500).json({
      error: isNotFound ? 'Аватарка не найдена' : msg,
    });
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
