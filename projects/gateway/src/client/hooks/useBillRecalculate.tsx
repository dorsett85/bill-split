import { useEffect, useRef } from 'react';
import { subscribeRecalculateBill } from '../api/api.ts';
import {
  type BillRecalculateData,
  BillRecalculateResponse,
} from '../pages/bills/[id]/dto.ts';

export const useBillSubscription = (
  billId: number,
  onRecalculate: (recalculatedBill: BillRecalculateData) => void,
) => {
  const recalculateHandler = useRef(onRecalculate);
  recalculateHandler.current = onRecalculate;

  useEffect(() => {
    const eventSource = subscribeRecalculateBill(billId);

    eventSource.onmessage = (event) => {
      console.log(event.data);

      try {
        const json = BillRecalculateResponse.parse(event.data);
        if ('data' in json) {
          onRecalculate(json.data);
        }
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
