import { Box, Heading, Text } from '@radix-ui/themes';
import React from 'react';

interface BillProps {
  bill: {
    image_path?: string;
    image_status: 'parsing' | 'ready';
  };
}

export const Bill: React.FC<BillProps> = ({ bill }) => {
  return (
    <Box pt="8" mt="8" ml="4" mr="4">
      <Heading size="9" align="center" mb="8">
        Here is your bill, let&#39;s take a look!
      </Heading>
      <Heading as="h2" align="center" mb="2">
        Receipt image location:
      </Heading>
      <Text as="p" align="center">
        {bill.image_path}
      </Text>
    </Box>
  );
};
