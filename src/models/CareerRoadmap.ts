import mongoose, { Schema, Model } from 'mongoose';
import { ICareerRoadmap, RoadmapBranchType } from '../types/careerRoadmap';
import { Direction, Level } from '../types';

const careerRoadmapSchema = new Schema<ICareerRoadmap>(
  {
    direction: {
      type: String,
      required: true,
      enum: Object.values(Direction),
    },
    fromLevel: {
      type: String,
      required: true,
      enum: Object.values(Level),
    },
    toLevel: {
      type: String,
      required: true,
      enum: Object.values(Level),
    },
    toRole: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true,
    },
    skillsToDevelop: {
      type: [String],
      required: true,
      validate: {
        validator(skills: string[]) {
          return Array.isArray(skills) && skills.length > 0 && skills.every((s) => s.trim().length > 0);
        },
        message: 'skillsToDevelop: нужен хотя бы один навык',
      },
    },
    estimatedTimeMonths: {
      type: Number,
      required: true,
      min: 1,
    },
    estimatedTimeMonthsMax: {
      type: Number,
      default: null,
      min: 1,
    },
    branchType: {
      type: String,
      required: true,
      enum: Object.values(RoadmapBranchType),
    },
    careerBranches: {
      type: [String],
      default: [],
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

careerRoadmapSchema.index({ direction: 1, fromLevel: 1, isActive: 1, sortOrder: 1 });
careerRoadmapSchema.index({ branchType: 1 });

const CareerRoadmap: Model<ICareerRoadmap> = mongoose.model<ICareerRoadmap>(
  'CareerRoadmap',
  careerRoadmapSchema
);

export default CareerRoadmap;
