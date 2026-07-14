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
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "vendor-react", test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: "vendor-motion", test: /node_modules[\\/]framer-motion[\\/]/ },
            { name: "vendor-lucide", test: /node_modules[\\/]lucide-react[\\/]/ },
            { name: "vendor-graphql", test: /node_modules[\\/](urql|@urql|graphql)[\\/]/ },
            { name: "vendor-baseui", test: /node_modules[\\/]@base-ui[\\/]/ },
            { name: "vendor-zod", test: /node_modules[\\/]zod[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
});
