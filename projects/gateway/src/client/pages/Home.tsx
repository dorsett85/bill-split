import styles from './Home.module.css';
import { useState } from 'react';

export const Home = () => {
  const [count, setCount] = useState(0);

  return (
    <div className={styles.appContainer}>
      <h1>Hello World!</h1>
      <button onClick={() => setCount((prevState) => prevState + 1)}>
        Increase Count
      </button>
      <h2>Count: {count}</h2>
    </div>
  );
};
