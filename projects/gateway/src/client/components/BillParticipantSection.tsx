import { Accordion, Chip, Group, Text, Title } from '@mantine/core';
import type React from 'react';
import { useMemo } from 'react';
import type { LineItems, Participant } from '../pages/bills/[id]/dto.ts';
import {
  createLineItemParticipant,
  deleteLineItemParticipant,
} from '../utils/api.ts';
import { USCurrency } from '../utils/UsCurrency.ts';

interface BillParticipantSectionsProps {
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

    return (
      <>
        <Text span fw={700}>
          With
        </Text>{' '}
        {tipAmount} tip: {USCurrency.format(withTip)}.{' '}
        <Text span fw={700}>
          Without
        </Text>{' '}
        tip: {USCurrency.format(withoutTip)}
      </>
    );
  };

  const handleOnItemClick = async (
    checked: boolean,
    lineItemId: number,
    participantId: number,
    pctOwes: number,
  ) => {
    try {
      let newParticipants: Participant[];
      if (checked) {
        // Count how many
        const { data } = await createLineItemParticipant(
          lineItemId,
          participantId,
          pctOwes,
        );
        newParticipants = participants.map((participant) => ({
          ...participant,
          lineItems: participant.lineItems.concat({
            id: data.id,
            lineItemId,
            pctOwes,
          }),
        }));
      } else {
        const id = participantLineItemLookup[participantId][lineItemId].id;
        const { data } = await deleteLineItemParticipant(id);

        newParticipants = participants.map((participant) => ({
          ...participant,
          lineItems: participant.lineItems.filter(
            (lineItem) => lineItem.id !== data.id,
          ),
        }));
      }

      onChange(newParticipants);
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
            <Text>Owes: {renderOwes(participant.lineItems)}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Text size="lg" mb="sm">
              Assign Items
            </Text>
            <Group gap={8}>
              {lineItems.map((lineItem) => (
                <Chip
                  key={lineItem.id}
                  id={`participant-${participant.id}-item-${lineItem.id}`}
                  size="lg"
                  radius="md"
                  checked={
                    !!participantLineItemLookup[participant.id][lineItem.id]
                  }
                  onChange={(checked) =>
                    handleOnItemClick(
                      checked,
                      lineItem.id,
                      participant.id,
                      lineItem.price,
                    )
                  }
                >
                  {lineItem.name}: {USCurrency.format(lineItem.price)}
                </Chip>
              ))}
            </Group>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};
