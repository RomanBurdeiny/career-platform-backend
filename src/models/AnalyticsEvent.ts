import mongoose, { Schema, Model } from 'mongoose';
import { IAnalyticsEvent } from '../types/analytics';

const analyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    userId: {
      type: String,
      default: null,
    },
    eventName: {
      type: String,
      required: true,
      index: true,
    },
    entityType: {
      type: String,
      default: null,
    },
    entityId: {
      type: String,
      default: null,
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

analyticsEventSchema.index({ eventName: 1, createdAt: -1 });
analyticsEventSchema.index({ userId: 1, createdAt: -1 });

const AnalyticsEvent: Model<IAnalyticsEvent> = mongoose.model<IAnalyticsEvent>(
  'AnalyticsEvent',
  analyticsEventSchema
);
export default AnalyticsEvent;
