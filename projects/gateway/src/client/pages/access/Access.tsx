import { Container } from '@mantine/core';
import { VerifyAccessModal } from '../../components/VerifyAccess.tsx';

export const Access = () => {
  const handleOnModalClose = (accessVerified: boolean | undefined) => {
    if (!accessVerified) return;
    const redirectUrl = new URLSearchParams(window.location.search).get(
      'redirectUrl',
    );
    window.location.assign(redirectUrl || '/');
  };

  return (
    <Container mt={32}>
      <VerifyAccessModal
        open
        onClose={handleOnModalClose}
        closeButton={false}
      />
    </Container>
  );
};
