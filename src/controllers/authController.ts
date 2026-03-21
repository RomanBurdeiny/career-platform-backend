import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import User from '../models/User';
import Invite from '../models/Invite';
import InviteUsage from '../models/InviteUsage';
import {
  RegisterBody,
  LoginBody,
  GoogleAuthBody,
  TelegramAuthPayload,
  UserRole,
  AuthRequest,
} from '../types';
import { isMongoDuplicateError, getErrorMessage } from '../utils/errorHandlers';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
} from '../utils/tokenService';

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней
const IS_PROD = process.env.NODE_ENV === 'production';
// Security: in production never accept/return refreshToken via JSON/body.
// In development you can enable explicit fallback when cookies are inconvenient.
const ALLOW_REFRESH_TOKEN_BODY = !IS_PROD && process.env.ALLOW_REFRESH_TOKEN_BODY === 'true';
const ALLOW_REFRESH_TOKEN_JSON = !IS_PROD && process.env.ALLOW_REFRESH_TOKEN_JSON === 'true';

type RefreshCookieSameSite = 'strict' | 'lax' | 'none';

function parseRefreshCookieSameSite(
  value: string | undefined
): RefreshCookieSameSite | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (v === 'strict' || v === 'lax' || v === 'none') return v;
  return undefined;
}

/**
 * Настройки httpOnly cookie для refresh.
 * В production по умолчанию SameSite=None + Secure: иначе при SPA на другом origin
 * (например Vercel + API на Railway) браузер не отправляет cookie на POST /auth/refresh,
 * сессия «ломается» после истечения access token — падают и админские запросы (аналитика и т.д.).
 */
function getRefreshTokenCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: RefreshCookieSameSite;
  maxAge: number;
  path: string;
} {
  const fromEnv = parseRefreshCookieSameSite(
    process.env.REFRESH_TOKEN_COOKIE_SAMESITE
  );
  const sameSite: RefreshCookieSameSite =
    fromEnv ?? (IS_PROD ? 'none' : 'strict');
  const secure = IS_PROD || sameSite === 'none';
  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

/** Выставляет refresh token в cookie и возвращает accessToken + user для JSON-ответа */
async function issueAuthResponse(
  res: Response,
  user: InstanceType<typeof User>
): Promise<{ accessToken: string; refreshToken?: string; user: { id: typeof user._id; email: string; role: UserRole } }> {
  const userId = user._id.toString();
  const email = user.email ?? '';
  const accessToken = generateAccessToken({ userId, email, role: user.role });
  const refreshToken = await generateRefreshToken(userId);
  res.cookie('refreshToken', refreshToken, getRefreshTokenCookieOptions());
  return {
    accessToken,
    ...(ALLOW_REFRESH_TOKEN_JSON ? { refreshToken } : {}),
    user: { id: user._id, email, role: user.role },
  };
}

function isInviteValid(invite: InstanceType<typeof Invite>): boolean {
  if (!invite.isActive) return false;
  if (invite.usedCount >= invite.maxUses) return false;
  if (invite.expiresAt && new Date(invite.expiresAt) <= new Date()) return false;
  return true;
}

// Регистрация: обычная (email+пароль) или по invite
export const register = async (req: Request<{}, {}, RegisterBody>, res: Response): Promise<void> => {
  try {
    const { name, email, password, inviteCode } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }

    let role = UserRole.SPECIALIST;
    let inviteDoc: InstanceType<typeof Invite> | null = null;
    const code = inviteCode?.toUpperCase().trim();

    if (code) {
      inviteDoc = await Invite.findOne({ code });
      if (!inviteDoc) {
        res.status(400).json({ error: 'Приглашение не найдено' });
        return;
      }
      if (!isInviteValid(inviteDoc)) {
        res.status(400).json({ error: 'Приглашение недействительно или истекло' });
        return;
      }
      role = inviteDoc.role as UserRole;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name: name || undefined,
      email,
      password: hashedPassword,
      authProvider: 'email',
      role,
    });

    if (inviteDoc) {
      await InviteUsage.create({
        inviteId: inviteDoc._id as import('mongoose').Types.ObjectId,
        userId: user._id as import('mongoose').Types.ObjectId,
        email: user.email!,
      });
      await Invite.findByIdAndUpdate(inviteDoc._id, { $inc: { usedCount: 1 } });
    }

    const payload = await issueAuthResponse(res, user);
    res.status(201).json(payload);
  } catch (error: unknown) {
    if (isMongoDuplicateError(error)) {
      res.status(409).json({ error: 'Пользователь с таким email уже существует' });
      return;
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Авторизация по email + пароль (только для пользователей с authProvider === 'email')
export const login = async (req: Request<{}, {}, LoginBody>, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    if (user.authProvider && user.authProvider !== 'email') {
      res.status(401).json({
        error: 'Войдите через Google или Telegram',
        authProvider: user.authProvider,
      });
      return;
    }

    if (!user.password) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Неверный email или пароль' });
      return;
    }

    if (user.isDeleted || user.isBlocked) {
      res.status(403).json({ error: 'Аккаунт недоступен' });
      return;
    }

    const payload = await issueAuthResponse(res, user);
    res.status(200).json(payload);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Обновление access token через refresh token
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    // Читаем refresh token из httpOnly cookie
    const refreshToken =
      req.cookies?.refreshToken ??
      (ALLOW_REFRESH_TOKEN_BODY
        ? (req.body as { refreshToken?: string } | undefined)?.refreshToken
        : undefined);

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token отсутствует' });
      return;
    }

    // Верифицируем refresh token и проверяем в БД
    const decoded = await verifyRefreshToken(refreshToken);

    // Находим пользователя
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }

    if (user.isDeleted || user.isBlocked) {
      res.status(401).json({ error: 'Пользователь недоступен' });
      return;
    }

    // Генерируем новый access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email ?? '',
      role: user.role,
    });

    res.status(200).json({
      accessToken,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes('не найден') || error.message.includes('отозван')) {
        res.status(401).json({ error: 'Refresh token недействителен' });
        return;
      }
      if (error.message.includes('истек')) {
        res.status(401).json({ error: 'Refresh token истек' });
        return;
      }
    }
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Выход из системы (logout) - удаляет refresh token
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Читаем refresh token из httpOnly cookie
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        // Верифицируем токен и получаем его ID
        const decoded = await verifyRefreshToken(refreshToken);
        
        // Удаляем refresh token из БД
        await revokeRefreshToken(decoded.tokenId);
      } catch (error) {
        // Игнорируем ошибки валидации токена при logout
      }
    }

    // Удаляем cookie с refresh token (опции должны совпадать с выставлением)
    const cookieOpts = getRefreshTokenCookieOptions();
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: cookieOpts.secure,
      sameSite: cookieOpts.sameSite,
      path: cookieOpts.path,
    });

    res.status(200).json({ message: 'Выход выполнен успешно' });
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};

// Вход через Google (id_token от Google Sign-In)
export const googleAuth = async (req: Request<{}, {}, GoogleAuthBody>, res: Response): Promise<void> => {
  try {
    const { idToken, inviteCode } = req.body;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      res.status(500).json({ error: 'Google OAuth не настроен (GOOGLE_CLIENT_ID)' });
      return;
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(400).json({ error: 'Не удалось получить email из Google' });
      return;
    }

    const email = payload.email;
    const googleId = payload.sub;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      let role = UserRole.SPECIALIST;
      let inviteDoc: InstanceType<typeof Invite> | null = null;
      const code = inviteCode?.toUpperCase().trim();

      if (code) {
        inviteDoc = await Invite.findOne({ code });
        if (!inviteDoc || !isInviteValid(inviteDoc)) {
          res.status(400).json({ error: 'Приглашение недействительно или истекло' });
          return;
        }
        role = inviteDoc.role as UserRole;
      }

      user = await User.create({
        email,
        authProvider: 'google',
        googleId,
        role,
      });

      if (inviteDoc) {
        await InviteUsage.create({
          inviteId: inviteDoc._id as import('mongoose').Types.ObjectId,
          userId: user._id as import('mongoose').Types.ObjectId,
          email: user.email!,
        });
        await Invite.findByIdAndUpdate(inviteDoc._id, { $inc: { usedCount: 1 } });
      }
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.authProvider = 'google';
      await user.save();
    }

    if (user.isDeleted || user.isBlocked) {
      res.status(403).json({ error: 'Аккаунт недоступен' });
      return;
    }

    const authPayload = await issueAuthResponse(res, user);
    res.status(200).json(authPayload);
  } catch (error: unknown) {
    res.status(401).json({ error: 'Недействительный Google токен' });
  }
};

// Вход через Telegram (данные от Telegram Login Widget, hash проверяется на бэкенде)
export const telegramAuth = async (
  req: Request<{}, {}, TelegramAuthPayload>,
  res: Response
): Promise<void> => {
  try {
    const data = req.body;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      res.status(500).json({ error: 'Telegram Login не настроен (TELEGRAM_BOT_TOKEN)' });
      return;
    }

    const { hash, inviteCode: _inviteCode, ...telegramFields } = data as TelegramAuthPayload & { inviteCode?: string };
    // Только поля от Telegram участвуют в проверке hash (inviteCode — наш, не от виджета)
    const checkString = Object.keys(telegramFields)
      .sort()
      .map((k) => `${k}=${(telegramFields as Record<string, unknown>)[k]}`)
      .join('\n');

    const secret = crypto.createHash('sha256').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secret).update(checkString).digest('hex');

    const computedBuf = Buffer.from(computedHash, 'hex');
    const receivedBuf = Buffer.from(hash, 'hex');
    if (computedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(computedBuf, receivedBuf)) {
      res.status(401).json({ error: 'Недействительные данные Telegram' });
      return;
    }

    const authDate = data.auth_date;
    const maxAge = 60 * 2; // 2 минуты
    if (Math.floor(Date.now() / 1000) - authDate > maxAge) {
      res.status(401).json({ error: 'Данные авторизации устарели' });
      return;
    }

    const telegramId = data.id;
    let user = await User.findOne({ telegramId });

    if (!user) {
      let role = UserRole.SPECIALIST;
      let inviteDoc: InstanceType<typeof Invite> | null = null;
      const code = _inviteCode?.toUpperCase().trim();

      if (code) {
        inviteDoc = await Invite.findOne({ code });
        if (!inviteDoc || !isInviteValid(inviteDoc)) {
          res.status(400).json({ error: 'Приглашение недействительно или истекло' });
          return;
        }
        role = inviteDoc.role as UserRole;
      }

      const placeholderEmail = `telegram_${telegramId}@placeholder.local`;
      user = await User.create({
        email: placeholderEmail,
        authProvider: 'telegram',
        telegramId,
        telegramUsername: data.username,
        role,
      });

      if (inviteDoc) {
        await InviteUsage.create({
          inviteId: inviteDoc._id as import('mongoose').Types.ObjectId,
          userId: user._id as import('mongoose').Types.ObjectId,
          email: placeholderEmail,
        });
        await Invite.findByIdAndUpdate(inviteDoc._id, { $inc: { usedCount: 1 } });
      }
    }

    if (user.isDeleted || user.isBlocked) {
      res.status(403).json({ error: 'Аккаунт недоступен' });
      return;
    }

    const authPayload = await issueAuthResponse(res, user);
    res.status(200).json(authPayload);
  } catch (error: unknown) {
    res.status(500).json({ error: getErrorMessage(error) });
  }
};
