import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The API runs on :4000; proxy /api during dev so the browser talks same-origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
