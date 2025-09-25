import { Box, Group, Text, type TextProps } from '@mantine/core';
import type React from 'react';
import type { PropsWithChildren } from 'react';

interface BillInfoItemProps extends PropsWithChildren {
  label: string;
  /**
   * Props passed to the text element of the label text
   */
  labelProps?: TextProps;
}

export const BillInfoItem: React.FC<BillInfoItemProps> = ({
  label,
  labelProps,
  children,
}) => {
  return (
    <Group gap="md" justify="space-between">
      <Text {...labelProps}>{label}:</Text>
      <Box>{children}</Box>
    </Group>
  );
};
