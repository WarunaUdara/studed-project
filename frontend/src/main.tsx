import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider as UrqlProvider } from "urql";
import { AuthInitializer } from "./components/auth/AuthInitializer";
import { GlobalErrorBoundary } from "./components/error/GlobalErrorBoundary";
import { graphqlClient } from "./lib/graphql";
import { routeTree } from "./routeTree.gen";
import "./styles/index.css";

const queryClient = new QueryClient();
const router = createRouter({ routeTree });

window.addEventListener("vite:preloadError", (event) => {
  // Prevent Vite's default throw behaviour for CSS/chunk preload failures
  // so transient asset mismatches or network glitches do not crash the app.
  event.preventDefault();
  console.warn("[vite:preloadError] Resource preload failed (ignored):", (event as any).payload);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");
  // Prevents the browser's default console noise and routes the rejection to a
  // single observable place so nothing fails silently in production.
  event.preventDefault();
  console.error("[unhandledrejection]", reason);
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <UrqlProvider value={graphqlClient}>
        <QueryClientProvider client={queryClient}>
          <AuthInitializer>
            <RouterProvider router={router} />
          </AuthInitializer>
        </QueryClientProvider>
      </UrqlProvider>
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
