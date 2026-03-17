import { Request, Response } from 'express';
import User from '../models/User';
import Profile from '../models/Profile';
import { AuthRequest, UserRole, UpdateUserRoleBody, UpdateUserBlockBody, UpdateUserSubscriptionBody } from '../types';
import { getErrorMessage } from '../utils/errorHandlers';

// Экранирование спецсимволов для безопасного использования в regex
const escapeRegex = (str: string): string =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePage = (val: unknown): number => {
  const n = parseInt(String(val || 1), 10);
  return isNaN(n) || n < 1 ? 1 : n;
};

const parseLimit = (val: unknown): number => {
  const n = parseInt(String(val || 10), 10);
  if (isNaN(n) || n < 1) return 10;
  return Math.min(n, 100);
};

// [ADMIN] Получение списка пользователей
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page: pageParam, limit: limitParam, role, search } = req.query;
    const page = parsePage(pageParam);
    const limit = parseLimit(limitParam);
    const skip = (page - 1) * limit;

    const filters: Record<string, unknown> = {
      isDeleted: false,
    };

    if (role) {
      filters.role = role;
    }

    const searchTerm = typeof search === 'string' ? search.trim() : '';
    if (searchTerm) {
      const escaped = escapeRegex(searchTerm);
      const searchRegex = { $regex: escaped, $options: 'i' };

      const profiles = await Profile.find({ name: searchRegex }).select('userId');
      const profileUserIds = profiles.map(profile => profile.userId);

      filters.$or = [
        { email: searchRegex },
        { _id: { $in: profileUserIds } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filters),
      User.find(filters)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const userIds = users.map(user => user._id);
    const profiles = await Profile.find({ userId: { $in: userIds } })
      .select('userId name avatar')
      .lean();

    const profileMap = new Map(
      profiles.map(profile => [profile.userId.toString(), profile])
    );

    const result = users.map(user => {
      const profile = profileMap.get(user._id.toString());

      return {
        ...user,
        profile: profile
          ? {
              name: profile.name,
              avatar: profile.avatar ?? null,
            }
          : null,
      };
    });

    res.status(200).json({
      total,
      page,
      limit,
      users: result,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Изменение роли пользователя
export const updateUserRole = async (
  req: AuthRequest<{ id: string }, {}, UpdateUserRoleBody>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (id === req.user.userId) {
      res.status(400).json({ error: 'Нельзя изменить роль самому себе' });
      return;
    }

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    if (user.role === UserRole.ADMIN && role === UserRole.SPECIALIST) {
      const adminsCount = await User.countDocuments({
        role: UserRole.ADMIN,
        isDeleted: false,
      });

      if (adminsCount <= 1) {
        res.status(400).json({ error: 'Нельзя убрать роль ADMIN у последнего администратора' });
        return;
      }
    }

    user.role = role;
    await user.save();

    res.status(200).json({
      id: user._id,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      isDeleted: user.isDeleted,
      isSubscribed: user.isSubscribed,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Блокировка/разблокировка пользователя
export const updateUserBlock = async (
  req: AuthRequest<{ id: string }, {}, UpdateUserBlockBody>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const { id } = req.params;
    const { blocked } = req.body;

    if (id === req.user.userId) {
      res.status(400).json({ error: 'Нельзя заблокировать самого себя' });
      return;
    }

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    user.isBlocked = blocked;
    await user.save();

    res.status(200).json({
      id: user._id,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      isDeleted: user.isDeleted,
      isSubscribed: user.isSubscribed,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Soft delete пользователя
export const deleteUser = async (
  req: AuthRequest<{ id: string }>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const { id } = req.params;

    if (id === req.user.userId) {
      res.status(400).json({ error: 'Нельзя удалить самого себя' });
      return;
    }

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    if (user.role === UserRole.ADMIN) {
      const adminsCount = await User.countDocuments({
        role: UserRole.ADMIN,
        isDeleted: false,
      });

      if (adminsCount <= 1) {
        res.status(400).json({ error: 'Нельзя удалить последнего администратора' });
        return;
      }
    }

    user.isDeleted = true;
    user.isBlocked = true;
    await user.save();

    res.status(200).json({
      message: 'Пользователь успешно деактивирован',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        isBlocked: user.isBlocked,
        isDeleted: user.isDeleted,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// [ADMIN] Изменение подписки пользователя
export const updateUserSubscription = async (
  req: AuthRequest<{ id: string }, {}, UpdateUserSubscriptionBody>,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    const { id } = req.params;
    const { isSubscribed } = req.body;

    const user = await User.findOne({ _id: id, isDeleted: false });
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    user.isSubscribed = isSubscribed;
    await user.save();

    res.status(200).json({
      id: user._id,
      email: user.email,
      role: user.role,
      isBlocked: user.isBlocked,
      isDeleted: user.isDeleted,
      isSubscribed: user.isSubscribed,
    });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
