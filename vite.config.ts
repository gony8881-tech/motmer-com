import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// المرحلة القادمة: يمكن إضافة vite-plugin-pwa هنا لتوليد service worker حقيقي.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
});
