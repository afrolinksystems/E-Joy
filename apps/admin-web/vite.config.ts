import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// E-Joy admin-web dev server port starts at 9603 (project rule).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 9603,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
