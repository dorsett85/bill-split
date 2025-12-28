import type { ParticipantLineItemCreate } from '../../src/server/dto/participantLineItem.ts';

export const participantLineItemCreateFixture = <
  T extends keyof ParticipantLineItemCreate,
>(
  overrides?: Pick<ParticipantLineItemCreate, T>,
): ParticipantLineItemCreate => {
  const defaults: ParticipantLineItemCreate = {
    lineItemId: 0,
    participantId: 0,
    pctOwes: 100,
  };

  return { ...defaults, ...overrides };
};
