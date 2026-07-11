import { useEffect } from "react";
import { useQuery } from "urql";
import { ME_QUERY } from "@/graphql/auth";
import { useAuthStore } from "@/stores/auth";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { user, isLoading, setUser } = useAuthStore();
  const [{ data, fetching, error }] = useQuery({ query: ME_QUERY });

  useEffect(() => {
    if (fetching) return;

    const me = data?.me ?? null;
    if (user?.id !== me?.id || isLoading) {
      setUser(me);
    }
  }, [data, fetching, user, isLoading, setUser]);

  return <>{children}</>;
}
