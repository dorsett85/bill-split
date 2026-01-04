import { z } from 'zod';
import type { IdRecord } from './id.ts';

export const ParticipantLineItemCreate = z.object({
  lineItemId: z.number(),
  participantId: z.number(),
  pctOwes: z.number(),
});

export const ParticipantLineItemReadStorage = z
  .object({
    line_item_id: ParticipantLineItemCreate.shape.lineItemId,
    participant_id: ParticipantLineItemCreate.shape.participantId,
    pct_owes: ParticipantLineItemCreate.shape.pctOwes,
  })
  .strict();

export const ParticipantLineItemUpdate = z.object({
  pctOwes: z.number().optional(),
});

export const ParticipantLineItemUpdateManyRequest = z.object({
  participants: z.array(
    z.object({
      id: z.number(),
      pctOwes: z.number(),
    }),
  ),
});

export const ParticipantLineItemDeleteManyRequest = z.object({
  participants: z.array(
    z.object({
      id: z.number(),
    }),
  ),
});

export type ParticipantLineItemCreate = z.infer<
  typeof ParticipantLineItemCreate
>;
export type ParticipantLineItemReadStorage = z.infer<
  typeof ParticipantLineItemReadStorage
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
export type ParticipantLineItemUpdateManyRequest = z.infer<
  typeof ParticipantLineItemUpdateManyRequest
>;
export type ParticipantLineItemDeleteManyRequest = z.infer<
  typeof ParticipantLineItemDeleteManyRequest
>;

export const toParticipantLineItemStorage = (
  participantLineItem: ParticipantLineItemCreate | ParticipantLineItemUpdate,
) => ({
  line_item_id:
    'lineItemId' in participantLineItem
      ? participantLineItem.lineItemId
      : undefined,
  participant_id:
    'participantId' in participantLineItem
      ? participantLineItem.participantId
      : undefined,
  pct_owes:
    'pctOwes' in participantLineItem ? participantLineItem.pctOwes : undefined,
});
