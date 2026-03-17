import { Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  userId: string | null;
  eventName: string;
  entityType: string | null;
  entityId: string | null;
  properties: Record<string, unknown>;
  createdAt: Date;
}
