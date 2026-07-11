import { useEffect } from "react";
import { useQuery } from "urql";
import { ME_QUERY } from "@/graphql/auth";
import { useAuthStore } from "@/stores/auth";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [{ data, fetching, error }] = useQuery({ query: ME_QUERY });

  useEffect(() => {
    if (fetching) return;

    if (data?.me) {
      setUser(data.me);
    } else {
      setUser(null);
    }
  }, [data, fetching, error, setUser]);

  return <>{children}</>;
}
