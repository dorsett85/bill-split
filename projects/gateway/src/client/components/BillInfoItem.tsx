import { Box, Group, Text } from '@mantine/core';
import type React from 'react';
import type { PropsWithChildren } from 'react';

interface BillInfoItemProps extends PropsWithChildren {
  label: string;
}

export const BillInfoItem: React.FC<BillInfoItemProps> = ({
  label,
  children,
}) => {
  return (
    <Group gap="md" justify="space-between">
      <Text>{label}:</Text>
      <Box>{children}</Box>
    </Group>
  );
};
