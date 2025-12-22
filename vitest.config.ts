import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    alias: {
      'src': path.resolve(__dirname, './src'),
    },
  },
});
