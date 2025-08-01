import type { Options } from 'tsup';

export default (<Options>{
  entry: ['./src/index.ts'],
  format: 'esm',
  outDir: './dist',
  dts: true,
  clean: true,
});
