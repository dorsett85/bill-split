import { Button, Card, Group, Switch, Text } from '@mantine/core';
import { IconEdit } from '@tabler/icons-react';
import { USPercent } from '../utils/UsCurrency.ts';
import styles from './BillParticipantCheckBoxCard.module.css';

interface BillLineItemParticipantCardProps {
  participantName: string;
  participantPctOwes?: number;
  onChange: (checked: boolean) => void;
  /**
   * Handler when a user wants to adjust the split on a shared item.
   */
  onAdjustSharedItem: () => void;
  /** Passed to the id attribute of the switch checkbox component */
  switchId: string;
}

export const BillLineItemParticipantCard = ({
  participantName,
  participantPctOwes,
  onChange,
  onAdjustSharedItem,
  switchId,
}: BillLineItemParticipantCardProps) => {
  const handleOnChange = () => {
    onChange(!participantPctOwes);
  };

  const cardClassName =
    participantPctOwes === undefined
      ? ''
      : participantPctOwes < 100
        ? ` ${styles.shared}`
        : ` ${styles.claimed}`;

  const borderColor =
    participantPctOwes === undefined
      ? ''
      : participantPctOwes < 100
        ? 'var(--mantine-color-orange-filled)'
        : 'var(--mantine-primary-color-filled)';

  const switchOnLabel =
    participantPctOwes !== undefined &&
    USPercent.format(participantPctOwes / 100);

  const switchColor =
    participantPctOwes !== undefined && participantPctOwes < 100
      ? 'orange'
      : undefined;

  return (
    <Card
      withBorder
      p={8}
      py={10}
      classNames={{ root: `${styles.item}${cardClassName}` }}
      styles={{ root: { borderColor } }}
    >
      <Group justify={'space-between'} gap={'xs'} wrap="nowrap">
        <Text truncate={'end'} fw={700}>
          {participantName}
        </Text>
        <Group gap={'xs'} wrap="nowrap">
          {participantPctOwes && participantPctOwes < 100 ? (
            <Button
              p={0}
              h={20}
              variant={'transparent'}
              color={'gray'}
              onClick={onAdjustSharedItem}
            >
              <Text span size={'sm'}>
                Edit share
                {participantPctOwes < 100 && <IconEdit size={14} />}
              </Text>
            </Button>
          ) : null}
          <Switch
            id={switchId}
            styles={{
              trackLabel: { fontSize: 10 },
            }}
            onChange={handleOnChange}
            onLabel={switchOnLabel}
            color={switchColor}
            checked={!!participantPctOwes}
            size={'lg'}
          />
        </Group>
      </Group>
    </Card>
  );
};
