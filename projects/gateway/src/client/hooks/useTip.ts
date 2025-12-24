import { useEffect, useState } from 'react';

type UseTipOutput = [number, (tip: number) => void];

/**
 * Store tip amount in React state and local storage for each bill.
 */
export const useTip = (billId: number): UseTipOutput => {
  const [tip, setTip] = useState(0);
  const LOCAL_STORAGE_TIP_KEY = `bill-${billId}-tip`;

  useEffect(() => {
    const localTip = localStorage.getItem(LOCAL_STORAGE_TIP_KEY);
    const parsedLocalTip = parseFloat(localTip ?? '');

    // Default to 20% tip if there's no local storage tip
    setTip(parsedLocalTip ?? 20);
  }, []);

  const handleSetTip = (tip: number) => {
    localStorage.setItem(LOCAL_STORAGE_TIP_KEY, tip.toString());
    setTip(tip);
  };

  return [tip, handleSetTip];
};
