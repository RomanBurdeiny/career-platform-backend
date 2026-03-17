import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/tokenService';
import User from '../models/User';

// Middleware для проверки Access Token
const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'Токен не предоставлен' });
      return;
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({ error: 'Неверный формат токена' });
      return;
    }

    const token = parts[1];

    // Верифицируем access token
    const decoded = verifyAccessToken(token);

    // Проверяем актуальное состояние пользователя в БД
    const user = await User.findById(decoded.userId);
    if (!user || user.isDeleted) {
      res.status(401).json({ error: 'Пользователь не найден' });
      return;
    }

    if (user.isBlocked) {
      res.status(403).json({ error: 'Пользователь заблокирован' });
      return;
    }

    // Сохраняем данные пользователя без type (email может быть пустым для OAuth)
    req.user = {
      userId: user._id.toString(),
      email: user.email ?? '',
      role: user.role,
      isSubscribed: user.isSubscribed ?? true,
    };

    next();
  } catch (error) {
    // Передаем ошибку в глобальный error handler
    next(error);
  }
};

export default authMiddleware;
