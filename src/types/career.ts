import { Document, Types } from 'mongoose';
import { Direction, Level } from './profileEnums';
import { ActionType } from './careerEnums';

// Интерфейс для рекомендации действия
export type CareerAction = {
  type: ActionType;
  title: string;
  description: string;
  link?: string;
};

// Модель карьерного сценария
export interface ICareerScenario extends Document {
  direction: Direction;
  level: Level;
  title: string;
  description: string;
  actions: CareerAction[];
  createdBy: Types.ObjectId;
  careerBranches?: string[];
  transitionSkills?: string[];
  sortOrder?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Request типы для карьерных сценариев
export type CreateCareerScenarioBody = {
  direction: Direction;
  level: Level;
  title: string;
  description: string;
  actions: CareerAction[];
  careerBranches?: string[];
  transitionSkills?: string[];
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateCareerScenarioBody = Partial<CreateCareerScenarioBody> & {
  // keep explicit fields for readability
};

// Фильтры для поиска карьерных сценариев
export type CareerScenarioFilters = {
  direction?: Direction;
  level?: Level;
  sortOrder?: number;
  isActive?: boolean;
};
