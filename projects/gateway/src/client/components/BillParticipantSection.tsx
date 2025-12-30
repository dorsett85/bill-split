import {
  ActionIcon,
  Box,
  Collapse,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Text,
  Title,
  useComputedColorScheme,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import type React from 'react';
import { useState } from 'react';
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
import { BillParticipantEditName } from './BillParticipantEditName.tsx';

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
  const colorScheme = useComputedColorScheme();
  const [openSection, setOpenSection] = useState<Set<number>>(new Set());

  const handleOnToggleSection = (id: number) => {
    if (openSection.has(id)) {
      openSection.delete(id);
    } else {
      openSection.add(id);
    }
    setOpenSection(new Set(openSection));
  };

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
    <Stack mb="xl">
      {participants.map((participant) => (
        <Stack key={participant.id}>
          <Box>
            <Group justify="space-between">
              <Title tt="capitalize" order={2} mb="xs">
                {participant.name}
                <sup>
                  <BillParticipantEditName
                    billId={billId}
                    participantId={participant.id}
                    name={participant.name}
                    onNameChange={(name) =>
                      handleOnNameChange(participant.id, name)
                    }
                  />
                </sup>
              </Title>
              <ActionIcon
                aria-label="toggle section"
                size="xl"
                variant="transparent"
                title="Toggle claims items"
                color={colorScheme === 'dark' ? 'white' : 'dark'}
                onClick={() => handleOnToggleSection(participant.id)}
              >
                {openSection.has(participant.id) ? (
                  <IconChevronUp />
                ) : (
                  <IconChevronDown />
                )}
              </ActionIcon>
            </Group>
            {renderParticipantOwes(participant)}
          </Box>
          <Divider />
          <Collapse in={openSection.has(participant.id)} mb="md">
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
          </Collapse>
        </Stack>
      ))}
    </Stack>
  );
};
