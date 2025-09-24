import { z } from 'zod';
import { type IdRecord, id } from './id.ts';

export const LineItemParticipantCreate = z.object({
  lineItemId: z.number(),
  participantId: z.number(),
  pctOwes: z.number(),
});

export const LineItemParticipantReadStorage = z
  .object({
    id,
    line_item_id: z.number(),
    participant_id: z.number(),
    pct_owes: z.number(),
  })
  .strict();

export const LineItemParticipantUpdate = z.object({
  pctOwes: z.number(),
});

export const LineItemParticipantSearch = z.object({
  lineItemId: z.number(),
});

export const LineItemParticipantCreateRequest = z.object({
  lineItemId: z.number(),
  participantId: z.number(),
});

export type LineItemParticipantCreate = z.infer<
  typeof LineItemParticipantCreate
>;
export type LineItemParticipantRead = {
  [K in keyof LineItemParticipantCreate]: Exclude<
    LineItemParticipantCreate[K],
    null
  >;
} & IdRecord;
export type LineItemParticipantUpdate = z.infer<
  typeof LineItemParticipantUpdate
>;
export type LineItemParticipantSearch = z.infer<
  typeof LineItemParticipantSearch
>;
export type LineItemParticipantCreateRequest = z.infer<
  typeof LineItemParticipantCreateRequest
>;

export const toLineItemParticipantStorage = (
  data:
    | LineItemParticipantCreate
    | LineItemParticipantUpdate
    | LineItemParticipantSearch,
) => ({
  line_item_id: 'lineItemId' in data ? data.lineItemId : undefined,
  participant_id: 'participantId' in data ? data.participantId : undefined,
  pct_owes: 'pctOwes' in data ? data.pctOwes : undefined,
});

export const toLineItemParticipantRead = (
  data: z.infer<typeof LineItemParticipantReadStorage>,
): LineItemParticipantRead => ({
  id: data.id,
  lineItemId: data.line_item_id,
  participantId: data.participant_id,
  pctOwes: data.pct_owes,
});
