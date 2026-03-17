import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';

/**
 * Middleware проверки подписки.
 * Использовать после authMiddleware.
 * Если isSubscribed === false, возвращает 403.
 *
 * Пока НЕ применён к эндпоинтам — в тестовом режиме все имеют полный доступ.
 * Когда подписка станет обязательной:
 * - default в User.isSubscribed изменить на false
 * - повесить middleware на ограниченные эндпоинты (jobs, recommendations, favorites, career actions)
 */
const subscriptionMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Пользователь не авторизован' });
      return;
    }

    if (req.user.isSubscribed === false) {
      res.status(403).json({ error: 'Требуется подписка для доступа' });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default subscriptionMiddleware;
