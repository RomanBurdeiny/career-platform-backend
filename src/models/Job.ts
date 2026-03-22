import mongoose, { Schema, Model } from 'mongoose';
import { IJob, Direction, Level, WorkFormat } from '../types';

// Схема вакансии
const jobSchema = new Schema<IJob>({
  title: {
    type: String,
    required: [true, 'Название вакансии обязательно'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Описание обязательно'],
  },
  company: {
    type: String,
    required: [true, 'Название компании обязательно'],
    trim: true,
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
  workFormat: {
    type: String,
    required: [true, 'Формат работы обязателен'],
    enum: Object.values(WorkFormat),
  },
  location: {
    type: String,
    required: [true, 'Локация обязательна'],
    trim: true,
  },
  salary: {
    min: { type: Number },
    max: { type: Number },
    currency: { 
      type: String, 
      default: 'USD',
      enum: ['USD', 'EUR', 'RUB'],
    },
  },
  requirements: {
    type: [String],
    required: [true, 'Требования обязательны'],
    validate: {
      validator: function(v: string[]) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Должно быть хотя бы одно требование',
    },
  },
  responsibilities: {
    type: [String],
    required: [true, 'Обязанности обязательны'],
    validate: {
      validator: function(v: string[]) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Должна быть хотя бы одна обязанность',
    },
  },
  // Вакансии из сидов/ручного insert могут быть без автора — без default, только optional
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Индексы для оптимизации поиска
jobSchema.index({ direction: 1, level: 1 });
jobSchema.index({ workFormat: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ isActive: 1 });

const Job: Model<IJob> = mongoose.model<IJob>('Job', jobSchema);

export default Job;
