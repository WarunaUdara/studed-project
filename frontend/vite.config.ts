import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("@puckeditor")) {
              return "vendor-puck";
            }
            if (id.includes("recharts") || id.includes("d3")) {
              return "vendor-charts";
            }
            if (id.includes("framer-motion")) {
              return "vendor-motion";
            }
            if (id.includes("lucide-react")) {
              return "vendor-lucide";
            }
            if (id.includes("urql") || id.includes("graphql")) {
              return "vendor-graphql";
            }
            if (id.includes("@base-ui")) {
              return "vendor-baseui";
            }
            if (id.includes("zod")) {
              return "vendor-zod";
            }
            if (id.includes("react") || id.includes("react-dom") || id.includes("@tanstack")) {
              return "vendor-core";
            }
            return "vendor";
          }
        },
      },
    },
  },
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
