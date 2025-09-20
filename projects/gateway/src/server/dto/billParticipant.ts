import { z } from 'zod';
import type { IdRecord } from './id.ts';

export const BillParticipantCreate = z.object({
  billId: z.number(),
  participantId: z.number(),
});

export const BillParticipantDelete = z.object({
  billId: z.number(),
  participantId: z.number(),
});

export type BillParticipantCreate = z.infer<typeof BillParticipantCreate>;
export type BillParticipantRead = {
  [K in keyof BillParticipantCreate]: Exclude<BillParticipantCreate[K], null>;
} & IdRecord;
export type BillParticipantDelete = z.infer<typeof BillParticipantDelete>;

export const toBillParticipantStorage = (data: BillParticipantCreate) => ({
  bill_id: data.billId,
  participant_id: data.participantId,
});
