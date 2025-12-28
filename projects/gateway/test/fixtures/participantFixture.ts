import type { ParticipantCreate } from '../../src/server/dto/participant.ts';

export const participantCreateFixture = <T extends keyof ParticipantCreate>(
  overrides?: Pick<ParticipantCreate, T>,
): ParticipantCreate => {
  const defaults: ParticipantCreate = {
    billId: 0,
    name: 'John Doe',
  };

  return { ...defaults, ...overrides };
};
