import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "urql";
import { LogoutConfirmModal } from "@/components/auth/LogoutConfirmModal";
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
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    setIsSubmitting(true);
    await logout({});
    logoutStore();
    setIsSubmitting(false);
    setShowConfirm(false);
    navigate({ to: "/login" });
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setShowConfirm(true)}
      >
        Log out
      </Button>

      <LogoutConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleLogout}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
