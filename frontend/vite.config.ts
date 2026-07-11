import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/graphql": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/api/v1": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
    warmup: {
      clientFiles: [
        "./src/components/puck-blocks/puck-config.tsx",
        "./src/routes/educator/_layout/courses.new.tsx",
        "./src/routes/educator/_layout/courses.tsx",
        "./src/routes/dashboard.tsx",
        "./src/routes/waves.$waveId.tsx",
      ],
    },
  },
});
