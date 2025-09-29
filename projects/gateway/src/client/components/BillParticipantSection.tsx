import {
  ActionIcon,
  Box,
  Checkbox,
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
import type { LineItems, Participant } from '../pages/bills/[id]/dto.ts';
import {
  createLineItemParticipant,
  deleteLineItemParticipant,
  fetchBillParticipants,
} from '../utils/api.ts';
import { USCurrency } from '../utils/UsCurrency.ts';
import { BillParticipantEditName } from './BillParticipantEditName.tsx';
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
  /**
   * Render the line calculating how much and individual participant owes
   */
  renderParticipantOwes: (
    participantLineItems: Participant['lineItems'],
  ) => React.ReactElement;
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
    <Stack mb="xl">
      {participants.map((participant) => (
        <Stack key={participant.id}>
          <Box>
            <Group justify="space-between">
              <Title tt="capitalize" order={2} mb="xs">
                {participant.name}
                <sup>
                  <BillParticipantEditName
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
            {renderParticipantOwes(participant.lineItems)}
          </Box>
          <Divider />
          <Collapse in={openSection.has(participant.id)} mb="md">
            <Text size="lg" mb="sm">
              Claim Items
            </Text>
            <ScrollArea h={250}>
              {lineItems.map((lineItem) => (
                <Checkbox.Card
                  key={lineItem.id}
                  p={8}
                  className={styles.claimCheckbox}
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
            <Divider />
          </Collapse>
        </Stack>
      ))}
    </Stack>
  );
};
