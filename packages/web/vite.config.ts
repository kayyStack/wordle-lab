import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // The built page is served on the same port as the dev server, so the app
  // has one address either way
  preview: { port: 5173, strictPort: true },
  build: {
    // Two pages: the game and "How Wordle Lab works"
    rollupOptions: {
      input: { main: 'index.html', help: 'help.html' },
    },
  },
});
