import mongoose, { Schema, Model } from 'mongoose';
import { IProfile, Direction, Level, CareerGoal } from '../types';

// Схема профиля
const profileSchema = new Schema<IProfile>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: [true, 'Имя обязательно'],
    trim: true,
  },
  avatar: {
    type: String,
    default: null,
  },
  direction: {
    type: String,
    required: [true, 'Направление обязательно'],
    enum: Object.values(Direction),
  },
  level: {
    type: String,
    required: [true, 'Уровень обязателен'],
    enum: Object.values(Level),
  },
  skills: {
    type: [String],
    required: [true, 'Навыки обязательны'],
    validate: {
      validator: function(v: string[]) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Должен быть хотя бы один навык',
    },
  },
  experience: {
    type: String,
    required: [true, 'Опыт обязателен'],
  },
  careerGoal: {
    type: String,
    required: [true, 'Карьерная цель обязательна'],
    enum: Object.values(CareerGoal),
  },
  favoriteJobs: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Job',
    }],
    default: [], // По умолчанию пустой массив
  },
}, {
  timestamps: true,
});

const Profile: Model<IProfile> = mongoose.model<IProfile>('Profile', profileSchema);

export default Profile;
