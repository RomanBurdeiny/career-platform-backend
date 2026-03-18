import mongoose, { Schema, Model } from 'mongoose';
import { ICareerScenario, Direction, Level, ActionType } from '../types';

// Схема для действия (вложенный объект)
const careerActionSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Тип действия обязателен'],
    enum: Object.values(ActionType),
  },
  title: {
    type: String,
    required: [true, 'Название действия обязательно'],
    minlength: [3, 'Название действия должно содержать минимум 3 символа'],
  },
  description: {
    type: String,
    required: [true, 'Описание действия обязательно'],
    minlength: [10, 'Описание действия должно содержать минимум 10 символов'],
  },
  link: {
    type: String,
    validate: {
      validator: function(v: string) {
        if (!v) return true; // optional поле
        try {
          new URL(v);
          return true;
        } catch {
          return false;
        }
      },
      message: 'Некорректный URL',
    },
  },
}, { _id: false }); // Отключаем автогенерацию _id для вложенных объектов

// Схема карьерного сценария
const careerScenarioSchema = new Schema<ICareerScenario>({
  direction: {
    type: String,
    required: [true, 'Направление обязательно'],
    enum: Object.values(Direction),
    index: true,
  },
  level: {
    type: String,
    required: [true, 'Уровень обязателен'],
    enum: Object.values(Level),
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Заголовок обязателен'],
    minlength: [5, 'Заголовок должен содержать минимум 5 символов'],
  },
  description: {
    type: String,
    required: [true, 'Описание обязательно'],
    minlength: [20, 'Описание должно содержать минимум 20 символов'],
  },
  actions: {
    type: [careerActionSchema],
    validate: {
      validator: function(v: any[]) {
        return v && v.length > 0;
      },
      message: 'Необходимо добавить хотя бы одно действие',
    },
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Создатель обязателен'],
  },
  sortOrder: {
    type: Number,
    default: 0,
    min: [0, 'sortOrder не может быть отрицательным'],
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Индексы для оптимизации поиска рекомендаций
careerScenarioSchema.index({ direction: 1, level: 1 });
careerScenarioSchema.index({ isActive: 1 });
careerScenarioSchema.index({ sortOrder: 1 });

const CareerScenario: Model<ICareerScenario> = mongoose.model<ICareerScenario>('CareerScenario', careerScenarioSchema);

export default CareerScenario;
