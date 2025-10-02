import {
  Anchor,
  Button,
  Container,
  Notification,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import type React from 'react';
import { useState } from 'react';
import type { AdminData } from './dto.ts';

export interface AdminProps {
  admin: AdminData;
}

export const Admin: React.FC<AdminProps> = ({ admin }) => {
  const [showPinNotification, setShowPinNotification] = useState(
    !!admin.pinGenerated,
  );

  const renderContent = () => {
    if (admin.authorized) {
      return (
        <form method="POST">
          <Stack align="start">
            <TextInput
              id="generate-pin-input"
              label="Generate pin"
              description="Enter a 5 digit pin"
              name="pin"
              defaultValue={admin.pin}
              maxLength={5}
              minLength={5}
              required
            />
            <Button type="submit">Submit</Button>
            {showPinNotification && admin.pin && (
              <Notification
                title="Pin Successfully Generated"
                onClose={() => setShowPinNotification(false)}
              >
                The pin "{admin.pin}" will be valid for 10 minutes.
              </Notification>
            )}
          </Stack>
        </form>
      );
    }
    return (
      <form action="/admin" method="POST">
        <Stack align="start">
          <TextInput
            id="authentication-code-input"
            defaultValue={admin.authenticationCode}
            label="Enter authentication code"
            error={admin.authenticationError}
            name="authenticationCode"
            required
          />
          <Button type="submit">Authorize</Button>
        </Stack>
      </form>
    );
  };

  return (
    <Container mt={32}>
      <Title order={1} mb="xl">
        Admin
      </Title>
      <Anchor href="/" display="block" mb={32}>
        Return to homepage
      </Anchor>
      {renderContent()}
    </Container>
  );
};
