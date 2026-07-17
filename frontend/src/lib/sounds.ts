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

let ambientSource: AudioBufferSourceNode | null = null;
let ambientGainNode: GainNode | null = null;
let leftOsc: OscillatorNode | null = null;
let rightOsc: OscillatorNode | null = null;

export function playAmbientNoise(type: "brown" | "pink" | "white" | "adhd" | "none") {
  const ctx = getCtx();
  if (!ctx) return;

  if (ambientSource) {
    try {
      ambientSource.stop();
    } catch {}
    ambientSource = null;
  }
  if (leftOsc) {
    try {
      leftOsc.stop();
    } catch {}
    leftOsc = null;
  }
  if (rightOsc) {
    try {
      rightOsc.stop();
    } catch {}
    rightOsc = null;
  }

  if (type === "none") return;

  if (ctx.state === "suspended") ctx.resume();

  const bufferSize = ctx.sampleRate * 2; // 2 seconds
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (type === "brown" || type === "adhd") {
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  } else if (type === "pink") {
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] *= 0.11;
    }
  } else if (type === "white") {
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  ambientSource = ctx.createBufferSource();
  ambientSource.buffer = buffer;
  ambientSource.loop = true;

  ambientGainNode = ctx.createGain();
  ambientGainNode.gain.setValueAtTime(0.04, ctx.currentTime);

  if (type === "adhd") {
    // Binaural Beat (10Hz Alpha Wave, e.g. 140Hz and 150Hz in opposite ears)
    leftOsc = ctx.createOscillator();
    leftOsc.type = "sine";
    leftOsc.frequency.value = 140;

    rightOsc = ctx.createOscillator();
    rightOsc.type = "sine";
    rightOsc.frequency.value = 150;

    const merger = ctx.createChannelMerger(2);
    leftOsc.connect(merger, 0, 0);
    rightOsc.connect(merger, 0, 1);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);
    ambientSource.connect(noiseGain);

    const beatGain = ctx.createGain();
    beatGain.gain.setValueAtTime(0.015, ctx.currentTime); // Keep alpha beat subtle
    merger.connect(beatGain);

    noiseGain.connect(ambientGainNode);
    beatGain.connect(ambientGainNode);

    ambientGainNode.connect(ctx.destination);

    ambientSource.start(0);
    leftOsc.start(0);
    rightOsc.start(0);
  } else {
    ambientSource.connect(ambientGainNode);
    ambientGainNode.connect(ctx.destination);
    ambientSource.start(0);
  }
}

export function stopAmbientNoise() {
  if (ambientSource) {
    try {
      ambientSource.stop();
    } catch {}
    ambientSource = null;
  }
  if (leftOsc) {
    try {
      leftOsc.stop();
    } catch {}
    leftOsc = null;
  }
  if (rightOsc) {
    try {
      rightOsc.stop();
    } catch {}
    rightOsc = null;
  }
}
