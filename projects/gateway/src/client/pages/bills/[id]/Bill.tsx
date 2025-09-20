import { Center, Container, Divider, Stack, Title } from '@mantine/core';
import type React from 'react';
import { useEffect, useState } from 'react';
import { BillInfoItem } from '../../../components/BasePage/BillInfoItem.tsx';
import { BillParticipantInput } from '../../../components/BasePage/BillParticipantInput.tsx';
import { BillStatusNotification } from '../../../components/BasePage/BillStatusNotification.tsx';
import { fetchBill } from '../../../utils/api.ts';
import type { BillData, Participants } from './dto.ts';

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

  const handleOnChangeParticipant = (newParticipants: Participants) => {
    setBill((bill) => ({
      ...bill,
      participants: newParticipants,
    }));
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
        <BillInfoItem label="Subtotal">
          {bill.imageStatus === 'ready'
            ? USCurrency.format(subTotal ?? 0)
            : 'Pending'}
        </BillInfoItem>
        <BillInfoItem label="Tax">
          {bill.imageStatus === 'ready'
            ? USCurrency.format(bill.tax ?? 0)
            : 'Pending'}
        </BillInfoItem>
        <BillInfoItem label="Gratuity">
          {bill.imageStatus === 'ready'
            ? USCurrency.format(bill.gratuity ?? 0)
            : 'Pending'}
        </BillInfoItem>
        <Divider />
        <BillInfoItem label="Total">
          {bill.imageStatus === 'ready' ? USCurrency.format(total) : 'Pending'}
        </BillInfoItem>
      </Stack>
      <BillParticipantInput
        billId={bill.id}
        onChange={handleOnChangeParticipant}
        participants={bill.participants}
      />
    </Container>
  );
};
