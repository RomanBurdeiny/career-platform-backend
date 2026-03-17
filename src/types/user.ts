import { Document } from 'mongoose';
import { UserRole } from './auth';
import type { AuthProvider } from './auth';

// User Model (email и password опциональны для OAuth: Google, Telegram)
export interface IUser extends Document {
  name?: string;
  email?: string;
  password?: string;
  authProvider: AuthProvider;
  googleId?: string;
  telegramId?: number;
  telegramUsername?: string;
  role: UserRole;
  isBlocked: boolean;
  isDeleted: boolean;
  isSubscribed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Request типы для управления пользователями (ADMIN)
export type UpdateUserRoleBody = {
  role: UserRole;
};

export type UpdateUserBlockBody = {
  blocked: boolean;
};

export type UpdateUserSubscriptionBody = {
  isSubscribed: boolean;
};
