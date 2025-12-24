import { NumberInput } from '@mantine/core';
import type React from 'react';

interface TipInputProps {
  tip: number;
  onChange: (tip: number) => void;
}

export const TipInput: React.FC<TipInputProps> = ({ tip, onChange }) => {
  const handleOnChange = (value: number | string) => {
    onChange(typeof value === 'string' ? 0 : value);
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
      value={tip}
      onChange={handleOnChange}
    />
  );
};
