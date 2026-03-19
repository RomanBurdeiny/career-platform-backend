/**
 * Скрипт заполнения БД тестовыми данными: вакансии и карьерные сценарии.
 * Запуск: npx ts-node scripts/seed.ts
 * Требуется MONGODB_URI в .env
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../src/models/User';
import Job from '../src/models/Job';
import CareerScenario from '../src/models/CareerScenario';
import { Direction, Level } from '../src/types/profileEnums';
import { WorkFormat } from '../src/types/jobEnums';
import { ActionType } from '../src/types/careerEnums';
import { UserRole } from '../src/types/auth';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI не задана в .env');
  process.exit(1);
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);
  console.log('MongoDB connected');

  // Создаём или находим seed-пользователя (admin)
  let seedUser = await User.findOne({ email: 'seed@career-platform.local' });
  if (!seedUser) {
    const hashedPassword = await bcrypt.hash('seed123', 10);
    seedUser = await User.create({
      name: 'Seed Admin',
      email: 'seed@career-platform.local',
      password: hashedPassword,
      authProvider: 'email',
      role: UserRole.ADMIN,
    });
    console.log('Создан seed-пользователь: seed@career-platform.local / seed123');
  } else {
    console.log('Seed-пользователь уже существует');
  }

  const userId = seedUser._id;

  // Вакансии
  const jobsCount = await Job.countDocuments();
  if (jobsCount === 0) {
    await Job.insertMany([
      {
        title: 'Frontend-разработчик (React)',
        description:
          'Ищем опытного frontend-разработчика для работы над веб-приложениями. Работа в команде из 5 человек, современный стек.',
        company: 'TechStart Inc',
        direction: Direction.IT,
        level: Level.MIDDLE,
        workFormat: WorkFormat.REMOTE,
        location: 'Москва (удалённо)',
        salary: { min: 150000, max: 250000, currency: 'RUB' },
        requirements: ['React', 'TypeScript', 'REST API', 'Git'],
        responsibilities: ['Разработка UI', 'Code review', 'Участие в планировании'],
        createdBy: userId,
        isActive: true,
      },
      {
        title: 'UX/UI дизайнер',
        description:
          'Присоединяйтесь к дизайн-команде для создания интерфейсов мобильных и веб-приложений.',
        company: 'Creative Studio',
        direction: Direction.CREATIVE,
        level: Level.JUNIOR,
        workFormat: WorkFormat.HYBRID,
        location: 'Санкт-Петербург',
        salary: { min: 80000, max: 120000, currency: 'RUB' },
        requirements: ['Figma', 'Adobe XD', 'Базовые знания UX'],
        responsibilities: ['Проектирование интерфейсов', 'Создание прототипов'],
        createdBy: userId,
        isActive: true,
      },
      {
        title: 'Product Manager',
        description:
          'Управление продуктом B2B-платформы. Полный цикл от идеи до релиза.',
        company: 'ProductLab',
        direction: Direction.IT,
        level: Level.SENIOR,
        workFormat: WorkFormat.OFFICE,
        location: 'Москва',
        salary: { min: 200000, max: 350000, currency: 'RUB' },
        requirements: ['Опыт 3+ года', 'Agile/Scrum', 'Аналитика'],
        responsibilities: ['Roadmap', 'Приоритизация', 'Работа с командой'],
        createdBy: userId,
        isActive: true,
      },
      {
        title: 'Менеджер по продажам в HoReCa',
        description:
          'Развитие клиентской базы в сегменте HoReCa. Работа с ключевыми клиентами.',
        company: 'FoodSupply Co',
        direction: Direction.HORECA,
        level: Level.MIDDLE,
        workFormat: WorkFormat.OFFICE,
        location: 'Москва',
        salary: { min: 100000, max: 150000, currency: 'RUB' },
        requirements: ['Опыт продаж', 'Знание HoReCa', 'CRM'],
        responsibilities: ['Поиск клиентов', 'Переговоры', 'Ведение сделок'],
        createdBy: userId,
        isActive: true,
      },
      {
        title: 'Backend-разработчик (Node.js)',
        description:
          'Разработка API и сервисов для высоконагруженных систем.',
        company: 'CloudTech',
        direction: Direction.IT,
        level: Level.SENIOR,
        workFormat: WorkFormat.REMOTE,
        location: 'Удалённо',
        salary: { min: 250000, max: 400000, currency: 'RUB' },
        requirements: ['Node.js', 'PostgreSQL', 'Redis', 'Docker'],
        responsibilities: ['Проектирование API', 'Оптимизация', 'Менторинг'],
        createdBy: userId,
        isActive: true,
      },
    ]);
    console.log('Создано 5 вакансий');
  } else {
    console.log(`Вакансии уже есть (${jobsCount} шт.)`);
  }

  // Карьерные сценарии (рекомендации)
  const scenariosCount = await CareerScenario.countDocuments();
  if (scenariosCount === 0) {
    await CareerScenario.insertMany([
      {
        direction: Direction.IT,
        level: Level.JUNIOR,
        title: 'Старт в IT: путь Junior Frontend',
        description:
          'Пошаговый план для входа в IT с нуля. Включает обучение основам, практику и поиск первой работы.',
        actions: [
          {
            type: ActionType.LECTURE,
            title: 'Основы HTML/CSS/JS',
            description: 'Пройдите бесплатный курс на Stepik или Hexlet. Минимум 40 часов.',
            link: 'https://stepik.org/catalog',
          },
          {
            type: ActionType.ARTICLE,
            title: 'React за неделю',
            description: 'Изучите официальную документацию React и создайте todo-приложение.',
            link: 'https://react.dev',
          },
          {
            type: ActionType.COMMUNITY,
            title: 'Вступите в IT-сообщество',
            description: 'Telegram-чаты, Discord, митапы — найдите единомышленников и менторов.',
          },
        ],
        careerBranches: ['Frontend', 'Backend', 'Mobile'],
        transitionSkills: ['JavaScript', 'Git', 'Основы алгоритмов'],
        createdBy: userId,
        sortOrder: 0,
        isActive: true,
      },
      {
        direction: Direction.IT,
        level: Level.MIDDLE,
        title: 'Переход с Junior на Middle',
        description:
          'Рекомендации по росту: углубление экспертизы, менторинг, участие в архитектурных решениях.',
        actions: [
          {
            type: ActionType.CONSULTATION,
            title: 'Карьерная консультация',
            description: 'Запишитесь на сессию с карьерным коучем для оценки текущего уровня.',
          },
          {
            type: ActionType.ARTICLE,
            title: 'Системный дизайн',
            description: 'Изучите паттерны проектирования и масштабирования систем.',
            link: 'https://github.com/donnemartin/system-design-primer',
          },
        ],
        careerBranches: ['Tech Lead', 'Архитектор', 'Эксперт'],
        transitionSkills: ['Системный дизайн', 'Code review', 'Менторинг'],
        createdBy: userId,
        sortOrder: 1,
        isActive: true,
      },
      {
        direction: Direction.CREATIVE,
        level: Level.JUNIOR,
        title: 'Начало карьеры в дизайне',
        description:
          'План для тех, кто хочет стать UX/UI дизайнером. От основ до первого портфолио.',
        actions: [
          {
            type: ActionType.LECTURE,
            title: 'Основы UX-дизайна',
            description: 'Курс по пользовательскому опыту и исследованию потребностей.',
          },
          {
            type: ActionType.ARTICLE,
            title: 'Создание портфолио',
            description: 'Соберите 3–5 кейсов: редизайн, pet-проект, учебный проект.',
          },
        ],
        careerBranches: ['UX', 'UI', 'Product Design'],
        transitionSkills: ['Figma', 'Прототипирование', 'Исследования'],
        createdBy: userId,
        sortOrder: 2,
        isActive: true,
      },
      {
        direction: Direction.ECOMMERCE,
        level: Level.MIDDLE,
        title: 'Рост в E-commerce',
        description:
          'Как развиваться в онлайн-торговле: аналитика, маркетинг, управление проектами.',
        actions: [
          {
            type: ActionType.CONSULTATION,
            title: 'Аудит интернет-магазина',
            description: 'Получите экспертную оценку конверсии и юзабилити вашего магазина.',
          },
          {
            type: ActionType.COMMUNITY,
            title: 'E-commerce клуб',
            description: 'Присоединяйтесь к сообществу специалистов по электронной коммерции.',
          },
        ],
        careerBranches: ['Маркетинг', 'Аналитика', 'Управление'],
        transitionSkills: ['Google Analytics', 'CRO', 'A/B тесты'],
        createdBy: userId,
        sortOrder: 3,
        isActive: true,
      },
      {
        direction: Direction.HORECA,
        level: Level.JUNIOR,
        title: 'Карьера в HoReCa: с нуля до менеджера',
        description:
          'План входа в индустрию гостеприимства: от официанта до управляющего рестораном.',
        actions: [
          {
            type: ActionType.LECTURE,
            title: 'Основы сервиса и этикета',
            description: 'Обучающий курс по стандартам обслуживания в ресторанах.',
          },
          {
            type: ActionType.COMMUNITY,
            title: 'Сообщество HoReCa',
            description: 'Присоединяйтесь к профессиональным чатам и мероприятиям отрасли.',
          },
        ],
        careerBranches: ['Ресторан', 'Отель', 'Кейтеринг'],
        transitionSkills: ['Сервис', 'Управление персоналом', 'Закупки'],
        createdBy: userId,
        sortOrder: 4,
        isActive: true,
      },
    ]);
    console.log('Создано 5 карьерных сценариев');
  } else {
    console.log(`Карьерные сценарии уже есть (${scenariosCount} шт.)`);
  }

  console.log('Seed завершён успешно');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
