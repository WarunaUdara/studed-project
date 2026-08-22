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
    plugins: [
      TanStackRouterVite({ autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      {
        name: "clean-puck-css-imports",
        transform(code, id) {
          if (id.includes("@puckeditor") && id.endsWith(".css")) {
            return {
              code: code.replace(/@import\s+["']https:\/\/rsms\.me\/inter\/inter\.css["'];?/g, ""),
              map: null,
            };
          }
        },
      },
      {
        // The Puck editor chunk (908 kB) is educator-only. Roldown-vite
        // preloads it into the entry HTML even though only a lazy dynamic
        // import references it; strip the preload hints so students never
        // fetch it. The chunk still loads on demand when the editor mounts.
        name: "strip-educator-chunk-preloads",
        transformIndexHtml(html) {
          return html
            .replace(/<link rel="modulepreload"[^>]*href="[^"]*vendor-puck[^"]*"[^>]*>/g, "")
            .replace(/<link rel="stylesheet"[^>]*href="[^"]*vendor-puck[^"]*"[^>]*>/g, "");
        },
      },
    ],
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
        // Course manifests live outside the frontend package so content-sync
        // and the app read the exact same files.
        "@content": path.resolve(import.meta.dirname, "../content"),
      },
    },
    server: {
      port: 5173,
      fs: {
        // Needed for the "@content" alias, which points above the Vite root.
        allow: [path.resolve(import.meta.dirname), path.resolve(import.meta.dirname, "../content")],
      },
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
        "/code": {
          target,
          changeOrigin: true,
        },
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
              // The puck group regex would otherwise swallow @puckeditor/core's NESTED
              // zustand + use-sync-external-store copies; the app's own stores
              // resolve into them, dragging the whole 908 kB Puck editor into
              // the entry preload of every page, students included. Give both
              // their own groups (matched first) so they stay entry-sized.
              {
                name: "vendor-zustand",
                test: /node_modules[\\/](zustand|use-sync-external-store)[\\/]/,
              },
              { name: "vendor-puck", test: /node_modules[\\/]@puckeditor[\\/]/ },
              {
                name: "vendor-three",
                test: /node_modules[\\/](three|@types[\\/]three|ogl|postprocessing)[\\/]/,
              },
              {
                name: "vendor-katex",
                test: /node_modules[\\/](katex|rehype-katex|remark-math)[\\/]/,
              },
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
