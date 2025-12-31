import { Text } from '@mantine/core';
import type React from 'react';
import { memo } from 'react';
import { USCurrency } from '../utils/UsCurrency.ts';

interface BillParticipantOwesProps {
  owes: number;
  tip: number;
}

export const BillParticipantOwes: React.FC<BillParticipantOwesProps> = memo(
  ({ owes, tip }) => {
    return (
      <Text truncate={'end'}>
        Owes{' '}
        <Text c="yellow" span fw={700}>
          {USCurrency.format(owes)}
        </Text>{' '}
        (
        <Text c="orange" span fs="italic">
          {USCurrency.format(owes * (tip / 100) + owes)}
        </Text>{' '}
        with {tip}% tip)
      </Text>
    );
  },
);
