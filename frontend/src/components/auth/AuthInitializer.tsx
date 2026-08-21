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
  const { isLoading, setUser, setLoading } = useAuthStore();
  const hasSession = typeof window !== "undefined" && localStorage.getItem("studed_has_session") === "true";

  const [{ data, fetching }, reexecuteQuery] = useQuery({
    query: ME_QUERY,
    requestPolicy: "network-only",
    pause: !hasSession && !isLoading,
  });
  const [, refreshToken] = useMutation(REFRESH_TOKEN_MUTATION);
  const [refreshing, setRefreshing] = useState(false);

  // If user has no active session marker, unblock the UI instantly on initial mount
  useEffect(() => {
    if (!hasSession && isLoading) {
      setUser(null);
    }
  }, [hasSession, isLoading, setUser]);

  // Safety fallback: never trap the user on a blank spinner for more than 2.5s
  useEffect(() => {
    if (!isLoading && !refreshing) return;
    const timer = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [isLoading, refreshing, setLoading]);

  useEffect(() => {
    if (fetching || refreshing) return;
    if (!isLoading) return;

    const me = data?.me ?? null;

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
  }, [data, fetching, isLoading, setUser, refreshToken, reexecuteQuery, refreshing, hasSession]);

  if (hasSession && (isLoading || refreshing)) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
