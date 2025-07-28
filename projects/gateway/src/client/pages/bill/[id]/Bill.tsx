import {
  Center,
  Container,
  SemiCircleProgress,
  TextInput,
  Title,
} from '@mantine/core';
import React, { useEffect, useState } from 'react';

interface BillProps {
  bill: {
    image_path?: string;
    image_status: 'parsing' | 'ready' | 'error';
  };
}

export const Bill: React.FC<BillProps> = ({ bill }) => {
  const [analyzeProgress, setAnalyzeProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnalyzeProgress((prevState) => {
        if (prevState < 100) {
          return prevState + 10;
        }
        clearTimeout(timeout);
        return prevState;
      });
    }, 1000);

    return () => clearTimeout(timeout);
  });

  return (
    <Container mt={32}>
      <Title size={56} order={1} ta="center" mb="xl">
        Here is your bill, let&#39;s take a look!
      </Title>
      {bill.image_status === 'parsing' && (
        <Center mb="xl">
          <SemiCircleProgress
            label="Extracting image upload"
            value={analyzeProgress}
            size={225}
            thickness={20}
            transitionDuration={250}
          />
        </Center>
      )}
      <Center mb="xl">
        <img src={bill.image_path} alt="bill image" />
      </Center>
      <form>
        <TextInput
          id="participant-input"
          label="Add Participants"
          placeholder="Enter someone's name"
          size="md"
        />
      </form>
    </Container>
  );
};
