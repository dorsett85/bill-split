import { Loader, TagsInput } from '@mantine/core';
import type React from 'react';
import type { Participants } from '../../pages/bills/[id]/dto.ts';

interface BillParticipantInputProps {
  updating: boolean;
  onChange: (participants: string[]) => void;
  participants: Participants;
}

export const BillParticipantInput: React.FC<BillParticipantInputProps> = ({
  updating,
  participants,
  onChange,
}) => {
  return (
    <TagsInput
      id="add-participant-input"
      label="Add Participants"
      leftSection={
        updating ? <Loader size={'sm'} color={'yellow'} /> : undefined
      }
      placeholder="Enter someone's name"
      mb="xl"
      size="md"
      value={participants.map((participant) => participant.name)}
      onChange={onChange}
    />
  );
};
