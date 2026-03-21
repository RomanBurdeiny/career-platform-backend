import rateLimit from 'express-rate-limit';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 100;
const DEFAULT_AUTH_MAX = 5;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (value === undefined || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

const windowMs = parsePositiveInt(
  process.env.RATE_LIMIT_WINDOW_MS,
  DEFAULT_WINDOW_MS
);
const generalMax = parsePositiveInt(process.env.RATE_LIMIT_MAX, DEFAULT_MAX);
const authMax = parsePositiveInt(process.env.RATE_LIMIT_AUTH_MAX, DEFAULT_AUTH_MAX);

// Общий rate limiter для всех эндпоинтов (настраивается через RATE_LIMIT_*)
export const generalRateLimiter = rateLimit({
  windowMs,
  max: generalMax,
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
  windowMs,
  max: authMax,
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
