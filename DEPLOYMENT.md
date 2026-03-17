# Деплой бэкенда

> **Чтобы другие пользователи могли открыть ссылку-приглашение и зарегистрироваться**, нужен деплой и бэкенда, и фронтенда. Локальный бэкенд (`localhost:3000`) доступен только на вашем компьютере — внешние пользователи не смогут к нему подключиться.

## 1. MongoDB Atlas (облачная БД)

Локальная MongoDB не подойдёт — нужна облачная.

1. Зарегистрируйтесь на [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Создайте кластер (бесплатный tier M0)
3. **Database Access** → Add User → создайте пользователя с паролем
4. **Network Access** → Add IP → `0.0.0.0/0` (разрешить доступ отовсюду)
5. **Connect** → Drivers → скопируйте connection string:
   ```
   mongodb+srv://user:password@cluster.xxxxx.mongodb.net/career-platform
   ```

---

## 2. Railway (рекомендуется)

1. Зайдите на [railway.app](https://railway.app) и войдите через GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Выберите репозиторий и укажите **Root Directory**: `backend`
4. В настройках проекта добавьте переменные окружения:

| Переменная | Значение |
|------------|----------|
| `PORT` | `3000` (Railway подставит свой, но можно указать) |
| `MONGODB_URI` | Ваша строка подключения из Atlas |
| `JWT_SECRET` | Случайная строка (например, `openssl rand -hex 32`) |
| `CLIENT_URL` | URL вашего фронтенда (например, `https://frontend-chi-eight-35.vercel.app`). Без этого ссылки в инвайтах будут вести на localhost. |
| `GOOGLE_CLIENT_ID` | Ваш Web Client ID из Google Cloud |
| `TELEGRAM_BOT_TOKEN` | Токен бота от BotFather |
| `NODE_ENV` | `production` |

5. **Settings** → **Build**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Output Directory: (оставить пустым)

6. **Deploy** — Railway соберёт и запустит проект
7. **Settings** → **Networking** → **Generate Domain** — получите URL вида `xxx.railway.app`

---

## 3. Render

1. [render.com](https://render.com) → **New** → **Web Service**
2. Подключите GitHub, выберите репозиторий
3. **Root Directory**: `backend`
4. **Build Command**: `npm run build`
5. **Start Command**: `npm start`
6. **Instance Type**: Free
7. Добавьте переменные окружения (как в таблице выше)
8. **Create Web Service**

---

## 4. После деплоя

1. **Обновите фронтенд** — в Vercel добавьте переменную:
   ```
   API_URL_WEB=https://ваш-backend.railway.app/api
   ```
   (или ваш URL от Render)

2. **Передеплойте фронтенд** — чтобы он использовал новый API URL

3. **BotFather** — если используете Telegram, домен уже настроен для фронта

4. **Google Cloud Console** — добавьте origin бэкенда в CORS при необходимости (обычно не нужно — CORS настраивается на бэкенде)
