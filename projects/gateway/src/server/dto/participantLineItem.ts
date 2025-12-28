import { z } from 'zod';
import type { IdRecord } from './id.ts';

export const ParticipantLineItemCreate = z.object({
  lineItemId: z.number(),
  participantId: z.number(),
  pctOwes: z.number(),
});

export const ParticipantLineItemUpdate = z.object({
  pctOwes: z.number().optional(),
});

export type ParticipantLineItemCreate = z.infer<
  typeof ParticipantLineItemCreate
>;
export type ParticipantLineItemRead = {
  [K in keyof ParticipantLineItemCreate]: Exclude<
    ParticipantLineItemCreate[K],
    null
  >;
} & IdRecord;
export type ParticipantLineItemUpdate = z.infer<
  typeof ParticipantLineItemUpdate
>;
