import { Request, Response } from 'express';
import Job from '../models/Job';
import { AuthRequest, CreateJobBody, UpdateJobBody } from '../types';
import { isMongoDuplicateError, isMongooseValidationError, getErrorMessage } from '../utils/errorHandlers';

// Создание вакансии (только ADMIN)
export const createJob = async (req: AuthRequest<{}, {}, CreateJobBody>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    // Валидация выполнена Zod middleware
    const jobData = {
      ...req.body,
      createdBy: req.user.userId,
    };

    const job = await Job.create(jobData);

    res.status(201).json(job);
  } catch (error: unknown) {
    if (isMongooseValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Экранирование спецсимволов для безопасного использования в regex
const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Парсинг page и limit с дефолтами и ограничениями
const parsePage = (val: unknown): number => {
  const n = parseInt(String(val || 1), 10);
  return isNaN(n) || n < 1 ? 1 : n;
};

const parseLimit = (val: unknown): number => {
  const n = parseInt(String(val || 10), 10);
  if (isNaN(n) || n < 1) return 10;
  return Math.min(n, 100); // максимум 100 на страницу
};

// Получение списка вакансий с фильтрами, поиском и пагинацией
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    // Получаем параметры фильтрации, поиска и пагинации из query
    const { direction, level, workFormat, location, search, page: pageParam, limit: limitParam } = req.query;

    const page = parsePage(pageParam);
    const limit = parseLimit(limitParam);
    const skip = (page - 1) * limit;

    // Строим объект фильтров
    const filters: Record<string, unknown> = {
      isActive: true, // По умолчанию показываем только активные
    };

    if (direction) filters.direction = direction;
    if (level) filters.level = level;
    if (workFormat) filters.workFormat = workFormat;
    if (location) filters.location = location;

    // Поиск по подстроке (регистронезависимый) в title, description, company
    const searchTerm = typeof search === 'string' ? search.trim() : '';
    if (searchTerm) {
      const escaped = escapeRegex(searchTerm);
      const searchRegex = { $regex: escaped, $options: 'i' };
      filters.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { company: searchRegex },
      ];
    }

    // total — общее количество по фильтрам; jobs — с пагинацией
    const [total, jobs] = await Promise.all([
      Job.countDocuments(filters),
      Job.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'email role'),
    ]);

    res.status(200).json({
      total,
      page,
      limit,
      jobs,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Получение одной вакансии по ID
export const getJobById = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN';

    const job = await Job.findById(id)
      .populate('createdBy', 'email role');

    if (!job) {
      res.status(404).json({ error: 'Вакансия не найдена' });
      return;
    }

    // Обычным пользователям не отдаём неактивные вакансии
    if (!job.isActive && !isAdmin) {
      res.status(404).json({ error: 'Вакансия не найдена' });
      return;
    }

    res.status(200).json(job);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Обновление вакансии (только ADMIN)
export const updateJob = async (
  req: AuthRequest<{ id: string }, {}, UpdateJobBody>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    // Валидация выполнена Zod middleware
    const { id } = req.params;
    const updateData = req.body;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ error: 'Вакансия не найдена' });
      return;
    }

    // Обновляем поля
    Object.assign(job, updateData);
    await job.save();

    res.status(200).json(job);
  } catch (error: unknown) {
    if (isMongooseValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Удаление вакансии (только ADMIN) - мягкое удаление через isActive
export const deleteJob = async (req: AuthRequest<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) {
      res.status(404).json({ error: 'Вакансия не найдена' });
      return;
    }

    // Мягкое удаление
    job.isActive = false;
    await job.save();

    res.status(200).json({
      message: 'Вакансия успешно деактивирована',
      job: {
        id: job._id,
        title: job.title,
        isActive: job.isActive,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
