import mongoose, { Schema, Model } from 'mongoose';
import {
  ICareerTrigger,
  CareerTriggerCta,
  CareerTriggerSpecialCase,
  CareerTriggerNextStep,
} from '../types/careerTrigger';
import { Direction, Level } from '../types';

const nextStepSchema = new Schema<CareerTriggerNextStep>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
  },
  { _id: false }
);

const careerTriggerSchema = new Schema<ICareerTrigger>(
  {
    direction: {
      type: String,
      default: null,
      validate: {
        validator(v: string | null) {
          if (v === null || v === undefined) return true;
          return Object.values(Direction).includes(v as Direction);
        },
        message: 'Недопустимое значение direction',
      },
    },
    currentLevel: {
      type: String,
      default: null,
      validate: {
        validator(v: string | null) {
          if (v === null || v === undefined) return true;
          return Object.values(Level).includes(v as Level);
        },
        message: 'Недопустимое значение currentLevel',
      },
    },
    minYears: {
      type: Number,
      default: null,
      min: 0,
    },
    triggerTitle: {
      type: String,
      required: true,
      trim: true,
    },
    triggerDescription: {
      type: String,
      required: true,
      trim: true,
    },
    nextSteps: {
      type: [nextStepSchema],
      required: true,
      validate: {
        validator(steps: CareerTriggerNextStep[]) {
          return Array.isArray(steps) && steps.length === 3;
        },
        message: 'nextSteps должен содержать ровно 3 шага (ветки карьеры)',
      },
    },
    ctaType: {
      type: String,
      required: true,
      enum: Object.values(CareerTriggerCta),
    },
    specialCase: {
      type: String,
      enum: Object.values(CareerTriggerSpecialCase),
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

careerTriggerSchema.index({ specialCase: 1, isActive: 1 });
careerTriggerSchema.index({ direction: 1, currentLevel: 1, minYears: 1, isActive: 1 });

const CareerTrigger: Model<ICareerTrigger> = mongoose.model<ICareerTrigger>(
  'CareerTrigger',
  careerTriggerSchema
);

export default CareerTrigger;
