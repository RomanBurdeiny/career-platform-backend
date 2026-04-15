import mongoose, { Schema, Model } from 'mongoose';
import { ILearningResource } from '../types/careerRoadmap';

const learningResourceSchema = new Schema<ILearningResource>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    url: {
      type: String,
      default: null,
      trim: true,
      validate: {
        validator(v: string | null) {
          if (!v) return true;
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
    tags: {
      type: [String],
      required: true,
      validate: {
        validator(tags: string[]) {
          return Array.isArray(tags) && tags.length > 0 && tags.every((t) => t.trim().length > 0);
        },
        message: 'Нужен хотя бы один непустой тег',
      },
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

learningResourceSchema.index({ isActive: 1, sortOrder: 1 });
learningResourceSchema.index({ tags: 1 });

const LearningResource: Model<ILearningResource> = mongoose.model<ILearningResource>(
  'LearningResource',
  learningResourceSchema
);

export default LearningResource;
