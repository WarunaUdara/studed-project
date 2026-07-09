/**
 * Sound utility — subtle UI click sounds via Web Audio API.
 * No audio files needed; tones are synthesized at runtime.
 * Respects prefers-reduced-motion (no sound when reduced motion is preferred).
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.08,
) {
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.value = frequency;

  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playClickSound() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
    return;
  playTone(800, 0.04, "sine", 0.05);
}

export function playSuccessSound() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
    return;
  playTone(660, 0.08, "sine", 0.06);
  setTimeout(() => playTone(880, 0.12, "sine", 0.06), 60);
}

export function playErrorSound() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
    return;
  playTone(220, 0.12, "square", 0.04);
}

export function playLevelUpSound() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  )
    return;
  playTone(523, 0.1, "sine", 0.07);
  setTimeout(() => playTone(659, 0.1, "sine", 0.07), 80);
  setTimeout(() => playTone(784, 0.15, "sine", 0.07), 160);
}
