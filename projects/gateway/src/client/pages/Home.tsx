import {
  Button,
  Center,
  Container,
  Group,
  Loader,
  NumberInput,
  type NumberInputHandlers,
  Title,
} from '@mantine/core';
import { IconCamera, IconFile, IconMinus, IconPlus } from '@tabler/icons-react';
import { useRef, useState } from 'react';
import { createBill } from '../api/api.ts';
import { VerifyAccessModal } from '../components/VerifyAccessModal.tsx';
import { errorNotification } from '../utils/notifications.ts';
import { BillCreateResponse } from './dto.ts';

export const Home = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const numPayeesHandlerRef = useRef<NumberInputHandlers>(null);
  const [uploading, setUploading] = useState(false);
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

  const requestCreateBill = async () => {
    if (!formRef.current) return;
    const form = formRef.current;

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
        const { id, signature } = json.data;
        // Redirect to the specific bills page
        return window.location.assign(`/bills/${id}?signature=${signature}`);
      }
      errorNotification({
        title: 'We were unable to upload your bill',
        message: json.error.message,
      });
    } catch (e) {
      console.error(e);
      setUploading(false);
      errorNotification({
        title: 'We were unable to upload your bill',
        message: 'Please refresh the page and try again',
      });
    }
  };

  const handleOnVerifyAccessClose = (accessVerified: boolean | undefined) => {
    setUploading(false);
    setOpenVerifyModal(false);
    if (accessVerified) {
      void requestCreateBill();
    }
  };

  const NUMBER_OF_PAYEES_LABEL = 'number-of-payees-label';

  return (
    <Container mt={32}>
      <Title size={48} order={1} ta="center" mb="xl">
        Welcome to Check Mate!
      </Title>
      <Title order={2} ta="center" mb="xl">
        Blazing fast bill splitting 🪄
      </Title>

      <form ref={formRef}>
        <Title id={NUMBER_OF_PAYEES_LABEL} order={2} ta="center" mb="lg">
          How many people are paying?
        </Title>
        <Group justify={'center'} style={{ flexWrap: 'nowrap' }} mb={'lg'}>
          <Button
            size={'lg'}
            onClick={() => numPayeesHandlerRef.current?.decrement()}
            variant="outline"
          >
            <IconMinus />
          </Button>
          <NumberInput
            id={'number-of-payees-input'}
            name={'numPayees'}
            aria-labelledby={NUMBER_OF_PAYEES_LABEL}
            readOnly
            handlersRef={numPayeesHandlerRef}
            defaultValue={4}
            min={2}
            max={26}
            hideControls
            styles={(theme) => ({
              input: {
                width: 50,
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'center',
                fontSize: theme.fontSizes.xl,
              },
            })}
          />
          <Button
            size={'lg'}
            onClick={() => numPayeesHandlerRef.current?.increment()}
            variant="outline"
          >
            <IconPlus />
          </Button>
        </Group>
        <Title order={2} ta="center" mb="lg">
          Upload or scan your receipt
        </Title>
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
          onChange={requestCreateBill}
          hidden
          accept="image/*"
        />
      </form>
      {uploading && (
        <Center mt={'xl'}>
          <Loader color="yellow" type="bars" size="xl" />
        </Center>
      )}
      <VerifyAccessModal
        open={openVerifyModal}
        onClose={handleOnVerifyAccessClose}
      />
    </Container>
  );
};
