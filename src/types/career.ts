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
};

export type UpdateCareerScenarioBody = Partial<CreateCareerScenarioBody> & {
  isActive?: boolean;
};

// Фильтры для поиска карьерных сценариев
export type CareerScenarioFilters = {
  direction?: Direction;
  level?: Level;
  isActive?: boolean;
};
