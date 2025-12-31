import { Button, List, ListItem, Popover, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type React from 'react';
import type { LineItem, Participant } from '../pages/bills/[id]/dto.ts';
import { BillInfoItem } from './BillInfoItem.tsx';

interface BillInfoItemUnclaimedProps {
  participants: Participant[];
  lineItems: LineItem[];
}

export const BillInfoItemUnclaimed: React.FC<BillInfoItemUnclaimedProps> = ({
  participants,
  lineItems,
}) => {
  const participantLineItemIds = new Set(
    participants
      .flatMap((p) => p.participantLineItems)
      .map((pli) => pli.lineItemId),
  );

  const unclaimedItems = lineItems.filter(
    (lineItem) => !participantLineItemIds.has(lineItem.id),
  );

  return (
    <BillInfoItem
      labelProps={{
        fw: 700,
        size: 'lg',
        c: unclaimedItems.length ? 'yellow' : 'green',
      }}
      label="Unclaimed Items"
    >
      <Popover id="unclaimed-items-popover">
        <Popover.Target>
          <Button
            size={'compact-xs'}
            p={0}
            c={unclaimedItems.length ? 'yellow' : 'green'}
            title="See unclaimed items"
            variant={'transparent'}
            styles={{ label: { alignItems: 'start' } }}
          >
            <Text fw={700} size="lg">
              {unclaimedItems.length}
            </Text>
            <IconInfoCircle size={14} />
          </Button>
        </Popover.Target>
        <Popover.Dropdown style={{ maxWidth: '90%' }}>
          {unclaimedItems.length ? (
            <List size="sm" type="ordered">
              {unclaimedItems.map((item) => (
                <ListItem key={item.id}>{item.name}</ListItem>
              ))}
            </List>
          ) : (
            <Text>All items claimed!</Text>
          )}
        </Popover.Dropdown>
      </Popover>
    </BillInfoItem>
  );
};
