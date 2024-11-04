import { Box, Button, Flex, Heading, Strong, Text } from '@radix-ui/themes';
import { CameraIcon, FileIcon } from '@radix-ui/react-icons';
import { ChangeEvent, useRef, useState } from 'react';

export const Home = () => {
  const [filename, setFilename] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOnFileClick = async (capture: boolean) => {
    if (!fileInputRef.current) return;

    // If the user clicks the scan button we'll add the capture attribute,
    // otherwise remove it.
    if (capture) {
      fileInputRef.current.setAttribute('capture', '');
    } else {
      fileInputRef.current.removeAttribute('capture');
    }

    fileInputRef.current.click();
  };

  const handleOnFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFilename(event.target.files?.[0].name);
  };

  return (
    <Box pt="8" mt="8" ml="4" mr="4">
      <Heading size="9" align="center" mb="8">
        Welcome to Bill Split!
      </Heading>
      <Heading align="center" as="h2" mb="6">
        Quickly split the bill by uploading or scanning your receipt 🧾
      </Heading>
      <Heading align="center" as="h2" mb="6">
        Assign the items among your party and we&#39;ll do the math 🙌
      </Heading>
      <form>
        <Flex gap="4" mb="4">
          <Box asChild flexGrow="1">
            <Button
              type="button"
              size="4"
              onClick={() => handleOnFileClick(false)}
            >
              <FileIcon />
              Upload File
            </Button>
          </Box>
          <Box asChild flexGrow="1">
            <Button
              type="button"
              size="4"
              onClick={() => handleOnFileClick(true)}
            >
              <CameraIcon />
              Scan Photo
            </Button>
          </Box>
        </Flex>
        {filename && (
          <Text as="p" align="center">
            <Strong>{filename}</Strong>
          </Text>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleOnFileInputChange}
          hidden
          accept="image/*"
        />
      </form>
    </Box>
  );
};
