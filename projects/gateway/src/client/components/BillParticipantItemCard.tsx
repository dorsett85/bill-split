import { Button, Card, Group, Stack, Switch, Text } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { USCurrency, USPercent } from '../utils/UsCurrency.ts';
import styles from './BillParticipantCheckBoxCard.module.css';

interface BillParticipantCheckBoxCardProps {
  /** If undefined, then the participant has not claimed this item yet */
  pctOwes?: number;
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
  pctOwes,
  onChange,
  onAdjustSharedItem,
  name,
  price,
  switchId,
}: BillParticipantCheckBoxCardProps) => {
  const handleOnChange = () => {
    onChange(!pctOwes);
  };

  const cardClassName =
    pctOwes === undefined
      ? ''
      : pctOwes < 100
        ? ` ${styles.shared}`
        : ` ${styles.claimed}`;

  const borderColor =
    pctOwes === undefined
      ? ''
      : pctOwes < 100
        ? 'var(--mantine-color-orange-filled)'
        : 'var(--mantine-primary-color-filled)';

  const switchColor =
    pctOwes !== undefined && pctOwes < 100 ? 'orange' : undefined;

  return (
    <Card
      withBorder
      p={8}
      classNames={{ root: `${styles.item}${cardClassName}` }}
      styles={{ root: { borderColor } }}
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
              <Button
                p={0}
                // Subtle adjustment to get the text in line with the price
                mt={-4}
                h={18}
                variant={'transparent'}
                color={'gray'}
                onClick={onAdjustSharedItem}
              >
                <Text span size={'sm'}>
                  Your share
                  {pctOwes < 100 && <IconEdit size={14} />}:
                </Text>
                <Text
                  span
                  size={'sm'}
                  c={pctOwes === 100 ? 'blue' : 'orange'}
                  pl={4}
                >
                  {USPercent.format(pctOwes / 100)}
                </Text>
              </Button>
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
            color={switchColor}
            checked={!!pctOwes}
            size={'lg'}
          />
        </Group>
      </Group>
    </Card>
  );
};
