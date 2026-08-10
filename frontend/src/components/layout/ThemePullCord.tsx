import { PullCord } from "pullcord";
import "pullcord/pullcord.css";
import { useUiPrefs } from "@/stores/uiPrefs";

export function ThemePullCord() {
  const theme = useUiPrefs((s) => s.theme);
  const toggleTheme = useUiPrefs((s) => s.toggleTheme);

  return (
    <PullCord
      onPull={() => toggleTheme()}
      pulled={theme === "dark"}
      ariaLabel="Toggle dark and light theme"
      config={{
        gravity: 1350,
        damping: 0.95,
        iterations: 25,
        stretchMax: 65,
        stretchToggle: 25,
        maxVelocity: 25,
      }}
    />
  );
}
