import { authExchange } from "@urql/exchange-auth";
import { createClient as createWsClient } from "graphql-ws";
import {
  cacheExchange,
  createClient,
  fetchExchange,
  type OperationResult,
  subscriptionExchange,
} from "urql";

const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
    }
  }
`;

const GRAPHQL_URL =
  import.meta.env.VITE_GRAPHQL_URL ||
  (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/graphql` : "/graphql");

const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (GRAPHQL_URL.startsWith("http")) return GRAPHQL_URL.replace(/^http/, "ws");
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}${GRAPHQL_URL}`;
  }
  return "ws://localhost:8080/graphql";
};

const subscriptionForwarder = (request: {
  query?: string;
  variables?: Record<string, unknown>;
}) => ({
  subscribe(sink: {
    next: (value: OperationResult) => void;
    error: (error: Error) => void;
    complete: () => void;
  }) {
    const client = createWsClient({
      url: getWsUrl(),
      lazy: true,
    });
    const dispose = client.subscribe(
      { query: request.query ?? "", variables: request.variables },
      {
        next: (result) => sink.next(result as OperationResult),
        error: (err) => sink.error(err instanceof Error ? err : new Error(String(err))),
        complete: () => sink.complete(),
      },
    );
    return { unsubscribe: dispose };
  },
});

export const graphqlClient = createClient({
  url: GRAPHQL_URL,
  preferGetMethod: false,
  fetchOptions: {
    credentials: "include",
  },
  exchanges: [
    cacheExchange,
    authExchange(async (utils) => {
      return {
        addAuthToOperation(operation) {
          return operation;
        },
        willAuthError() {
          return false;
        },
        didAuthError(error) {
          return error.graphQLErrors.some((e) => e.message?.toLowerCase().includes("unauthorized"));
        },
        async refreshAuth() {
          try {
            const result = await utils.mutate(REFRESH_TOKEN_MUTATION, { refreshToken: "" });
            if (!result.data?.refreshToken) {
              localStorage.removeItem("studed_has_session");
            }
          } catch (_err) {
            localStorage.removeItem("studed_has_session");
          }
        },
      };
    }),
    subscriptionExchange({
      forwardSubscription: (operation) => subscriptionForwarder(operation),
    }),
    fetchExchange,
  ],
});
