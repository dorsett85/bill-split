import { Accordion, Box, Button, Text, Title } from '@mantine/core';
import type React from 'react';
import { useState } from 'react';
import {
  createParticipantLineItem,
  deleteManyParticipantLineItems,
  deleteParticipantLineItem,
} from '../api/api.ts';
import type {
  BillRecalculateData,
  BillRecalculateResponse,
  LineItem,
  Participant,
} from '../pages/bills/[id]/dto.ts';
import { errorNotification } from '../utils/notifications.ts';
import { USCurrency } from '../utils/UsCurrency.ts';
import { BillLineItemModalProps } from './BillItemModal.tsx';
import { BillLineItemParticipantCard } from './BillLineItemParticipantCard.tsx';

interface BillLineItemSectionProps {
  billId: number;
  lineItems: LineItem[];
  participants: Participant[];
  onChange: (recalculatedBill: BillRecalculateData) => void;
}

export const BillLineItemSection: React.FC<BillLineItemSectionProps> = ({
  billId,
  lineItems,
  participants,
  onChange,
}) => {
  const [adjustSharedLineItem, setAdjustSharedLineItem] = useState<
    LineItem | undefined
  >(undefined);

  const handleOnRemoveAll = async (li: LineItem) => {
    try {
      const json = await deleteManyParticipantLineItems(billId, li.id, {
        participants: Object.keys(li.participantById).map((id) => ({
          id: +id,
        })),
      });

      if ('data' in json) {
        onChange(json.data);
      } else {
        errorNotification({
          title: 'Unable to remove all participants',
          message: json.error.message,
        });
      }
    } catch (e) {
      console.log(e);
      errorNotification({
        title: 'Unable to remove all participants',
        message: 'Please refresh the page and try again',
      });
    }
  };

  const handleOnAddAll = (_: LineItem) => {
    // TODO
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
          title: `Unable to ${checked ? 'add' : 'remove'} this participant`,
          message: recalculatedBillResponse.error.message,
        });
      }
    } catch (e) {
      console.log(e);
      errorNotification({
        title: `Unable to ${checked ? 'add' : 'remove'} this participant`,
        message: 'Please refresh the page and try again',
      });
    }
  };

  return (
    <>
      <Accordion
        chevronPosition="left"
        chevronIconSize={20}
        id={'line-item-accordion'}
        styles={{
          chevron: { marginLeft: 4 },
          content: { paddingLeft: 0, paddingRight: 0 },
          control: {
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'var(--mantine-color-body)',
          },
        }}
      >
        {lineItems.map((li) => (
          <Accordion.Item key={li.id} value={li.id.toString()}>
            <Accordion.Control>
              <Box>
                <Title size={'xl'} tt="capitalize" order={2} mb="xs">
                  {li.name}
                </Title>
                <Text>{USCurrency.format(li.price)}</Text>
              </Box>
            </Accordion.Control>

            <Accordion.Panel>
              <Text size="lg" mb="sm">
                Add/Remove Participants
              </Text>
              <Button.Group mb={'lg'}>
                <Button
                  color={'gray'}
                  fullWidth
                  onClick={() => handleOnRemoveAll(li)}
                >
                  Remove Everyone
                </Button>
                <Button
                  color={'orange'}
                  fullWidth
                  onClick={() => handleOnAddAll(li)}
                >
                  Add Everyone
                </Button>
              </Button.Group>
              {participants.map((participant) => (
                <BillLineItemParticipantCard
                  key={participant.id}
                  participantName={participant.name}
                  participantPctOwes={
                    li.participantById[participant.id]?.pctOwes
                  }
                  onChange={(checked) =>
                    handleOnItemClick(checked, li.id, participant.id)
                  }
                  onAdjustSharedItem={() => setAdjustSharedLineItem(li)}
                  switchId={`line-item-participant-card-switch-input-${participant.id}-${li.id}`}
                />
              ))}
            </Accordion.Panel>
          </Accordion.Item>
        ))}
      </Accordion>
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
