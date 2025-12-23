import {
  Anchor,
  Button,
  Container,
  Stack,
  TextInput,
  Title,
} from '@mantine/core';
import type React from 'react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import {
  deleteAccessToken,
  getAccessTokens,
  patchAccessToken,
  postAccessToken,
} from '../../api/api.ts';
import { AdminAccessTokenTable } from '../../components/AdminAccessTokenTable.tsx';
import type { AccessToken, AdminData } from './dto.ts';

const byLatestDesc = (a: AccessToken, b: AccessToken) => {
  return a.createdAt < b.createdAt ? 1 : -1;
};

export interface AdminProps {
  admin: AdminData;
}

export const Admin: React.FC<AdminProps> = ({ admin }) => {
  const [accessTokens, setAccessTokens] = useState<AdminData['accessTokens']>(
    admin.accessTokens?.sort(byLatestDesc),
  );
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | undefined>(undefined);

  const handleOnSubmitToken = async (e: FormEvent) => {
    e.preventDefault();

    let pinError: undefined | string = 'Unable to generate a pin';
    try {
      const res = await postAccessToken(pin);
      if (res.ok) {
        pinError = undefined;
        const { data } = await getAccessTokens();
        setAccessTokens(data.accessTokens?.sort(byLatestDesc));
      }
    } catch {
      // no-op
    }
    setPinError(pinError);
  };

  const handleOnTokenActiveToggle = async (pin: string, active: boolean) => {
    try {
      const res = await patchAccessToken(pin, active);
      if (res.ok) {
        const { data } = await getAccessTokens();
        setAccessTokens(data.accessTokens?.sort(byLatestDesc));
      }
    } catch {
      //
    }
  };

  const handleOnDeleteToken = async (pin: string) => {
    try {
      const res = await deleteAccessToken(pin);
      if (res.ok) {
        const { data } = await getAccessTokens();
        setAccessTokens(data.accessTokens?.sort(byLatestDesc));
      }
    } catch {
      //
    }
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
            </Stack>
          </form>
          <AdminAccessTokenTable
            accessTokens={accessTokens}
            onActiveToggle={handleOnTokenActiveToggle}
            onDelete={handleOnDeleteToken}
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
