# API Документация

## Базовый URL
```
http://localhost:3000
```

---

## Аутентификация

### Регистрация
**Endpoint:** `POST /api/auth/register`

**Описание:** Регистрация нового пользователя. Возвращает access token (20 минут по умолчанию) и refresh token (7 дней по умолчанию). Время жизни токенов настраивается через переменные окружения `ACCESS_TOKEN_EXPIRES_IN` и `REFRESH_TOKEN_EXPIRES_IN_DAYS`.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Успешный ответ (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "SPECIALIST"
  }
}
```

**Set-Cookie заголовок:**
```
refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Важно:** 
- Refresh token устанавливается в httpOnly cookie и недоступен для JavaScript
- SameSite настраивается через переменную окружения `COOKIE_SAME_SITE` (по умолчанию `lax`)
- Пароль: минимум 8 символов, хотя бы одна заглавная буква и одна цифра

---

### Вход
**Endpoint:** `POST /api/auth/login`

**Описание:** Авторизация существующего пользователя. Возвращает access token в JSON, refresh token устанавливается в httpOnly cookie.

**Тело запроса:**
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Успешный ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "SPECIALIST"
  }
}
```

**Set-Cookie заголовок:**
```
refreshToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Возможные ошибки:**
- `401` - Неверный email или пароль (или аккаунт зарегистрирован через Google/Telegram — в ответе может быть `authProvider`)
- `403` - Аккаунт недоступен (пользователь заблокирован или удалён)
- `500` - Внутренняя ошибка сервера

---

### Вход через Google
**Endpoint:** `POST /api/auth/google`

**Описание:** Вход или регистрация через Google. Фронтенд передаёт `id_token`, полученный от Google Sign-In; бэкенд проверяет подпись через Google OAuth2 Client и создаёт/находит пользователя. Ответ — те же access token и refresh token в cookie, что и при обычном входе.

**Требования:** В `.env` должен быть задан `GOOGLE_CLIENT_ID` (Client ID из Google Cloud Console, OAuth 2.0).

**Тело запроса:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

**Успешный ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@gmail.com",
    "role": "SPECIALIST"
  }
}
```

**Set-Cookie:** аналогично логину (refresh token в httpOnly cookie).

**Возможные ошибки:**
- `400` - Не удалось получить email из Google
- `401` - Недействительный Google токен
- `403` - Аккаунт недоступен
- `500` - Google OAuth не настроен или внутренняя ошибка

---

### Вход через Telegram
**Endpoint:** `POST /api/auth/telegram`

**Описание:** Вход или регистрация через Telegram Login Widget. Фронтенд передаёт объект, полученный от виджета (поля `id`, `auth_date`, `hash` обязательны); бэкенд проверяет `hash` через HMAC-SHA256 с секретом от токена бота и создаёт/находит пользователя. Ответ — access token и refresh token в cookie.

**Требования:** В `.env` должен быть задан `TELEGRAM_BOT_TOKEN` (токен бота от @BotFather). В настройках бота должен быть включён Telegram Login Widget и указан домен фронтенда.

**Тело запроса:**
```json
{
  "id": 123456789,
  "first_name": "Иван",
  "last_name": "Иванов",
  "username": "ivan",
  "photo_url": "https://t.me/i/userpic/...",
  "auth_date": 1700000000,
  "hash": "a1b2c3..."
}
```

**Успешный ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "telegram_123456789@placeholder.local",
    "role": "SPECIALIST"
  }
}
```

**Примечание:** У пользователей, зарегистрированных только через Telegram, в ответе может быть placeholder-email; для отображения имени можно использовать данные профиля или Telegram username.

**Возможные ошибки:**
- `401` - Недействительные данные Telegram или устаревший auth_date (старше 2 минут)
- `403` - Аккаунт недоступен
- `500` - Telegram не настроен или внутренняя ошибка

---

### Обновление Access Token
**Endpoint:** `POST /api/auth/refresh`

**Описание:** Обновляет истекший access token через refresh token из httpOnly cookie.

**Требования:**
- Refresh token должен быть в cookie (автоматически отправляется браузером)
- Запрос должен быть с `credentials: 'include'` (для fetch/axios)

**Тело запроса:** не требуется (токен читается из cookie)

**Успешный ответ (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Примечание:** Refresh token остается в cookie, обновляется только access token в JSON.

**Возможные ошибки:**
- `401` - Refresh token отсутствует
- `401` - Пользователь недоступен (заблокирован или удалён)
- `401` - Refresh token недействителен или истек
- `404` - Пользователь не найден
- `500` - Внутренняя ошибка сервера

---

### Выход
**Endpoint:** `POST /api/auth/logout`

**Описание:** Выход из системы. Удаляет refresh token из базы данных и очищает httpOnly cookie.

**Требования:**
- Запрос должен быть с `credentials: 'include'` (для fetch/axios)

**Тело запроса:** не требуется (токен читается из cookie)

**Успешный ответ (200):**
```json
{
  "message": "Выход выполнен успешно"
}
```

**Примечание:** 
- Refresh token удаляется из БД и cookie
- Access token продолжит работать до истечения (максимум 20 минут)
- Клиент должен удалить access token из памяти/storage

---

## Вакансии (требуют Authorization)

**Важно:** Все эндпоинты вакансий требуют access token в заголовке:
```
Authorization: Bearer <accessToken>
```

---

### Получение списка вакансий
**Endpoint:** `GET /api/jobs`

**Описание:** Получение списка активных вакансий с возможностью фильтрации.

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Query параметры (опциональные):**
- `search` - текстовый поиск по подстроке (регистронезависимый) в названии вакансии, описании и компании. Пример: `search=react` найдёт «React Developer»
- `direction` - фильтр по направлению (Creative, IT, E-commerce, HoReCa, Architecture & Design, Production)
- `level` - фильтр по уровню (Junior, Middle, Senior, Lead)
- `workFormat` - фильтр по формату работы (Office, Remote, Hybrid)
- `location` - фильтр по локации (строка)
- `page` - номер страницы (по умолчанию 1)
- `limit` - количество вакансий на странице (по умолчанию 10, максимум 100)

Параметры комбинируются. При отсутствии фильтров и пагинации возвращаются все активные вакансии (с page=1, limit=10 по умолчанию).

**Пример запроса:**
```
GET /api/jobs?direction=IT&level=Middle&workFormat=Remote
GET /api/jobs?search=react
GET /api/jobs?search=developer&location=Москва
GET /api/jobs?page=2&limit=20
GET /api/jobs?direction=IT&page=1&limit=10
```

**Успешный ответ (200):**
```json
{
  "total": 2,
  "page": 1,
  "limit": 10,
  "jobs": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "title": "Middle React Developer",
      "description": "Ищем опытного React разработчика...",
      "company": "Tech Company",
      "direction": "IT",
      "level": "Middle",
      "workFormat": "Remote",
      "location": "Москва / Удаленно",
      "salary": {
        "min": 150000,
        "max": 250000,
        "currency": "RUB"
      },
      "requirements": [
        "React 3+ года",
        "TypeScript",
        "REST API"
      ],
      "responsibilities": [
        "Разработка новых фич",
        "Code review",
        "Менторство junior разработчиков"
      ],
      "createdBy": {
        "_id": "507f1f77bcf86cd799439011",
        "email": "admin@example.com",
        "role": "ADMIN"
      },
      "isActive": true,
      "createdAt": "2026-01-29T12:00:00.000Z",
      "updatedAt": "2026-01-29T12:00:00.000Z"
    }
  ]
}
```

---

### Получение вакансии по ID
**Endpoint:** `GET /api/jobs/:id`

**Описание:** Получение детальной информации об одной вакансии.

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Успешный ответ (200):** см. структуру вакансии выше

**Ошибка (404):**
```json
{
  "error": "Вакансия не найдена"
}
```

---

### Создание вакансии (только ADMIN)
**Endpoint:** `POST /api/jobs`

**Описание:** Создание новой вакансии. Доступно только администраторам.

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Тело запроса:**
```json
{
  "title": "Middle React Developer",
  "description": "Ищем опытного React разработчика для работы над enterprise проектами...",
  "company": "Tech Company",
  "direction": "IT",
  "level": "Middle",
  "workFormat": "Remote",
  "location": "Москва / Удаленно",
  "salary": {
    "min": 150000,
    "max": 250000,
    "currency": "RUB"
  },
  "requirements": [
    "React 3+ года",
    "TypeScript",
    "REST API"
  ],
  "responsibilities": [
    "Разработка новых фич",
    "Code review",
    "Менторство junior разработчиков"
  ]
}
```

**Обязательные поля:**
- `title` - название вакансии
- `description` - описание (минимум 20 символов)
- `company` - название компании
- `direction` - направление (enum)
- `level` - уровень (enum)
- `workFormat` - формат работы (enum)
- `location` - локация
- `requirements` - массив требований (минимум 1)
- `responsibilities` - массив обязанностей (минимум 1)

**Опциональные поля:**
- `salary` - зарплатная вилка (объект с полями min, max, currency)

**Успешный ответ (201):**
```json
{
  "_id": "507f1f77bcf86cd799439013",
  "title": "Middle React Developer",
  "description": "Ищем опытного React разработчика...",
  "company": "Tech Company",
  "direction": "IT",
  "level": "Middle",
  "workFormat": "Remote",
  "location": "Москва / Удаленно",
  "salary": {
    "min": 150000,
    "max": 250000,
    "currency": "RUB"
  },
  "requirements": [...],
  "responsibilities": [...],
  "createdBy": "507f1f77bcf86cd799439011",
  "isActive": true,
  "createdAt": "2026-01-29T12:00:00.000Z",
  "updatedAt": "2026-01-29T12:00:00.000Z"
}
```

**Ошибка (403):**
```json
{
  "error": "Доступ запрещён. Требуется роль: ADMIN"
}
```

---

### Обновление вакансии (только ADMIN)
**Endpoint:** `PUT /api/jobs/:id`

**Описание:** Обновление существующей вакансии. Доступно только администраторам.

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Тело запроса (все поля опциональны):**
```json
{
  "title": "Senior React Developer",
  "level": "Senior",
  "salary": {
    "min": 200000,
    "max": 350000,
    "currency": "RUB"
  },
  "isActive": false
}
```

**Успешный ответ (200):** обновленная вакансия

**Ошибка (404):**
```json
{
  "error": "Вакансия не найдена"
}
```

---

### Удаление вакансии (только ADMIN)
**Endpoint:** `DELETE /api/jobs/:id`

**Описание:** Деактивация вакансии (мягкое удаление через isActive = false). Доступно только администраторам.

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Успешный ответ (200):**
```json
{
  "message": "Вакансия успешно деактивирована",
  "job": {
    "id": "507f1f77bcf86cd799439013",
    "title": "Middle React Developer",
    "isActive": false
  }
}
```

---

## Избранное вакансий (требуют Authorization)

**Важно:** Все эндпоинты избранного требуют access token в заголовке:
```
Authorization: Bearer <accessToken>
```

**Требования:** У пользователя должен быть создан профиль!

---

### Получение списка избранных вакансий

**Endpoint:** `GET /api/jobs/favorites`

**Права доступа:** Авторизованный пользователь (с профилем)

**Описание:** Возвращает список всех вакансий, добавленных пользователем в избранное.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Пример успешного ответа (200):**
```json
{
  "total": 2,
  "favoriteJobs": [
    {
      "_id": "677e8e9a1234567890abcdef",
      "title": "Senior Frontend Developer",
      "description": "Работа в крупном стартапе",
      "company": "TechCorp",
      "direction": "IT",
      "level": "Senior",
      "workFormat": "Hybrid",
      "location": "Москва",
      "salary": {
        "min": 200000,
        "max": 300000,
        "currency": "RUB"
      },
      "requirements": ["React", "TypeScript", "5+ лет опыта"],
      "responsibilities": ["Разработка UI", "Код-ревью"],
      "createdBy": {
        "_id": "677e8e9a1234567890abcd00",
        "email": "admin@example.com",
        "role": "ADMIN"
      },
      "isActive": true,
      "createdAt": "2026-01-29T10:00:00.000Z",
      "updatedAt": "2026-01-29T10:00:00.000Z"
    }
  ]
}
```

**Возможные ошибки:**
- `401` - Пользователь не авторизован
- `404` - Профиль не найден
- `500` - Внутренняя ошибка сервера

**Примечания:**
- Показываются только активные вакансии (`isActive: true`)
- Если вакансия была удалена из БД, она автоматически исключается из результата
- Пользователь должен иметь созданный профиль

---

### Добавление вакансии в избранное

**Endpoint:** `POST /api/jobs/:id/favorite`

**Права доступа:** Авторизованный пользователь (с профилем)

**Описание:** Добавляет указанную вакансию в список избранного пользователя.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Параметры URL:**
- `id` (string, обязательный) - ID вакансии

**Пример успешного ответа (200):**
```json
{
  "message": "Вакансия добавлена в избранное",
  "favoriteJobsCount": 3
}
```

**Возможные ошибки:**
- `400` - Вакансия уже добавлена в избранное
- `400` - Нельзя добавить неактивную вакансию в избранное
- `401` - Пользователь не авторизован
- `404` - Вакансия не найдена
- `404` - Профиль не найден (создайте профиль)
- `500` - Внутренняя ошибка сервера

**Примечания:**
- Можно добавить только активные вакансии (`isActive: true`)
- Повторное добавление одной и той же вакансии возвращает ошибку
- Требуется созданный профиль пользователя

---

### Удаление вакансии из избранного

**Endpoint:** `DELETE /api/jobs/:id/favorite`

**Права доступа:** Авторизованный пользователь (с профилем)

**Описание:** Удаляет указанную вакансию из списка избранного пользователя.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Параметры URL:**
- `id` (string, обязательный) - ID вакансии

**Пример успешного ответа (200):**
```json
{
  "message": "Вакансия удалена из избранного",
  "favoriteJobsCount": 2
}
```

**Возможные ошибки:**
- `400` - Вакансия не найдена в избранном
- `401` - Пользователь не авторизован
- `404` - Профиль не найден
- `500` - Внутренняя ошибка сервера

**Примечания:**
- Можно удалить вакансию, даже если она стала неактивной или была удалена из БД
- Попытка удалить вакансию, которой нет в избранном, возвращает ошибку

---

## Карьерные рекомендации

### Получение персональных рекомендаций

**Endpoint:** `GET /api/career/recommendations`

**Права доступа:** Авторизованный пользователь (с профилем)

**Описание:** Возвращает карьерные рекомендации, подобранные на основе профиля пользователя (направление и уровень). Рекомендации формируются rule-based методом без использования ML.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Пример успешного ответа (200):**
```json
{
  "profile": {
    "direction": "IT",
    "level": "Middle",
    "careerGoal": "Growth"
  },
  "recommendations": [
    {
      "_id": "677e8e9a1234567890abcd11",
      "direction": "IT",
      "level": "Middle",
      "title": "Путь в Senior разработчика",
      "description": "Рекомендуемый карьерный путь для перехода на позицию Senior Developer в IT...",
      "actions": [
        {
          "type": "lecture",
          "title": "Архитектура микросервисов",
          "description": "Онлайн-курс по проектированию распределенных систем",
          "link": "https://example.com/course"
        },
        {
          "type": "consultation",
          "title": "Консультация с ментором",
          "description": "Персональная консультация по карьерному росту"
        },
        {
          "type": "article",
          "title": "Как стать Senior: практическое руководство",
          "description": "Статья с практическими советами по развитию",
          "link": "https://example.com/article"
        },
        {
          "type": "community",
          "title": "Клуб IT-лидеров",
          "description": "Сообщество для обмена опытом и нетворкинга"
        }
      ],
      "isActive": true,
      "createdAt": "2026-01-28T10:00:00.000Z",
      "updatedAt": "2026-01-29T15:30:00.000Z"
    }
  ]
}
```

**Возможные ошибки:**
- `400` - Профиль пользователя не найден (необходимо создать профиль)
- `401` - Пользователь не авторизован
- `404` - Рекомендации не найдены для данного профиля
- `500` - Внутренняя ошибка сервера

**Примечания:**
- Рекомендации подбираются на основе `direction` и `level` из профиля пользователя
- Показываются только активные сценарии (`isActive: true`)
- Если профиль не создан, возвращается ошибка 400
- Типы действий (action.type): `lecture`, `article`, `consultation`, `community`

---

### [ADMIN] Создание карьерного сценария

**Endpoint:** `POST /api/career/scenarios`

**Права доступа:** Только ADMIN

**Описание:** Создает новый карьерный сценарий для определенного направления и уровня.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Тело запроса:**
```json
{
  "direction": "IT",
  "level": "Middle",
  "title": "Путь в Senior разработчика",
  "description": "Рекомендуемый карьерный путь для перехода на позицию Senior Developer в IT. Включает технические и управленческие компетенции.",
  "actions": [
    {
      "type": "lecture",
      "title": "Архитектура микросервисов",
      "description": "Онлайн-курс по проектированию распределенных систем",
      "link": "https://example.com/course"
    },
    {
      "type": "consultation",
      "title": "Консультация с ментором",
      "description": "Персональная консультация по карьерному росту"
    }
  ]
}
```

**Допустимые значения:**
- `direction`: `'Creative'`, `'IT'`, `'E-commerce'`, `'HoReCa'`, `'Architecture & Design'`, `'Production'`
- `level`: `'Junior'`, `'Middle'`, `'Senior'`, `'Lead'`
- `action.type`: `'lecture'`, `'article'`, `'consultation'`, `'community'`

**Пример успешного ответа (201):**
```json
{
  "_id": "677e8e9a1234567890abcd11",
  "direction": "IT",
  "level": "Middle",
  "title": "Путь в Senior разработчика",
  "description": "Рекомендуемый карьерный путь для перехода на позицию Senior Developer в IT. Включает технические и управленческие компетенции.",
  "actions": [
    {
      "type": "lecture",
      "title": "Архитектура микросервисов",
      "description": "Онлайн-курс по проектированию распределенных систем",
      "link": "https://example.com/course"
    },
    {
      "type": "consultation",
      "title": "Консультация с ментором",
      "description": "Персональная консультация по карьерному росту"
    }
  ],
  "createdBy": "677e8e9a1234567890abcd00",
  "isActive": true,
  "createdAt": "2026-01-29T15:30:00.000Z",
  "updatedAt": "2026-01-29T15:30:00.000Z"
}
```

**Возможные ошибки:**
- `400` - Ошибка валидации Zod (некорректные данные)
- `401` - Пользователь не авторизован
- `403` - Недостаточно прав (только ADMIN)
- `500` - Внутренняя ошибка сервера

**Правила валидации:**
- `title`: минимум 5 символов
- `description`: минимум 20 символов
- `actions`: минимум 1 действие
- `action.title`: минимум 3 символа
- `action.description`: минимум 10 символов
- `action.link`: должен быть валидным URL (опционально)

---

### [ADMIN] Получение всех карьерных сценариев

**Endpoint:** `GET /api/career/scenarios`

**Права доступа:** Только ADMIN

**Описание:** Возвращает список всех карьерных сценариев с возможностью фильтрации.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Query параметры (опционально):**
- `direction` (string) - фильтр по направлению (например, `IT`, `Creative`)
- `level` (string) - фильтр по уровню (например, `Middle`, `Senior`)
- `isActive` (boolean) - фильтр по статусу активности (`true` или `false`)

**Пример запроса:**
```
GET /api/career/scenarios?direction=IT&level=Middle&isActive=true
```

**Пример успешного ответа (200):**
```json
[
  {
    "_id": "677e8e9a1234567890abcd11",
    "direction": "IT",
    "level": "Middle",
    "title": "Путь в Senior разработчика",
    "description": "Рекомендуемый карьерный путь...",
    "actions": [
      {
        "type": "lecture",
        "title": "Архитектура микросервисов",
        "description": "Онлайн-курс...",
        "link": "https://example.com/course"
      }
    ],
    "createdBy": {
      "_id": "677e8e9a1234567890abcd00",
      "email": "admin@example.com",
      "role": "ADMIN"
    },
    "isActive": true,
    "createdAt": "2026-01-28T10:00:00.000Z",
    "updatedAt": "2026-01-29T15:30:00.000Z"
  }
]
```

**Возможные ошибки:**
- `401` - Пользователь не авторизован
- `403` - Недостаточно прав (только ADMIN)
- `500` - Внутренняя ошибка сервера

**Примечания:**
- Без фильтров возвращает все сценарии (активные и неактивные)
- Поле `createdBy` автоматически populate с информацией о пользователе

---

### [ADMIN] Получение карьерного сценария по ID

**Endpoint:** `GET /api/career/scenarios/:id`

**Права доступа:** Только ADMIN

**Описание:** Возвращает один карьерный сценарий по указанному ID.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Параметры URL:**
- `id` (string, обязательный) - ID карьерного сценария

**Пример запроса:**
```
GET /api/career/scenarios/677e8e9a1234567890abcd11
```

**Пример успешного ответа (200):**
```json
{
  "_id": "677e8e9a1234567890abcd11",
  "direction": "IT",
  "level": "Middle",
  "title": "Путь в Senior разработчика",
  "description": "Рекомендуемый карьерный путь...",
  "actions": [
    {
      "type": "lecture",
      "title": "Архитектура микросервисов",
      "description": "Онлайн-курс...",
      "link": "https://example.com/course"
    }
  ],
  "createdBy": {
    "_id": "677e8e9a1234567890abcd00",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "isActive": true,
  "createdAt": "2026-01-28T10:00:00.000Z",
  "updatedAt": "2026-01-29T15:30:00.000Z"
}
```

**Возможные ошибки:**
- `401` - Пользователь не авторизован
- `403` - Недостаточно прав (только ADMIN)
- `404` - Карьерный сценарий не найден
- `500` - Внутренняя ошибка сервера

---

### [ADMIN] Обновление карьерного сценария

**Endpoint:** `PUT /api/career/scenarios/:id`

**Права доступа:** Только ADMIN

**Описание:** Обновляет существующий карьерный сценарий.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Параметры URL:**
- `id` (string, обязательный) - ID карьерного сценария

**Тело запроса (все поля опциональны):**
```json
{
  "title": "Новое название",
  "description": "Обновленное описание карьерного пути...",
  "actions": [
    {
      "type": "article",
      "title": "Новая статья",
      "description": "Описание новой статьи",
      "link": "https://example.com/new-article"
    }
  ],
  "isActive": false
}
```

**Пример успешного ответа (200):**
```json
{
  "_id": "677e8e9a1234567890abcd11",
  "direction": "IT",
  "level": "Middle",
  "title": "Новое название",
  "description": "Обновленное описание карьерного пути...",
  "actions": [
    {
      "type": "article",
      "title": "Новая статья",
      "description": "Описание новой статьи",
      "link": "https://example.com/new-article"
    }
  ],
  "createdBy": "677e8e9a1234567890abcd00",
  "isActive": false,
  "createdAt": "2026-01-28T10:00:00.000Z",
  "updatedAt": "2026-01-29T16:00:00.000Z"
}
```

**Возможные ошибки:**
- `400` - Ошибка валидации Zod (некорректные данные)
- `401` - Пользователь не авторизован
- `403` - Недостаточно прав (только ADMIN)
- `404` - Карьерный сценарий не найден
- `500` - Внутренняя ошибка сервера

**Примечания:**
- Можно обновить любое поле, все поля опциональны
- Для деактивации сценария установите `isActive: false`

---

### [ADMIN] Удаление карьерного сценария

**Endpoint:** `DELETE /api/career/scenarios/:id`

**Права доступа:** Только ADMIN

**Описание:** Удаляет карьерный сценарий из базы данных.

**Требуемые заголовки:**
```
Authorization: Bearer <access_token>
```

**Параметры URL:**
- `id` (string, обязательный) - ID карьерного сценария

**Пример успешного ответа (200):**
```json
{
  "message": "Карьерный сценарий успешно удален"
}
```

**Возможные ошибки:**
- `401` - Пользователь не авторизован
- `403` - Недостаточно прав (только ADMIN)
- `404` - Карьерный сценарий не найден
- `500` - Внутренняя ошибка сервера

**Примечания:**
- Удаление карьерного сценария необратимо
- Рекомендуется вместо удаления использовать деактивацию (`isActive: false`)

---

## Профиль (требуют Authorization)

**Важно:** Все эндпоинты профиля требуют access token в заголовке:
```
Authorization: Bearer <accessToken>
```

---

### Создание профиля
**Endpoint:** `POST /api/profile`

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Тело запроса:**
```json
{
  "name": "Иван Иванов",
  "avatar": "https://example.com/avatar.jpg",
  "direction": "IT",
  "level": "Middle",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": "5 лет опыта в веб-разработке",
  "careerGoal": "Growth"
}
```

**Важно:** Поле `favoriteJobs` передавать НЕ нужно - оно автоматически создается как пустой массив.

**Допустимые значения:**
- `direction`: `'Creative'`, `'IT'`, `'E-commerce'`, `'HoReCa'`, `'Architecture & Design'`, `'Production'`
- `level`: `'Junior'`, `'Middle'`, `'Senior'`, `'Lead'`
- `careerGoal`: `'Growth'`, `'Career Change'`, `'Skill Development'`, `'Leadership'`, `'Expertise'`

**Успешный ответ (201):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "name": "Иван Иванов",
  "avatar": "https://example.com/avatar.jpg",
  "direction": "IT",
  "level": "Middle",
  "skills": ["JavaScript", "React", "Node.js"],
  "experience": "5 лет опыта в веб-разработке",
  "careerGoal": "Growth",
  "favoriteJobs": [],
  "createdAt": "2026-01-29T12:00:00.000Z",
  "updatedAt": "2026-01-29T12:00:00.000Z"
}
```

**Примечание:** Поле `favoriteJobs` автоматически инициализируется пустым массивом при создании профиля. Передавать его в запросе НЕ нужно.

---

### Получение профиля
**Endpoint:** `GET /api/profile`

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Тело:** не требуется

**Успешный ответ (200):** см. ответ создания профиля

---

### Обновление профиля
**Endpoint:** `PUT /api/profile`

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Тело запроса:** (все поля опциональны, можно отправить любое подмножество)
```json
{
  "name": "Иван Петров",
  "level": "Senior"
}
```

**Успешный ответ (200):** см. ответ создания профиля

---

### Удаление аватарки
**Endpoint:** `DELETE /api/profile/avatar`

**Описание:** Удаляет аватарку текущего пользователя (устанавливает поле `avatar` в `null`).

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Тело:** не требуется

**Успешный ответ (200):** Возвращает обновлённый профиль (см. ответ создания профиля; поле `avatar` будет `null`)

**Возможные ошибки:**
- `401` - Пользователь не авторизован
- `404` - Профиль не найден
- `500` - Внутренняя ошибка сервера

---

### Замена аватарки
**Endpoint:** `PUT /api/profile/avatar`

**Описание:** Заменяет аватарку на новый URL. Подходит для обновления изображения без изменения остальных полей профиля.

**Заголовки:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Тело запроса:**
```json
{
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Поле `avatar`:** обязательный, валидный URL.

**Успешный ответ (200):** Возвращает обновлённый профиль (см. ответ создания профиля; поле `avatar` содержит новый URL)

**Возможные ошибки:**
- `400` - Неверный формат URL
- `401` - Пользователь не авторизован
- `404` - Профиль не найден
- `500` - Внутренняя ошибка сервера

**Примечание:** Аватарка хранится как URL. Файлы на сервер не загружаются — для замены аватарки фронтенд должен сначала загрузить изображение во внешнее хранилище (Cloudinary, S3 и т.п.) и передать полученный URL.

---

### Удаление профиля
**Endpoint:** `DELETE /api/profile`

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Тело:** не требуется

**Успешный ответ (200):**
```json
{
  "message": "Профиль успешно удалён",
  "deletedProfile": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Иван Иванов"
  }
}
```

---

## Управление пользователями (только ADMIN)

**Важно:** Все эндпоинты `/api/users` требуют роль ADMIN. Access token в заголовке:
```
Authorization: Bearer <accessToken>
```

**Возможные ошибки доступа:**
- `401` - Пользователь не авторизован
- `403` - Доступ запрещён (требуется роль ADMIN)
- `403` - Пользователь заблокирован (при обращении к любому защищённому эндпоинту)

---

### [ADMIN] Получение списка пользователей
**Endpoint:** `GET /api/users`

**Описание:** Возвращает список пользователей с пагинацией, фильтрацией по роли и поиском по email или имени в профиле. Не возвращает удалённых пользователей (isDeleted).

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Query параметры (опциональные):**
- `page` - номер страницы (по умолчанию 1)
- `limit` - количество на странице (по умолчанию 10, максимум 100)
- `role` - фильтр по роли: `ADMIN` | `SPECIALIST`
- `search` - поиск по подстроке (регистронезависимый) в email или в имени профиля

**Пример запроса:**
```
GET /api/users
GET /api/users?page=2&limit=20
GET /api/users?role=SPECIALIST
GET /api/users?search=ivan
GET /api/users?search=@example.com&page=1&limit=10
```

**Успешный ответ (200):**
```json
{
  "total": 25,
  "page": 1,
  "limit": 10,
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "SPECIALIST",
      "isBlocked": false,
      "isDeleted": false,
      "isSubscribed": true,
      "createdAt": "2026-01-29T12:00:00.000Z",
      "updatedAt": "2026-01-29T12:00:00.000Z",
      "profile": {
        "name": "Иван Иванов",
        "avatar": "https://example.com/avatar.jpg"
      }
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "email": "admin@example.com",
      "role": "ADMIN",
      "isBlocked": false,
      "isDeleted": false,
      "isSubscribed": true,
      "createdAt": "2026-01-28T10:00:00.000Z",
      "updatedAt": "2026-01-28T10:00:00.000Z",
      "profile": null
    }
  ]
}
```

**Примечание:** Поле `profile` — данные из профиля специалиста (name, avatar). Если профиля нет, `profile` будет `null`.

---

### [ADMIN] Изменение роли пользователя
**Endpoint:** `PATCH /api/users/:id/role`

**Описание:** Изменяет роль пользователя (ADMIN или SPECIALIST).

**Заголовки:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Параметры пути:** `id` — ObjectId пользователя

**Тело запроса:**
```json
{
  "role": "ADMIN"
}
```

**Допустимые значения `role`:** `ADMIN`, `SPECIALIST`

**Успешный ответ (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "ADMIN",
  "isBlocked": false,
  "isDeleted": false,
  "isSubscribed": true
}
```

**Ограничения:**
- Нельзя изменить роль самому себе
- Нельзя убрать роль ADMIN у последнего администратора

**Возможные ошибки:**
- `400` - Нельзя изменить роль самому себе
- `400` - Нельзя убрать роль ADMIN у последнего администратора
- `404` - Пользователь не найден

---

### [ADMIN] Блокировка/разблокировка пользователя
**Endpoint:** `PATCH /api/users/:id/block`

**Описание:** Устанавливает флаг `isBlocked`. Заблокированный пользователь получает 403 при обращении к защищённым эндпоинтам.

**Заголовки:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Параметры пути:** `id` — ObjectId пользователя

**Тело запроса:**
```json
{
  "blocked": true
}
```

**Успешный ответ (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "SPECIALIST",
  "isBlocked": true,
  "isDeleted": false,
  "isSubscribed": true
}
```

**Ограничения:**
- Нельзя заблокировать самого себя

**Возможные ошибки:**
- `400` - Нельзя заблокировать самого себя
- `404` - Пользователь не найден

---

### [ADMIN] Изменение подписки пользователя
**Endpoint:** `PATCH /api/users/:id/subscription`

**Описание:** Включает или выключает флаг подписки. Используется админом для тестирования поведения пользователей с подпиской и без. Платежи не интегрированы — подписка управляется вручную.

**Заголовки:**
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Параметры пути:** `id` — ObjectId пользователя

**Тело запроса:**
```json
{
  "isSubscribed": false
}
```

**Успешный ответ (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "role": "SPECIALIST",
  "isBlocked": false,
  "isDeleted": false,
  "isSubscribed": false
}
```

**Возможные ошибки:**
- `404` - Пользователь не найден

---

### [ADMIN] Удаление пользователя (soft delete)
**Endpoint:** `DELETE /api/users/:id`

**Описание:** Мягкое удаление пользователя. Устанавливает `isDeleted: true` и `isBlocked: true`. Пользователь не будет отображаться в списке и не сможет авторизоваться.

**Заголовки:**
```
Authorization: Bearer <accessToken>
```

**Параметры пути:** `id` — ObjectId пользователя

**Тело:** не требуется

**Успешный ответ (200):**
```json
{
  "message": "Пользователь успешно деактивирован",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "role": "SPECIALIST",
    "isBlocked": true,
    "isDeleted": true
  }
}
```

**Ограничения:**
- Нельзя удалить самого себя
- Нельзя удалить последнего администратора

**Возможные ошибки:**
- `400` - Нельзя удалить самого себя
- `400` - Нельзя удалить последнего администратора
- `404` - Пользователь не найден

---

## Подписка (архитектура)

### Текущий режим

В тестовом режиме **все пользователи имеют полный доступ** (`isSubscribed: true` по умолчанию). Middleware проверки подписки (`subscriptionMiddleware`) реализован, но **пока не применён** ни к одному эндпоинту.

### Модель данных

- В `User` добавлено поле `isSubscribed: boolean` (по умолчанию `true`).
- Админ может менять подписку через `PATCH /api/users/:id/subscription`.
- Платежи (Stripe, Telegram и т.п.) не интегрированы — подписка управляется вручную.

### Эндпоинты для будущих ограничений

Когда ограничения по подписке будут включены, `subscriptionMiddleware` планируется повесить на:

| Эндпоинт | Планируемое ограничение без подписки |
|----------|--------------------------------------|
| `GET /api/jobs` | Ограниченное число вакансий (например, 3–5 в неделю) |
| `GET /api/career/recommendations` | Только базовый вариант, без деталей и карточек действий |
| `GET /api/jobs/favorites` | Закрыт или ограничен |
| `POST /api/jobs/:id/favorite` | Закрыт |
| `DELETE /api/jobs/:id/favorite` | Закрыт |
| Карьерные сценарии | actions (консультации, лекции, статьи, клубы) — закрыты без подписки |

### Как включить ограничения

1. Изменить `default` поля `isSubscribed` в модели User на `false` (для новых пользователей).
2. Подключить `subscriptionMiddleware` к нужным роутам.
3. При необходимости реализовать лимиты (например, просмотры вакансий в неделю).

### Ошибка 403 при отсутствии подписки

```json
{
  "error": "Требуется подписка для доступа"
}
```

---

## Обработка ошибок

API использует централизованный глобальный error handler для обработки всех непойманных ошибок. Все эндпоинты возвращают ошибки в едином формате:

**Валидация (400):**
```json
{
  "error": "Ошибка валидации",
  "details": [
    {
      "field": "body.email",
      "message": "Неверный формат email"
    }
  ]
}
```

**Авторизация (401):**
```json
{
  "error": "Невалидный или истёкший access token"
}
```

**Доступ запрещён (403):**
```json
{
  "error": "Доступ запрещён. Недостаточно прав."
}
```
или
```json
{
  "error": "Пользователь заблокирован"
}
```
или
```json
{
  "error": "Требуется подписка для доступа"
}
```

**JWT ошибки (401):**
```json
{
  "error": "Невалидный токен"
}
```
или
```json
{
  "error": "Токен истек"
}
```

**Не найдено (404):**
```json
{
  "error": "Профиль не найден"
}
```

**Несуществующий эндпоинт (404):**
```json
{
  "error": "Эндпоинт не найден",
  "path": "/api/nonexistent"
}
```

**Конфликт (409):**
```json
{
  "error": "Пользователь с таким email уже существует"
}
```
или
```json
{
  "error": "Конфликт данных. Запись с такими данными уже существует"
}
```

**Превышен лимит запросов (429):**
```json
{
  "error": "Слишком много запросов с этого IP, попробуйте позже"
}
```
или для auth эндпоинтов:
```json
{
  "error": "Слишком много попыток авторизации. Попробуйте через 15 минут"
}
```

**Внутренняя ошибка (500):**
```json
{
  "error": "Описание ошибки"
}
```

---

## Важные изменения по безопасности

### Access и Refresh токены:
- **Access Token** (JSON):
  - Срок жизни: 20 минут (по умолчанию)
  - Настраивается через переменную окружения `ACCESS_TOKEN_EXPIRES_IN` (формат: '20m', '1h', '30d')
  - Возвращается в JSON response
  - Храните в памяти приложения или sessionStorage
  - Используется для всех API запросов
  
- **Refresh Token** (httpOnly Cookie):
  - Срок жизни: 7 дней (по умолчанию)
  - Настраивается через переменную окружения `REFRESH_TOKEN_EXPIRES_IN_DAYS`
  - Устанавливается в httpOnly cookie (недоступен JavaScript)
  - Защита от XSS атак
  - Автоматически отправляется браузером
  - Используется только для обновления access token

### Workflow:
1. **Логин/Регистрация:**
   - Отправляете запрос с `credentials: 'include'`
   - Получаете access token в JSON
   - Refresh token автоматически устанавливается в cookie

2. **API запросы:**
   - Все запросы с `Authorization: Bearer <accessToken>`
   - Защищенные эндпоинты требуют валидный access token

3. **Обновление токена:**
   - При ошибке 401 (токен истек) → вызываете `/api/auth/refresh` с `credentials: 'include'`
   - Refresh token автоматически читается из cookie
   - Получаете новый access token в JSON
   - Повторяете неудавшийся запрос

4. **Logout:**
   - Отправляете запрос на `/api/auth/logout` с `credentials: 'include'`
   - Refresh token удаляется из БД и cookie
   - Удаляете access token из памяти

### Frontend настройки:

**Fetch:**
```javascript
fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ВАЖНО: для отправки/получения cookies
  body: JSON.stringify({ email, password })
})
```

**Axios:**
```javascript
axios.post('http://localhost:3000/api/auth/login', 
  { email, password },
  { withCredentials: true } // ВАЖНО: для отправки/получения cookies
)
```

### Автоматическое обновление токенов:
Используйте interceptor для автоматического обновления при 401:

```javascript
// Axios interceptor
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, 
          { withCredentials: true }
        );
        
        // Обновляем access token
        localStorage.setItem('accessToken', data.accessToken);
        
        // Повторяем запрос
        error.config.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return axios(error.config);
      } catch (refreshError) {
        // Refresh token невалиден - редирект на логин
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
```

### Безопасность:

✅ **Что сделано:**
- Refresh token в httpOnly cookie (защита от XSS)
- SameSite=Lax (защита от CSRF, настраивается через `COOKIE_SAME_SITE`)
- Secure flag в production (только HTTPS)
- CORS с credentials
- TTL для автоматического удаления истекших токенов
- **Helmet** - безопасные HTTP заголовки (защита от XSS, clickjacking, MIME sniffing)
- **Rate limiting** - защита от DDoS и brute force:
  - Auth эндпоинты: максимум 5 попыток за 15 минут с одного IP
  - Общий лимит: 100 запросов за 15 минут с одного IP
- Глобальный error handler для централизованной обработки ошибок
- Автоматическая обработка 404 для несуществующих эндпоинтов
- Логирование HTTP запросов через **morgan**

❌ **Что НЕ делать:**
- НЕ храните refresh token в localStorage
- НЕ отправляйте refresh token в JSON
- НЕ храните access token в cookie (должен быть доступен JS)
