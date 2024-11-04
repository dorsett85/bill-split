import { useReducer } from 'react';
import { Button, Heading } from '@radix-ui/themes';
import { wineGlassesSrc } from '../../utils/imagesSrc.ts';

export const Bill = () => {
  const [count, setCount] = useReducer((prevState) => prevState + 1, 0);

  return (
    <div>
      <Heading size="4">Hello World!</Heading>
      <div>
        <img src={wineGlassesSrc} alt="" />
      </div>
      <Button onClick={setCount}>Increase Count</Button>
      <Heading as="h2">Count: {count}</Heading>
    </div>
  );
};
