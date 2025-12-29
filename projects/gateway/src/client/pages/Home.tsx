import {
  Alert,
  Button,
  Center,
  Container,
  Group,
  Loader,
  Text,
  Title,
} from '@mantine/core';
import { IconCamera, IconFile, IconInfoCircle } from '@tabler/icons-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { createBill } from '../api/api.ts';
import { VerifyAccessModal } from '../components/VerifyAccessModal.tsx';
import { BillCreateResponse } from './dto.ts';

export const Home = () => {
  const [filename, setFilename] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [openVerifyModal, setOpenVerifyModal] = useState(false);

  const handleOnFileClick = async (capture: boolean) => {
    if (!fileInputRef.current) return;

    // Reset the input ref value in case the user returns without reloading
    // (e.g., clicks the back button and tries to upload again)
    fileInputRef.current.value = '';

    // If the user clicks the scan button we'll add the capture attribute,
    // otherwise remove it.
    if (capture) {
      fileInputRef.current.setAttribute('capture', '');
    } else {
      fileInputRef.current.removeAttribute('capture');
    }

    fileInputRef.current.click();
  };

  const requestCreateBill = async (form: HTMLFormElement) => {
    setUploading(true);
    try {
      const res = await createBill(form);

      if (res.status === 403) {
        setOpenVerifyModal(true);
        return setUploading(false);
      }

      const json = BillCreateResponse.parse(await res.json());
      setUploading(false);
      if ('data' in json) {
        setError(undefined);
        const { id, signature } = json.data;
        // Redirect to the specific bills page
        return window.location.assign(`/bills/${id}?signature=${signature}`);
      }
      setError(json.error.message);
    } catch {
      setUploading(false);
      setError(
        'We were unable to upload your bill. Please refresh and try again.',
      );
    }
  };

  const handleOnFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!formRef.current) return;

    setFilename(event.target.files?.[0].name);

    // Validate here if needed
    void requestCreateBill(formRef.current);
  };

  const handleOnVerifyAccessClose = (accessVerified: boolean | undefined) => {
    setUploading(false);
    setOpenVerifyModal(false);
    if (formRef.current && accessVerified) {
      void requestCreateBill(formRef.current);
    }
  };

  return (
    <Container mt={32}>
      <Title size={56} order={1} ta="center" mb="xl">
        Welcome to Check Mate!
      </Title>
      <Title order={2} ta="center" mb="xl">
        Blazing fast bill splitting tool 🪄
      </Title>
      <Title order={2} ta="center" mb="xl">
        Upload or scan your receipt
      </Title>
      <form ref={formRef}>
        <Group gap="md" grow>
          <Button
            size="lg"
            onClick={() => handleOnFileClick(false)}
            disabled={uploading}
            leftSection={<IconFile />}
          >
            Upload
          </Button>
          <Button
            size="lg"
            onClick={() => handleOnFileClick(true)}
            disabled={uploading}
            leftSection={<IconCamera />}
          >
            Take Photo
          </Button>
        </Group>
        <input
          type="file"
          name="receipt"
          ref={fileInputRef}
          onChange={handleOnFileInputChange}
          hidden
          accept="image/*"
        />
      </form>
      {filename && (
        <Text size="xl" display="block" component="strong" ta="center" mt="lg">
          {filename}
        </Text>
      )}
      {uploading && (
        <Center>
          <Loader color="yellow" type="bars" size="xl" mt="lg" />
        </Center>
      )}
      {error && (
        <Alert
          mt={'lg'}
          icon={<IconInfoCircle />}
          color={'red'}
          title={'Something went wrong'}
        >
          {error}
        </Alert>
      )}
      <VerifyAccessModal
        open={openVerifyModal}
        onClose={handleOnVerifyAccessClose}
      />
    </Container>
  );
};
