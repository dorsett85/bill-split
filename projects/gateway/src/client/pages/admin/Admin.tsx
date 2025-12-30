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
import {
  errorNotification,
  successNotification,
} from '../../utils/notifications.ts';
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

    let newPinError: undefined | string;
    try {
      const json = await postAccessToken(pin);
      if ('data' in json) {
        successNotification({
          title: 'Successfully generated pin',
          message: `Pin: ${pin}`,
        });

        // refetch tokens to update the table
        try {
          const tokenJson = await getAccessTokens();
          if ('data' in tokenJson) {
            setAccessTokens(tokenJson.data.accessTokens.sort(byLatestDesc));
          } else {
            errorNotification({
              title: 'Failed to refetch access tokens',
              message: tokenJson.error.message,
            });
          }
        } catch (e) {
          console.error(e);
          errorNotification({
            title: 'Failed to refetch access tokens',
            message: 'Try refreshing the page',
          });
        }
      } else {
        newPinError = json.error.message;
      }
    } catch (e) {
      console.error(e);
      newPinError = 'Unable to generate a pin';
    }
    setPinError(newPinError);
  };

  const handleOnTokenActiveToggle = async (pin: string, active: boolean) => {
    try {
      const json = await patchAccessToken(pin, active);
      if ('data' in json && json.data.count) {
        return setAccessTokens((oldTokens) =>
          oldTokens?.map((token) =>
            token.pin === pin ? { ...token, active } : token,
          ),
        );
      }
      errorNotification({
        title: `Could not ${active ? 'activate' : 'deactivate'} token`,
        message: 'error' in json ? json.error.message : '',
      });
    } catch (e) {
      console.error(e);
      errorNotification({
        title: `Could not ${active ? 'activate' : 'deactivate'} token`,
        message: 'Please refresh the page and try again',
      });
    }
  };

  const handleOnDeleteToken = async (pin: string) => {
    try {
      const json = await deleteAccessToken(pin);
      if ('data' in json && json.data.count) {
        return setAccessTokens((oldTokens) =>
          oldTokens?.filter((token) => token.pin !== pin),
        );
      }
      errorNotification({
        title: `Could not delete the token`,
        message: 'error' in json ? json.error.message : '',
      });
    } catch (e) {
      console.error(e);
      errorNotification({
        title: `Could not delete the token`,
        message: 'Please refresh the page and try again',
      });
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
