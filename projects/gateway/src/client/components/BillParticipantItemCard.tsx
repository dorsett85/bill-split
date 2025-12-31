import { Card, Group, Stack, Switch, Text } from '@mantine/core';
import { USCurrency } from '../utils/UsCurrency.ts';
import styles from './BillParticipantCheckBoxCard.module.css';

interface BillParticipantCheckBoxCardProps {
  /** Whether the participant has claimed the item */
  claimed: boolean;
  /** Whether other participants have claimed the item */
  othersClaimed: boolean;
  onChange: (checked: boolean) => void;
  name: string;
  price: number;
  /** Passed to the id attribute of the switch checkbox component */
  switchId: string;
}

export const BillParticipantItemCard = ({
  claimed,
  othersClaimed,
  onChange,
  name,
  price,
  switchId,
}: BillParticipantCheckBoxCardProps) => {
  const shared = claimed && othersClaimed;

  const handleOnChange = () => {
    onChange(!claimed);
  };

  const cardClassName = `${styles.item}${shared ? ` ${styles.shared}` : claimed ? ` ${styles.claimed}` : ''}`;

  return (
    <Card
      withBorder
      p={8}
      classNames={{ root: `${styles.item}${cardClassName}` }}
      styles={{
        root: {
          borderColor: shared
            ? 'var(--mantine-color-green-filled)'
            : claimed
              ? 'var(--mantine-primary-color-filled)'
              : '',
        },
      }}
    >
      <Group justify={'space-between'} wrap="nowrap">
        <Stack gap={0}>
          <Text truncate={'end'} fw={700}>
            {name}
          </Text>
          <Group gap={'sm'}>
            <Text>{USCurrency.format(price)}</Text>
          </Group>
        </Stack>
        <Switch
          id={switchId}
          styles={{
            trackLabel: { fontSize: 10 },
          }}
          onChange={handleOnChange}
          onLabel={shared ? 'SHARED' : 'CLAIMED'}
          color={shared ? 'green' : undefined}
          checked={claimed}
          size={'lg'}
        />
      </Group>
    </Card>
  );
};
