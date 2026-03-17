import mongoose, { Schema, Model } from 'mongoose';
import { Document } from 'mongoose';

// Интерфейс для Refresh Token
export interface IRefreshToken extends Document {
  userId: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt?: Date;
}

// Схема Refresh Token
const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }, // Автоматическое удаление истекших токенов
  },
}, {
  timestamps: true,
});

const RefreshToken: Model<IRefreshToken> = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema);

export default RefreshToken;
