import { List, ListItem, Popover, Text } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type React from 'react';
import type { LineItems, Participant } from '../pages/bills/[id]/dto.ts';
import { BillInfoItem } from './BillInfoItem.tsx';
import styles from './BillInfoItemUnclaimed.module.css';

interface BillInfoItemUnclaimedProps {
  participants: Participant[];
  lineItems: LineItems;
}

export const BillInfoItemUnclaimed: React.FC<BillInfoItemUnclaimedProps> = ({
  participants,
  lineItems,
}) => {
  const participantLineItemIds = new Set(
    participants.flatMap((p) => p.lineItems).map((pli) => pli.lineItemId),
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
          <Text
            className={styles.valueText}
            fw={700}
            size="lg"
            c={unclaimedItems.length ? 'yellow' : 'green'}
          >
            {unclaimedItems.length}
            <sup>
              <IconInfoCircle size={14} />
            </sup>
          </Text>
        </Popover.Target>
        <Popover.Dropdown
          style={{
            // unset the dropdown width in case the text inside is wider than the
            // screen.
            width: undefined,
          }}
        >
          <List size="sm" type="ordered">
            {unclaimedItems.length ? (
              unclaimedItems.map((item) => (
                <ListItem key={item.id}>{item.name}</ListItem>
              ))
            ) : (
              <ListItem>All items claimed!</ListItem>
            )}
          </List>
        </Popover.Dropdown>
      </Popover>
    </BillInfoItem>
  );
};
