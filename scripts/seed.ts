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
import CareerTrigger from '../src/models/CareerTrigger';
import CareerRoadmap from '../src/models/CareerRoadmap';
import LearningResource from '../src/models/LearningResource';
import { Direction, Level } from '../src/types/profileEnums';
import { CareerTriggerCta, CareerTriggerSpecialCase } from '../src/types/careerTrigger';
import { RoadmapBranchType } from '../src/types/careerRoadmap';
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

  // Карьерные триггеры «Пора расти» (GET /api/career/trigger)
  const triggersCount = await CareerTrigger.countDocuments();
  if (triggersCount === 0) {
    await CareerTrigger.insertMany([
      {
        direction: null,
        currentLevel: null,
        minYears: null,
        triggerTitle: 'Трек 40+',
        triggerDescription:
          'Вы указали переквалификацию — подключите программу развития 40+ и соберите персональный план перехода.',
        nextSteps: [
          {
            title: 'Пройти вводную диагностику',
            description: 'Оценка текущих компетенций и целевого направления.',
          },
          {
            title: 'Собрать учебный маршрут',
            description: 'Курсы и практика под выбранную роль.',
          },
          {
            title: 'Закрепить результат на рынке',
            description: 'Резюме, портфолио и сопровождение до оффера.',
          },
        ],
        ctaType: CareerTriggerCta.COURSES,
        specialCase: CareerTriggerSpecialCase.RESKILLING_TRACK_40,
        sortOrder: 0,
        isActive: true,
      },
      {
        direction: null,
        currentLevel: null,
        minYears: null,
        triggerTitle: 'Трек переквалификации',
        triggerDescription:
          'Карьерная цель «Смена карьеры» — откройте сценарий переквалификации и следующие шаги.',
        nextSteps: [
          {
            title: 'Сузить новое направление',
            description: '1–2 роли, которые совпадают с вашим бэкграундом.',
          },
          {
            title: 'Закрыть пробелы навыков',
            description: 'Минимальный набор для первого оффера в новой сфере.',
          },
          {
            title: 'Собрать доказательства компетенции',
            description: 'Пет-проекты, сертификаты, менторство.',
          },
        ],
        ctaType: CareerTriggerCta.CONSULTATION,
        specialCase: CareerTriggerSpecialCase.CAREER_CHANGE_RETRAINING,
        sortOrder: 1,
        isActive: true,
      },
      {
        direction: null,
        currentLevel: Level.JUNIOR,
        minYears: 1,
        triggerTitle: 'Вы больше года на Junior',
        triggerDescription:
          'Пора усилить трек к Middle: углубите экспертизу и возьмите задачи уровня выше текущего грейда.',
        nextSteps: [
          {
            title: 'Расширить зону ответственности',
            description: 'Code review, фичи end-to-end, онбординг коллег.',
          },
          {
            title: 'Углубить системные навыки',
            description: 'Архитектура, качество, наблюдаемость — по вашему стеку.',
          },
          {
            title: 'Зафиксировать рост для ревью',
            description: 'Метрики, кейсы, обратная связь лида.',
          },
        ],
        ctaType: CareerTriggerCta.ROADMAP,
        sortOrder: 10,
        isActive: true,
      },
      {
        direction: null,
        currentLevel: Level.JUNIOR,
        minYears: 1.5,
        triggerTitle: 'Вы уже готовы к Middle',
        triggerDescription:
          'Стаж и задачи тянут на следующий грейд — обсудите переход с руководителем и зафиксируйте критерии Middle.',
        nextSteps: [
          {
            title: 'Согласовать ожидания Middle',
            description: 'Список компетенций и примеры задач уровня Middle.',
          },
          {
            title: 'Взять менторство или сложный проект',
            description: 'Показать самостоятельность и влияние на результат.',
          },
          {
            title: 'Подготовиться к performance review',
            description: 'Досье достижений и план на полгода.',
          },
        ],
        ctaType: CareerTriggerCta.CONSULTATION,
        sortOrder: 11,
        isActive: true,
      },
      {
        direction: null,
        currentLevel: Level.MIDDLE,
        minYears: 2,
        triggerTitle: 'Два года на Middle',
        triggerDescription:
          'Хороший момент планировать рост: экспертиза, архитектура или люди — выберите вектор на ближайший год.',
        nextSteps: [
          {
            title: 'Усилить экспертный столб',
            description: 'Глубина в домене или технологии, узнаваемость в команде.',
          },
          {
            title: 'Пробовать системное влияние',
            description: 'Дизайн решений, кросс-командные инициативы.',
          },
          {
            title: 'Собрать план к Senior',
            description: 'Критерии и сроки с руководителем.',
          },
        ],
        ctaType: CareerTriggerCta.ROADMAP,
        sortOrder: 20,
        isActive: true,
      },
      {
        direction: null,
        currentLevel: Level.MIDDLE,
        minYears: 2.5,
        triggerTitle: 'Пора думать о Senior',
        triggerDescription:
          'Стаж на Middle позволяет целиться в Senior — определите, чем вы будете «незаменимы» на следующем уровне.',
        nextSteps: [
          {
            title: 'Масштаб влияния',
            description: 'Продукт, команда или техническая платформа.',
          },
          {
            title: 'Лидерство без титула',
            description: 'Инициативы, наставничество, качество поставки.',
          },
          {
            title: 'Внешняя видимость',
            description: 'Митапы, статьи, открытые проекты.',
          },
        ],
        ctaType: CareerTriggerCta.CONSULTATION,
        sortOrder: 21,
        isActive: true,
      },
      {
        direction: null,
        currentLevel: Level.SENIOR,
        minYears: 3,
        triggerTitle: 'Lead или своё направление?',
        triggerDescription:
          'Три года на Senior — логичная развилка: управление людьми, архитектура или собственный продукт/бизнес.',
        nextSteps: [
          {
            title: 'Путь Engineering / Team Lead',
            description: 'Люди, процессы, найм и развитие команды.',
          },
          {
            title: 'Путь главного эксперта',
            description: 'Staff/Principal: стандарты, стратегия технологий.',
          },
          {
            title: 'Путь предпринимательства',
            description: 'Консалтинг, студия, продукт — проверка гипотез.',
          },
        ],
        ctaType: CareerTriggerCta.ROADMAP,
        sortOrder: 30,
        isActive: true,
      },
    ]);
    console.log('Созданы карьерные триггеры (7 шт.)');
  } else {
    console.log(`Карьерные триггеры уже есть (${triggersCount} шт.)`);
  }

  // Learning resources (связь с картами через tags ↔ skillsToDevelop после normalizeSkillTag)
  const lrCount = await LearningResource.countDocuments();
  if (lrCount === 0) {
    await LearningResource.insertMany([
      {
        title: 'UX Research: от интервью до инсайтов',
        description: 'Практический гайд по исследованиям для дизайнеров.',
        url: 'https://example.com/learn/ux-research',
        tags: ['ux research'],
        sortOrder: 0,
        isActive: true,
      },
      {
        title: 'Design Systems в Figma',
        description: 'Токены, компоненты, документация для команды.',
        url: 'https://example.com/learn/design-systems',
        tags: ['design systems'],
        sortOrder: 1,
        isActive: true,
      },
      {
        title: 'Figma Advanced: автолейауты и прототипы',
        description: 'Углублённая работа с компонентами и вариантами.',
        url: 'https://example.com/learn/figma-advanced',
        tags: ['figma advanced'],
        sortOrder: 2,
        isActive: true,
      },
      {
        title: 'Презентации для стейкхолдеров',
        description: 'Структура, сторителлинг, защита дизайн-решений.',
        url: 'https://example.com/learn/presentation-skills',
        tags: ['presentation skills'],
        sortOrder: 3,
        isActive: true,
      },
      {
        title: 'Работа со стейкхолдерами',
        description: 'Согласования, приоритеты, управление ожиданиями.',
        url: 'https://example.com/learn/stakeholders',
        tags: ['stakeholder management'],
        sortOrder: 4,
        isActive: true,
      },
      {
        title: 'Фасилитация дизайн-сессий',
        description: 'Воркшопы, ретро, кросс-функциональные встречи.',
        url: 'https://example.com/learn/facilitation',
        tags: ['team facilitation'],
        sortOrder: 5,
        isActive: true,
      },
    ]);
    console.log('Созданы обучающие ресурсы (6 шт.)');
  } else {
    console.log(`Обучающие ресурсы уже есть (${lrCount} шт.)`);
  }

  // Карты развития (пример из ТЗ: Design + Middle → Senior)
  const rmCount = await CareerRoadmap.countDocuments();
  if (rmCount === 0) {
    await CareerRoadmap.insertMany([
      {
        direction: Direction.DESIGN,
        fromLevel: Level.MIDDLE,
        toLevel: Level.SENIOR,
        toRole: 'Senior Designer',
        skillsToDevelop: [
          'UX Research',
          'Design Systems',
          'Figma Advanced',
          'Presentation Skills',
        ],
        estimatedTimeMonths: 12,
        estimatedTimeMonthsMax: 18,
        branchType: RoadmapBranchType.TECHNICAL,
        careerBranches: ['Art Director', 'Product Designer', 'UX Lead'],
        sortOrder: 0,
        isActive: true,
      },
      {
        direction: Direction.DESIGN,
        fromLevel: Level.MIDDLE,
        toLevel: Level.SENIOR,
        toRole: 'Senior Designer (управленческий трек)',
        skillsToDevelop: [
          'UX Research',
          'Presentation Skills',
          'Stakeholder Management',
          'Team Facilitation',
        ],
        estimatedTimeMonths: 15,
        estimatedTimeMonthsMax: 24,
        branchType: RoadmapBranchType.MANAGEMENT,
        careerBranches: ['Design Manager', 'Head of Design'],
        sortOrder: 1,
        isActive: true,
      },
    ]);
    console.log('Созданы карты развития (2 шт., Design Middle)');
  } else {
    console.log(`Карты развития уже есть (${rmCount} шт.)`);
  }

  console.log('Seed завершён успешно');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
