import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
// import devtools from 'solid-devtools/vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    /*
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    cssInjectedByJsPlugin(),
    solidPlugin(),
  ],
  server: {
    port: 3001,
  },
  build: {
    rollupOptions: {
      output: {
        compact: true,
        entryFileNames: "bundle.js",
      },
      input: {
        main: 'src/index.jsx',
      },
    },
    target: 'esnext',
  },
});
