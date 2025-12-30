import {
  Accordion,
  Box,
  Center,
  Divider,
  ScrollArea,
  Text,
  Title,
} from '@mantine/core';
import type React from 'react';
import {
  createParticipantLineItem,
  deleteParticipantLineItem,
} from '../api/api.ts';
import type {
  BillRecalculateData,
  BillRecalculateResponse,
  LineItems,
  Participant,
} from '../pages/bills/[id]/dto.ts';
import { errorNotification } from '../utils/notifications.ts';
import { BillParticipantCheckBoxCard } from './BillParticipantCheckBoxCard.tsx';
import { BillParticipantEdit } from './BillParticipantEdit.tsx';

interface BillParticipantSectionsProps {
  billId: number;
  lineItems: LineItems;
  participants: Participant[];
  onChange: (recalculatedBill: BillRecalculateData) => void;
  /**
   * Render the line calculating how much and individual participant owes
   */
  renderParticipantOwes: (participant: Participant) => React.ReactElement;
}

export const BillParticipantSection: React.FC<BillParticipantSectionsProps> = ({
  billId,
  lineItems,
  participants,
  onChange,
  renderParticipantOwes,
}) => {
  const handleOnNameChange = (participantId: number, name: string) => {
    const updatedParticipants = participants.map((participant) => {
      return {
        ...participant,
        // Update with the new name
        name: participantId === participant.id ? name : participant.name,
      };
    });
    onChange({ participants: updatedParticipants, lineItems });
  };

  const handleOnDeleteParticipant = (recalculatedData: BillRecalculateData) => {
    onChange(recalculatedData);
  };

  const handleOnItemClick = async (
    checked: boolean,
    lineItemId: number,
    participantId: number,
  ) => {
    try {
      let recalculatedBillResponse: BillRecalculateResponse;
      if (checked) {
        recalculatedBillResponse = await createParticipantLineItem(
          billId,
          participantId,
          lineItemId,
        );
      } else {
        recalculatedBillResponse = await deleteParticipantLineItem(
          billId,
          participantId,
          lineItemId,
        );
      }

      if ('data' in recalculatedBillResponse) {
        onChange(recalculatedBillResponse.data);
      } else {
        errorNotification({
          title: `Unable to ${checked ? 'claim' : 'unclaim'} this item`,
          message: recalculatedBillResponse.error.message,
        });
      }
    } catch (e) {
      console.log(e);
      errorNotification({
        title: `Unable to ${checked ? 'claim' : 'unclaim'} this item`,
        message: 'Please refresh the page and try again',
      });
    }
  };

  return (
    <Accordion
      chevronPosition="left"
      chevronIconSize={20}
      multiple
      id={'participant-accordion'}
    >
      {participants.map((participant) => (
        <Accordion.Item key={participant.id} value={participant.id.toString()}>
          <Center>
            <Accordion.Control>
              <Box>
                <Title size={'xl'} tt="capitalize" order={2} mb="xs">
                  {participant.name}
                </Title>
                {renderParticipantOwes(participant)}
              </Box>
            </Accordion.Control>
            <BillParticipantEdit
              billId={billId}
              participantId={participant.id}
              name={participant.name}
              onNameChange={(name) => handleOnNameChange(participant.id, name)}
              onDelete={handleOnDeleteParticipant}
            />
          </Center>

          <Accordion.Panel>
            <Text size="lg" mb="sm">
              Claim Items
            </Text>
            <ScrollArea h={250}>
              {lineItems.map((lineItem) => (
                <BillParticipantCheckBoxCard
                  key={lineItem.id}
                  claimed={lineItem.participantIds.includes(participant.id)}
                  othersClaimed={lineItem.participantIds.some(
                    (id) => id !== participant.id,
                  )}
                  onChange={(checked) =>
                    handleOnItemClick(checked, lineItem.id, participant.id)
                  }
                  name={lineItem.name}
                  price={lineItem.price}
                />
              ))}
            </ScrollArea>
            <Divider />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  );
};
