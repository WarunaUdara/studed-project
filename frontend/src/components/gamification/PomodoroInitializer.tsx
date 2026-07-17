import { useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/stores/auth";
import { usePomodoroStore } from "@/stores/pomodoro";
import { Confetti } from "./Confetti";
import { FloatingPomodoro } from "./FloatingPomodoro";

export function PomodoroInitializer() {
  const { isActive, tick, showConfetti } = usePomodoroStore();
  const { user, updateTotalXp } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isActive) {
      interval = setInterval(() => {
        tick((xp) => {
          if (user) {
            updateTotalXp(user.totalXp + xp);
            toast({
              type: "success",
              title: "Focus Session Complete!",
              message: `Great job focusing! You gained +${xp} XP towards your goals.`,
            });
          }
        });
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isActive, tick, user, updateTotalXp, toast]);

  return (
    <>
      <Confetti show={showConfetti} />
      <FloatingPomodoro />
    </>
  );
}
