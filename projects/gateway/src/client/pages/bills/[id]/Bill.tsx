import {
  Center,
  Container,
  Divider,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type React from 'react';
import { useEffect, useState } from 'react';
import { BillParticipantInput } from '../../../components/BasePage/BillParticipantInput.tsx';
import { BillStatusNotification } from '../../../components/BasePage/BillStatusNotification.tsx';
import {
  createBillParticipant,
  deleteParticipant,
  fetchBill,
} from '../../../utils/api.ts';
import type { BillData } from './dto.ts';

const USCurrency = Intl.NumberFormat('en-US', {
  currency: 'USD',
  style: 'currency',
});

interface BillProps {
  bill: BillData;
}

export const Bill: React.FC<BillProps> = (props) => {
  const [bill, setBill] = useState<BillData>(props.bill);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [participants, setParticipants] = useState(props.bill.participants);
  const [updatingParticipants, setUpdatingParticipants] = useState(false);

  useEffect(() => {
    // No need to refetch the bill if it's done parsing
    if (props.bill.imageStatus !== 'parsing') {
      return;
    }

    const pollBill = async () => {
      setAnalyzeProgress((prev) => (prev < 100 ? prev + 5 : prev));

      try {
        const { data } = await fetchBill(bill.id);
        if (data.imageStatus === 'parsing') {
          // Refetch if it's still parsing
          return setTimeout(() => pollBill(), 1000);
        }
        setBill(data);
      } catch (e) {
        console.log(e);
        // Any fetch errors we can just set the image status to error
        setBill((prev) => ({
          ...prev,
          imageStatus: 'error',
        }));
      }
    };

    void pollBill();
  }, [props.bill.imageStatus]);

  const handleOnChangeParticipant = async (newParticipants: string[]) => {
    if (updatingParticipants) {
      return;
    }

    setUpdatingParticipants(() => true);

    // Any new names not in the old list need to be created
    const createName = newParticipants.find(
      (newParticipant) =>
        !participants
          .map((participant) => participant.name)
          .includes(newParticipant),
    );

    // Any names in the old list that aren't in the new list need to be deleted
    const deleteId = participants.find(
      (participant) => !newParticipants.includes(participant.name),
    )?.id;

    if (createName) {
      try {
        const { data } = await createBillParticipant(bill.id, createName);
        setParticipants((participants) => [
          ...participants,
          { id: data.id, name: createName },
        ]);
      } catch {
        // no-op
      }
    }

    if (deleteId) {
      try {
        const { data } = await deleteParticipant(bill.id, deleteId);
        setParticipants((participants) =>
          participants.filter((participant) => participant.id !== data.id),
        );
      } catch {
        // no-op
      }
    }

    setUpdatingParticipants(() => false);
  };

  const subTotal = bill.lineItems?.reduce(
    (total, item) => item.price + total,
    0,
  );

  const total = (subTotal ?? 0) + (bill.gratuity ?? 0) + (bill.tax ?? 0);

  return (
    <Container mt={32}>
      <Title size={56} order={1} ta="center" mb="xl">
        Here is your bill!
      </Title>
      <Center mb="xl">
        <img
          width="auto"
          height="300px"
          src={bill.imagePath}
          alt="bill image"
        />
      </Center>
      {/* Only show image status notification if it's not initially ready */}
      {props.bill.imageStatus !== 'ready' && (
        <BillStatusNotification
          analyzeProgress={analyzeProgress}
          imageStatus={bill.imageStatus}
        />
      )}
      <Stack gap="xs" mb="xl">
        <Group gap="md" justify="space-between">
          <Text>Subtotal:</Text>
          <Text>
            {bill.imageStatus === 'ready'
              ? USCurrency.format(subTotal ?? 0)
              : 'Pending'}
          </Text>
        </Group>
        <Group gap="md" justify="space-between">
          <Text>Tax:</Text>
          <Text>
            {bill.imageStatus === 'ready'
              ? USCurrency.format(bill.tax ?? 0)
              : 'Pending'}
          </Text>
        </Group>
        <Group gap="md" justify="space-between">
          <Text>Gratuity:</Text>
          <Text>
            {bill.imageStatus === 'ready'
              ? USCurrency.format(bill.gratuity ?? 0)
              : 'Pending'}
          </Text>
        </Group>
        <Divider />
        <Group gap="md" justify="space-between">
          <Text size="xl" component={'b'} fw={'bolder'}>
            Total:
          </Text>
          <Text size="xl" component={'b'} fw={'bolder'}>
            {bill.imageStatus === 'ready'
              ? USCurrency.format(total)
              : 'Pending'}
          </Text>
        </Group>
      </Stack>
      <BillParticipantInput
        participants={participants}
        onChange={handleOnChangeParticipant}
        updating={updatingParticipants}
      />
    </Container>
  );
};
