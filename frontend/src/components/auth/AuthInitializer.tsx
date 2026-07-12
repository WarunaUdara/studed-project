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
  const { isLoading, setUser } = useAuthStore();
  const [{ data, fetching }, reexecuteQuery] = useQuery({
    query: ME_QUERY,
    requestPolicy: "network-only",
  });
  const [, refreshToken] = useMutation(REFRESH_TOKEN_MUTATION);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (fetching || refreshing) return;
    if (!isLoading) return;

    const me = data?.me ?? null;
    const hasSession = localStorage.getItem("studed_has_session") === "true";

    if (!me && hasSession) {
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
  }, [data, fetching, isLoading, setUser, refreshToken, reexecuteQuery, refreshing]);

  if (isLoading || refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
