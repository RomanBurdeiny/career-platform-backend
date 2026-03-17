import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { verifyAccessToken } from '../utils/tokenService';
import User from '../models/User';

/** Опциональная авторизация: устанавливает req.user если токен валиден, иначе продолжает без него */
const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      next();
      return;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      next();
      return;
    }

    const token = parts[1];

    try {
      const decoded = verifyAccessToken(token);
      const user = await User.findById(decoded.userId);
      if (user && !user.isDeleted && !user.isBlocked) {
        req.user = {
          userId: user._id.toString(),
          email: user.email ?? '',
          role: user.role,
          isSubscribed: user.isSubscribed ?? true,
        };
      }
    } catch {
      // Игнорируем невалидный токен — для analytics не критично
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default optionalAuthMiddleware;
