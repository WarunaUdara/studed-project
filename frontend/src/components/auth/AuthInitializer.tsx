import { useEffect, useState } from "react";
import { useMutation, useQuery } from "urql";
import { ME_QUERY } from "@/graphql/auth";
import { useAuthStore } from "@/stores/auth";

const REFRESH_TOKEN_MUTATION = `
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      accessToken
    }
  }
`;

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser } = useAuthStore();
  const hasSession =
    typeof window !== "undefined" &&
    localStorage.getItem("studed_has_session") === "true";

  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: ME_QUERY,
    requestPolicy: "network-only",
    pause: !hasSession,
  });
  const [, refreshToken] = useMutation(REFRESH_TOKEN_MUTATION);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!hasSession) {
      setUser(null);
      return;
    }

    if (fetching || refreshing) return;

    if (error) {
      setUser(null);
      return;
    }

    const me = data?.me ?? null;

    if (!me) {
      setRefreshing(true);
      refreshToken({ refreshToken: "" })
        .then((res) => {
          if (res.data?.refreshToken) {
            reexecuteQuery({ requestPolicy: "network-only" });
          } else {
            setUser(null);
          }
        })
        .catch(() => {
          setUser(null);
        })
        .finally(() => {
          setRefreshing(false);
        });
    } else {
      setUser(me);
    }
  }, [data, fetching, error, setUser, refreshToken, reexecuteQuery, refreshing, hasSession]);

  return <>{children}</>;
}
