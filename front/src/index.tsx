/* @refresh reload */
import 'vite/modulepreload-polyfill'
import { render } from 'solid-js/web';

import App from './App';

const scriptUrl =import.meta.url.includes("t=") ? "http://localhost:3000/bundle.js?channel_id=1258912186244268104" : import.meta.url;
console.log(scriptUrl)
const root = document.querySelector("body");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <App script={scriptUrl} />, root as HTMLElement);
