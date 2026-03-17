import mongoose, { Schema, Model } from 'mongoose';
import { IInvite } from '../types/invite';
import { UserRole } from '../types/auth';

const inviteSchema = new Schema<IInvite>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
    },
    accessType: {
      type: String,
      enum: ['INVITE_ONLY', 'TRIAL'],
      required: true,
      default: 'INVITE_ONLY',
    },
    maxUses: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Invite: Model<IInvite> = mongoose.model<IInvite>('Invite', inviteSchema);
export default Invite;
