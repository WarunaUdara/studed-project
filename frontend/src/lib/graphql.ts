import { authExchange } from "@urql/exchange-auth";
import { cacheExchange, createClient, fetchExchange } from "urql";

const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
    }
  }
`;

export const graphqlClient = createClient({
  url: "/graphql",
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
              if (
                window.location.pathname !== "/login" &&
                window.location.pathname !== "/register"
              ) {
                window.location.href = "/login";
              }
            }
          } catch (_err) {
            localStorage.removeItem("studed_has_session");
            if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
              window.location.href = "/login";
            }
          }
        },
      };
    }),
    fetchExchange,
  ],
});
