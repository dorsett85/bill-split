import { Button, Popover, Switch, Table, Text } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import type { AccessToken } from '../pages/admin/dto.ts';

interface AdminAccessTokenTableProps {
  accessTokens: AccessToken[];
  onActiveToggle: (pin: string, active: boolean) => void;
  onDelete: (pin: string) => void;
}

export const AdminAccessTokenTable = ({
  accessTokens,
  onActiveToggle,
  onDelete,
}: AdminAccessTokenTableProps) => {
  return (
    <Table
      mt={'xl'}
      verticalSpacing={'xs'}
      striped
      captionSide={'top'}
      data={{
        caption: 'Available access tokens for uploading bills',
        head: ['Pin', 'Active', 'Number of Uses', 'Created Date', 'Delete'],
        body: accessTokens.map((token) => {
          return [
            token.pin,
            <Switch
              id={`active-token-switch-${token.pin}`}
              size={'md'}
              color={'green'}
              key={token.pin}
              checked={token.active}
              onChange={(e) =>
                onActiveToggle(token.pin, e.currentTarget.checked)
              }
            />,
            token.noOfUses,
            token.createdAt.toLocaleString(),
            <Popover key={token.pin} id={`delete-token-popover-${token.pin}`}>
              <Popover.Target>
                <Button color="red" size={'compact-sm'} radius="xl">
                  <IconX size={16} />
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                <Text size={'sm'} mb={'sm'}>
                  Are you sure?
                </Text>
                <Button
                  variant={'outline'}
                  color={'red'}
                  size={'compact-sm'}
                  onClick={() => onDelete(token.pin)}
                >
                  Yes
                </Button>
              </Popover.Dropdown>
            </Popover>,
          ];
        }),
      }}
    />
  );
};
