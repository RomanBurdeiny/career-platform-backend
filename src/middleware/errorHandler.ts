import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  isError,
  isMongoDuplicateError,
  isMongooseValidationError,
  getErrorMessage,
  formatZodError,
} from '../utils/errorHandlers';

// Глобальный обработчик ошибок Express
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Zod ошибки валидации
  if (err instanceof ZodError) {
    const errors = formatZodError(err);
    res.status(400).json({
      error: 'Ошибка валидации',
      details: errors,
    });
    return;
  }

  // MongoDB duplicate key ошибка
  if (isMongoDuplicateError(err)) {
    res.status(409).json({
      error: 'Конфликт данных. Запись с такими данными уже существует',
    });
    return;
  }

  // Mongoose ValidationError
  if (isMongooseValidationError(err)) {
    res.status(400).json({
      error: 'Ошибка валидации данных',
      message: err.message,
    });
    return;
  }

  // JWT ошибки
  if (isError(err)) {
    if (err.name === 'JsonWebTokenError') {
      res.status(401).json({
        error: 'Невалидный токен',
      });
      return;
    }

    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'Токен истек',
      });
      return;
    }

    // Ошибки с явным сообщением (из наших контроллеров)
    if (err.message.includes('не найден') || err.message.includes('отозван')) {
      res.status(401).json({
        error: 'Refresh token недействителен',
      });
      return;
    }

    if (err.message.includes('истек')) {
      res.status(401).json({
        error: 'Refresh token истек',
      });
      return;
    }
  }

  // Логирование ошибки для дебага (только в development)
  if (process.env.NODE_ENV === 'development' && isError(err)) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }

  // Общая ошибка сервера
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Внутренняя ошибка сервера' 
      : getErrorMessage(err),
  });
};
