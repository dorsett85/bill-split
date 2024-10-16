import ReactDomClient from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Unable to find root element');
}

ReactDomClient.hydrateRoot(root, <App />);
