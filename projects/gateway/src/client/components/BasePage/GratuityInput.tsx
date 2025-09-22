import { NumberInput } from '@mantine/core';
import type React from 'react';
import { useRef, useState } from 'react';
import { updateBill } from '../../utils/api.ts';

interface GratuityInputProps {
  billId: number;
  gratuity?: number;
  onChange: (gratuity: number) => void;
}

export const GratuityInput: React.FC<GratuityInputProps> = ({
  billId,
  gratuity,
  onChange,
}) => {
  const [inputGratuity, setInputGratuity] = useState(gratuity ?? 0);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);
  const abortRef = useRef<AbortController>(new AbortController());

  const handleOnChange = (gratuity: number | string) => {
    const newGratuity = typeof gratuity === 'string' ? 0 : gratuity;

    // Set the gratuity on every change for responsiveness, but throttle the
    // onChange handler to not spam the api.
    setInputGratuity(() => newGratuity);

    clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      abortRef.current.abort();
      abortRef.current = new AbortController();

      try {
        await updateBill(
          billId,
          { gratuity: newGratuity },
          abortRef.current.signal,
        );
        onChange(newGratuity);
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
      id="gratuity-input"
      aria-label="gratuity percent"
      max={100}
      min={0}
      suffix="%"
      stepHoldInterval={100}
      value={inputGratuity}
      onChange={handleOnChange}
    />
  );
};
