import {
  Accordion,
  Checkbox,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type React from 'react';
import { useMemo } from 'react';
import type { LineItems, Participant } from '../pages/bills/[id]/dto.ts';
import {
  createLineItemParticipant,
  deleteLineItemParticipant,
  fetchBillParticipants,
} from '../utils/api.ts';
import { USCurrency } from '../utils/UsCurrency.ts';
import styles from './BillParticipantSection.module.css';

interface BillParticipantSectionsProps {
  billId: number;
  lineItems: LineItems;
  participants: Participant[];
  /**
   * When updates are made to the bill participant sections we'll send back a
   * new reference to the participant array with all changes.
   */
  onChange: (newParticipants: Participant[]) => void;
  onCalculateParticipantOwes: (lineItems: Participant['lineItems']) => {
    withTip: number;
    withoutTip: number;
  };
}

export const BillParticipantSection: React.FC<BillParticipantSectionsProps> = ({
  billId,
  lineItems,
  participants,
  onChange,
  onCalculateParticipantOwes,
}) => {
  const participantLineItemLookup = useMemo(() => {
    const records: Record<
      string,
      Record<string, { id: number; pctOwes: number }>
    > = {};
    participants.forEach((participant) => {
      records[participant.id] ??= {};
      participant.lineItems.forEach((lineItem) => {
        records[participant.id][lineItem.lineItemId] = lineItem;
      });
    });

    return records;
  }, [participants]);

  const renderOwes = (lineItems: Participant['lineItems']) => {
    const { withTip, withoutTip } = onCalculateParticipantOwes(lineItems);
    const tipAmount = new Intl.NumberFormat('en-US', {
      style: 'percent',
    }).format((withTip - withoutTip) / withoutTip || 0);

    // TODO add tooltip for explaining the amount (pass in tax/tip share)
    return (
      <>
        Owes{' '}
        <Text span fw={700}>
          {USCurrency.format(withoutTip)}
        </Text>{' '}
        (
        <Text span fs="italic">
          {USCurrency.format(withTip)}
        </Text>{' '}
        with {tipAmount} tip)
      </>
    );
  };

  const handleOnItemClick = async (
    checked: boolean,
    lineItemId: number,
    participantId: number,
  ) => {
    try {
      if (checked) {
        await createLineItemParticipant(lineItemId, participantId);
      } else {
        const id = participantLineItemLookup[participantId][lineItemId].id;
        await deleteLineItemParticipant(id);
      }

      const { data } = await fetchBillParticipants(billId);
      onChange(data);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <Accordion
      id="participant-accordion"
      multiple
      defaultValue={participants.map((participant) => participant.name)}
    >
      {participants.map((participant) => (
        <Accordion.Item key={participant.id} value={participant.name}>
          <Accordion.Control>
            <Title tt="capitalize" order={2} mb="xs">
              {participant.name}
            </Title>
            <Text>{renderOwes(participant.lineItems)}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="lg" mb="sm">
              Assign Items
            </Text>
            <ScrollArea h={250}>
              {lineItems.map((lineItem) => (
                <Checkbox.Card
                  key={lineItem.id}
                  p={8}
                  className={styles.root}
                  checked={
                    !!participantLineItemLookup[participant.id][lineItem.id]
                  }
                  onChange={(checked) =>
                    handleOnItemClick(checked, lineItem.id, participant.id)
                  }
                >
                  <Group align="start" wrap="nowrap">
                    <Checkbox.Indicator />
                    <Stack gap={0}>
                      <Text fw={700}>{lineItem.name}</Text>
                      <Text>{USCurrency.format(lineItem.price)}</Text>
                    </Stack>
                  </Group>
                </Checkbox.Card>
              ))}
            </ScrollArea>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};
