import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "urql";
import { Button } from "@/components/ui/button";
import { LOGOUT_MUTATION } from "@/graphql/auth";
import { useAuthStore } from "@/stores/auth";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function LogoutButton({ variant = "ghost", size = "sm", className }: LogoutButtonProps) {
  const navigate = useNavigate();
  const logoutStore = useAuthStore((s) => s.logout);
  const [, logout] = useMutation(LOGOUT_MUTATION);

  const handleLogout = async () => {
    await logout({});
    logoutStore();
    navigate({ to: "/login" });
  };

  return (
    <Button variant={variant} size={size} className={className} onClick={handleLogout}>
      Log out
    </Button>
  );
}
