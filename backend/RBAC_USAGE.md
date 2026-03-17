# Использование RBAC (Role-Based Access Control)

## Роли пользователей

- `SPECIALIST` - обычный специалист (роль по умолчанию)
- `ADMIN` - администратор с расширенными правами

## Как защитить роуты по ролям

### Пример: Защита админских эндпоинтов

```typescript
import express, { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import roleMiddleware from '../middleware/roleMiddleware';
import * as adminController from '../controllers/adminController';

const router: Router = express.Router();

// Только для ADMIN
router.get('/admin/users', 
  authMiddleware,                    // Сначала проверяем JWT access token
  roleMiddleware(['ADMIN']),         // Затем проверяем роль
  adminController.getAllUsers
);

// Для ADMIN и SPECIALIST (если нужно)
router.get('/jobs', 
  authMiddleware, 
  roleMiddleware(['ADMIN', 'SPECIALIST']), // Доступ для обеих ролей
  jobsController.getJobs
);

// Только для ADMIN - создание вакансии
router.post('/jobs', 
  authMiddleware, 
  roleMiddleware(['ADMIN']), 
  jobsController.createJob
);

export default router;
```

## Как создать администратора

### Вариант 1: Через регистрацию + ручное изменение в БД

1. Зарегистрируйте пользователя через `/api/auth/register`
2. В MongoDB найдите этого пользователя и измените `role` на `ADMIN`

### Вариант 2: Специальный эндпоинт (для разработки)

Создайте временный эндпоинт для создания админа:

```typescript
// controllers/authController.ts
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import { UserRole } from '../types';
import { generateAccessToken, generateRefreshToken } from '../utils/tokenService';

export const registerAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, adminSecret } = req.body;

    // Проверка секретного ключа (храните в .env)
    if (adminSecret !== process.env.ADMIN_SECRET) {
      res.status(403).json({ error: 'Неверный секретный ключ' });
      return;
    }

    // Хэширование пароля
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Создаём админа
    const user = await User.create({
      email,
      password: hashedPassword,
      role: UserRole.ADMIN, // Устанавливаем роль ADMIN
    });

    // Генерируем токены
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const refreshToken = await generateRefreshToken(user._id.toString());

    // Устанавливаем refresh token в httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: unknown) {
    res.status(500).json({ error: 'Ошибка создания администратора' });
  }
};
```

## Структура токенов

### Access Token (20 минут):
```typescript
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "SPECIALIST",          // или "ADMIN"
  "type": "access",               // тип токена
  "iat": 1516239022,              // время выдачи
  "exp": 1516325422               // время истечения (20 мин)
}
```

### Refresh Token (7 дней):
```typescript
{
  "userId": "507f1f77bcf86cd799439011",
  "tokenId": "677e8e9a1234567890abcdef", // ID документа в БД
  "type": "refresh",              // тип токена
  "iat": 1516239022,              // время выдачи
  "exp": 1516843822               // время истечения (7 дней)
}
```

**Важно:** 
- Refresh token хранится в httpOnly cookie (защита от XSS)
- При валидации проверяется: JWT подпись + существование документа RefreshToken в БД + срок действия
- Документ RefreshToken содержит только `userId`, `expiresAt` и автоматически удаляется по TTL

## Проверка роли на клиенте

После получения access token декодируйте его на фронтенде, чтобы показывать/скрывать UI элементы:

```typescript
// Frontend (TypeScript)
import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
  userId: string;
  email: string;
  role: 'SPECIALIST' | 'ADMIN';
  type: 'access';
  iat: number;
  exp: number;
}

const token = localStorage.getItem('accessToken');
if (token) {
  const decoded = jwtDecode<TokenPayload>(token);
  
  if (decoded.role === 'ADMIN') {
    // Показать админскую панель
  }
}
```

**Важно:** 
- Проверка на клиенте только для UI! 
- Безопасность обеспечивается на бэкенде через `authMiddleware` и `roleMiddleware`
- Access token хранится в localStorage/memory
- Refresh token в httpOnly cookie (недоступен для JavaScript)

## Таблица доступов к эндпоинтам

### Авторизация (`/api/auth`)

| Эндпоинт | Метод | Доступ | Описание |
|----------|-------|--------|----------|
| `/api/auth/register` | POST | Публичный | Регистрация нового пользователя |
| `/api/auth/login` | POST | Публичный | Вход в систему |
| `/api/auth/refresh` | POST | Публичный* | Обновление access token через cookie |
| `/api/auth/logout` | POST | Авторизован | Выход из системы |

*Refresh token передается автоматически в cookie

### Профиль (`/api/profile`)

| Эндпоинт | Метод | Доступ | Описание |
|----------|-------|--------|----------|
| `/api/profile` | POST | Авторизован | Создание профиля |
| `/api/profile` | GET | Авторизован | Получение своего профиля |
| `/api/profile` | PUT | Авторизован | Обновление своего профиля |
| `/api/profile` | DELETE | Авторизован | Удаление своего профиля |

### Вакансии (`/api/jobs`)

| Эндпоинт | Метод | Доступ | Описание |
|----------|-------|--------|----------|
| `/api/jobs` | GET | Авторизован | Список вакансий с фильтрами |
| `/api/jobs/:id` | GET | Авторизован | Детали вакансии |
| `/api/jobs/favorites` | GET | Авторизован | Список избранных вакансий |
| `/api/jobs/:id/favorite` | POST | Авторизован | Добавить вакансию в избранное |
| `/api/jobs/:id/favorite` | DELETE | Авторизован | Удалить вакансию из избранного |
| `/api/jobs` | POST | **ADMIN** | Создание вакансии |
| `/api/jobs/:id` | PUT | **ADMIN** | Обновление вакансии |
| `/api/jobs/:id` | DELETE | **ADMIN** | Деактивация вакансии |

### Карьерные рекомендации (`/api/career`)

| Эндпоинт | Метод | Доступ | Описание |
|----------|-------|--------|----------|
| `/api/career/recommendations` | GET | Авторизован | Получение персональных рекомендаций |
| `/api/career/scenarios` | POST | **ADMIN** | Создание карьерного сценария |
| `/api/career/scenarios` | GET | **ADMIN** | Список всех сценариев |
| `/api/career/scenarios/:id` | GET | **ADMIN** | Детали сценария |
| `/api/career/scenarios/:id` | PUT | **ADMIN** | Обновление сценария |
| `/api/career/scenarios/:id` | DELETE | **ADMIN** | Удаление сценария |

**Примечание:** 
- "Авторизован" означает, что требуется access token в заголовке `Authorization: Bearer <token>`
- "**ADMIN**" означает, что требуется роль администратора (проверка через `roleMiddleware`)

## Типизация для TypeScript

```typescript
// src/types/auth.ts
export enum UserRole {
  SPECIALIST = 'SPECIALIST',
  ADMIN = 'ADMIN',
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface UserPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthRequest extends Request {
  user?: UserPayload;
}
```
