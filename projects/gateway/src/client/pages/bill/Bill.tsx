import { useReducer } from 'react';
import { Button } from '@radix-ui/themes';
import { wineGlassesSrc } from '../../utils/imagesSrc.ts';

export const Bill = () => {
  const [count, setCount] = useReducer((prevState) => prevState + 1, 0);

  return (
    <div>
      <h1>Hello World!</h1>
      <div>
        <img src={wineGlassesSrc} alt="" />
      </div>
      <Button onClick={setCount}>Increase Count</Button>
      <h2>Count: {count}</h2>
    </div>
  );
};
