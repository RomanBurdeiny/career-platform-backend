# Career Platform Backend (MVP)

Бэкенд для карьерной платформы. Регистрация по email или по invite-коду.

## Технологический стек

| Технология | Версия | Назначение |
|------------|--------|------------|
| **Node.js** | 18+ | Runtime |
| **TypeScript** | 5.9 | Строгая типизация |
| **Express** | 5.x | Серверный фреймворк |
| **MongoDB** + **Mongoose** | 9.x | База данных и ODM |
| **Zod** | 4.x | Валидация запросов |
| **jsonwebtoken** | 9.x | JWT (Access + Refresh токены) |
| **bcrypt** | 6.x | Хэширование паролей |
| **cookie-parser** | 1.4 | Работа с httpOnly cookies |
| **helmet** | 8.x | Безопасные HTTP заголовки |
| **express-rate-limit** | 8.x | Защита от DDoS и brute force |
| **morgan** | 1.x | Логирование HTTP |
| **dotenv** | 17.x | Переменные окружения |

## Структура проекта

```
career-platform-app/backend/
├── src/
│   ├── controllers/          # Контроллеры
│   │   ├── authController.ts
│   │   ├── inviteController.ts
│   │   ├── analyticsController.ts
│   │   ├── adminAnalyticsController.ts
│   │   ├── profileController.ts
│   │   ├── jobController.ts
│   │   ├── favoriteController.ts
│   │   ├── careerController.ts
│   │   └── usersController.ts
│   ├── middleware/           # Middleware
│   │   ├── authMiddleware.ts
│   │   ├── optionalAuthMiddleware.ts
│   │   ├── roleMiddleware.ts
│   │   ├── validateRequest.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Profile.ts
│   │   ├── RefreshToken.ts
│   │   ├── Invite.ts
│   │   ├── InviteUsage.ts
│   │   ├── AnalyticsEvent.ts
│   │   ├── Job.ts
│   │   └── CareerScenario.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── invite.ts
│   │   ├── analytics.ts
│   │   ├── adminInvites.ts
│   │   ├── adminAnalytics.ts
│   │   ├── profile.ts
│   │   ├── job.ts
│   │   ├── career.ts
│   │   └── users.ts
│   ├── schemas/
│   ├── types/
│   └── utils/
├── index.ts
├── .env
├── package.json
├── API_DOCUMENTATION.md
└── README.md
```

## Установка и запуск

### Требования

- **Node.js** 18+
- **MongoDB** (локально или MongoDB Atlas)
- **npm** или **yarn**

### 1. Установка

```bash
cd career-platform-app/backend
npm install
```

### 2. Переменные окружения

Скопируйте `.env.example` в `.env` и заполните:

```bash
cp .env.example .env
```

Обязательные: `JWT_SECRET`, `PORT`, `MONGODB_URI`, `CLIENT_URL`. OAuth: `GOOGLE_CLIENT_ID`, `TELEGRAM_BOT_TOKEN`.

### 3. Запуск

```bash
# Режим разработки (hot reload)
npm run dev

# Сборка
npm run build

# Production
npm start
```

Сервер по умолчанию слушает порт **3000**.

## API Endpoints

**Полная документация:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Краткий обзор

#### Авторизация (`/api/auth`)

- `POST /api/auth/register` — Регистрация: по email+паролю (`email`, `password`) или по invite (`name`, `email`, `password`, `inviteCode`)
- `POST /api/auth/login` — Вход по email и паролю
- `POST /api/auth/google` — Вход через Google (тело: `{ "idToken": "..." }`)
- `POST /api/auth/telegram` — Вход через Telegram (тело: `{ "id", "first_name", ... }`, опционально `inviteCode`)
- `POST /api/auth/refresh` — Обновление access token (из cookie)
- `POST /api/auth/logout` — Выход

#### Invite (`/api/invites`)

- `GET /api/invites/:code` — Валидация invite (публично)

#### Invite — Admin (`/api/admin/invites`) — требуют роль ADMIN

- `POST /api/admin/invites` — Создание invite
- `GET /api/admin/invites` — Список invite
- `PATCH /api/admin/invites/:id/deactivate` — Деактивация invite

#### Аналитика (`/api/analytics`)

- `POST /api/analytics/events` — Трекинг события (auth опциональна)

#### Аналитика — Admin (`/api/admin/analytics`)

- `GET /api/admin/analytics/summary` — KPI (users, invites created, invites active, invites activated, profiles, jobs viewed)
- `GET /api/admin/analytics/funnel` — Воронка invite (создано → открыто → регистрации → профили)

#### Профиль (`/api/profile`)

- `POST /api/profile` - Создание профиля
- `GET /api/profile` - Получение своего профиля
- `PUT /api/profile` - Обновление своего профиля
- `DELETE /api/profile` - Удаление своего профиля

#### Вакансии (`/api/jobs`) - требуют авторизации

- `GET /api/jobs` - Список вакансий с фильтрами (все авторизованные)
- `GET /api/jobs/:id` - Детали вакансии (все авторизованные)
- `GET /api/jobs/favorites` - Список избранных вакансий (все авторизованные)
- `POST /api/jobs/:id/favorite` - Добавить в избранное (все авторизованные)
- `DELETE /api/jobs/:id/favorite` - Удалить из избранного (все авторизованные)
- `POST /api/jobs` - Создание вакансии (только ADMIN)
- `PUT /api/jobs/:id` - Обновление вакансии (только ADMIN)
- `DELETE /api/jobs/:id` - Деактивация вакансии (только ADMIN)

#### Карьерные рекомендации (`/api/career`) - требуют авторизации

- `GET /api/career/recommendations` - Получение персональных рекомендаций (все авторизованные)
- `POST /api/career/scenarios` - Создание карьерного сценария (только ADMIN)
- `GET /api/career/scenarios` - Список всех сценариев (только ADMIN)
- `GET /api/career/scenarios/:id` - Детали сценария (только ADMIN)
- `PUT /api/career/scenarios/:id` - Обновление сценария (только ADMIN)
- `DELETE /api/career/scenarios/:id` - Удаление сценария (только ADMIN)

### Система токенов

**Access Token:**
- Срок жизни: 20 минут
- Возвращается в JSON response
- Используется для всех API запросов
- Отправляется в заголовке: `Authorization: Bearer <token>`

**Refresh Token:**
- Срок жизни: 7 дней
- Устанавливается в httpOnly cookie (защита от XSS)
- Используется только для обновления access token
- Автоматически отправляется браузером

## Ключевые особенности

### 1. TypeScript
- Полная типизация всего проекта
- Строгий режим (`strict: true`)
- Type guards для безопасной обработки ошибок
- Domain-driven types (auth, profile, user, enums)

### 2. Zod валидация
- Централизованные схемы валидации в `src/schemas/`
- Автоматическая валидация на уровне роутов
- Структурированные сообщения об ошибках
- Разделение по доменам (auth, profile, common)

Пример использования:
```typescript
// src/schemas/auth.schema.ts
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
  }),
});

// src/routes/auth.ts
router.post('/login', validateRequest(loginSchema), authController.login);
```

### 3. Безопасная аутентификация
- **Регистрация:** по email+паролю или по invite (роль из invite)
- **Способы входа:** email+пароль, Google (OAuth 2.0 id_token), Telegram (Login Widget)
- Access Token (20 мин) + Refresh Token (7 дней)
- Refresh token в httpOnly cookie (защита от XSS)
- SameSite=Strict (защита от CSRF)
- Secure flag в production (только HTTPS)
- Автоматическое удаление истекших токенов (TTL index)
- Настраиваемое время жизни токенов через переменные окружения
- Rate limiting на auth эндпоинтах (защита от brute force: 5 попыток за 15 минут)
- Общий rate limiting (100 запросов за 15 минут с одного IP)

### 4. Обработка ошибок
- Глобальный error handler для всех непойманных ошибок
- Type guards для разных типов ошибок
- Централизованные error handlers
- Unknown вместо any в catch блоках
- Специальные обработчики для MongoDB, Mongoose, Zod и JWT ошибок
- Автоматическая обработка 404 для несуществующих эндпоинтов

### 5. RBAC (Role-Based Access Control)
- Роли: `SPECIALIST`, `ADMIN`
- Middleware для проверки ролей
- Типобезопасные enum для ролей
- Разделение прав доступа (CRUD вакансий только для ADMIN)

### 6. Модуль вакансий
- CRUD операции для администраторов
- Фильтрация по направлению, уровню, формату работы, локации
- Мягкое удаление через isActive
- Индексы для оптимизации поиска
- Полная Zod валидация

### 7. Избранное вакансий
- Добавление/удаление вакансий в избранное
- Получение списка избранных вакансий с полной информацией
- Автоматическая фильтрация неактивных вакансий
- Привязка к профилю пользователя
- Проверка на дубликаты

### 8. Карьерные рекомендации (Rule-based)
- Персонализированные рекомендации на основе профиля (direction + level)
- Карьерные сценарии с действиями (lecture, article, consultation, community)
- CRUD операции для администраторов
- Гибкая система фильтрации
- Активация/деактивация сценариев

### Профиль (`/api/profile`)

Все эндпоинты требуют авторизации (JWT токен в заголовке `Authorization: Bearer <token>`).

#### POST `/api/profile`
Создание профиля специалиста

**Request:**
```json
{
  "name": "Иван Иванов",
  "avatar": "https://example.com/avatar.jpg",
  "direction": "IT",
  "level": "Middle",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": "3 года разработки веб-приложений",
  "careerGoal": "Growth"
}
```

**Enum значения:**
- **direction**: `Creative`, `IT`, `E-commerce`, `HoReCa`, `Architecture & Design`, `Production`
- **level**: `Junior`, `Middle`, `Senior`, `Lead`
- **careerGoal**: `Growth`, `Career Change`, `Skill Development`, `Leadership`, `Expertise`

**Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "name": "Иван Иванов",
  "avatar": "https://example.com/avatar.jpg",
  "direction": "IT",
  "level": "Middle",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": "3 года разработки веб-приложений",
  "careerGoal": "Growth",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

#### GET `/api/profile`
Получение своего профиля

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "name": "Иван Иванов",
  "avatar": "https://example.com/avatar.jpg",
  "direction": "IT",
  "level": "Middle",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": "3 года разработки веб-приложений",
  "careerGoal": "Growth",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

#### PUT `/api/profile`
Обновление своего профиля

**Request (можно передать любые поля для обновления):**
```json
{
  "level": "Senior",
  "skills": ["JavaScript", "React", "Node.js", "TypeScript"],
  "careerGoal": "Leadership"
}
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "name": "Иван Иванов",
  "avatar": "https://example.com/avatar.jpg",
  "direction": "IT",
  "level": "Senior",
  "skills": ["JavaScript", "React", "Node.js", "TypeScript"],
  "experience": "3 года разработки веб-приложений",
  "careerGoal": "Leadership",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "updatedAt": "2024-01-02T15:30:00.000Z"
}
```

#### DELETE `/api/profile`
Удаление своего профиля

**Response (200):**
```json
{
  "message": "Профиль успешно удалён",
  "deletedProfile": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Иван Иванов"
  }
}
```

## RBAC (Role-Based Access Control)

Система поддерживает две роли:
- **SPECIALIST** - обычный специалист (по умолчанию)
- **ADMIN** - администратор

Подробнее о настройке и использовании ролей: [RBAC_USAGE.md](./RBAC_USAGE.md)

## Безопасность

- ✅ Хэширование паролей через **bcrypt** (10 раундов)
- ✅ Access Token (20 минут) + Refresh Token (7 дней)
- ✅ Refresh token в httpOnly cookie (защита от XSS)
- ✅ **Helmet** - безопасные HTTP заголовки (защита от XSS, clickjacking, MIME sniffing)
- ✅ **Rate limiting** - защита от DDoS и brute force атак
  - Auth эндпоинты: 5 попыток за 15 минут
  - Общий лимит: 100 запросов за 15 минут с одного IP
- ✅ Zod валидация всех входящих данных
- ✅ Валидация формата email
- ✅ Валидация enum значений
- ✅ Проверка уникальности email
- ✅ RBAC для защиты админских эндпоинтов
- ✅ Пароли никогда не возвращаются в ответах API
- ✅ Логирование HTTP запросов через **morgan**

## База данных (MongoDB)

### User Schema
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['SPECIALIST', 'ADMIN']),
  createdAt: Date,
  updatedAt: Date
}
```

### Profile Schema
```javascript
{
  userId: ObjectId (ref: User, unique),
  name: String,
  avatar: String,
  direction: String (enum),
  level: String (enum),
  skills: [String],
  experience: String,
  careerGoal: String (enum),
  favoriteJobs: [ObjectId] (ref: Job, default: []),
  createdAt: Date,
  updatedAt: Date
}
```

### RefreshToken Schema
```javascript
{
  userId: ObjectId (ref: User),
  expiresAt: Date (TTL index),
  createdAt: Date
}
```

**Примечание:** Refresh token хранится как JWT с `tokenId` (ID документа в БД). При валидации проверяется JWT подпись + существование документа в БД + срок действия.

### Job Schema
```javascript
{
  title: String,
  description: String,
  company: String,
  direction: String (enum),
  level: String (enum),
  workFormat: String (enum: Office/Remote/Hybrid),
  location: String,
  salary: {
    min: Number,
    max: Number,
    currency: String
  },
  requirements: [String],
  responsibilities: [String],
  createdBy: ObjectId (ref: User),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### CareerScenario Schema
```javascript
{
  direction: String (enum),
  level: String (enum),
  title: String,
  description: String,
  actions: [
    {
      type: String (enum: lecture/article/consultation/community),
      title: String,
      description: String,
      link: String (optional)
    }
  ],
  createdBy: ObjectId (ref: User),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

**Примечание:** Карьерные сценарии создаются администратором и автоматически подбираются пользователям на основе их профиля (direction + level). Это rule-based система без использования ML.

## Что готово ✅

- ✅ Регистрация по email или по invite
- ✅ Авторизация (login, logout, Google OAuth, Telegram OAuth)
- ✅ Access Token (20 мин) + Refresh Token (7 дней) в httpOnly cookie
- ✅ RBAC (SPECIALIST, ADMIN)
- ✅ Invite: создание, валидация, деактивация (ADMIN)
- ✅ Аналитика: трекинг событий, summary, funnel (ADMIN)
- ✅ CRUD профиля, вакансий, карьерных сценариев
- ✅ Избранные вакансии, карьерные рекомендации
- ✅ Управление пользователями (ADMIN)
- ✅ Zod, Mongoose, TypeScript, helmet, rate limiting

## TODO

- [ ] Загрузка аватаров (cloud storage)
- [ ] Подписки (Subscriptions)

## Разработчик

Проект разработан в рамках MVP карьерной платформы.

## Лицензия

ISC
