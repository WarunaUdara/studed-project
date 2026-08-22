import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "urql";
import { MY_ENROLLMENTS_QUERY } from "@/graphql/courses";
import { useAuthStore } from "@/stores/auth";
import { DailySparkLeagueRank } from "./DailySparkLeagueRank";
import { DailySparkMascotMotivation } from "./DailySparkMascotMotivation";
import { DailySparkStreakCharge } from "./DailySparkStreakCharge";
import { DailySparkStreakScreen } from "./DailySparkStreakScreen";
import { DailySparkTaskCard } from "./DailySparkTaskCard";
import type { SparkScreenState, SparkTask } from "./types";

const FRACTION_TASKS: SparkTask[] = [
  {
    id: "task-1",
    title: "Fraction Basics",
    targetFraction: 0.25,
    targetFractionLabel: "1/4",
    numerator: 1,
    denominator: 4,
    xpReward: 15,
    explanation:
      "The large triangle is divided into 4 equal quarters of area (top quarter, center inverted quarter, bottom-right quarter, and the combined bottom-left quarter made of two 1/8 pieces). Selecting any one 1/4 section (or both 1/8 pieces) equals 1/4 of the total area.",
  },
  {
    id: "task-2",
    title: "Equivalent Fractions",
    targetFraction: 0.5,
    targetFractionLabel: "2/4",
    numerator: 2,
    denominator: 4,
    xpReward: 20,
    explanation:
      "2/4 is equivalent to 1/2 (50% of the total area). Selecting any two 1/4 pieces (or one 1/4 piece plus both 1/8 pieces) fills exactly half of the total triangle area.",
  },
  {
    id: "task-3",
    title: "Advanced Fractions",
    targetFraction: 0.75,
    targetFractionLabel: "3/4",
    numerator: 3,
    denominator: 4,
    xpReward: 20,
    explanation:
      "3/4 represents 75% of the total area. Selecting any three 1/4 regions (or two 1/4 regions plus both 1/8 pieces) equals 3/4.",
  },
];

export interface DailySparkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailySparkModal({ isOpen, onClose }: DailySparkModalProps) {
  const [mounted, setMounted] = useState(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [screenState, setScreenState] = useState<SparkScreenState>("task");

  const { user, updateTotalXp } = useAuthStore();

  const [{ data: enrollData }] = useQuery({
    query: MY_ENROLLMENTS_QUERY,
    requestPolicy: "cache-first",
  });

  const activeCourseName = useMemo(() => {
    const enrollments = enrollData?.myEnrollments ?? [];
    if (enrollments.length > 0 && enrollments[0]?.title) {
      return enrollments[0].title;
    }
    return user?.grade ? `Grade ${user.grade} Mathematics` : "Mathematics: Fractions";
  }, [enrollData, user?.grade]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state whenever opened
  useEffect(() => {
    if (isOpen) {
      setTaskIndex(0);
      setTotalXpEarned(0);
      setScreenState("task");
    }
  }, [isOpen]);

  const handleTaskCorrect = (xpReward: number) => {
    const nextXp = totalXpEarned + xpReward;
    setTotalXpEarned(nextXp);

    if (taskIndex < FRACTION_TASKS.length - 1) {
      setTaskIndex((prev) => prev + 1);
    } else {
      // Completed all 3 tasks -> Screen 4: Mascot Motivation Screen
      setScreenState("motivation");
    }
  };

  const handleMotivationContinue = () => {
    // Screen 5: Streak Born Screen
    setScreenState("streak");
  };

  const handleStreakContinue = () => {
    // Screen 6: Streak Charge Battery Screen (Screenshot 1)
    setScreenState("charge");
  };

  const handleChargeContinue = () => {
    // Screen 7: League Rank Up Screen (Screenshot 2)
    setScreenState("league");
  };

  const handleLeagueFinish = () => {
    // Commit XP bonus to student profile and close
    if (totalXpEarned > 0 && user) {
      updateTotalXp((user.totalXp ?? 0) + totalXpEarned);
    }

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`daily_spark_${user?.id ?? "guest"}_${todayStr}`, "completed");
    } catch {
      // Ignore in private storage mode
    }

    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-[oklch(0.314_0.012_262.3)]/90 p-4 backdrop-blur-xl sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="relative flex w-full max-w-4xl items-center justify-center"
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
          >
            {screenState === "task" && (
              <DailySparkTaskCard
                task={FRACTION_TASKS[taskIndex]}
                courseTitle={activeCourseName}
                currentIndex={taskIndex}
                totalTasks={FRACTION_TASKS.length}
                currentXp={totalXpEarned}
                onCorrect={handleTaskCorrect}
                onExit={onClose}
              />
            )}

            {screenState === "motivation" && (
              <DailySparkMascotMotivation
                totalXp={totalXpEarned}
                onContinue={handleMotivationContinue}
              />
            )}

            {screenState === "streak" && (
              <DailySparkStreakScreen
                streakCount={Math.max(1, user?.streak ?? 1)}
                onFinish={handleStreakContinue}
              />
            )}

            {screenState === "charge" && (
              <DailySparkStreakCharge onContinue={handleChargeContinue} />
            )}

            {screenState === "league" && <DailySparkLeagueRank onFinish={handleLeagueFinish} />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
