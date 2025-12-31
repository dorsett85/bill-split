import { ActionIcon, Box, Button, Modal, Text, TextInput } from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { type FormEvent, useState } from 'react';
import { deleteBillParticipant, updateBillParticipant } from '../api/api.ts';
import type {
  BillRecalculateData,
  Participant,
} from '../pages/bills/[id]/dto.ts';

interface BillParticipantModalProps {
  billId: number;
  participant?: Participant;
  onClose: () => void;
  onNameChanged: (participantId: number, newName: string) => void;
  onDeleted: (recalculatedData: BillRecalculateData) => void;
}

export const BillParticipantModal = ({
  billId,
  participant,
  onClose,
  onNameChanged,
  onDeleted,
}: BillParticipantModalProps) => {
  const [error, setError] = useState<string | undefined>();
  const INPUT_NAME = 'name';

  const handleOnSubmitNameChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!participant) return;

    const newName = new FormData(e.currentTarget).get(INPUT_NAME);

    // check that they changed the name
    if (typeof newName !== 'string' || newName === participant.name) {
      return;
    }

    try {
      const res = await updateBillParticipant(billId, participant.id, newName);
      if ('data' in res && res.data.count) {
        setError(undefined);
        onNameChanged(participant.id, newName);
      } else {
        setError('error' in res ? res.error.message : 'Something went wrong');
      }
    } catch (e) {
      console.log(e);
      setError('Something went wrong');
    }
  };

  const handleOnDelete = async (participantId: number) => {
    try {
      const json = await deleteBillParticipant(billId, participantId);
      if ('data' in json) {
        onDeleted(json.data);
      }
    } catch (e) {
      console.error(e);
      // Feels odd to show something here. The user can close the popover.
    }
  };

  const modalContent = participant && (
    <>
      <form onSubmit={handleOnSubmitNameChange}>
        <TextInput
          label="Edit name"
          name={INPUT_NAME}
          error={error}
          defaultValue={participant.name}
          rightSection={
            <ActionIcon aria-label="submit-name" type="submit">
              <IconCheck />
            </ActionIcon>
          }
        />
      </form>
      <Text mt={'md'} mb={'xs'}>
        Delete Participant?{' '}
        <Text component={'b'} span fw={'bold'}>
          Careful!
        </Text>
      </Text>
      <Box>
        <Button
          color="red"
          variant={'outline'}
          onClick={() => handleOnDelete(participant.id)}
        >
          DELETE
        </Button>
      </Box>
    </>
  );

  return (
    <Modal
      opened={!!participant}
      onClose={onClose}
      title={participant?.name}
      centered
    >
      {modalContent}
    </Modal>
  );
};
