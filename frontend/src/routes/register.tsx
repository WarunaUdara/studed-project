import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { RegisterAuthCard } from "@/components/auth/RegisterAuthCard";
import { RegisterBrandPanel } from "@/components/auth/RegisterBrandPanel";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <RegisterBrandPanel />

      {/* Right panel — form */}
      <div className="bg-login-panel-sky relative flex w-full items-start justify-center px-6 pt-20 pb-6 lg:w-1/2">
        {/* Two textures, swapped by theme */}
        <img
          src="/covers/mascot/bg-light.png"
          alt=""
          aria-hidden="true"
          width={864}
          height={1746}
          className="pointer-events-none absolute inset-0 size-full object-cover select-none dark:hidden"
        />
        <img
          src="/covers/mascot/bg-stars.png"
          alt=""
          aria-hidden="true"
          width={1024}
          height={1024}
          className="pointer-events-none absolute inset-0 hidden size-full object-cover opacity-30 select-none dark:block"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative my-auto w-full max-w-lg"
        >
          <RegisterAuthCard />
        </motion.div>
      </div>
    </div>
  );
}
