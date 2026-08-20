import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LoginAuthCard } from "@/components/auth/LoginAuthCard";
import { LoginBrandPanel } from "@/components/auth/LoginBrandPanel";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-[100dvh]">
      {/* Left panel - branding */}
      <LoginBrandPanel />

      {/* Right panel - form */}
      {/* No overflow-hidden here: it would clip the mascot peeking over the
          card's top edge on short viewports. The starfield is pinned with
          inset-0 + object-cover, so it cannot spill without it. */}
      {/* items-start + my-auto on the card, rather than items-center: auto
          margins centre the card when there is room but collapse to 0 when there
          is not, pinning it below the panel's top padding instead of overflowing
          symmetrically. Centring alone pushed the card - and the mascot hanging
          64px above it - past y=0 on short viewports, where scrolling cannot
          reach it. pt-20 reserves that mascot headroom. */}
      <div className="bg-login-panel-sky relative flex w-full items-start justify-center px-6 pt-20 pb-6 lg:w-1/2">
        {/* Two textures, swapped by theme. Rendering both and toggling with the
            `dark:` variant keeps this declarative - reading theme state in JS
            here would flash the wrong image on first paint. */}
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
          <LoginAuthCard />
        </motion.div>
      </div>
    </div>
  );
}
