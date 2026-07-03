import { useEffect } from "react";
import { useQuery } from "urql";
import { ME_QUERY } from "@/graphql/auth";
import { useAuthStore } from "@/stores/auth";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const [{ data, error }] = useQuery({ query: ME_QUERY });

  useEffect(() => {
    if (data?.me) {
      setUser(data.me);
      return;
    }
    if (error) {
      setLoading(false);
      return;
    }
  }, [data, error, setUser, setLoading]);

  return <>{children}</>;
}
