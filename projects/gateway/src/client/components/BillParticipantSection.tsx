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
import { useMemo, useState } from 'react';
import {
  createLineItemParticipant,
  deleteLineItemParticipant,
  fetchBill,
} from '../api/api.ts';
import type { LineItems, Participant } from '../pages/bills/[id]/dto.ts';
import { BillParticipantCheckBoxCard } from './BillParticipantCheckBoxCard.tsx';
import { BillParticipantEditName } from './BillParticipantEditName.tsx';

interface BillParticipantSectionsProps {
  billId: number;
  lineItems: LineItems;
  participants: Participant[];
  /**
   * When updates are made to the bill participant sections we'll send back a
   * new reference to the participant array with all changes.
   */
  onChange: (newParticipants: Participant[]) => void;
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
    onChange(updatedParticipants);
  };

  const handleOnItemClick = async (
    checked: boolean,
    lineItemId: number,
    participantId: number,
  ) => {
    try {
      if (checked) {
        await createLineItemParticipant(billId, lineItemId, participantId);
      } else {
        const id = participantLineItemLookup[participantId][lineItemId].id;
        await deleteLineItemParticipant(billId, id);
      }

      const json = await fetchBill(billId);
      if ('data' in json) {
        onChange(json.data.participants);
      }
    } catch (e) {
      console.log(e);
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
                  claimed={
                    !!participantLineItemLookup[participant.id][lineItem.id]
                  }
                  othersClaimed={
                    // See if anyone else has claimed the item
                    Object.entries(participantLineItemLookup).some(
                      ([participantId, items]) => {
                        return (
                          +participantId !== participant.id &&
                          !!items[lineItem.id]
                        );
                      },
                    )
                  }
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
