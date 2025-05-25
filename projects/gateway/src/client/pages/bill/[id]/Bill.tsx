import { Container, Text, Title } from '@mantine/core';
import React from 'react';

interface BillProps {
  bill: {
    image_path?: string;
    image_status: 'parsing' | 'ready';
  };
}

export const Bill: React.FC<BillProps> = ({ bill }) => {
  return (
    <Container mt={32}>
      <Title size={56} order={1} ta="center" mb="xl">
        Here is your bill, let&#39;s take a look!
      </Title>
      <Title order={2} ta="center" mb="lg">
        Receipt image location:
      </Title>
      <Text size="xl" ta="center">
        {bill.image_path}
      </Text>
    </Container>
  );
};
