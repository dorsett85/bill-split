import { Button, Input, Modal, PinInput, Stack } from '@mantine/core';

import type React from 'react';
import type { FormEvent } from 'react';

import { useState } from 'react';
import { postBillCreateAccess } from '../api/api.ts';

export interface VerifyAccessProps {
  open: boolean;
  onClose: (accessVerified?: boolean) => void;
  closeButton?: boolean;
}

export const VerifyAccessModal: React.FC<VerifyAccessProps> = ({
  open,
  onClose,
  closeButton = true,
}) => {
  const [error, setError] = useState<string | undefined>(undefined);
  const PIN_INPUT_NAME = 'accessPin';

  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(undefined);

    const accessPin = new FormData(e.currentTarget).get(PIN_INPUT_NAME);

    if (!accessPin || typeof accessPin !== 'string') {
      return;
    }

    try {
      const json = await postBillCreateAccess(accessPin);

      if ('data' in json && json.data.success) {
        return onClose(true);
      }

      setError(
        'error' in json
          ? json.error.message
          : 'We were unable to verify your pin',
      );
    } catch (e) {
      console.log(e);
      setError('We were unable to verify your pin');
    }
  };

  return (
    <Modal
      opened={open}
      withCloseButton={closeButton}
      onClose={onClose}
      title="Verify Access"
      centered
    >
      <form onSubmit={handleOnSubmit}>
        <Stack align="start">
          <Input.Wrapper
            id="access-pin-label"
            label="Enter access pin"
            error={error}
            required
          >
            <PinInput
              id="access-pin-input"
              name={PIN_INPUT_NAME}
              length={5}
              error={!!error}
            />
          </Input.Wrapper>

          <Button type="submit">Submit</Button>
        </Stack>
      </form>
    </Modal>
  );
};
