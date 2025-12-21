import { Checkbox, Group, Stack, Text } from '@mantine/core';
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
}

export const BillParticipantCheckBoxCard = ({
  claimed,
  othersClaimed,
  onChange,
  name,
  price,
}: BillParticipantCheckBoxCardProps) => {
  const shared = claimed && othersClaimed;
  const onlyOthersClaimed = !claimed && othersClaimed;

  const sharedOrOthersClaimedText = shared ? (
    <Text component="span" c={'green'}>
      (Shared)
    </Text>
  ) : onlyOthersClaimed ? (
    <Text component="span" c={'gray'}>
      (Claimed)
    </Text>
  ) : undefined;

  const handleOnChange = () => {
    onChange(!claimed);
  };

  return (
    <Checkbox.Card
      p={8}
      className={`${styles.claimCheckbox}${shared ? ` ${styles.shared}` : claimed ? ` ${styles.claimed}` : ''}`}
      checked={claimed || onlyOthersClaimed}
      onChange={handleOnChange}
    >
      <Group align="start" wrap="nowrap">
        <Checkbox.Indicator
          color={shared ? 'green' : onlyOthersClaimed ? 'gray' : undefined}
          variant={onlyOthersClaimed ? 'outline' : undefined}
        />
        <Stack gap={0}>
          <Text fw={700}>
            {name}
            {sharedOrOthersClaimedText && <> {sharedOrOthersClaimedText}</>}
          </Text>
          <Text>{USCurrency.format(price)}</Text>
        </Stack>
      </Group>
    </Checkbox.Card>
  );
};
