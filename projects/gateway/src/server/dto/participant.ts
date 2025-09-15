import { z } from 'zod';
import { type IdRecord, id } from './id.ts';

export const ParticipantCreate = z.object({
  billId: z.number(),
  name: z.string(),
});

export const ParticipantReadStorage = z
  .object({
    id,
    bill_id: ParticipantCreate.shape.billId,
    name: ParticipantCreate.shape.name,
  })
  .strict();

export const ParticipantSearch = z.object({
  billId: z.preprocess((val) => Number(val), z.number()),
});

export type ParticipantCreate = z.infer<typeof ParticipantCreate>;
export type ParticipantRead = {
  [K in keyof ParticipantCreate]: Exclude<ParticipantCreate[K], null>;
} & IdRecord;
export type ParticipantReadStorage = z.infer<typeof ParticipantReadStorage>;
export type ParticipantSearch = z.infer<typeof ParticipantSearch>;

export const toParticipantStorage = (
  participant: ParticipantCreate | ParticipantSearch,
) => ({
  bill_id: participant.billId,
  name: 'name' in participant ? participant.name : undefined,
});

export const toParticipantRead = (
  Participant: ParticipantReadStorage,
): ParticipantRead => ({
  id: Participant.id,
  billId: Participant.bill_id,
  name: Participant.name,
});
