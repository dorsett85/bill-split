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
import { fetchBill } from '../../../api/api.ts';
import { BillInfoItem } from '../../../components/BillInfoItem.tsx';
import { BillInfoItemUnclaimed } from '../../../components/BillInfoItemUnclaimed.tsx';
import { BillItemValue } from '../../../components/BillItemValue.tsx';
import { BillParticipantInput } from '../../../components/BillParticipantInput.tsx';
import { BillParticipantOwes } from '../../../components/BillParticipantOwes.tsx';
import { BillParticipantSection } from '../../../components/BillParticipantSection.tsx';
import { BillStatusNotification } from '../../../components/BillStatusNotification.tsx';
import { TipInput } from '../../../components/TipInput.tsx';
import { useBillSubscription } from '../../../hooks/useBillRecalculate.tsx';
import { useTip } from '../../../hooks/useTip.ts';
import type { BillData, BillRecalculateData, Participant } from './dto.ts';

interface BillProps {
  bill: BillData;
}

export const Bill: React.FC<BillProps> = (props) => {
  const [bill, setBill] = useState<BillData>(props.bill);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [tip, setTip] = useTip(bill.id);

  useEffect(() => {
    // No need to refetch the bill if it's done parsing
    if (props.bill.imageStatus !== 'parsing') {
      return;
    }

    const pollBill = async () => {
      let progress = 0;
      setAnalyzeProgress((prev) => {
        progress = prev + 10;
        return prev < 100 ? progress : prev;
      });

      if (progress >= 100) {
        setBill((prev) => ({
          ...prev,
          imageStatus: 'error',
        }));
        return;
      }

      try {
        const json = await fetchBill(bill.id);
        if ('data' in json) {
          if (json.data.imageStatus === 'parsing') {
            // Refetch if it's still parsing
            return setTimeout(() => pollBill(), 1000);
          }
          // The backend will get a new presigned url on each request, but we
          // only need it on initial page load, otherwise it will rerequest the
          // image with the new presigned url.
          setBill({ ...json.data, imagePath: bill.imagePath });
        }
      } catch {
        // Any fetch errors we can just set the image status to error
        setBill((prev) => ({
          ...prev,
          imageStatus: 'error',
        }));
      }
    };

    void pollBill();
  }, [props.bill.imageStatus]);

  useBillSubscription(bill.id, (recalculatedBill: BillRecalculateData) => {
    setBill({ ...bill, ...recalculatedBill });
  });

  const handleOnCreateParticipant = (newParticipants: Participant[]) => {
    setBill((bill) => ({
      ...bill,
      participants: newParticipants,
    }));
  };

  const handleOnRecalculateBill = (recalculatedBill: BillRecalculateData) => {
    setBill((bill) => ({
      ...bill,
      ...recalculatedBill,
    }));
  };

  const gratuity = bill.gratuity ?? 0;
  const tax = bill.tax ?? 0;
  const discount = bill.discount ?? 0;
  const subTotal = bill.subTotal ?? 0;
  const total = bill.total ?? 0;
  const totalWithTip = total * (tip / 100) + total;

  return (
    <Container mt={32} mb={256}>
      <Title size={48} order={1} ta="center" mb="xl">
        {props.bill.businessName
          ? `"${props.bill.businessName}" Bill`
          : 'Here is your bill!'}
      </Title>
      <Center mb="xl">
        <img
          width="auto"
          height="400px"
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
      <Stack gap="sm" mb="xl">
        {!!discount && (
          <BillInfoItem label="Discount">
            <BillItemValue imageStatus={bill.imageStatus} value={-discount} />
          </BillInfoItem>
        )}
        <BillInfoItem label="Subtotal">
          <BillItemValue imageStatus={bill.imageStatus} value={subTotal} />
        </BillInfoItem>
        <BillInfoItem label="Tax">
          <BillItemValue imageStatus={bill.imageStatus} value={tax} />
        </BillInfoItem>
        {!!gratuity && (
          <BillInfoItem label="Gratuity">
            <BillItemValue imageStatus={bill.imageStatus} value={gratuity} />
          </BillInfoItem>
        )}
        <Divider />
        <BillInfoItem labelProps={{ fw: 700, size: 'lg' }} label="Total">
          <Text span fw={700} size="lg">
            <BillItemValue imageStatus={bill.imageStatus} value={total} />
          </Text>
        </BillInfoItem>
        <BillInfoItem
          labelProps={{ fs: 'italic', fw: 700, size: 'lg' }}
          label="Total With Tip"
        >
          <Group gap={8}>
            <TipInput tip={tip} onChange={setTip} />
            <Text span fs="italic" fw={700} size="lg">
              <BillItemValue
                imageStatus={bill.imageStatus}
                value={totalWithTip}
              />
            </Text>
          </Group>
        </BillInfoItem>
        <BillInfoItemUnclaimed
          lineItems={bill.lineItems}
          participants={bill.participants}
        />
      </Stack>
      <BillParticipantInput
        billId={bill.id}
        onCreateParticipant={handleOnCreateParticipant}
        onDeleteParticipant={handleOnRecalculateBill}
        participants={bill.participants}
      />
      <BillParticipantSection
        billId={bill.id}
        participants={bill.participants}
        lineItems={bill.lineItems}
        onChange={handleOnRecalculateBill}
        renderParticipantOwes={(participant) => (
          <BillParticipantOwes owes={participant.owes} tip={tip} />
        )}
      />
    </Container>
  );
};
