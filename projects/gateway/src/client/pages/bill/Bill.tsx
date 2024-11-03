import { useReducer } from 'react';
import { Button } from '@radix-ui/themes';

export const Bill = () => {
  const [count, setCount] = useReducer((prevState) => prevState + 1, 0);

  return (
    <div>
      <h1>Hello World!</h1>
      <Button onClick={setCount}>Increase Count</Button>
      <h2>Count: {count}</h2>
    </div>
  );
};
