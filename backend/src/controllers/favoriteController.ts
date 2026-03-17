import { Response } from 'express';
import Profile from '../models/Profile';
import Job from '../models/Job';
import { AuthRequest } from '../types';
import { getErrorMessage } from '../utils/errorHandlers';

// Добавление вакансии в избранное
export const addToFavorites = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const { id: jobId } = req.params;
    const userId = req.user.userId;

    // Проверяем, существует ли вакансия
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ error: 'Вакансия не найдена' });
      return;
    }

    // Проверяем, активна ли вакансия
    if (!job.isActive) {
      res.status(400).json({ error: 'Нельзя добавить неактивную вакансию в избранное' });
      return;
    }

    // Получаем профиль пользователя
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ 
        error: 'Профиль не найден. Создайте профиль перед добавлением вакансий в избранное' 
      });
      return;
    }

    // Инициализируем favoriteJobs, если он undefined
    if (!profile.favoriteJobs) {
      profile.favoriteJobs = [];
    }

    // Проверяем, не добавлена ли уже эта вакансия
    const alreadyFavorite = profile.favoriteJobs.some(
      (favJobId) => favJobId.toString() === jobId
    );

    if (alreadyFavorite) {
      res.status(400).json({ error: 'Вакансия уже добавлена в избранное' });
      return;
    }

    // Добавляем в избранное
    profile.favoriteJobs.push(jobId as any);
    await profile.save();

    res.status(200).json({
      message: 'Вакансия добавлена в избранное',
      favoriteJobsCount: profile.favoriteJobs.length,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Удаление вакансии из избранного
export const removeFromFavorites = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const { id: jobId } = req.params;
    const userId = req.user.userId;

    // Получаем профиль пользователя
    const profile = await Profile.findOne({ userId });
    if (!profile) {
      res.status(404).json({ error: 'Профиль не найден' });
      return;
    }

    // Инициализируем favoriteJobs, если он undefined
    if (!profile.favoriteJobs) {
      profile.favoriteJobs = [];
    }

    // Проверяем, есть ли вакансия в избранном
    const favoriteIndex = profile.favoriteJobs.findIndex(
      (favJobId) => favJobId.toString() === jobId
    );

    if (favoriteIndex === -1) {
      res.status(400).json({ error: 'Вакансия не найдена в избранном' });
      return;
    }

    // Удаляем из избранного
    profile.favoriteJobs.splice(favoriteIndex, 1);
    await profile.save();

    res.status(200).json({
      message: 'Вакансия удалена из избранного',
      favoriteJobsCount: profile.favoriteJobs.length,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Получение списка избранных вакансий
export const getFavorites = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const userId = req.user.userId;

    // Получаем профиль с populate избранных вакансий
    const profile = await Profile.findOne({ userId })
      .populate({
        path: 'favoriteJobs',
        match: { isActive: true }, // Показываем только активные вакансии
        populate: {
          path: 'createdBy',
          select: 'email role',
        },
      });

    if (!profile) {
      res.status(404).json({ error: 'Профиль не найден' });
      return;
    }

    // Фильтруем null значения (если вакансия была удалена) и проверяем на undefined
    const favoriteJobs = (profile.favoriteJobs || []).filter((job) => job !== null);

    res.status(200).json({
      total: favoriteJobs.length,
      favoriteJobs,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
