import { Card, Group, Stack, Switch, Text } from '@mantine/core';
import { USCurrency, USPercent } from '../utils/UsCurrency.ts';
import styles from './BillParticipantCheckBoxCard.module.css';

interface BillParticipantCheckBoxCardProps {
  participantId: number;
  lineItemParticipantsById: Record<
    string,
    {
      pctOwes: number;
    }
  >;
  onChange: (checked: boolean) => void;
  /**
   * Handler when a user wants to adjust the split on a shared item.
   */
  onAdjustSharedItem: () => void;
  name: string;
  price: number;
  /** Passed to the id attribute of the switch checkbox component */
  switchId: string;
}

export const BillParticipantItemCard = ({
  participantId,
  lineItemParticipantsById,
  onChange,
  name,
  price,
  switchId,
}: BillParticipantCheckBoxCardProps) => {
  const pctOwes: number | undefined =
    lineItemParticipantsById[participantId]?.pctOwes;
  const shared = !!pctOwes && Object.keys(lineItemParticipantsById).length > 1;

  const handleOnChange = () => {
    onChange(!pctOwes);
  };

  const cardClassName = `${styles.item}${shared ? ` ${styles.shared}` : pctOwes ? ` ${styles.claimed}` : ''}`;

  return (
    <Card
      withBorder
      p={8}
      classNames={{ root: `${styles.item}${cardClassName}` }}
      styles={{
        root: {
          borderColor: shared
            ? 'var(--mantine-color-orange-filled)'
            : pctOwes
              ? 'var(--mantine-primary-color-filled)'
              : '',
        },
      }}
    >
      <Group justify={'space-between'} gap={'xs'} wrap="nowrap">
        <Stack
          gap={0}
          flex={1}
          styles={{
            root: {
              overflow: 'hidden',
            },
          }}
        >
          <Text truncate={'end'} fw={700}>
            {name}
          </Text>
          <Group justify={'space-between'}>
            <Text>{USCurrency.format(price)}</Text>
            {pctOwes ? (
              <Group gap={4}>
                <Text span size={'sm'}>
                  Your share:
                </Text>
                <Text span size={'sm'} c={pctOwes === 100 ? 'blue' : 'orange'}>
                  {USPercent.format(pctOwes / 100)}
                </Text>
              </Group>
            ) : null}
          </Group>
        </Stack>
        <Group gap={'xs'} wrap="nowrap">
          <Switch
            id={switchId}
            styles={{
              trackLabel: { fontSize: 10 },
            }}
            onChange={handleOnChange}
            onLabel={'CLAIMED'}
            color={shared ? 'orange' : undefined}
            checked={!!pctOwes}
            size={'lg'}
          />
        </Group>
      </Group>
    </Card>
  );
};
