import { Document, Types } from 'mongoose';
import { Direction, Level, CareerGoal } from './profileEnums';

// Profile Model
export interface IProfile extends Document {
  userId: Types.ObjectId;
  name: string;
  avatar?: string | null;
  direction: Direction;
  level: Level;
  skills: string[];
  experience: string;
  careerGoal: CareerGoal;
  favoriteJobs?: Types.ObjectId[]; // Массив ID избранных вакансий (optional, по умолчанию [])
  createdAt?: Date;
  updatedAt?: Date;
}

// Request типы для профиля
export type CreateProfileBody = {
  name: string;
  avatar?: string;
  direction: Direction;
  level: Level;
  skills: string[];
  experience: string;
  careerGoal: CareerGoal;
};

export type UpdateProfileBody = {
  name?: string;
  avatar?: string;
  direction?: Direction;
  level?: Level;
  skills?: string[];
  experience?: string;
  careerGoal?: CareerGoal;
};
