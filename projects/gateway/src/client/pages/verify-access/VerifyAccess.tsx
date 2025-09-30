import {
  Button,
  Container,
  Input,
  PinInput,
  Stack,
  Title,
} from '@mantine/core';
import type React from 'react';
import type { VerifyAccessData } from './dto.ts';

export interface VerifyAccessProps {
  verifyAccess: VerifyAccessData;
}

export const VerifyAccess: React.FC<VerifyAccessProps> = ({ verifyAccess }) => {
  return (
    <Container mt={32}>
      <Title order={1} mb="xl">
        Verify Access
      </Title>
      <form method="POST">
        <Stack align="start">
          <Input.Wrapper
            id="access-pin-label"
            label="Enter access pin"
            error={verifyAccess.error}
            required
          >
            <PinInput
              id="access-pin-input"
              name="accessPin"
              length={5}
              error={!!verifyAccess.error}
            />
          </Input.Wrapper>

          <Button type="submit">Submit</Button>
        </Stack>
      </form>
    </Container>
  );
};
