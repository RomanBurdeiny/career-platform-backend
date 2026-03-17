import { Response, NextFunction } from 'express';
import { AuthRequest, UserRole } from '../types';

// Middleware для проверки роли пользователя (RBAC)
const roleMiddleware = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Пользователь не авторизован' });
        return;
      }

      if (!req.user.role) {
        res.status(403).json({ error: 'Роль пользователя не определена' });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({ 
          error: 'Доступ запрещён. Недостаточно прав.' 
        });
        return;
      }

      next();
    } catch (error) {
      // Передаем ошибку в глобальный error handler
      next(error);
    }
  };
};

export default roleMiddleware;
