import {
  ActionIcon,
  Popover,
  TextInput,
  useComputedColorScheme,
} from '@mantine/core';
import { IconCheck, IconEdit } from '@tabler/icons-react';
import type React from 'react';
import { type FormEvent, useState } from 'react';
import { updateParticipant } from '../api/api.ts';

interface BillParticipantEditNameProps {
  billId: number;
  name: string;
  onNameChange: (name: string) => void;
  participantId: number;
}

export const BillParticipantEditName: React.FC<
  BillParticipantEditNameProps
> = ({ billId, name, onNameChange, participantId }) => {
  const colorScheme = useComputedColorScheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const INPUT_NAME = 'name';

  const handleOnSubmitNameChange = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newName = new FormData(e.currentTarget).get(INPUT_NAME);

    // check that they changed the name
    if (typeof newName !== 'string' || newName === name) {
      return;
    }

    setLoading(true);
    setError(undefined);

    try {
      await updateParticipant(billId, participantId, newName);
      onNameChange(newName);
    } catch (e) {
      console.log(e);
      setError('Something went wrong');
    }

    setLoading(false);
    setOpen(false);
  };

  return (
    <Popover
      id="edit-name-popover"
      opened={open}
      onDismiss={() => setOpen(false)}
      position="top"
      trapFocus
    >
      <Popover.Target>
        <ActionIcon
          aria-label="Edit name"
          title="Edit name"
          size="xs"
          variant="transparent"
          color={colorScheme === 'dark' ? 'white' : 'dark'}
          onClick={() => setOpen((opened) => !opened)}
        >
          <IconEdit />
        </ActionIcon>
      </Popover.Target>
      <Popover.Dropdown>
        <form onSubmit={handleOnSubmitNameChange}>
          <TextInput
            label="Edit name"
            name={INPUT_NAME}
            error={error}
            defaultValue={name}
            rightSection={
              <ActionIcon
                aria-label="submit-name"
                type="submit"
                loading={loading}
              >
                <IconCheck />
              </ActionIcon>
            }
          />
        </form>
      </Popover.Dropdown>
    </Popover>
  );
};
