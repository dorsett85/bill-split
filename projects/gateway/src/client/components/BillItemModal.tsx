import { Button, Group, Modal, NumberInput, Stack, Text } from '@mantine/core';
import { type FormEvent, useEffect, useState } from 'react';
import { putManyParticipantLineItems } from '../api/api.ts';
import type { BillRecalculateData, LineItem } from '../pages/bills/[id]/dto.ts';
import { successNotification } from '../utils/notifications.ts';
import { USPercent } from '../utils/UsCurrency.ts';

interface BillLineItemModalProps {
  billId: number;
  lineItem?: LineItem;
  onClose: () => void;
  onAdjustedShares: (recalculatedBill: BillRecalculateData) => void;
}

export const BillLineItemModalProps = ({
  billId,
  lineItem,
  onClose,
  onAdjustedShares,
}: BillLineItemModalProps) => {
  const [participantsById, setParticipantsById] = useState(
    lineItem?.participantById ?? {},
  );
  const [adjustSharesError, setAdjustSharesError] = useState<
    string | undefined
  >();

  // Listen for incoming changes from other people
  useEffect(() => {
    if (lineItem?.participantById) {
      setParticipantsById(lineItem.participantById);
    }
  }, [lineItem?.participantById]);

  const handleOnChange = (participantId: string, value: string | number) => {
    setParticipantsById((prev) => ({
      ...prev,
      [participantId]: {
        ...prev[participantId],
        pctOwes:
          typeof value !== 'number' ? prev[participantId].pctOwes : value,
      },
    }));
  };

  const handleOnSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!lineItem) return;

    const sum = Object.values(participantsById).reduce(
      (total, participant) => total + participant.pctOwes,
      0,
    );

    console.log(sum);

    if (sum !== 100) {
      return setAdjustSharesError(
        `Must equal 100%. Current: ${USPercent.format(sum / 100)}`,
      );
    }
    setAdjustSharesError(undefined);

    try {
      const json = await putManyParticipantLineItems(billId, lineItem.id, {
        participants: Object.entries(participantsById).map(
          ([id, participant]) => ({ id: +id, pctOwes: participant.pctOwes }),
        ),
      });
      if ('data' in json) {
        onAdjustedShares(json.data);
        successNotification({
          title: 'Success',
          message: 'Shares were adjusted',
        });
      } else {
        setAdjustSharesError(json.error.message);
      }
    } catch (e) {
      console.error(e);
      setAdjustSharesError('Unable to update shares');
    }
  };

  const modalContent = lineItem && (
    <Stack gap={'sm'}>
      <Text>Price: {lineItem.price}</Text>
      <form onSubmit={handleOnSubmit}>
        {Object.entries(participantsById).map(
          ([participantId, participant]) => (
            <NumberInput
              key={participantId}
              name={participantId}
              label={participant.name}
              description={'Adjust share'}
              error={!!adjustSharesError}
              min={1}
              max={99}
              required
              mb={'md'}
              onChange={(value) => handleOnChange(participantId, value)}
              value={participant.pctOwes}
            />
          ),
        )}
        <Group gap={'sm'}>
          <Button type={'submit'}>Adjust</Button>
          {adjustSharesError && (
            <Text size={'sm'} c={'red'}>
              {adjustSharesError}
            </Text>
          )}
        </Group>
      </form>
    </Stack>
  );

  return (
    <Modal
      opened={!!lineItem}
      onClose={() => {
        setAdjustSharesError(undefined);
        onClose();
      }}
      title={lineItem?.name}
      centered
    >
      {modalContent}
    </Modal>
  );
};
