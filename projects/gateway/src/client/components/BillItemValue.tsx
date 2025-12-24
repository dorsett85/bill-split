import { Skeleton } from '@mantine/core';
import type { ImageStatus } from '../pages/bills/[id]/dto.ts';
import { USCurrency } from '../utils/UsCurrency.ts';

interface BillItemValueProps {
  imageStatus: ImageStatus;
  value: number;
}

export const BillItemValue = ({ imageStatus, value }: BillItemValueProps) => {
  return imageStatus === 'ready' ? (
    <>{USCurrency.format(value)}</>
  ) : (
    <Skeleton height={24} animate width={64} />
  );
};
