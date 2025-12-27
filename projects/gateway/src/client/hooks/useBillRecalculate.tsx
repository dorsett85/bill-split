import { useEffect, useRef } from 'react';
import { subscribeRecalculateBill } from '../api/api.ts';
import { BillRecalculateData } from '../pages/bills/[id]/dto.ts';

export const useBillSubscription = (
  billId: number,
  onRecalculate: (recalculatedBill: BillRecalculateData) => void,
) => {
  const recalculateHandler = useRef(onRecalculate);
  recalculateHandler.current = onRecalculate;

  useEffect(() => {
    const eventSource = subscribeRecalculateBill(billId);

    eventSource.onmessage = (event) => {
      try {
        const data = BillRecalculateData.parse(JSON.parse(event.data));
        onRecalculate(data);
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [billId]);
};
