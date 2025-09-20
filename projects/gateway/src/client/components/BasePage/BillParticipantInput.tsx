import { Loader, TagsInput } from '@mantine/core';
import type React from 'react';
import { useState } from 'react';
import type { Participants } from '../../pages/bills/[id]/dto.ts';
import { createBillParticipant, deleteParticipant } from '../../utils/api.ts';

export interface BillParticipantInputProps {
  billId: number;
  onChange: (newParticipants: Participants) => void;
  participants: Participants;
}

export const BillParticipantInput: React.FC<BillParticipantInputProps> = ({
  billId,
  onChange,
  participants,
}) => {
  const [error, setError] = useState<string>();
  const [updatingParticipants, setUpdatingParticipants] = useState(false);

  const handleOnChange = async (newParticipants: string[]) => {
    if (updatingParticipants) {
      return;
    }

    setUpdatingParticipants(true);
    setError(undefined);

    const loopLength = Math.max(participants.length, newParticipants.length);

    // We'll check for two conditions here. 1) If there is no existing
    // participant then we know we need to add the new participant at the end
    // of the new list. 2) If the existing participant name does not match the
    // newName, that means it's been removed, and we need to delete it.
    for (let i = 0; i < loopLength; i++) {
      const existingParticipant = participants[i];
      const newName = newParticipants[i];
      try {
        if (!existingParticipant) {
          const { data } = await createBillParticipant(billId, newName);
          onChange([...participants, { id: data.id, name: newName }]);
          break;
        } else if (existingParticipant.name !== newName) {
          const { data } = await deleteParticipant(
            billId,
            existingParticipant.id,
          );
          onChange(
            participants.filter((participant) => participant.id !== data.id),
          );
          break;
        }
      } catch {
        // no-op
      }
    }

    setUpdatingParticipants(false);
  };

  return (
    <TagsInput
      id="add-participant-input"
      label="Add Participants"
      leftSection={
        updatingParticipants ? (
          <Loader size={'sm'} color={'yellow'} />
        ) : undefined
      }
      placeholder="Enter someone's name"
      mb="xl"
      size="md"
      value={participants.map((participant) => participant.name)}
      onChange={handleOnChange}
      onDuplicate={(name) => setError(`There's already a "${name}"`)}
      error={error}
    />
  );
};
