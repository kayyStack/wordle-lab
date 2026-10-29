import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    // Two pages: the game and "How Wordle Lab works"
    rollupOptions: {
      input: { main: 'index.html', help: 'help.html' },
    },
  },
});
