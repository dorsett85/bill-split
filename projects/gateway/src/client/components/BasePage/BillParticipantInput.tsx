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

  const handleOnOptionSubmit = async (name: string) => {
    if (updatingParticipants || !name) {
      return;
    }

    setUpdatingParticipants(true);
    setError(undefined);

    try {
      const { data } = await createBillParticipant(billId, name);
      onChange([...participants, { id: data.id, name, lineItems: [] }]);
    } catch {
      // no-up
    }

    setUpdatingParticipants(false);
  };

  const handleOnRemove = async (name: string) => {
    if (updatingParticipants) {
      return;
    }

    setUpdatingParticipants(true);
    setError(undefined);

    const deleteId = participants.find((p) => p.name === name)?.id;

    if (deleteId) {
      try {
        // TODO we probably want to create a modal here to warn users of the
        //  consequences of deleting a participant.
        const { data } = await deleteParticipant(billId, deleteId);
        onChange(
          participants.filter((participant) => participant.id !== data.id),
        );
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
        updatingParticipants ? <Loader size="sm" color="yellow" /> : undefined
      }
      placeholder="Enter someone's name"
      mb="xl"
      size="md"
      value={participants.map((participant) => participant.name)}
      onOptionSubmit={handleOnOptionSubmit}
      onRemove={handleOnRemove}
      onDuplicate={(name) => setError(`There's already a "${name}"`)}
      error={error}
    />
  );
};
