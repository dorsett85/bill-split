import { Button, Input, Modal, PinInput, Stack } from '@mantine/core';

import type React from 'react';
import type { FormEvent } from 'react';

import { useState } from 'react';
import { postVerifyAccess } from '../api/api.ts';
import { ErrorResponse, SuccessResponse } from '../api/dto.ts';

export interface VerifyAccessProps {
  open: boolean;
  onClose: (accessVerified?: boolean) => void;
}

export const VerifyAccessModal: React.FC<VerifyAccessProps> = ({
  open,
  onClose,
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
      const res = await postVerifyAccess(accessPin);
      const json = await res.json();
      if (res.ok && SuccessResponse.parse(json).data.success) {
        return onClose(true);
      }

      const { error } = ErrorResponse.parse(json);
      setError(error.message);
    } catch (e) {
      console.log(e);
      setError('We were unable to verify your pin');
    }
  };

  return (
    <Modal opened={open} onClose={onClose} title="Verify Access" centered>
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
