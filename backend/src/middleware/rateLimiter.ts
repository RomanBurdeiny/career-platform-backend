import rateLimit from 'express-rate-limit';

// Общий rate limiter для всех эндпоинтов
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP за 15 минут
  message: {
    error: 'Слишком много запросов с этого IP, попробуйте позже',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // В development для localhost отключаем — React StrictMode и hot reload дают много запросов
  skip: (req) =>
    process.env.NODE_ENV === 'development' &&
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.ip ?? ''),
});

// Строгий rate limiter для auth эндпоинтов (защита от brute force)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток входа/регистрации с одного IP за 15 минут
  message: {
    error: 'Слишком много попыток авторизации. Попробуйте через 15 минут',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Не считаем успешные запросы
  skip: (req) =>
    process.env.NODE_ENV === 'development' &&
    (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
});
