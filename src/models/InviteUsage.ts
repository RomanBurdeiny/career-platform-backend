import mongoose, { Schema, Model } from 'mongoose';
import { IInviteUsage } from '../types/invite';

const inviteUsageSchema = new Schema<IInviteUsage>(
  {
    inviteId: {
      type: Schema.Types.ObjectId,
      ref: 'Invite',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

const InviteUsage: Model<IInviteUsage> = mongoose.model<IInviteUsage>(
  'InviteUsage',
  inviteUsageSchema
);
export default InviteUsage;
