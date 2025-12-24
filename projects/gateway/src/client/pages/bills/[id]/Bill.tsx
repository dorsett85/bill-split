import {
  Center,
  Container,
  Divider,
  Group,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import type React from 'react';
import { useEffect, useState } from 'react';
import { fetchBill } from '../../../api/api.ts';
import { BillInfoItem } from '../../../components/BillInfoItem.tsx';
import { BillInfoItemUnclaimed } from '../../../components/BillInfoItemUnclaimed.tsx';
import { BillParticipantInput } from '../../../components/BillParticipantInput.tsx';
import { BillParticipantOwes } from '../../../components/BillParticipantOwes.tsx';
import { BillParticipantSection } from '../../../components/BillParticipantSection.tsx';
import { BillStatusNotification } from '../../../components/BillStatusNotification.tsx';
import { TipInput } from '../../../components/TipInput.tsx';
import { USCurrency } from '../../../utils/UsCurrency.ts';
import type { BillData, Participant } from './dto.ts';
import { calculateTotals } from './utils.ts';

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
        const json = await fetchBill(bill.id);
        if ('data' in json) {
          if (json.data.imageStatus === 'parsing') {
            // Refetch if it's still parsing
            return setTimeout(() => pollBill(), 1000);
          }
          // The backend will get a new presigned url on each request, but we only
          // need it on initial page load, otherwise it will rerequest the image
          // with the new presigned url.
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

  const handleOnChangeParticipant = (newParticipants: Participant[]) => {
    setBill((bill) => ({
      ...bill,
      participants: newParticipants,
    }));
  };

  const {
    gratuity,
    tax,
    tip,
    discount,
    discountPct,
    subTotal,
    total,
    totalWithTip,
  } = calculateTotals(bill);

  const renderBillItemValue = (value: number) => {
    return bill.imageStatus === 'ready' ? (
      USCurrency.format(value)
    ) : (
      <Skeleton height={24} animate width={64} />
    );
  };

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
            {renderBillItemValue(-discount)}
          </BillInfoItem>
        )}
        <BillInfoItem label="Subtotal">
          {renderBillItemValue(subTotal)}
        </BillInfoItem>
        <BillInfoItem label="Tax">{renderBillItemValue(tax)}</BillInfoItem>
        {!!gratuity && (
          <BillInfoItem label="Gratuity">
            {renderBillItemValue(gratuity)}
          </BillInfoItem>
        )}
        <Divider />
        <BillInfoItem labelProps={{ fw: 700, size: 'lg' }} label="Total">
          <Text span fw={700} size="lg">
            {renderBillItemValue(total)}
          </Text>
        </BillInfoItem>
        <BillInfoItem
          labelProps={{ fs: 'italic', fw: 700, size: 'lg' }}
          label="Total With Tip"
        >
          <Group gap={8}>
            <TipInput
              billId={bill.id}
              tip={bill.tip}
              onChange={(tip) => setBill({ ...bill, tip })}
            />
            <Text span fs="italic" fw={700} size="lg">
              {renderBillItemValue(totalWithTip)}
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
        onChange={handleOnChangeParticipant}
        participants={bill.participants}
      />
      <BillParticipantSection
        billId={bill.id}
        participants={bill.participants}
        lineItems={bill.lineItems}
        onChange={handleOnChangeParticipant}
        renderParticipantOwes={(participantLineItems, lineItemPriceLookup) => (
          <BillParticipantOwes
            lineItemPriceLookup={lineItemPriceLookup}
            participantLineItems={participantLineItems}
            tip={tip}
            tax={tax}
            discountPct={discountPct}
            subTotal={subTotal}
            gratuity={gratuity}
          />
        )}
      />
    </Container>
  );
};
