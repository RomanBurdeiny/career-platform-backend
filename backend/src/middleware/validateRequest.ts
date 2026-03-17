import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

// Middleware для валидации запросов через Zod схемы
export const validateRequest = <T>(schema: ZodType<T>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Валидируем запрос (body, query, params)
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error: unknown) {
      // Передаем ошибку в глобальный error handler
      // Он обработает ZodError и другие типы ошибок
      next(error);
    }
  };
};
