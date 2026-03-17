import { z } from 'zod';

export const trackEventSchema = z.object({
  body: z.object({
    eventName: z.string().min(1).max(100),
    entityType: z.string().max(50).optional().nullable(),
    entityId: z.string().max(100).optional().nullable(),
    properties: z.record(z.string(), z.unknown()).optional().default({}),
  }),
});

export type TrackEventInput = z.infer<typeof trackEventSchema>;
