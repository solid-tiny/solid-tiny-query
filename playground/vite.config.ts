import path from 'node:path';
import UnoCSS from 'unocss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import solidPagesPlugin from 'vite-plugin-solid-pages';

export default defineConfig({
  root: './playground',
  resolve: {
    alias: {
      '~/': `${path.resolve(__dirname, '../src')}/`,
    },
  },
  css: {
    modules: false,
  },
  server: {
    port: 5010,
  },
  plugins: [
    UnoCSS(),
    solidPlugin(),
    solidPagesPlugin({
      dir: './playground/src/pages',
      extensions: ['tsx'],
    }),
  ],
});
