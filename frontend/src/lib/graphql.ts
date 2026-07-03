import { cacheExchange, createClient, fetchExchange } from "urql";

export const graphqlClient = createClient({
  url: "/graphql",
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: {
    credentials: "include",
  },
});
