import { Loader, TagsInput } from '@mantine/core';
import type React from 'react';
import { useState } from 'react';
import { createBillParticipant, deleteBillParticipant } from '../api/api.ts';
import type {
  BillRecalculateData,
  Participant,
} from '../pages/bills/[id]/dto.ts';

export interface BillParticipantInputProps {
  billId: number;
  onCreateParticipant: (newParticipants: Participant[]) => void;
  onDeleteParticipant: (recalculatedBill: BillRecalculateData) => void;
  participants: Participant[];
}

export const BillParticipantInput: React.FC<BillParticipantInputProps> = ({
  billId,
  onCreateParticipant,
  onDeleteParticipant,
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
      const json = await createBillParticipant(billId, name);
      if ('data' in json) {
        onCreateParticipant([
          ...participants,
          { id: json.data.id, name, owes: 0, participantLineItems: [] },
        ]);
      }
    } catch {
      // no-op
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
        const json = await deleteBillParticipant(billId, deleteId);
        if ('data' in json) {
          onDeleteParticipant(json.data);
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
