/* @refresh reload */
import 'vite/modulepreload-polyfill'
import { render } from 'solid-js/web';

import './index.css';
import 'remixicon/fonts/remixicon.css'
import App from './App';
const scriptUrl = (document.currentScript as HTMLScriptElement | null)?.src || "http://localhost:3000/bundle.js?channel_id=1258912186244268104";
const root = document.querySelector("body");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}

render(() => <App script={scriptUrl} />, root as HTMLElement);
