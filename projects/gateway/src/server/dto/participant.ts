import { z } from 'zod';
import { type IdRecord, id } from './id.ts';
import type { LineItemParticipantRead } from './lineItemParticipant.ts';

export const ParticipantCreate = z.object({
  name: z.string(),
});

export const ParticipantReadStorage = z
  .object({
    id,
    name: ParticipantCreate.shape.name,
  })
  .strict();

export type ParticipantCreate = z.infer<typeof ParticipantCreate>;
export type ParticipantRead = {
  [K in keyof ParticipantCreate]: Exclude<ParticipantCreate[K], null>;
} & IdRecord;
export type ParticipantReadStorage = z.infer<typeof ParticipantReadStorage>;
export type ParticipantResponse = (ParticipantRead & {
  lineItems: Omit<LineItemParticipantRead, 'participantId'>[];
})[];

export const toParticipantStorage = (participant: ParticipantCreate) => ({
  name: participant.name,
});

export const toParticipantRead = (
  Participant: ParticipantReadStorage,
): ParticipantRead => ({
  id: Participant.id,
  name: Participant.name,
});
