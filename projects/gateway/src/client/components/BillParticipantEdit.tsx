import {
  ActionIcon,
  Button,
  Popover,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { IconCheck, IconDots } from '@tabler/icons-react';
import type React from 'react';
import { type FormEvent, useState } from 'react';
import { deleteBillParticipant, updateBillParticipant } from '../api/api.ts';
import type { BillRecalculateData } from '../pages/bills/[id]/dto.ts';

interface BillParticipantEditProps {
  billId: number;
  name: string;
  onNameChange: (name: string) => void;
  onDelete: (recalculatedData: BillRecalculateData) => void;
  participantId: number;
}

export const BillParticipantEdit: React.FC<BillParticipantEditProps> = ({
  billId,
  name,
  onNameChange,
  onDelete,
  participantId,
}) => {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const INPUT_NAME = 'name';

  const handleOnSubmitNameChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newName = new FormData(e.currentTarget).get(INPUT_NAME);

    // check that they changed the name
    if (typeof newName !== 'string' || newName === name) {
      return;
    }

    try {
      const res = await updateBillParticipant(billId, participantId, newName);
      if ('data' in res && res.data.count) {
        setError(undefined);
        setOpen(false);
        onNameChange(newName);
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
        onDelete(json.data);
      }
    } catch (e) {
      console.error(e);
      // Feels odd to show something here. The user can close the popover.
    }
  };

  return (
    <Popover
      id="edit-name-popover"
      opened={open}
      onDismiss={() => setOpen(false)}
      position="top"
      trapFocus
      withOverlay
    >
      <Popover.Target>
        <ActionIcon
          aria-label="Edit name"
          title="Edit name"
          size="lg"
          variant="subtle"
          color="gray"
          onClick={() => setOpen((opened) => !opened)}
        >
          <IconDots />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack>
          <form onSubmit={handleOnSubmitNameChange}>
            <TextInput
              label="Edit name"
              name={INPUT_NAME}
              error={error}
              defaultValue={name}
              rightSection={
                <ActionIcon aria-label="submit-name" type="submit">
                  <IconCheck />
                </ActionIcon>
              }
            />
          </form>
          <Text>
            Delete Participant?{' '}
            <Text component={'b'} span fw={'bold'}>
              Careful!
            </Text>
          </Text>
          <Button
            color="red"
            size={'compact-md'}
            style={{ maxWidth: 64 }}
            onClick={() => handleOnDelete(participantId)}
          >
            Yes
          </Button>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
};
