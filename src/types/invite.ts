import { Document, Types } from 'mongoose';
import { UserRole } from './auth';

export type AccessType = 'INVITE_ONLY' | 'TRIAL';

export interface IInvite extends Document {
  code: string;
  createdBy: Types.ObjectId;
  role: UserRole;
  accessType: AccessType;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface IInviteUsage extends Document {
  inviteId: Types.ObjectId;
  userId: Types.ObjectId;
  email: string;
  usedAt: Date;
}
