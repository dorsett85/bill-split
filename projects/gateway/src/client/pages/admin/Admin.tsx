import {
  Anchor,
  Button,
  Container,
  Notification,
  Stack,
  Table,
  TextInput,
  Title,
} from '@mantine/core';
import type React from 'react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { getAccessTokens, postAccessToken } from '../../api/api.ts';
import type { AdminData } from './dto.ts';

export interface AdminProps {
  admin: AdminData;
}

export const Admin: React.FC<AdminProps> = ({ admin }) => {
  const [accessTokens, setAccessTokens] = useState<AdminData['accessTokens']>(
    admin.accessTokens,
  );
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | undefined>(undefined);
  const [showPinNotification, setShowPinNotification] = useState(false);

  const handleOnSubmitToken = async (e: FormEvent) => {
    e.preventDefault();

    let pinError: undefined | string = 'Unable to generate a pin';
    try {
      const res = await postAccessToken(pin);
      if (res.ok) {
        pinError = undefined;
        setShowPinNotification(true);
        const { data } = await getAccessTokens();
        setAccessTokens(data.accessTokens);
      }
    } catch {
      // no-op
    }
    setPinError(pinError);
  };

  const renderContent = () => {
    if (accessTokens) {
      return (
        <>
          <form onSubmit={handleOnSubmitToken}>
            <Stack align="start">
              <TextInput
                id="generate-pin-input"
                label="Generate pin"
                description="Enter a 5 digit pin"
                name="pin"
                value={pin}
                error={pinError}
                onChange={(e) => setPin(e.target.value)}
                maxLength={5}
                minLength={5}
                required
              />
              <Button type="submit">Submit</Button>
              {showPinNotification && (
                <Notification
                  title="Pin Successfully Generated"
                  onClose={() => setShowPinNotification(false)}
                >
                  The pin "{pin}" can be used up to 10 times.
                </Notification>
              )}
            </Stack>
          </form>
          <Table
            mt={'xl'}
            striped
            styles={{
              table: {
                maxWidth: 500,
              },
            }}
            captionSide={'top'}
            data={{
              caption: 'Available access tokens for uploading bills',
              head: ['Pin', 'Active', 'Number of Uses', 'Created Date'],
              body: accessTokens.map((token) => {
                return [
                  token.pin,
                  token.active ? 'True' : 'False',
                  token.noOfUses,
                  token.createdAt.toLocaleString(),
                ];
              }),
            }}
          />
        </>
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
