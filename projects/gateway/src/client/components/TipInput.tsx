import { NumberInput } from '@mantine/core';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { updateBill } from '../api/api.ts';

interface TipInputProps {
  billId: number;
  tip: number;
  onChange: (tip: number) => void;
}

export const TipInput: React.FC<TipInputProps> = ({
  billId,
  tip,
  onChange,
}) => {
  const [inputTip, setInputTip] = useState(tip);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const abortRef = useRef<AbortController>(new AbortController());

  useEffect(() => {
    setInputTip(tip);
  }, [tip]);

  const handleOnChange = (value: number | string) => {
    const newTip = typeof value === 'string' ? 0 : value;

    // Set the tip on every change for responsiveness, but throttle the
    // onChange handler to not spam the api.
    setInputTip(() => newTip);

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        await updateBill(billId, { tip: newTip }, abortRef.current.signal);
        onChange(newTip);
      } catch (e) {
        // Most likely signal was aborted
        console.log(e);
      }
    }, 500);
  };

  return (
    <NumberInput
      allowNegative={false}
      styles={{
        input: { width: '75px' },
      }}
      id="tip-input"
      aria-label="tip percent"
      max={100}
      min={0}
      suffix="%"
      stepHoldInterval={100}
      value={inputTip}
      onChange={handleOnChange}
    />
  );
};
