import { Group, Text } from '@mantine/core';
import type React from 'react';
import type { PropsWithChildren } from 'react';

interface BillInfoItemProps {
  label: string;
}

export const BillInfoItem: React.FC<PropsWithChildren<BillInfoItemProps>> = ({
  label,
  children,
}) => {
  return (
    <Group gap="md" justify="space-between">
      <Text>{label}:</Text>
      <Text>{children}</Text>
    </Group>
  );
};
