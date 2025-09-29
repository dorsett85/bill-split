import { Text } from '@mantine/core';
import type React from 'react';
import type { LineItems, Participant } from '../pages/bills/[id]/dto.ts';
import { USCurrency } from '../utils/UsCurrency.ts';

interface BillParticipantOwesProps {
  gratuity: number;
  tax: number;
  tip: number;
  subTotal: number;
  lineItems: LineItems;
  participantLineItems: Participant['lineItems'];
}

export const BillParticipantOwes: React.FC<BillParticipantOwesProps> = ({
  gratuity,
  tax,
  tip,
  subTotal,
  participantLineItems,
  lineItems,
}) => {
  const lineItemPriceMap = Object.fromEntries(
    lineItems.map((li) => [li.id, li.price]),
  );

  const individualSubTotal = participantLineItems.reduce(
    (total, pli) =>
      lineItemPriceMap[pli.lineItemId] * (pli.pctOwes / 100) + total,
    0,
  );

  const taxShare = (individualSubTotal / subTotal) * tax;
  const tipShare = (individualSubTotal / subTotal) * gratuity;
  const totalShare = individualSubTotal + taxShare + tipShare;
  const totalShareWithTip = totalShare * (tip / 100) + totalShare;

  return (
    <Text>
      Owes{' '}
      <Text c="yellow" span fw={700}>
        {USCurrency.format(totalShare)}
      </Text>{' '}
      (
      <Text c="orange" span fs="italic">
        {USCurrency.format(totalShareWithTip)}
      </Text>{' '}
      with {tip}% tip)
    </Text>
  );
};
