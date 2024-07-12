import { defineConfig } from "vite";
import solidPlugin from 'vite-plugin-solid';

// import devtools from 'solid-devtools/vite';
/**
 * @type {import('vite').UserConfig}
 */
export default defineConfig({
  plugins: [
    /*
    Uncomment the following line to enable solid-devtools.
    For more info see https://github.com/thetarnav/solid-devtools/tree/main/packages/extension#readme
    */
    // devtools(),
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
        esModule: true,
      },
      input: {
        main: 'src/index.tsx',
      },
    },
  },
});
