import { z } from 'zod';
import { type IdRecord, id } from './id.ts';

export const ParticipantLineItemCreate = z.object({
  lineItemId: z.number(),
  participantId: z.number(),
  pctOwes: z.number(),
});

export const ParticipantLineItemReadStorage = z
  .object({
    id,
    line_item_id: z.number(),
    participant_id: z.number(),
    pct_owes: z.number(),
  })
  .strict();

export const ParticipantLineItemUpdate = z.object({
  pctOwes: z.number(),
});

export const ParticipantLineItemSearch = z.object({
  lineItemId: z.number(),
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
export type ParticipantLineItemSearch = z.infer<
  typeof ParticipantLineItemSearch
>;

export const toParticipantLineItemStorage = (
  data:
    | ParticipantLineItemCreate
    | ParticipantLineItemUpdate
    | ParticipantLineItemSearch,
) => ({
  line_item_id: 'lineItemId' in data ? data.lineItemId : undefined,
  participant_id: 'participantId' in data ? data.participantId : undefined,
  pct_owes: 'pctOwes' in data ? data.pctOwes : undefined,
});

export const toParticipantLineItemRead = (
  data: z.infer<typeof ParticipantLineItemReadStorage>,
): ParticipantLineItemRead => ({
  id: data.id,
  lineItemId: data.line_item_id,
  participantId: data.participant_id,
  pctOwes: data.pct_owes,
});
