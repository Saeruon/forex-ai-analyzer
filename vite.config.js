import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Frontend calls /api/claude → forwarded to the Express server (holds the API key)
      "/api": "http://localhost:3001",
    },
  },
});
