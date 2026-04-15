// Enum значения для профиля
export enum Direction {
  CREATIVE = 'Creative',
  IT = 'IT',
  DESIGN = 'Design',
  ECOMMERCE = 'E-commerce',
  HORECA = 'HoReCa',
  ARCHITECTURE_DESIGN = 'Architecture & Design',
  PRODUCTION = 'Production',
}

export enum Level {
  JUNIOR = 'Junior',
  MIDDLE = 'Middle',
  SENIOR = 'Senior',
  LEAD = 'Lead',
}

export enum CareerGoal {
  GROWTH = 'Growth',
  CAREER_CHANGE = 'Career Change',
  SKILL_DEVELOPMENT = 'Skill Development',
  LEADERSHIP = 'Leadership',
  EXPERTISE = 'Expertise',
}

/** Город / регион (Казахстан и зарубеж) */
export enum City {
  ALMATY = 'almaty',
  ASTANA = 'astana',
  SHYMKENT = 'shymkent',
  OTHER_KZ = 'other_kz',
  ABROAD = 'abroad',
}

/** Тип занятости */
export enum EmploymentType {
  FULLTIME = 'fulltime',
  FREELANCE = 'freelance',
  BUSINESS = 'business',
  SEARCHING = 'searching',
  RESKILLING = 'reskilling',
}

/** Язык интерфейса профиля */
export enum ProfileLang {
  RU = 'ru',
  EN = 'en',
}
