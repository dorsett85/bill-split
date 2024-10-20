import ReactDomClient from 'react-dom/client';
import { Home } from './Home.tsx';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Unable to find root element');
}

ReactDomClient.hydrateRoot(root, <Home />);
