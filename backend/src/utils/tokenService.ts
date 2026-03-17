import jwt from 'jsonwebtoken';
import RefreshToken from '../models/RefreshToken';
import { JWTPayload, RefreshTokenPayload } from '../types';

// Время жизни токенов
// - Можно настроить через ACCESS_TOKEN_EXPIRES_IN в .env (формат: '20m', '1h', '30d')
const ACCESS_TOKEN_EXPIRES_IN = '20m';
// Refresh Token: 7 дней
// Можно настроить через REFRESH_TOKEN_EXPIRES_IN_DAYS в .env
const REFRESH_TOKEN_EXPIRES_IN_DAYS = 7;

// Генерация access token
export const generateAccessToken = (payload: Omit<JWTPayload, 'type'>): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET не настроен');
  }

  const tokenPayload: JWTPayload = {
    ...payload,
    type: 'access',
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
};

// Генерация refresh token и сохранение в БД
export const generateRefreshToken = async (userId: string): Promise<string> => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET не настроен');
  }

  // Вычисляем дату истечения
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

  // Сохраняем запись в БД (без random token)
  const refreshTokenDoc = await RefreshToken.create({
    userId,
    expiresAt,
  });

  // Создаем JWT с ID документа в БД
  const tokenPayload: RefreshTokenPayload = {
    userId,
    tokenId: refreshTokenDoc._id.toString(),
    type: 'refresh',
  };

  return jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: `${REFRESH_TOKEN_EXPIRES_IN_DAYS}d`,
  });
};

// Верификация access token
export const verifyAccessToken = (token: string): JWTPayload => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET не настроен');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;

  if (decoded.type !== 'access') {
    throw new Error('Неверный тип токена');
  }

  return decoded;
};

// Верификация refresh token и проверка в БД
export const verifyRefreshToken = async (token: string): Promise<RefreshTokenPayload> => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET не настроен');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET) as RefreshTokenPayload;

  if (decoded.type !== 'refresh') {
    throw new Error('Неверный тип токена');
  }

  // Проверяем наличие токена в БД
  const refreshTokenDoc = await RefreshToken.findById(decoded.tokenId);
  if (!refreshTokenDoc) {
    throw new Error('Refresh token не найден или был отозван');
  }

  // Проверяем, не истек ли токен
  if (refreshTokenDoc.expiresAt < new Date()) {
    await RefreshToken.findByIdAndDelete(decoded.tokenId);
    throw new Error('Refresh token истек');
  }

  return decoded;
};

// Удаление refresh token (для logout)
export const revokeRefreshToken = async (tokenId: string): Promise<void> => {
  await RefreshToken.findByIdAndDelete(tokenId);
};

// Удаление всех refresh токенов пользователя (для полного logout)
export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  await RefreshToken.deleteMany({ userId });
};
