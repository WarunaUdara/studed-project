import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target =
    process.env.VITE_PROXY_TARGET ||
    env.VITE_PROXY_TARGET ||
    process.env.VITE_API_URL ||
    env.VITE_API_URL ||
    "http://localhost:8080";

  console.log("[vite.config] Proxy target resolved to:", target);

  return {
    plugins: [TanStackRouterVite(), react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      allowedHosts: [
        "localhost",
        "127.0.0.1",
        ".ngrok-free.app",
        ".ngrok-free.dev",
        ".ngrok.io",
        "mumps-lapel-rinsing.ngrok-free.dev",
      ],
      proxy: {
        "/graphql": {
          target,
          changeOrigin: true,
        },
        "/api/v1": {
          target,
          changeOrigin: true,
        },
        "/ai": {
          target,
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
      chunkSizeWarningLimit: 1000,
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
  };
});
