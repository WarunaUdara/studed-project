import { useEffect } from "react";
import { useQuery } from "urql";
import { ME_QUERY } from "@/graphql/auth";
import { useAuthStore } from "@/stores/auth";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isLoading, setUser } = useAuthStore();
  const [{ data, fetching }] = useQuery({ query: ME_QUERY });

  useEffect(() => {
    if (fetching) return;
    if (!isLoading) return;

    const me = data?.me ?? null;
    setUser(me);
  }, [data, fetching, isLoading, setUser]);

  return <>{children}</>;
}
