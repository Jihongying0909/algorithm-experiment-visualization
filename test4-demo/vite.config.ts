import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const REPO_NAME = 'test4-demo';

export default defineConfig({
  plugins: [react()],
  base: `/${REPO_NAME}/`,
});
