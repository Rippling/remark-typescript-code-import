import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';
import pkg from './package.json';
import tsConfig from './tsconfig.json';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['cjs'],
      fileName: 'index',
    },
    minify: false,
    rollupOptions: {
      external: Object.keys(pkg.dependencies || {}),
    },
    sourcemap: true,
    ssr: true,
    target: tsConfig.compilerOptions.module,
  },
  plugins: [
    dts(),
  ],
});
