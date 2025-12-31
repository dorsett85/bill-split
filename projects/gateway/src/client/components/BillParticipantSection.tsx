import {
  Accordion,
  ActionIcon,
  Box,
  Center,
  ScrollArea,
  Text,
  Title,
} from '@mantine/core';
import { IconDots } from '@tabler/icons-react';
import type React from 'react';
import { useState } from 'react';
import {
  createParticipantLineItem,
  deleteParticipantLineItem,
} from '../api/api.ts';
import type {
  BillRecalculateData,
  BillRecalculateResponse,
  LineItem,
  Participant,
} from '../pages/bills/[id]/dto.ts';
import { errorNotification } from '../utils/notifications.ts';
import { BillLineItemModalProps } from './BillItemModal.tsx';
import { BillParticipantItemCard } from './BillParticipantItemCard.tsx';
import { BillParticipantModal } from './BillParticipantModal.tsx';
import { BillParticipantOwes } from './BillParticipantOwes.tsx';

interface BillParticipantSectionsProps {
  billId: number;
  tip: number;
  lineItems: LineItem[];
  participants: Participant[];
  onChange: (recalculatedBill: BillRecalculateData) => void;
}

export const BillParticipantSection: React.FC<BillParticipantSectionsProps> = ({
  billId,
  tip,
  lineItems,
  participants,
  onChange,
}) => {
  const [adjustSharedLineItem, setAdjustSharedLineItem] = useState<
    LineItem | undefined
  >(undefined);
  const [editParticipant, setEditParticipant] = useState<
    Participant | undefined
  >();

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
    <>
      <Accordion
        chevronPosition="left"
        chevronIconSize={20}
        id={'participant-accordion'}
        styles={{
          chevron: { marginLeft: 4 },
          content: { paddingLeft: 0, paddingRight: 0 },
        }}
      >
        {participants.map((participant) => (
          <Accordion.Item
            key={participant.id}
            value={participant.id.toString()}
          >
            <Center>
              <Accordion.Control>
                <Box>
                  <Title size={'xl'} tt="capitalize" order={2} mb="xs">
                    {participant.name}
                  </Title>
                  <BillParticipantOwes owes={participant.owes} tip={tip} />
                </Box>
              </Accordion.Control>
              <ActionIcon
                aria-label="Edit Participant"
                title="Edit Participant"
                size="lg"
                variant="subtle"
                color="gray"
                onClick={() => setEditParticipant(participant)}
              >
                <IconDots />
              </ActionIcon>
            </Center>

            <Accordion.Panel>
              <Text size="lg" mb="sm">
                Claim Items
              </Text>
              <ScrollArea h={250} c={'gray'}>
                {lineItems.map((lineItem) => (
                  <BillParticipantItemCard
                    key={lineItem.id}
                    pctOwes={lineItem.participantById[participant.id]?.pctOwes}
                    onChange={(checked) =>
                      handleOnItemClick(checked, lineItem.id, participant.id)
                    }
                    onAdjustSharedItem={() => setAdjustSharedLineItem(lineItem)}
                    name={lineItem.name}
                    price={lineItem.price}
                    switchId={`item-card-switch-input-${participant.id}-${lineItem.id}`}
                  />
                ))}
              </ScrollArea>
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
      <BillParticipantModal
        billId={billId}
        participant={editParticipant}
        onClose={() => setEditParticipant(undefined)}
        onNameChanged={(participantId, newName) => {
          handleOnNameChange(participantId, newName);
          setEditParticipant(undefined);
        }}
        onDeleted={(recalculatedData) => {
          handleOnDeleteParticipant(recalculatedData);
          setEditParticipant(undefined);
        }}
      />
      <BillLineItemModalProps
        billId={billId}
        lineItem={adjustSharedLineItem}
        onClose={() => setAdjustSharedLineItem(undefined)}
        onAdjustedShares={(recalculatedBill) => {
          onChange(recalculatedBill);
          setAdjustSharedLineItem(undefined);
        }}
      />
    </>
  );
};
