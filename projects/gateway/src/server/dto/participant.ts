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

export const ParticipantUpdate = z.object({
  billId: ParticipantCreate.shape.billId,
  name: ParticipantCreate.shape.name,
});

export const ParticipantCreateRequest = ParticipantCreate.pick({
  name: true,
});

export const ParticipantUpdateRequest = ParticipantCreate.pick({
  name: true,
});

export type ParticipantCreate = z.infer<typeof ParticipantCreate>;
export type ParticipantRead = {
  [K in keyof ParticipantCreate]: Exclude<ParticipantCreate[K], null>;
} & IdRecord;
export type ParticipantReadStorage = z.infer<typeof ParticipantReadStorage>;
export type ParticipantUpdate = z.infer<typeof ParticipantUpdate>;
export type ParticipantCreateRequest = z.infer<typeof ParticipantCreateRequest>;
export type ParticipantUpdateRequest = z.infer<typeof ParticipantUpdateRequest>;

export const toParticipantStorage = (
  participant: ParticipantCreate | ParticipantUpdate,
) => ({
  bill_id: 'billId' in participant ? participant.billId : undefined,
  name: participant.name,
});

export const toParticipantRead = (
  participant: ParticipantReadStorage,
): ParticipantRead => ({
  id: participant.id,
  billId: participant.bill_id,
  name: participant.name,
});
