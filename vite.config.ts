import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages 项目站（username.github.io/仓库名/）需要相对路径
  base: './',
  plugins: [react()],
});
