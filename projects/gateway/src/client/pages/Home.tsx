import { useReducer } from 'react';
import { Box, Button, Heading, Text } from '@radix-ui/themes';
import { wineGlassesSrc } from '../utils/imagesSrc.ts';

export const Home = () => {
  const [count, setCount] = useReducer((prevState) => prevState + 1, 0);

  return (
    <Box>
      <Heading size="6" align="center" mb="4">
        Welcome to Bill Split!
      </Heading>
      <Text align="center" as="p" mb="4">
        Upload a bill or check to begin. You can also manually create one.
      </Text>
      <div>
        <img src={wineGlassesSrc} alt="" />
      </div>
      <Button onClick={setCount} mb="4">
        Increase Count
      </Button>
      <Text as="p">Count: {count}</Text>
    </Box>
  );
};
