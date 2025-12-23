import { Alert, Anchor, Container, Title } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';
import type React from 'react';

export interface ErrorProps {
  statusCode: number;
  message: string;
}

export const ErrorStatus: React.FC<ErrorProps> = ({ statusCode, message }) => {
  return (
    <Container mt={32}>
      <Title order={1} size={56} mb="xl" style={{ textAlign: 'center' }}>
        {statusCode}
      </Title>
      <Alert
        icon={<IconInfoCircle />}
        color={'red'}
        title={
          <Anchor href="/" display="block">
            Return to homepage
          </Anchor>
        }
      >
        {message}
      </Alert>
    </Container>
  );
};
