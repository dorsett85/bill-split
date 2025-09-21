import { z } from 'zod';
import { type IdRecord, id } from './id.ts';

export const BillParticipantCreate = z.object({
  billId: z.number(),
  participantId: z.number(),
});

export const BillParticipantReadStorage = z
  .object({
    id,
    bill_id: z.number(),
    participant_id: z.number(),
  })
  .strict();

export const BillParticipantSearch = z.object({
  billId: z.number(),
  participantId: z.number(),
});

export type BillParticipantCreate = z.infer<typeof BillParticipantCreate>;
export type BillParticipantRead = {
  [K in keyof BillParticipantCreate]: Exclude<BillParticipantCreate[K], null>;
} & IdRecord;
export type BillParticipantSearch = z.infer<typeof BillParticipantSearch>;

export const toBillParticipantStorage = (
  data: BillParticipantCreate | BillParticipantSearch,
) => ({
  bill_id: data.billId,
  participant_id: data.participantId,
});

export const toBillParticipantRead = (
  data: z.infer<typeof BillParticipantReadStorage>,
): BillParticipantRead => ({
  id: data.id,
  billId: data.bill_id,
  participantId: data.participant_id,
});
