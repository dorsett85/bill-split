import { Button, Container, Group, Text, Title } from '@mantine/core';
import { IconCamera, IconFile } from '@tabler/icons-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { CreateBillResponse } from './dto.ts';

export const Home = () => {
  const [filename, setFilename] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleOnFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!formRef.current) return;

    setFilename(event.target.files?.[0].name);

    // Validate here if needed

    // Automatically submit the form when the user uploads a file
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        body: new FormData(formRef.current),
      });
      const { data } = CreateBillResponse.parse(await res.json());

      // Redirect to the specific bills page
      // TODO Should we flash a success message before redirecting?
      window.location.assign(`bills/${data.id}`);
    } catch (e) {
      console.log(e);
      // TODO add error handler
    }
  };

  return (
    <Container mt={32}>
      <Title size={56} order={1} ta="center" mb="xl">
        Welcome to Bill Split!
      </Title>
      <Title order={2} ta="center" mb="lg">
        Quickly split the bill by uploading or scanning your receipt 🧾
      </Title>
      <Title order={2} ta="center" mb="xl">
        Assign the items among your party and we&#39;ll do the math 🙌
      </Title>
      <form ref={formRef}>
        <Group gap="md" grow>
          <Button
            size="lg"
            onClick={() => handleOnFileClick(false)}
            disabled={!!filename}
            leftSection={<IconFile />}
          >
            Upload File
          </Button>
          <Button
            size="lg"
            onClick={() => handleOnFileClick(true)}
            disabled={!!filename}
            leftSection={<IconCamera />}
          >
            Scan Photo
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
    </Container>
  );
};
